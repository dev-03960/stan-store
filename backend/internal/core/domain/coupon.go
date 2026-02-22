package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// DiscountType defines how the discount is calculated.
type DiscountType string

const (
	DiscountTypePercentage DiscountType = "percentage"
	DiscountTypeFixed      DiscountType = "fixed"
)

// Coupon represents a discount code created by a creator.
type Coupon struct {
	ID                   primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	CreatorID            primitive.ObjectID   `bson:"creator_id" json:"creator_id"`
	Code                 string               `bson:"code" json:"code"` // Unique per creator, stored uppercase
	DiscountType         DiscountType         `bson:"discount_type" json:"discount_type"`
	DiscountValue        int64                `bson:"discount_value" json:"discount_value"`     // Percentage (0-100) or fixed paise
	MinOrderAmount       int64                `bson:"min_order_amount" json:"min_order_amount"` // In paise (0 = no minimum)
	MaxUses              int64                `bson:"max_uses" json:"max_uses"`                 // 0 = unlimited
	TimesUsed            int64                `bson:"times_used" json:"times_used"`
	ApplicableProductIDs []primitive.ObjectID `bson:"applicable_product_ids,omitempty" json:"applicable_product_ids,omitempty"` // Empty = all products
	IsActive             bool                 `bson:"is_active" json:"is_active"`
	ExpiresAt            *time.Time           `bson:"expires_at,omitempty" json:"expires_at,omitempty"`
	CreatedAt            time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt            time.Time            `bson:"updated_at" json:"updated_at"`
}

// CouponRepository defines the interface for coupon storage.
type CouponRepository interface {
	Create(ctx context.Context, coupon *Coupon) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*Coupon, error)
	FindByCode(ctx context.Context, creatorID primitive.ObjectID, code string) (*Coupon, error)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Coupon, error)
	Update(ctx context.Context, coupon *Coupon) error
	IncrementUsage(ctx context.Context, couponID primitive.ObjectID) error
}
