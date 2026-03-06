package storage

import (
	"context"
	"errors"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoGoogleCalendarConnectionRepository implements GoogleCalendarConnectionRepository using MongoDB.
type MongoGoogleCalendarConnectionRepository struct {
	collection *mongo.Collection
}

// NewMongoGoogleCalendarConnectionRepository creates a new repository instance.
func NewMongoGoogleCalendarConnectionRepository(db *mongo.Database) *MongoGoogleCalendarConnectionRepository {
	repo := &MongoGoogleCalendarConnectionRepository{
		collection: db.Collection("google_calendar_connections"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *MongoGoogleCalendarConnectionRepository) ensureIndexes() {
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	r.collection.Indexes().CreateMany(context.Background(), indexes)
}

func (r *MongoGoogleCalendarConnectionRepository) FindByCreatorID(ctx context.Context, creatorID string) (*domain.GoogleCalendarConnection, error) {
	var conn domain.GoogleCalendarConnection
	err := r.collection.FindOne(ctx, bson.M{"creator_id": creatorID}).Decode(&conn)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &conn, nil
}

func (r *MongoGoogleCalendarConnectionRepository) CreateOrUpdate(ctx context.Context, conn *domain.GoogleCalendarConnection) error {
	filter := bson.M{"creator_id": conn.CreatorID}
	update := bson.M{
		"$set": bson.M{
			"email":                   conn.Email,
			"encrypted_access_token":  conn.EncryptedAccessToken,
			"encrypted_refresh_token": conn.EncryptedRefreshToken,
			"token_expiry":            conn.TokenExpiry,
			"is_active":               conn.IsActive,
			"updated_at":              conn.UpdatedAt,
		},
		"$setOnInsert": bson.M{
			"created_at": conn.CreatedAt,
		},
	}
	opts := options.Update().SetUpsert(true)
	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}

func (r *MongoGoogleCalendarConnectionRepository) Delete(ctx context.Context, creatorID string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"creator_id": creatorID})
	return err
}
