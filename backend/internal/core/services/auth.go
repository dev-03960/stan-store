package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"github.com/redis/go-redis/v9"
)

// GoogleUser holds user info from Google OAuth.
type GoogleUser struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// AuthResult holds the result of authentication.
type AuthResult struct {
	User        *domain.User `json:"user"`
	Token       string       `json:"token"`
	RedirectURL string       `json:"redirectUrl"`
	IsNewUser   bool         `json:"isNewUser"`
}

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo   domain.UserRepository
	jwtService *JWTService
	redis      *redis.Client
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo domain.UserRepository, jwtService *JWTService, redisClient *redis.Client) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtService: jwtService,
		redis:      redisClient,
	}
}

// HandleGoogleCallback processes the Google OAuth callback.
// It finds or creates a user, generates a JWT, and determines the redirect URL.
func (s *AuthService) HandleGoogleCallback(ctx context.Context, gUser *GoogleUser) (*AuthResult, error) {
	email := strings.ToLower(gUser.Email)

	// Check if user exists by Google ID first, then by email
	user, err := s.userRepo.FindByGoogleID(ctx, gUser.ID)
	if err != nil {
		return nil, fmt.Errorf("find by google id: %w", err)
	}

	isNewUser := false

	if user == nil {
		// Try by email (in case user was created differently)
		user, err = s.userRepo.FindByEmail(ctx, email)
		if err != nil {
			return nil, fmt.Errorf("find by email: %w", err)
		}
	}

	if user == nil {
		// Create new user
		newUser := domain.NewUserFromGoogle(email, gUser.Name, gUser.Picture, gUser.ID)
		user, err = s.userRepo.Create(ctx, newUser)
		if err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
		isNewUser = true
		logger.Info("new user created via google oauth", "email", email)
	}

	// Generate JWT
	token, err := s.jwtService.GenerateToken(user.ID.Hex(), user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	// Determine redirect
	redirectURL := "/onboarding"
	if user.HasUsername() {
		redirectURL = "/dashboard"
	}

	return &AuthResult{
		User:        user,
		Token:       token,
		RedirectURL: redirectURL,
		IsNewUser:   isNewUser,
	}, nil
}

// GetCurrentUser retrieves the current user by their ID.
func (s *AuthService) GetCurrentUser(ctx context.Context, userID string) (*domain.User, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

// GenerateMagicLinkToken generates a secure random token for emails.
func generateMagicLinkToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// HandleMagicLinkRequest generates and stores a magic link token for the buyer.
func (s *AuthService) HandleMagicLinkRequest(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return fmt.Errorf("email is required")
	}

	token := generateMagicLinkToken()
	key := fmt.Sprintf("auth:magic_link:%s", token)

	// Store in Redis for 15 minutes
	err := s.redis.Set(ctx, key, email, 15*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("redis set: %w", err)
	}

	// In a real system, we'd fire an event or call an email service here.
	// For now, log the token to the console so we can "click" it manually in dev.
	logger.Info("[MOCK EMAIL] MAGIC LINK GENERATED", "email", email, "token", token, "url", fmt.Sprintf("http://localhost:5173/verify?token=%s", token))

	return nil
}

// HandleMagicLinkVerify consumes the token, creates a buyer if needed, and logs them in.
func (s *AuthService) HandleMagicLinkVerify(ctx context.Context, token string) (*AuthResult, error) {
	key := fmt.Sprintf("auth:magic_link:%s", token)

	email, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("token invalid or expired")
	} else if err != nil {
		return nil, fmt.Errorf("redis get: %w", err)
	}

	// Immediately delete the token so it can't be reused
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		logger.Error("failed to delete used magic link token", "error", err, "token", token)
	}

	// Find or Create user as Buyer
	isNewUser := false
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("find by email: %w", err)
	}

	if user == nil {
		now := time.Now()
		newUser := &domain.User{
			Email:            email,
			DisplayName:      strings.Split(email, "@")[0], // Simple fallback
			Role:             domain.RoleBuyer,
			Status:           "active",
			SubscriptionTier: "free",
			CreatedAt:        now,
			UpdatedAt:        now,
		}
		user, err = s.userRepo.Create(ctx, newUser)
		if err != nil {
			return nil, fmt.Errorf("create buyer: %w", err)
		}
		isNewUser = true
		logger.Info("new buyer created via magic link", "email", email)
	}

	// Generate JWT
	jwtToken, err := s.jwtService.GenerateToken(user.ID.Hex(), user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &AuthResult{
		User:        user,
		Token:       jwtToken,
		RedirectURL: "/my-purchases",
		IsNewUser:   isNewUser,
	}, nil
}
