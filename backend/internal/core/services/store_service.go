package services

import (
	"context"
	"errors"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

// StoreResponse represents the data returned for a public storefront.
type StoreResponse struct {
	Creator  *PublicProfile    `json:"creator"`
	Products []*domain.Product `json:"products"`
}

// PublicProfile represents a sanitized user profile.
type PublicProfile struct {
	ID          string              `json:"id"`
	DisplayName string              `json:"displayName"`
	Username    string              `json:"username"`
	Bio         string              `json:"bio"`
	AvatarURL   string              `json:"avatarUrl"`
	SocialLinks []domain.SocialLink `json:"socialLinks"`
}

// StoreService handles business logic for the public storefront.
type StoreService struct {
	userRepo    domain.UserRepository
	productRepo domain.ProductRepository
}

// NewStoreService creates a new StoreService.
func NewStoreService(userRepo domain.UserRepository, productRepo domain.ProductRepository) *StoreService {
	return &StoreService{
		userRepo:    userRepo,
		productRepo: productRepo,
	}
}

// GetStoreByUsername fetches the store data for a given username.
func (s *StoreService) GetStoreByUsername(ctx context.Context, username string) (*StoreResponse, error) {
	// 1. Find User by Username
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("creator not found")
	}
	if user.Status == domain.UserStatusBanned {
		return nil, errors.New("store banned")
	}

	// 2. Find Visible Products
	products, err := s.productRepo.FindVisibleByCreatorID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	// 3. Construct Response (Sanitize User Data)
	profile := &PublicProfile{
		ID:          user.ID.Hex(),
		DisplayName: user.DisplayName,
		Username:    user.Username,
		Bio:         user.Bio,
		AvatarURL:   user.AvatarURL,
		SocialLinks: user.SocialLinks,
	}

	return &StoreResponse{
		Creator:  profile,
		Products: products,
	}, nil
}
