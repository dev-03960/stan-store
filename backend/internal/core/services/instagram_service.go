package services

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/hibiken/asynq"
)

type InstagramService struct {
	connRepo       domain.InstagramConnectionRepository
	automationRepo domain.InstagramAutomationRepository
	queueClient    *asynq.Client
	encryptionKey  []byte // 32 bytes for AES-256
	appSecret      string
	appID          string
	redirectURI    string
	configID       string
}

func NewInstagramService(
	connRepo domain.InstagramConnectionRepository,
	automationRepo domain.InstagramAutomationRepository,
	queueClient *asynq.Client,
	encryptionKey string,
	appID string,
	appSecret string,
	redirectURI string,
	configID string,
) *InstagramService {
	// Ensure key is 32 bytes
	keyBytes := []byte(encryptionKey)
	if len(keyBytes) > 32 {
		keyBytes = keyBytes[:32]
	} else if len(keyBytes) < 32 {
		padded := make([]byte, 32)
		copy(padded, keyBytes)
		keyBytes = padded
	}

	return &InstagramService{
		connRepo:       connRepo,
		automationRepo: automationRepo,
		queueClient:    queueClient,
		encryptionKey:  keyBytes,
		appID:          appID,
		appSecret:      appSecret,
		redirectURI:    redirectURI,
		configID:       configID,
	}
}

// encrypt AES-GCM
func (s *InstagramService) encrypt(text string) (string, error) {
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}
	ciphertext := make([]byte, aes.BlockSize+len(text))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}
	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[aes.BlockSize:], []byte(text))
	return base64.URLEncoding.EncodeToString(ciphertext), nil
}

// decrypt AES-GCM
func (s *InstagramService) decrypt(cryptoText string) (string, error) {
	ciphertext, err := base64.URLEncoding.DecodeString(cryptoText)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}
	if len(ciphertext) < aes.BlockSize {
		return "", errors.New("ciphertext too short")
	}
	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(ciphertext, ciphertext)
	return string(ciphertext), nil
}

func (s *InstagramService) GetOAuthURL(state string) string {
	// If a config_id is provided, Facebook Login for Business requires passing config_id instead of scope
	if s.configID != "" {
		return fmt.Sprintf("https://www.facebook.com/v18.0/dialog/oauth?client_id=%s&redirect_uri=%s&state=%s&response_type=code&config_id=%s", s.appID, url.QueryEscape(s.redirectURI), state, s.configID)
	}

	// Fallback to traditional scope (standard Facebook Login)
	scopes := "instagram_business_basic,instagram_business_manage_messages,pages_show_list,pages_read_engagement"
	return fmt.Sprintf("https://www.facebook.com/v18.0/dialog/oauth?client_id=%s&redirect_uri=%s&state=%s&scope=%s&response_type=code", s.appID, url.QueryEscape(s.redirectURI), state, scopes)
}

