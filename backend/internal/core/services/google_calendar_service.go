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
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

// GoogleCalendarService handles Google Calendar OAuth and event creation.
type GoogleCalendarService struct {
	connRepo      domain.GoogleCalendarConnectionRepository
	oauthConfig   *oauth2.Config
	encryptionKey []byte
}

// NewGoogleCalendarService creates a new GoogleCalendarService.
func NewGoogleCalendarService(
	connRepo domain.GoogleCalendarConnectionRepository,
	clientID, clientSecret, redirectURL string,
	encryptionKey string,
) *GoogleCalendarService {
	keyBytes := []byte(encryptionKey)
	if len(keyBytes) > 32 {
		keyBytes = keyBytes[:32]
	} else if len(keyBytes) < 32 {
		padded := make([]byte, 32)
		copy(padded, keyBytes)
		keyBytes = padded
	}

	return &GoogleCalendarService{
		connRepo: connRepo,
		oauthConfig: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Scopes: []string{
				"https://www.googleapis.com/auth/calendar.events",
				"https://www.googleapis.com/auth/userinfo.email",
			},
			Endpoint: google.Endpoint,
		},
		encryptionKey: keyBytes,
	}
}

// encrypt performs AES-CFB encryption.
func (s *GoogleCalendarService) encrypt(text string) (string, error) {
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

// decrypt performs AES-CFB decryption.
func (s *GoogleCalendarService) decrypt(cryptoText string) (string, error) {
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

// GetOAuthURL returns the Google OAuth consent URL for calendar access.
func (s *GoogleCalendarService) GetOAuthURL(state string) string {
	return s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
}

// ExchangeCodeAndConnect exchanges the OAuth code for tokens and stores the connection.
func (s *GoogleCalendarService) ExchangeCodeAndConnect(ctx context.Context, creatorID string, code string) error {
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		logger.Error("failed to exchange Google Calendar OAuth code", "error", err)
		return fmt.Errorf("failed to exchange code: %w", err)
	}

	encAccessToken, err := s.encrypt(token.AccessToken)
	if err != nil {
		return fmt.Errorf("failed to encrypt access token: %w", err)
	}

	encRefreshToken, err := s.encrypt(token.RefreshToken)
	if err != nil {
		return fmt.Errorf("failed to encrypt refresh token: %w", err)
	}

	// Fetch user email from the token info
	email := ""
	client := s.oauthConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err == nil && resp.StatusCode == 200 {
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		type userInfo struct {
			Email string `json:"email"`
		}
		var info userInfo
		if jsonErr := json.Unmarshal(body, &info); jsonErr == nil {
			email = info.Email
		}
	}

	now := time.Now()
	conn := &domain.GoogleCalendarConnection{
		CreatorID:             creatorID,
		Email:                 email,
		EncryptedAccessToken:  encAccessToken,
		EncryptedRefreshToken: encRefreshToken,
		TokenExpiry:           token.Expiry,
		IsActive:              true,
		CreatedAt:             now,
		UpdatedAt:             now,
	}

	return s.connRepo.CreateOrUpdate(ctx, conn)
}

// GetConnection returns the Google Calendar connection for a creator.
func (s *GoogleCalendarService) GetConnection(ctx context.Context, creatorID string) (*domain.GoogleCalendarConnection, error) {
	return s.connRepo.FindByCreatorID(ctx, creatorID)
}

// Disconnect removes the Google Calendar connection for a creator.
func (s *GoogleCalendarService) Disconnect(ctx context.Context, creatorID string) error {
	return s.connRepo.Delete(ctx, creatorID)
}

// getOAuthToken reconstructs an OAuth token from stored encrypted tokens.
func (s *GoogleCalendarService) getOAuthToken(ctx context.Context, creatorID string) (*domain.GoogleCalendarConnection, *oauth2.Token, error) {
	conn, err := s.connRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to find calendar connection: %w", err)
	}
	if conn == nil || !conn.IsActive {
		return nil, nil, errors.New("no active Google Calendar connection")
	}

	accessToken, err := s.decrypt(conn.EncryptedAccessToken)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to decrypt access token: %w", err)
	}

	refreshToken, err := s.decrypt(conn.EncryptedRefreshToken)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to decrypt refresh token: %w", err)
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       conn.TokenExpiry,
		TokenType:    "Bearer",
	}

	return conn, token, nil
}

