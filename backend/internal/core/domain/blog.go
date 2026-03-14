package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Blog represents a blog post in the system.
type Blog struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title" validate:"required"`
	Slug        string             `bson:"slug" json:"slug" validate:"required"`
	Content     string             `bson:"content" json:"content" validate:"required"`
	Summary     string             `bson:"summary" json:"summary"`
	CoverImage  string             `bson:"cover_image" json:"cover_image"`
	Author      string             `bson:"author" json:"author"`
	Tags        []string           `bson:"tags" json:"tags"`
	IsPublished *bool              `bson:"is_published" json:"is_published"`
	PublishedAt *time.Time         `bson:"published_at,omitempty" json:"published_at,omitempty"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// BlogRepository defines the interface for blog persistence.
type BlogRepository interface {
	Repository[Blog]
	FindBySlug(ctx context.Context, slug string) (*Blog, error)
	FindPublished(ctx context.Context, pagination *Pagination) ([]Blog, *PaginationMeta, error)
}