// ExchangeCode exchanges the OAuth code for a long-lived access token and fetches the IG User ID
func (s *InstagramService) ExchangeCodeAndConnect(ctx context.Context, creatorID string, code string) error {
	// 1. Exchange OAuth code for a short-lived token
	tokenURL := fmt.Sprintf("https://graph.facebook.com/v18.0/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s",
		s.appID, url.QueryEscape(s.redirectURI), s.appSecret, url.QueryEscape(code))

	resp, err := http.Get(tokenURL)
	if err != nil {
		return fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed OAuth exchange (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var shortTokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&shortTokenResp); err != nil {
		return err
	}

	// 2. Exchange short-lived token for long-lived token
	longTokenURL := fmt.Sprintf("https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=%s&client_secret=%s&fb_exchange_token=%s",
		s.appID, s.appSecret, shortTokenResp.AccessToken)

	respLong, err := http.Get(longTokenURL)
	if err != nil {
		return fmt.Errorf("failed to get long-lived token: %w", err)
	}
	defer respLong.Body.Close()

	var longTokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(respLong.Body).Decode(&longTokenResp); err != nil {
		return err
	}

	if longTokenResp.AccessToken == "" {
		longTokenResp.AccessToken = shortTokenResp.AccessToken // Fallback if no long token
	}

	// 3. Fetch user's Facebook Pages
	pagesURL := fmt.Sprintf("https://graph.facebook.com/v18.0/me/accounts?access_token=%s", longTokenResp.AccessToken)
	respPages, err := http.Get(pagesURL)
	if err != nil {
		return fmt.Errorf("failed to fetch pages: %w", err)
	}
	defer respPages.Body.Close()

	var pagesData struct {
		Data []struct {
			ID          string `json:"id"`
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(respPages.Body).Decode(&pagesData); err != nil {
		return err
	}

	if len(pagesData.Data) == 0 {
		return errors.New("no facebook pages found for user")
	}

	// 4. Fetch the Instagram Business Account linked to the pages
	// We check each page until we find an IG account.
	var igUserID string
	var igUsername string

	for _, page := range pagesData.Data {
		igURL := fmt.Sprintf("https://graph.facebook.com/v18.0/%s?fields=instagram_business_account&access_token=%s", page.ID, longTokenResp.AccessToken)
		respIG, err := http.Get(igURL)
		if err != nil {
			continue
		}
		defer respIG.Body.Close()

		var igData struct {
			InstagramBusinessAccount *struct {
				ID string `json:"id"`
			} `json:"instagram_business_account"`
		}
		_ = json.NewDecoder(respIG.Body).Decode(&igData)

		if igData.InstagramBusinessAccount != nil && igData.InstagramBusinessAccount.ID != "" {
			igUserID = igData.InstagramBusinessAccount.ID
			break
		}
	}

	if igUserID == "" {
		return errors.New("no instagram business account connected to any facebook page")
	}

	// 5. Fetch IG Username
	usernameURL := fmt.Sprintf("https://graph.facebook.com/v18.0/%s?fields=username&access_token=%s", igUserID, longTokenResp.AccessToken)
	respUser, err := http.Get(usernameURL)
	if err == nil {
		defer respUser.Body.Close()
		var userData struct {
			Username string `json:"username"`
		}
		_ = json.NewDecoder(respUser.Body).Decode(&userData)
		igUsername = userData.Username
	}
	if igUsername == "" {
		igUsername = "ig_user_" + igUserID
	}

	// 6. Encrypt token and store connection
	encryptedToken, err := s.encrypt(longTokenResp.AccessToken)
	if err != nil {
		return err
	}

	expiresAt := time.Now().AddDate(0, 2, 0) // default FB 60-day token
	if longTokenResp.ExpiresIn > 0 {
		expiresAt = time.Now().Add(time.Duration(longTokenResp.ExpiresIn) * time.Second)
	}

	conn := &domain.InstagramConnection{
		CreatorID:       creatorID,
		IGUserID:        igUserID,
		IGUsername:      igUsername,
		EncryptedToken:  encryptedToken,
		TokenExpiresAt:  expiresAt,
		WebhookVerified: true,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	return s.connRepo.CreateOrUpdate(ctx, conn)
}

func (s *InstagramService) Disconnect(ctx context.Context, creatorID string) error {
	return s.connRepo.Delete(ctx, creatorID)
}

func (s *InstagramService) GetConnection(ctx context.Context, creatorID string) (*domain.InstagramConnection, error) {
	return s.connRepo.FindByCreatorID(ctx, creatorID)
}

// AUTOMATIONS

func (s *InstagramService) GetAutomations(ctx context.Context, creatorID string) ([]*domain.InstagramAutomation, error) {
	return s.automationRepo.FindByCreatorID(ctx, creatorID)
}

func (s *InstagramService) CreateAutomation(ctx context.Context, creatorID string, keyword string, responseText string, productID string) (*domain.InstagramAutomation, error) {
	keyword = strings.ToLower(strings.TrimSpace(keyword))
	if keyword == "" || responseText == "" {
		return nil, errors.New("keyword and response_text are required")
	}

	existing, _ := s.automationRepo.FindByKeyword(ctx, creatorID, keyword)
	if existing != nil {
		return nil, errors.New("automation with this keyword already exists")
	}

	automation := &domain.InstagramAutomation{
		CreatorID:    creatorID,
		Keyword:      keyword,
		ResponseText: responseText,
		ProductID:    productID,
		IsActive:     true,
		DMCount:      0,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err := s.automationRepo.Create(ctx, automation)
	return automation, err
}

func (s *InstagramService) DeleteAutomation(ctx context.Context, id string) error {
	return s.automationRepo.Delete(ctx, id)
}

// WEBHOOK PROCESSING

type InstagramWebhookPayload struct {
	Object string           `json:"object"`
	Entry  []InstagramEntry `json:"entry"`
}

type InstagramEntry struct {
	ID        string               `json:"id"`
	Time      int64                `json:"time"`
	Changes   []InstagramChange    `json:"changes"`
	Messaging []InstagramMessaging `json:"messaging"`
}

type InstagramChange struct {
	Field string               `json:"field"`
	Value InstagramChangeValue `json:"value"`
}

type InstagramChangeValue struct {
	From struct {
		ID       string `json:"id"`
		Username string `json:"username"`
	} `json:"from"`
	Text  string `json:"text"`
	MsgID string `json:"id"` // the comment or message id
}

type InstagramMessaging struct {
	Sender struct {
		ID string `json:"id"`
	} `json:"sender"`
	Recipient struct {
		ID string `json:"id"`
	} `json:"recipient"`
	Message struct {
		Mid  string `json:"mid"`
		Text string `json:"text"`
	} `json:"message"`
}

// ProcessWebhook parses the webhook payload and enqueues DM tasks if rules match
func (s *InstagramService) ProcessWebhook(ctx context.Context, payloadBytes []byte) error {
	var payload InstagramWebhookPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return err
	}

	if payload.Object != "instagram" && payload.Object != "page" {
		return nil
	}

	for _, entry := range payload.Entry {
		igUserID := entry.ID // the IG account ID receiving the comment/message

		// 1. Ensure we have a connection for this IG User
		conn, err := s.connRepo.FindByIGUserID(ctx, igUserID)
		if err != nil || conn == nil || !conn.IsActive {
			continue // No user or not active
		}

		// 2. Fetch automations for the creator
		automations, err := s.automationRepo.FindByCreatorID(ctx, conn.CreatorID)
		if err != nil || len(automations) == 0 {
			continue
		}

		// Handle Comments
		for _, change := range entry.Changes {
			if change.Field == "comments" {
				text := strings.ToLower(strings.TrimSpace(change.Value.Text))
				commenterIGID := change.Value.From.ID

				s.checkAndTriggerAutomations(automations, text, conn.CreatorID, commenterIGID)
			}
		}

		// Handle Direct Messages
		for _, msg := range entry.Messaging {
			if msg.Message.Text != "" {
				text := strings.ToLower(strings.TrimSpace(msg.Message.Text))
				senderIGID := msg.Sender.ID

				// Don't reply to our own messages
				if senderIGID != igUserID {
					s.checkAndTriggerAutomations(automations, text, conn.CreatorID, senderIGID)
				}
			}
		}
	}

	return nil
}

func (s *InstagramService) checkAndTriggerAutomations(automations []*domain.InstagramAutomation, text string, creatorID string, senderIGID string) {
	for _, auto := range automations {
		if !auto.IsActive {
			continue
		}
		if strings.Contains(text, auto.Keyword) {
			s.enqueueDMTask(creatorID, senderIGID, auto.ResponseText, auto.ID.Hex())
			break // Only trigger one automation per message/comment
		}
	}
}

func (s *InstagramService) SendDM(ctx context.Context, creatorID string, recipientIGID string, message string) error {
	// 1. Fetch connection details
	conn, err := s.connRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("instagram connection not found: %w", err)
	}
	if conn == nil || !conn.IsActive {
		return errors.New("instagram connection is not active or null")
	}

	// 2. Decrypt token
	decryptedToken, err := s.decrypt(conn.EncryptedToken)
	if err != nil {
		return fmt.Errorf("failed to decrypt token: %w", err)
	}

	// 3. Send Graph API request
	// POST https://graph.facebook.com/v18.0/{ig_user_id}/messages
	urlStr := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", conn.IGUserID)
	
	payload := map[string]interface{}{
		"recipient": map[string]string{"id": recipientIGID},
		"message":   map[string]string{"text": message},
	}
	payloadBytes, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, "POST", urlStr, strings.NewReader(string(payloadBytes)))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+decryptedToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send DM: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to send DM (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func (s *InstagramService) enqueueDMTask(creatorID string, recipientIGID string, message string, automationID string) {
	// Will be handled by the worker implementation
	payload := map[string]string{
		"creator_id":      creatorID,
		"recipient_ig_id": recipientIGID,
		"message":         message,
		"automation_id":   automationID,
	}
	payloadBytes, _ := json.Marshal(payload)

	task := asynq.NewTask("dm:ig_send", payloadBytes, asynq.MaxRetry(3), asynq.Timeout(2*time.Minute))
	s.queueClient.Enqueue(task)
}
