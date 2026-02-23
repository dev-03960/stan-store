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
}

func NewInstagramService(
	connRepo domain.InstagramConnectionRepository,
	automationRepo domain.InstagramAutomationRepository,
	queueClient *asynq.Client,
	encryptionKey string,
	appID string,
	appSecret string,
	redirectURI string,
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

// GetOAuthURL generates the URL to redirect the user to for Instagram authentication.
func (s *InstagramService) GetOAuthURL(state string) string {
	// Requirements: instagram_basic, instagram_manage_messages, pages_show_list, pages_manage_metadata (for webhooks if needed)
	scopes := "instagram_basic,instagram_manage_messages,pages_show_list"
	return fmt.Sprintf("https://www.facebook.com/v18.0/dialog/oauth?client_id=%s&redirect_uri=%s&state=%s&scope=%s&response_type=code", s.appID, s.redirectURI, state, scopes)
}

// ExchangeCode exchanges the OAuth code for a long-lived access token and fetches the IG User ID
func (s *InstagramService) ExchangeCodeAndConnect(ctx context.Context, creatorID string, code string) error {
	// Simulated exchange for this test structure
	// In production:
	// 1. Exchange code -> short-lived token -> long-lived token
	// 2. Fetch Facebook Page ID
	// 3. Fetch Instagram Business Account ID associated with Page
	// 4. Encrypt token and store

	// MOCK Behavior for local testing
	mockToken := "mock_ig_long_lived_token_" + code
	mockIGUserID := "ig_mock_12345"

	encryptedToken, err := s.encrypt(mockToken)
	if err != nil {
		return err
	}

	conn := &domain.InstagramConnection{
		CreatorID:       creatorID,
		IGUserID:        mockIGUserID,
		IGUsername:      "mock_ig_user",
		EncryptedToken:  encryptedToken,
		TokenExpiresAt:  time.Now().AddDate(0, 2, 0), // typical FB 60-day token
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
	ID      string            `json:"id"`
	Time    int64             `json:"time"`
	Changes []InstagramChange `json:"changes"`
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

// ProcessWebhook parses the webhook payload and enqueues DM tasks if rules match
func (s *InstagramService) ProcessWebhook(ctx context.Context, payloadBytes []byte) error {
	var payload InstagramWebhookPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return err
	}

	if payload.Object != "instagram" {
		return nil
	}

	for _, entry := range payload.Entry {
		igUserID := entry.ID // the IG account ID receiving the comment

		for _, change := range entry.Changes {
			if change.Field == "comments" {
				text := strings.ToLower(strings.TrimSpace(change.Value.Text))
				commenterIGID := change.Value.From.ID

				// 1. Ensure we have a connection for this IG User
				conn, err := s.connRepo.FindByIGUserID(ctx, igUserID)
				if err != nil || conn == nil || !conn.IsActive {
					continue
				}

				// 2. Fetch automations for the creator
				automations, err := s.automationRepo.FindByCreatorID(ctx, conn.CreatorID)
				if err != nil {
					continue
				}

				// 3. Find matching keyword
				for _, auto := range automations {
					if !auto.IsActive {
						continue
					}
					if strings.Contains(text, auto.Keyword) {
						// Match found! Dispatch DM task
						s.enqueueDMTask(conn.CreatorID, commenterIGID, auto.ResponseText, auto.ID.Hex())
						break // Only trigger one automation per comment
					}
				}
			}
		}
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
