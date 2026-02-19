package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ProductType defines the type of product
type ProductType string

const (
	ProductTypeDownload ProductType = "download"
	ProductTypeCourse   ProductType = "course"
	ProductTypeBooking  ProductType = "booking"
)

// Product represents a digital product in the store
type Product struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID     primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Title         string             `bson:"title" json:"title"`
	Description   string             `bson:"description" json:"description"`
	Price         int64              `bson:"price" json:"price"` // In paise/cents
	CoverImageURL string             `bson:"cover_image_url" json:"cover_image_url"`
	FileURL       string             `bson:"file_url,omitempty" json:"-"` // Never return file URL in JSON
	ProductType   ProductType        `bson:"product_type" json:"product_type"`
	IsVisible     bool               `bson:"is_visible" json:"is_visible"`
	SortOrder     int                `bson:"sort_order" json:"sort_order"`
	DeletedAt     *time.Time         `bson:"deleted_at,omitempty" json:"-"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
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
}
