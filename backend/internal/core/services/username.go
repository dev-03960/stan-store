package services

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

var (
	// 3-30 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens
	usernameRegex = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$`)

	reservedUsernames = map[string]bool{
		"admin": true, "api": true, "www": true, "store": true,
		"help": true, "support": true, "dashboard": true, "settings": true,
		"onboarding": true, "checkout": true, "auth": true, "login": true,
		"signup": true, "profile": true, "account": true, "billing": true,
	}
)

// UsernameError types for validation failures.
type UsernameError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *UsernameError) Error() string {
	return e.Message
}

// UsernameService handles username validation and claiming.
type UsernameService struct {
	userRepo domain.UserRepository
}

// NewUsernameService creates a new UsernameService.
func NewUsernameService(userRepo domain.UserRepository) *UsernameService {
	return &UsernameService{userRepo: userRepo}
}

// ValidateUsername checks format and reserved status. Returns nil if valid.
func (s *UsernameService) ValidateUsername(username string) *UsernameError {
	username = strings.ToLower(strings.TrimSpace(username))

	if len(username) < 3 {
		return &UsernameError{Code: "ERR_VALIDATION", Message: "Username must be at least 3 characters"}
	}
	if len(username) > 30 {
		return &UsernameError{Code: "ERR_VALIDATION", Message: "Username must be at most 30 characters"}
	}
	if !usernameRegex.MatchString(username) {
		return &UsernameError{Code: "ERR_VALIDATION", Message: "Username can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)"}
	}
	if reservedUsernames[username] {
		return &UsernameError{Code: "ERR_VALIDATION", Message: "This username is reserved"}
	}

	return nil
}

// CheckAvailability checks if a username is available.
func (s *UsernameService) CheckAvailability(ctx context.Context, username string) (bool, *UsernameError) {
	username = strings.ToLower(strings.TrimSpace(username))

	// Validate format first
	if err := s.ValidateUsername(username); err != nil {
		return false, err
	}

	// Check DB
	existing, dbErr := s.userRepo.FindByUsername(ctx, username)
	if dbErr != nil {
		return false, &UsernameError{Code: "ERR_INTERNAL", Message: "Failed to check availability"}
	}

	return existing == nil, nil
}

// ClaimUsername sets the username on a user's document.
func (s *UsernameService) ClaimUsername(ctx context.Context, userID string, username string) (*domain.User, *UsernameError) {
	username = strings.ToLower(strings.TrimSpace(username))

	// Validate format
	if err := s.ValidateUsername(username); err != nil {
		return nil, err
	}

	// Check if user already has a username
	user, dbErr := s.userRepo.FindByID(ctx, userID)
	if dbErr != nil || user == nil {
		return nil, &UsernameError{Code: "ERR_NOT_FOUND", Message: "User not found"}
	}
	if user.HasUsername() {
		return nil, &UsernameError{Code: "USERNAME_ALREADY_SET", Message: "You have already claimed a username"}
	}

	// Check availability
	existing, dbErr := s.userRepo.FindByUsername(ctx, username)
	if dbErr != nil {
		return nil, &UsernameError{Code: "ERR_INTERNAL", Message: "Failed to check username"}
	}
	if existing != nil {
		return nil, &UsernameError{Code: "USERNAME_TAKEN", Message: "This username is already claimed"}
	}

	// Update user document
	user.Username = username
	user.UpdatedAt = time.Now()

	updated, dbErr := s.userRepo.Update(ctx, userID, user)
	if dbErr != nil {
		// Could be a race condition — unique index will catch it
		if strings.Contains(dbErr.Error(), "duplicate key") || strings.Contains(dbErr.Error(), "E11000") {
			return nil, &UsernameError{Code: "USERNAME_TAKEN", Message: "This username is already claimed"}
		}
		return nil, &UsernameError{Code: "ERR_INTERNAL", Message: "Failed to update username"}
	}

	return updated, nil
}
