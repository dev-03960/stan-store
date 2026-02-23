package storage

import (
	"context"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoEmailQueueRepository struct {
	collection *mongo.Collection
}

func NewMongoEmailQueueRepository(db *mongo.Database) *MongoEmailQueueRepository {
	return &MongoEmailQueueRepository{
		collection: db.Collection("email_queue"),
	}
}

func (r *MongoEmailQueueRepository) Create(ctx context.Context, queue *domain.EmailQueue) error {
	if queue.ID == primitive.NilObjectID {
		queue.ID = primitive.NewObjectID()
	}
	_, err := r.collection.InsertOne(ctx, queue)
	return err
}

func (r *MongoEmailQueueRepository) Update(ctx context.Context, queue *domain.EmailQueue) error {
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": queue.ID}, queue)
	return err
}

func (r *MongoEmailQueueRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.EmailQueue, error) {
	var queue domain.EmailQueue
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&queue)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &queue, nil
}

func (r *MongoEmailQueueRepository) MarkStatus(ctx context.Context, id primitive.ObjectID, status domain.QueueStatus) error {
	update := bson.M{
		"$set": bson.M{
			"status": status,
		},
	}
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *MongoEmailQueueRepository) CountSentByCampaign(ctx context.Context, campaignID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{
		"campaign_id": campaignID,
		"status":      domain.QueueStatusSent,
	})
}
