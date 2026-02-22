package services

import (
	"context"
	"errors"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

	// Enrich products with bump details before returning
	for _, p := range products {
		if p.Bump != nil && p.Bump.BumpProductID != primitive.NilObjectID {
			// In a real scenario we might want to return a nested BumpProduct object,
			// but the frontend just needs `bump.bump_product_id` and we can fetch the rest,
			// or we can attach title/price here.
			// Let's add a `BumpDetails` to `Product` struct or just let the client look up the product if it's in the products array.
			// Since all visible products are returned, the client can just find the product by ID!
			// We just need to ensure the bump product IS in the `products` array.
			// If it's visible, it will be. If it's hidden, the client won't find it.
			// The AC says "Deleted/hidden bump product → cleared from storefront response".
			// Let's verify here:
			bumpVisible := false
			for _, bp := range products {
				if bp.ID == p.Bump.BumpProductID {
					bumpVisible = true
					break
				}
			}
			// If the bump product itself is not visible, unset the bump config for the response
			if !bumpVisible {
				p.Bump = nil
			}
		}
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
