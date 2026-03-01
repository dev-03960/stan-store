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

// MongoWebhookEventRepository implements domain.WebhookEventRepository.
type MongoWebhookEventRepository struct {
	collection *mongo.Collection
}

// NewMongoWebhookEventRepository creates a new repository and ensures indexes.
func NewMongoWebhookEventRepository(db *mongo.Database) *MongoWebhookEventRepository {
	col := db.Collection("webhook_events")

	// Ensure unique index on event_id for deduplication
	_, _ = col.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{Key: "event_id", Value: 1}},
		Options: options.Index().SetUnique(true).SetSparse(true),
	})

	// Index on status for stats queries
	_, _ = col.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{{Key: "status", Value: 1}},
	})

	return &MongoWebhookEventRepository{collection: col}
}

// Create inserts a new webhook event record.
func (r *MongoWebhookEventRepository) Create(ctx context.Context, event *domain.WebhookEvent) error {
	event.ID = primitive.NewObjectID()
	event.CreatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, event)
	return err
}

// FindByEventID looks up a webhook event by Razorpay's event ID.
func (r *MongoWebhookEventRepository) FindByEventID(ctx context.Context, eventID string) (*domain.WebhookEvent, error) {
	var event domain.WebhookEvent
	err := r.collection.FindOne(ctx, bson.M{"event_id": eventID}).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

// UpdateStatus sets the status and processed_at timestamp on a webhook event.
func (r *MongoWebhookEventRepository) UpdateStatus(ctx context.Context, id primitive.ObjectID, status domain.WebhookEventStatus) error {
	update := bson.M{
		"$set": bson.M{
			"status": status,
		},
	}
	if status == domain.WebhookEventStatusProcessed {
		now := time.Now()
		update["$set"].(bson.M)["processed_at"] = now
	}
	_, err := r.collection.UpdateByID(ctx, id, update)
	return err
}

// IncrementRetryCount bumps the retry count and sets the error message.
func (r *MongoWebhookEventRepository) IncrementRetryCount(ctx context.Context, id primitive.ObjectID, errMsg string) error {
	update := bson.M{
		"$inc": bson.M{"retry_count": 1},
		"$set": bson.M{"error_message": errMsg},
	}
	_, err := r.collection.UpdateByID(ctx, id, update)
	return err
}

// GetStats returns aggregated webhook counts grouped by status and event_type.
func (r *MongoWebhookEventRepository) GetStats(ctx context.Context) (map[string]interface{}, error) {
	// Aggregate by status
	statusPipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$status"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
	}

	statusCursor, err := r.collection.Aggregate(ctx, statusPipeline)
	if err != nil {
		return nil, err
	}
	defer statusCursor.Close(ctx)

	byStatus := make(map[string]int64)
	for statusCursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := statusCursor.Decode(&result); err == nil {
			byStatus[result.ID] = result.Count
		}
	}

	// Aggregate by event_type
	typePipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$event_type"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
	}

	typeCursor, err := r.collection.Aggregate(ctx, typePipeline)
	if err != nil {
		return nil, err
	}
	defer typeCursor.Close(ctx)

	byType := make(map[string]int64)
	for typeCursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := typeCursor.Decode(&result); err == nil {
			byType[result.ID] = result.Count
		}
	}

	// Total count
	total, _ := r.collection.CountDocuments(ctx, bson.M{})

	return map[string]interface{}{
		"total":         total,
		"by_status":     byStatus,
		"by_event_type": byType,
	}, nil
}
