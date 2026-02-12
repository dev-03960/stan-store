package services

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

var allowedPlatforms = map[string]bool{
	"instagram": true, "youtube": true, "twitter": true,
	"linkedin": true, "tiktok": true,
}

// ProfileInput represents the input for updating a creator's profile.
type ProfileInput struct {
	DisplayName string              `json:"displayName"`
	Bio         string              `json:"bio"`
	AvatarURL   string              `json:"avatarUrl"`
	SocialLinks []domain.SocialLink `json:"socialLinks"`
}

// ProfileService handles creator profile operations.
type ProfileService struct {
	userRepo domain.UserRepository
}

// NewProfileService creates a new ProfileService.
func NewProfileService(userRepo domain.UserRepository) *ProfileService {
	return &ProfileService{userRepo: userRepo}
}

// GetProfile returns a user's profile by ID.
func (s *ProfileService) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}

// UpdateProfile validates and applies profile changes.
func (s *ProfileService) UpdateProfile(ctx context.Context, userID string, input *ProfileInput) (*domain.User, *ValidationErrors) {
	// Validate input
	if errs := s.validateProfileInput(input); errs != nil {
		return nil, errs
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil || user == nil {
		return nil, &ValidationErrors{Errors: []FieldError{{Field: "user", Message: "User not found"}}}
	}

	// Apply changes
	user.DisplayName = strings.TrimSpace(input.DisplayName)
	user.Bio = strings.TrimSpace(input.Bio)
	if input.AvatarURL != "" {
		user.AvatarURL = strings.TrimSpace(input.AvatarURL)
	}
	user.SocialLinks = input.SocialLinks
	if user.SocialLinks == nil {
		user.SocialLinks = []domain.SocialLink{}
	}
	user.UpdatedAt = time.Now()

	updated, err := s.userRepo.Update(ctx, userID, user)
	if err != nil {
		return nil, &ValidationErrors{Errors: []FieldError{{Field: "server", Message: "Failed to update profile"}}}
	}

	return updated, nil
}

func (s *ProfileService) validateProfileInput(input *ProfileInput) *ValidationErrors {
	var errs []FieldError

	// Display name
	name := strings.TrimSpace(input.DisplayName)
	if name == "" {
		errs = append(errs, FieldError{Field: "displayName", Message: "Display name is required"})
	} else if len(name) > 100 {
		errs = append(errs, FieldError{Field: "displayName", Message: "Display name must be at most 100 characters"})
	}

	// Bio
	if len(strings.TrimSpace(input.Bio)) > 160 {
		errs = append(errs, FieldError{Field: "bio", Message: "Bio must be at most 160 characters"})
	}

	// Avatar URL
	if input.AvatarURL != "" {
		if _, err := url.ParseRequestURI(input.AvatarURL); err != nil ||
			(!strings.HasPrefix(input.AvatarURL, "http://") && !strings.HasPrefix(input.AvatarURL, "https://")) {
			errs = append(errs, FieldError{Field: "avatarUrl", Message: "Avatar URL must be a valid HTTP/HTTPS URL"})
		}
	}

	// Social links
	if len(input.SocialLinks) > 5 {
		errs = append(errs, FieldError{Field: "socialLinks", Message: "Maximum 5 social links allowed"})
	} else {
		for i, link := range input.SocialLinks {
			platform := strings.ToLower(strings.TrimSpace(link.Platform))
			if !allowedPlatforms[platform] {
				errs = append(errs, FieldError{
					Field:   "socialLinks",
					Message: "Invalid platform at index " + strings.Repeat("", 0) + string(rune('0'+i)) + ": must be instagram, youtube, twitter, linkedin, or tiktok",
				})
			}
			if link.URL == "" {
				errs = append(errs, FieldError{Field: "socialLinks", Message: "URL is required for each social link"})
			} else if _, err := url.ParseRequestURI(link.URL); err != nil ||
				(!strings.HasPrefix(link.URL, "http://") && !strings.HasPrefix(link.URL, "https://")) {
				errs = append(errs, FieldError{Field: "socialLinks", Message: "Invalid URL at social link index " + string(rune('0'+i))})
			}
			// Normalize platform casing
			input.SocialLinks[i].Platform = platform
		}
	}

	if len(errs) > 0 {
		return &ValidationErrors{Errors: errs}
	}
	return nil
}

// ValidationErrors holds a list of field-level validation errors.
type ValidationErrors struct {
	Errors []FieldError `json:"errors"`
}

func (v *ValidationErrors) Error() string {
	if len(v.Errors) > 0 {
		return v.Errors[0].Message
	}
	return "Validation failed"
}

// FieldError represents a single field validation error.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}
