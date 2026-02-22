package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ProductType defines the type of product
type ProductType string

const (
	ProductTypeDownload   ProductType = "download"
	ProductTypeCourse     ProductType = "course"
	ProductTypeBooking    ProductType = "booking"
	ProductTypeLeadMagnet ProductType = "lead_magnet"
	ProductTypeMembership ProductType = "membership"
)

// BumpConfig holds order bump configuration for a product.
type BumpConfig struct {
	BumpProductID primitive.ObjectID `bson:"bump_product_id" json:"bump_product_id"`
	BumpDiscount  int64              `bson:"bump_discount" json:"bump_discount"` // In paise (optional discount)
}

// AvailabilityWindow defines a recurring weekly time slot for coaching
type AvailabilityWindow struct {
	DayOfWeek int    `bson:"day_of_week" json:"day_of_week"` // 0 = Sunday, 1 = Monday...
	StartTime string `bson:"start_time" json:"start_time"`   // Format: "HH:MM" (e.g. "09:00")
	EndTime   string `bson:"end_time" json:"end_time"`       // Format: "HH:MM"
}

// Product represents a digital product in the store
type Product struct {
	ID                      primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	CreatorID               primitive.ObjectID   `bson:"creator_id" json:"creator_id"`
	Title                   string               `bson:"title" json:"title"`
	Description             string               `bson:"description" json:"description"`
	Price                   int64                `bson:"price" json:"price"` // In paise/cents
	CoverImageURL           string               `bson:"cover_image_url" json:"cover_image_url"`
	FileURL                 string               `bson:"file_url,omitempty" json:"-"` // Never return file URL in JSON
	ProductType             ProductType          `bson:"product_type" json:"product_type"`
	IsVisible               bool                 `bson:"is_visible" json:"is_visible"`
	SortOrder               int                  `bson:"sort_order" json:"sort_order"`
	Bump                    *BumpConfig          `bson:"bump,omitempty" json:"bump,omitempty"`
	DurationMinutes         int                  `bson:"duration_minutes,omitempty" json:"duration_minutes,omitempty"`
	Timezone                string               `bson:"timezone,omitempty" json:"timezone,omitempty"`
	Availability            []AvailabilityWindow `bson:"availability,omitempty" json:"availability,omitempty"`
	CancellationWindowHours int                  `bson:"cancellation_window_hours,omitempty" json:"cancellation_window_hours,omitempty"`
	// Subscription Fields
	SubscriptionInterval string `bson:"subscription_interval,omitempty" json:"subscription_interval,omitempty"` // "monthly", "yearly"

	DeletedAt *time.Time `bson:"deleted_at,omitempty" json:"-"`
	CreatedAt time.Time  `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time  `bson:"updated_at" json:"updated_at"`
}

// UpdateVisibilityRequest represents the payload for toggling visibility
type UpdateVisibilityRequest struct {
	IsVisible bool `json:"is_visible"`
}

// ReorderRequest represents the payload for reordering products
type ReorderRequest struct {
	ProductIDs []string `json:"product_ids" validate:"required,min=1"`
}

// ProductRepository defines the interface for product storage
type ProductRepository interface {
	Create(ctx context.Context, product *Product) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*Product, error)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Product, error)
	Update(ctx context.Context, product *Product) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	UpdateVisibility(ctx context.Context, id primitive.ObjectID, creatorID primitive.ObjectID, isVisible bool) error
	ReorderProducts(ctx context.Context, creatorID primitive.ObjectID, productIDs []primitive.ObjectID) error
	FindVisibleByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Product, error)
	UpdateBumpConfig(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, bump *BumpConfig) error
}
