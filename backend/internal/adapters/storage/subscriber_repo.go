package storage

import (
	"context"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoSubscriberRepository implements domain.EmailSubscriberRepository.
type MongoSubscriberRepository struct {
	collection *mongo.Collection
}

// NewMongoSubscriberRepository creates a new subscriber repository with indexes.
func NewMongoSubscriberRepository(db *mongo.Database) *MongoSubscriberRepository {
	repo := &MongoSubscriberRepository{
		collection: db.Collection("email_subscribers"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *MongoSubscriberRepository) ensureIndexes() {
	ctx := context.Background()
	_, err := r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "creator_id", Value: 1}, {Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		logger.Error("failed to create subscriber index", "error", err.Error())
	}
}

// Upsert creates or updates a subscriber (no duplicate on creator_id + email).
func (r *MongoSubscriberRepository) Upsert(ctx context.Context, sub *domain.EmailSubscriber) error {
	filter := bson.M{
		"creator_id": sub.CreatorID,
		"email":      sub.Email,
	}
	update := bson.M{
		"$set": bson.M{
			"name":          sub.Name,
			"source":        sub.Source,
			"consent_given": sub.ConsentGiven,
		},
		"$setOnInsert": bson.M{
			"_id":           primitive.NewObjectID(),
			"subscribed_at": time.Now(),
		},
	}
	opts := options.Update().SetUpsert(true)
	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}

// FindAllByCreatorID returns active subscribers, paginated.
func (r *MongoSubscriberRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID, limit, offset int64) ([]*domain.EmailSubscriber, error) {
	filter := bson.M{
		"creator_id":      creatorID,
		"unsubscribed_at": bson.M{"$exists": false},
	}
	opts := options.Find().
		SetSort(bson.D{{Key: "subscribed_at", Value: -1}}).
		SetLimit(limit).
		SetSkip(offset)

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subs []*domain.EmailSubscriber
	if err = cursor.All(ctx, &subs); err != nil {
		return nil, err
	}
	return subs, nil
}

// Unsubscribe marks a subscriber as unsubscribed.
func (r *MongoSubscriberRepository) Unsubscribe(ctx context.Context, creatorID primitive.ObjectID, email string) error {
	now := time.Now()
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"creator_id": creatorID, "email": email},
		bson.M{"$set": bson.M{"unsubscribed_at": now}},
	)
	return err
}

// Count returns total active subscriber count.
func (r *MongoSubscriberRepository) Count(ctx context.Context, creatorID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{
		"creator_id":      creatorID,
		"unsubscribed_at": bson.M{"$exists": false},
	})
}
