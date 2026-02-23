package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Testimonial represents a social proof review attached to a specific product.
type Testimonial struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID    primitive.ObjectID `bson:"product_id" json:"product_id"`
	CreatorID    primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	CustomerName string             `bson:"customer_name" json:"customer_name"`
	Text         string             `bson:"text" json:"text"`     // Recommended limit: ~300 chars
	Rating       int                `bson:"rating" json:"rating"` // 1-5 stars
	AvatarURL    string             `bson:"avatar_url,omitempty" json:"avatar_url,omitempty"`
	SortOrder    int                `bson:"sort_order" json:"sort_order"` // Used for displaying order on storefront
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}

// TestimonialRepository defines the persistent storage contract.
type TestimonialRepository interface {
	Create(ctx context.Context, testimonial *Testimonial) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*Testimonial, error)
	FindByProductID(ctx context.Context, productID primitive.ObjectID) ([]*Testimonial, error)
	Update(ctx context.Context, testimonial *Testimonial) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	CountByProductID(ctx context.Context, productID primitive.ObjectID) (int64, error)
}