// CreateEventWithMeet creates a Google Calendar event with an auto-generated Google Meet link.
// Returns the Meet link URL on success.
func (s *GoogleCalendarService) CreateEventWithMeet(
	ctx context.Context,
	creatorID string,
	summary string,
	description string,
	startTime time.Time,
	endTime time.Time,
	attendeeEmail string,
) (string, error) {
	conn, token, err := s.getOAuthToken(ctx, creatorID)
	if err != nil {
		return "", err
	}

	// Create a token source that auto-refreshes and update stored tokens if refreshed
	tokenSource := s.oauthConfig.TokenSource(ctx, token)
	newToken, err := tokenSource.Token()
	if err != nil {
		return "", fmt.Errorf("failed to get valid token: %w", err)
	}

	// If the token was refreshed, update the stored connection
	if newToken.AccessToken != token.AccessToken {
		encAccess, _ := s.encrypt(newToken.AccessToken)
		encRefresh := conn.EncryptedRefreshToken // Keep existing if not refreshed
		if newToken.RefreshToken != "" {
			encRefresh, _ = s.encrypt(newToken.RefreshToken)
		}
		now := time.Now()
		updatedConn := &domain.GoogleCalendarConnection{
			CreatorID:             creatorID,
			Email:                 conn.Email,
			EncryptedAccessToken:  encAccess,
			EncryptedRefreshToken: encRefresh,
			TokenExpiry:           newToken.Expiry,
			IsActive:              true,
			UpdatedAt:             now,
			CreatedAt:             conn.CreatedAt,
		}
		_ = s.connRepo.CreateOrUpdate(ctx, updatedConn)
	}

	client := oauth2.NewClient(ctx, tokenSource)
	calendarService, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return "", fmt.Errorf("failed to create calendar service: %w", err)
	}

	event := &calendar.Event{
		Summary:     summary,
		Description: description,
		Start: &calendar.EventDateTime{
			DateTime: startTime.Format(time.RFC3339),
			TimeZone: "UTC",
		},
		End: &calendar.EventDateTime{
			DateTime: endTime.Format(time.RFC3339),
			TimeZone: "UTC",
		},
		Attendees: []*calendar.EventAttendee{
			{Email: attendeeEmail},
		},
		ConferenceData: &calendar.ConferenceData{
			CreateRequest: &calendar.CreateConferenceRequest{
				RequestId: fmt.Sprintf("stan-%s-%d", creatorID, startTime.Unix()),
				ConferenceSolutionKey: &calendar.ConferenceSolutionKey{
					Type: "hangoutsMeet",
				},
			},
		},
		GuestsCanModify: false,
	}

	createdEvent, err := calendarService.Events.Insert("primary", event).
		ConferenceDataVersion(1).
		SendUpdates("all").
		Do()
	if err != nil {
		return "", fmt.Errorf("failed to create calendar event: %w", err)
	}

	// Extract the Meet link
	meetLink := ""
	if createdEvent.ConferenceData != nil && len(createdEvent.ConferenceData.EntryPoints) > 0 {
		for _, ep := range createdEvent.ConferenceData.EntryPoints {
			if ep.EntryPointType == "video" {
				meetLink = ep.Uri
				break
			}
		}
	}

	// Fallback to the event's hangoutLink
	if meetLink == "" && createdEvent.HangoutLink != "" {
		meetLink = createdEvent.HangoutLink
	}

	logger.Info("Google Calendar event created",
		"event_id", createdEvent.Id,
		"meet_link", meetLink,
		"creator_id", creatorID,
	)

	return meetLink, nil
}
