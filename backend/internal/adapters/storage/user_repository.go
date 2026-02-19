package storage

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const usersCollection = "users"

// MongoUserRepository implements domain.UserRepository using MongoDB.
type MongoUserRepository struct {
	*BaseRepository[domain.User]
}

// NewMongoUserRepository creates a new MongoUserRepository and ensures indexes.
func NewMongoUserRepository(db *MongoDB) *MongoUserRepository {
	repo := &MongoUserRepository{
		BaseRepository: NewBaseRepository[domain.User](db, usersCollection),
	}
	repo.ensureIndexes()
	return repo
}

// ensureIndexes creates unique indexes on email, username, and google_id.
func (r *MongoUserRepository) ensureIndexes() {
	ctx := context.Background()
	col := r.Collection()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetCollation(&options.Collation{Locale: "en", Strength: 2}),
		},
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true).SetCollation(&options.Collation{Locale: "en", Strength: 2}),
		},
		{
			Keys:    bson.D{{Key: "google_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}

	_, err := col.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		logger.Error("failed to create user indexes", "error", err.Error())
	} else {
		logger.Info("user indexes ensured", "collection", usersCollection)
	}
}

// FindByEmail finds a user by email (case-insensitive).
func (r *MongoUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	col := r.Collection()

	var user domain.User
	err := col.FindOne(ctx, bson.M{"email": strings.ToLower(email)}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindByGoogleID finds a user by their Google OAuth ID.
func (r *MongoUserRepository) FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error) {
	col := r.Collection()

	var user domain.User
	err := col.FindOne(ctx, bson.M{"google_id": googleID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindByUsername finds a user by username (case-insensitive).
func (r *MongoUserRepository) FindByUsername(ctx context.Context, username string) (*domain.User, error) {
	col := r.Collection()

	var user domain.User
	err := col.FindOne(ctx, bson.M{"username": strings.ToLower(username)}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// UpdateStatus updates a user's status (active/banned) with ban metadata.
func (r *MongoUserRepository) UpdateStatus(ctx context.Context, id string, status string, reason string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	col := r.Collection()
	now := time.Now()

	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": now,
		},
	}

	if status == domain.UserStatusBanned {
		update["$set"].(bson.M)["banned_at"] = now
		update["$set"].(bson.M)["ban_reason"] = reason
	} else {
		// On unban, clear ban fields
		update["$unset"] = bson.M{
			"banned_at":  "",
			"ban_reason": "",
		}
	}

	result, err := col.UpdateByID(ctx, objectID, update)
	if err != nil {
		return fmt.Errorf("update status: %w", err)
	}
	if result.MatchedCount == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
