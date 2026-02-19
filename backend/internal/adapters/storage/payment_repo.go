package storage

import (
	"context"
	"errors"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoPaymentRepository struct {
	collection *mongo.Collection
}

func NewMongoPaymentRepository(db *mongo.Database) *MongoPaymentRepository {
	return &MongoPaymentRepository{
		collection: db.Collection("payment_settings"),
	}
}

func (r *MongoPaymentRepository) GetSettings(ctx context.Context, userID primitive.ObjectID) (*domain.PaymentSettings, error) {
	var settings domain.PaymentSettings
	err := r.collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&settings)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			// Return default settings if none exist
			return &domain.PaymentSettings{
				UserID:   userID,
				Enabled:  false,
				Currency: "INR",
			}, nil
		}
		return nil, err
	}
	return &settings, nil
}

func (r *MongoPaymentRepository) UpdateSettings(ctx context.Context, settings *domain.PaymentSettings) error {
	settings.UpdatedAt = time.Now()
	opts := options.Update().SetUpsert(true)
	filter := bson.M{"user_id": settings.UserID}
	update := bson.M{
		"$set": settings,
	}

	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}
