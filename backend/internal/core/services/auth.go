package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
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
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo domain.UserRepository, jwtService *JWTService) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtService: jwtService,
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
