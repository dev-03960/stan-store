package storage

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const blogsCollection = "blogs"

// MongoBlogRepository implements domain.BlogRepository using MongoDB.
type MongoBlogRepository struct {
	*BaseRepository[domain.Blog]
}

// NewMongoBlogRepository creates a new MongoBlogRepository and ensures indexes.
func NewMongoBlogRepository(db *MongoDB) *MongoBlogRepository {
	repo := &MongoBlogRepository{
		BaseRepository: NewBaseRepository[domain.Blog](db, blogsCollection),
	}
	repo.ensureIndexes()
	return repo
}

// ensureIndexes creates indexes for blogs collection.
func (r *MongoBlogRepository) ensureIndexes() {
	ctx := context.Background()
	col := r.Collection()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "slug", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "is_published", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "published_at", Value: -1}},
			Options: options.Index(),
		},
	}

	_, err := col.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		logger.Error("failed to create blog indexes", "error", err.Error())
	} else {
		logger.Info("blog indexes ensured", "collection", blogsCollection)
	}
}

// FindBySlug retrieves a single blog post by its slug.
func (r *MongoBlogRepository) FindBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.Collection().FindOne(ctx, bson.M{"slug": slug}).Decode(&blog)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("find by slug: %w", err)
	}
	return &blog, nil
}

// FindPublished retrieves published blog posts with pagination.
func (r *MongoBlogRepository) FindPublished(ctx context.Context, pagination *domain.Pagination) ([]domain.Blog, *domain.PaginationMeta, error) {
	filter := domain.Filter{
		"is_published": true,
	}
	sort := &domain.Sort{
		Field: "published_at",
		Order: domain.SortDesc,
	}
	return r.BaseRepository.FindMany(ctx, filter, pagination, sort)
}
