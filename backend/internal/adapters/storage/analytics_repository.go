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

type MongoAnalyticsRepository struct {
	*BaseRepository[domain.AnalyticsEvent]
}

func NewMongoAnalyticsRepository(db *MongoDB) *MongoAnalyticsRepository {
	repo := &MongoAnalyticsRepository{
		BaseRepository: NewBaseRepository[domain.AnalyticsEvent](db, "analytics_events"),
	}
	// Note: You can call repo.EnsureIndexes(context.Background()) elsewhere if you want.
	return repo
}

// EnsureIndexes creates the necessary indexes, specifically the 90-day TTL index on timestamp.
func (r *MongoAnalyticsRepository) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "creator_id", Value: 1}, {Key: "timestamp", Value: -1}},
		},
		{
			// 90 days TTL index on timestamp
			Keys:    bson.D{{Key: "timestamp", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(90 * 24 * 60 * 60),
		},
	}
	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

// AggregateDailyMetrics performs a native MongoDB aggregation against raw events matching the targetDate (YYYY-MM-DD).
// It maps the results into AnalyticsDaily items per creator_id.
// unique_visitors is roughly estimated by distinct visitor_ids.
func (r *MongoAnalyticsRepository) AggregateDailyMetrics(ctx context.Context, dateStr string) ([]domain.AnalyticsDaily, error) {
	// targetDate bounds for Timestamp
	startTime, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, err
	}
	endTime := startTime.AddDate(0, 0, 1)

	matchStage := bson.D{{Key: "$match", Value: bson.D{
		{Key: "timestamp", Value: bson.D{{Key: "$gte", Value: startTime}, {Key: "$lt", Value: endTime}}},
	}}}

	groupStage := bson.D{{Key: "$group", Value: bson.D{
		{Key: "_id", Value: "$creator_id"},
		// We use $addToSet to get unique visitors, and then we will count the array size in Go or in the next stage
		{Key: "unique_visitor_set", Value: bson.D{{Key: "$addToSet", Value: "$visitor_id"}}},
		{Key: "page_views", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{bson.D{{Key: "$eq", Value: bson.A{"$event_type", domain.EventPageView}}}, 1, 0}}}}}},
		{Key: "product_views", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{bson.D{{Key: "$eq", Value: bson.A{"$event_type", domain.EventProductView}}}, 1, 0}}}}}},
		{Key: "checkout_starts", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{bson.D{{Key: "$eq", Value: bson.A{"$event_type", domain.EventCheckoutStart}}}, 1, 0}}}}}},
		{Key: "purchases", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{bson.D{{Key: "$eq", Value: bson.A{"$event_type", domain.EventPurchase}}}, 1, 0}}}}}},
		// If revenue tracked in metadata: (simplifying by just converting `$metadata.revenue` if present to int, but Mongo string to int casting is tricky.
		// For now we will keep Revenue 0 and update it where Orders reside, or just do simple count.)
	}}}

	// Add $project stage to compute array size for unique_visitors
	projectStage := bson.D{{Key: "$project", Value: bson.D{
		{Key: "_id", Value: 1}, // creator_id
		{Key: "page_views", Value: 1},
		{Key: "product_views", Value: 1},
		{Key: "checkout_starts", Value: 1},
		{Key: "purchases", Value: 1},
		{Key: "unique_visitors", Value: bson.D{{Key: "$size", Value: "$unique_visitor_set"}}},
	}}}

	pipeline := mongo.Pipeline{matchStage, groupStage, projectStage}
	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rawResults []struct {
		ID             primitive.ObjectID `bson:"_id"` // Grouped by creator ID
		PageViews      int                `bson:"page_views"`
		ProductViews   int                `bson:"product_views"`
		CheckoutStarts int                `bson:"checkout_starts"`
		Purchases      int                `bson:"purchases"`
		UniqueVisitors int                `bson:"unique_visitors"`
	}

	if err := cursor.All(ctx, &rawResults); err != nil {
		return nil, err
	}

	var dailies []domain.AnalyticsDaily
	for _, raw := range rawResults {
		dailies = append(dailies, domain.AnalyticsDaily{
			CreatorID:      raw.ID,
			Date:           dateStr,
			PageViews:      raw.PageViews,
			ProductViews:   raw.ProductViews,
			CheckoutStarts: raw.CheckoutStarts,
			Purchases:      raw.Purchases,
			UniqueVisitors: raw.UniqueVisitors,
			// Revenue could be synced separately via Order mappings if needed
		})
	}
	return dailies, nil
}
