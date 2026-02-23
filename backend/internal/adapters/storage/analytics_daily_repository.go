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

type MongoAnalyticsDailyRepository struct {
	*BaseRepository[domain.AnalyticsDaily]
}

func NewMongoAnalyticsDailyRepository(db *MongoDB) *MongoAnalyticsDailyRepository {
	repo := &MongoAnalyticsDailyRepository{
		BaseRepository: NewBaseRepository[domain.AnalyticsDaily](db, "analytics_daily"),
	}
	return repo
}

// EnsureIndexes creates a unique index on creator_id + date
func (r *MongoAnalyticsDailyRepository) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}, {Key: "date", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *MongoAnalyticsDailyRepository) Upsert(ctx context.Context, daily *domain.AnalyticsDaily) error {
	filter := bson.M{
		"creator_id": daily.CreatorID,
		"date":       daily.Date,
	}

	update := bson.M{
		"$set": bson.M{
			"unique_visitors": daily.UniqueVisitors,
			"page_views":      daily.PageViews,
			"product_views":   daily.ProductViews,
			"checkout_starts": daily.CheckoutStarts,
			"purchases":       daily.Purchases,
			"revenue":         daily.Revenue,
			"updated_at":      time.Now(),
		},
		"$setOnInsert": bson.M{
			"created_at": time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}

func (r *MongoAnalyticsDailyRepository) FindByCreatorAndDateRange(ctx context.Context, creatorID primitive.ObjectID, startDate, endDate string) ([]domain.AnalyticsDaily, error) {
	filter := bson.M{
		"creator_id": creatorID,
		"date":       bson.M{"$gte": startDate, "$lte": endDate},
	}

	opts := options.Find().SetSort(bson.D{{Key: "date", Value: 1}})
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []domain.AnalyticsDaily
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}
	return results, nil
}
