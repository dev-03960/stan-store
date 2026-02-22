package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CouponService implements coupon CRUD and validation.
type CouponService struct {
	repo domain.CouponRepository
}

// NewCouponService creates a new CouponService.
func NewCouponService(repo domain.CouponRepository) *CouponService {
	return &CouponService{repo: repo}
}

// CreateCoupon validates and creates a new coupon.
func (s *CouponService) CreateCoupon(ctx context.Context, coupon *domain.Coupon) error {
	if coupon.Code == "" {
		return fmt.Errorf("coupon code is required")
	}
	coupon.Code = strings.ToUpper(coupon.Code)

	if coupon.DiscountType != domain.DiscountTypePercentage && coupon.DiscountType != domain.DiscountTypeFixed {
		return fmt.Errorf("discount_type must be 'percentage' or 'fixed'")
	}
	if coupon.DiscountValue <= 0 {
		return fmt.Errorf("discount_value must be positive")
	}
	if coupon.DiscountType == domain.DiscountTypePercentage && coupon.DiscountValue > 100 {
		return fmt.Errorf("percentage discount cannot exceed 100")
	}

	coupon.IsActive = true
	coupon.TimesUsed = 0

	// Check for duplicate code under this creator
	existing, err := s.repo.FindByCode(ctx, coupon.CreatorID, coupon.Code)
	if err != nil {
		return fmt.Errorf("failed to check existing coupon: %w", err)
	}
	if existing != nil {
		return fmt.Errorf("coupon code '%s' already exists", coupon.Code)
	}

	return s.repo.Create(ctx, coupon)
}

// GetCoupons returns all coupons for a creator.
func (s *CouponService) GetCoupons(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Coupon, error) {
	return s.repo.FindAllByCreatorID(ctx, creatorID)
}

// UpdateCoupon allows updating specific fields (is_active, max_uses, expires_at).
func (s *CouponService) UpdateCoupon(ctx context.Context, couponID primitive.ObjectID, creatorID primitive.ObjectID, updates map[string]interface{}) (*domain.Coupon, error) {
	coupon, err := s.repo.FindByID(ctx, couponID)
	if err != nil {
		return nil, fmt.Errorf("failed to find coupon: %w", err)
	}
	if coupon == nil {
		return nil, fmt.Errorf("coupon not found")
	}
	if coupon.CreatorID != creatorID {
		return nil, fmt.Errorf("unauthorized")
	}

	if isActive, ok := updates["is_active"].(bool); ok {
		coupon.IsActive = isActive
	}
	if maxUses, ok := updates["max_uses"].(float64); ok {
		coupon.MaxUses = int64(maxUses)
	}
	if expiresAtStr, ok := updates["expires_at"].(string); ok {
		t, err := time.Parse(time.RFC3339, expiresAtStr)
		if err == nil {
			coupon.ExpiresAt = &t
		}
	}

	if err := s.repo.Update(ctx, coupon); err != nil {
		return nil, fmt.Errorf("failed to update coupon: %w", err)
	}
	return coupon, nil
}

// DeleteCoupon soft-deletes a coupon (sets is_active to false).
func (s *CouponService) DeleteCoupon(ctx context.Context, couponID primitive.ObjectID, creatorID primitive.ObjectID) error {
	coupon, err := s.repo.FindByID(ctx, couponID)
	if err != nil {
		return fmt.Errorf("failed to find coupon: %w", err)
	}
	if coupon == nil {
		return fmt.Errorf("coupon not found")
	}
	if coupon.CreatorID != creatorID {
		return fmt.Errorf("unauthorized")
	}

	coupon.IsActive = false
	return s.repo.Update(ctx, coupon)
}

// ValidateCouponResult contains validation output.
type ValidateCouponResult struct {
	Valid          bool   `json:"valid"`
	DiscountAmount int64  `json:"discount_amount"` // In paise
	Message        string `json:"message,omitempty"`
}

// ValidateCoupon checks if a coupon is eligible and returns the discount amount.
func (s *CouponService) ValidateCoupon(ctx context.Context, creatorID primitive.ObjectID, code string, productID primitive.ObjectID, orderAmount int64) (*ValidateCouponResult, error) {
	coupon, err := s.repo.FindByCode(ctx, creatorID, code)
	if err != nil {
		return nil, fmt.Errorf("failed to look up coupon: %w", err)
	}
	if coupon == nil || !coupon.IsActive {
		return &ValidateCouponResult{Valid: false, Message: "Coupon not found or inactive"}, nil
	}

	// Check expiry
	if coupon.ExpiresAt != nil && time.Now().After(*coupon.ExpiresAt) {
		return &ValidateCouponResult{Valid: false, Message: "Coupon has expired"}, nil
	}

	// Check usage limit
	if coupon.MaxUses > 0 && coupon.TimesUsed >= coupon.MaxUses {
		return &ValidateCouponResult{Valid: false, Message: "Coupon usage limit reached"}, nil
	}

	// Check minimum order amount
	if coupon.MinOrderAmount > 0 && orderAmount < coupon.MinOrderAmount {
		return &ValidateCouponResult{
			Valid:   false,
			Message: fmt.Sprintf("Minimum order amount is ₹%.2f", float64(coupon.MinOrderAmount)/100),
		}, nil
	}

	// Check product applicability
	if len(coupon.ApplicableProductIDs) > 0 {
		applicable := false
		for _, pid := range coupon.ApplicableProductIDs {
			if pid == productID {
				applicable = true
				break
			}
		}
		if !applicable {
			return &ValidateCouponResult{Valid: false, Message: "Coupon is not applicable to this product"}, nil
		}
	}

	// Calculate discount
	var discountAmount int64
	if coupon.DiscountType == domain.DiscountTypePercentage {
		discountAmount = orderAmount * coupon.DiscountValue / 100
	} else {
		discountAmount = coupon.DiscountValue
	}

	// Cap: discount cannot exceed order amount - ₹1 (100 paise)
	maxDiscount := orderAmount - 100
	if maxDiscount < 0 {
		maxDiscount = 0
	}
	if discountAmount > maxDiscount {
		discountAmount = maxDiscount
	}

	return &ValidateCouponResult{
		Valid:          true,
		DiscountAmount: discountAmount,
	}, nil
}

// IncrementUsage atomically increments the coupon's usage count.
func (s *CouponService) IncrementUsage(ctx context.Context, couponID primitive.ObjectID) error {
	return s.repo.IncrementUsage(ctx, couponID)
}
