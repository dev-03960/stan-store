package storage

import (
	"context"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoPlatformSubscriptionRepository implements PlatformSubscriptionRepository.
type MongoPlatformSubscriptionRepository struct {
	collection *mongo.Collection
}

// NewMongoPlatformSubscriptionRepository creates a new repository.
func NewMongoPlatformSubscriptionRepository(db *mongo.Database) *MongoPlatformSubscriptionRepository {
	coll := db.Collection("platform_subscriptions")

	// Create indexes
	_, _ = coll.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{Keys: bson.D{{Key: "creator_id", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "trial_ends_at", Value: 1}}},
	})

	return &MongoPlatformSubscriptionRepository{collection: coll}
}

func (r *MongoPlatformSubscriptionRepository) Create(ctx context.Context, sub *domain.PlatformSubscription) error {
	if sub.ID.IsZero() {
		sub.ID = primitive.NewObjectID()
	}
	sub.CreatedAt = time.Now()
	sub.UpdatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, sub)
	return err
}

func (r *MongoPlatformSubscriptionRepository) FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (*domain.PlatformSubscription, error) {
	var sub domain.PlatformSubscription
	err := r.collection.FindOne(ctx, bson.M{"creator_id": creatorID}).Decode(&sub)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *MongoPlatformSubscriptionRepository) Update(ctx context.Context, sub *domain.PlatformSubscription) error {
	sub.UpdatedAt = time.Now()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": sub.ID}, sub)
	return err
}

func (r *MongoPlatformSubscriptionRepository) FindAll(ctx context.Context, filter domain.Filter, pagination *domain.Pagination) ([]*domain.PlatformSubscription, *domain.PaginationMeta, error) {
	mongoFilter := bson.M{}
	for k, v := range filter {
		if v != nil && v != "" {
			mongoFilter[k] = v
		}
	}

	page := int64(1)
	pageSize := int64(20)
	if pagination != nil {
		if pagination.Page > 0 {
			page = pagination.Page
		}
		if pagination.PageSize > 0 {
			pageSize = pagination.PageSize
		}
	}

	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, nil, err
	}

	skip := (page - 1) * pageSize
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(pageSize)

	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, nil, err
	}
	defer cursor.Close(ctx)

	var subs []*domain.PlatformSubscription
	if err := cursor.All(ctx, &subs); err != nil {
		return nil, nil, err
	}

	totalPages := total / pageSize
	if total%pageSize != 0 {
		totalPages++
	}

	meta := &domain.PaginationMeta{
		Page:       page,
		PageSize:   pageSize,
		TotalCount: total,
		TotalPages: totalPages,
	}

	return subs, meta, nil
}

func (r *MongoPlatformSubscriptionRepository) CountByStatus(ctx context.Context) (map[string]int64, error) {
	result := map[string]int64{
		"trial":     0,
		"active":    0,
		"cancelled": 0,
		"expired":   0,
	}

	for status := range result {
		count, err := r.collection.CountDocuments(ctx, bson.M{"status": status})
		if err != nil {
			return nil, err
		}
		result[status] = count
	}

	return result, nil
}
