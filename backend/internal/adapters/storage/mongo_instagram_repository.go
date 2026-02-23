package storage

import (
	"context"
	"errors"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoInstagramConnectionRepository struct {
	collection *mongo.Collection
}

func NewMongoInstagramConnectionRepository(db *mongo.Database) *MongoInstagramConnectionRepository {
	repo := &MongoInstagramConnectionRepository{
		collection: db.Collection("instagram_connections"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *MongoInstagramConnectionRepository) ensureIndexes() {
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "ig_user_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	r.collection.Indexes().CreateMany(context.Background(), indexes)
}

func (r *MongoInstagramConnectionRepository) FindByCreatorID(ctx context.Context, creatorID string) (*domain.InstagramConnection, error) {
	var conn domain.InstagramConnection
	err := r.collection.FindOne(ctx, bson.M{"creator_id": creatorID}).Decode(&conn)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil // Not found
		}
		return nil, err
	}
	return &conn, nil
}

func (r *MongoInstagramConnectionRepository) FindByIGUserID(ctx context.Context, igUserID string) (*domain.InstagramConnection, error) {
	var conn domain.InstagramConnection
	err := r.collection.FindOne(ctx, bson.M{"ig_user_id": igUserID}).Decode(&conn)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &conn, nil
}

func (r *MongoInstagramConnectionRepository) CreateOrUpdate(ctx context.Context, conn *domain.InstagramConnection) error {
	filter := bson.M{"creator_id": conn.CreatorID}
	update := bson.M{
		"$set": bson.M{
			"ig_user_id":       conn.IGUserID,
			"ig_username":      conn.IGUsername,
			"encrypted_token":  conn.EncryptedToken,
			"token_expires_at": conn.TokenExpiresAt,
			"facebook_page_id": conn.FacebookPageID,
			"webhook_verified": conn.WebhookVerified,
			"is_active":        conn.IsActive,
			"updated_at":       conn.UpdatedAt,
		},
		"$setOnInsert": bson.M{
			"created_at": conn.CreatedAt,
		},
	}
	opts := options.Update().SetUpsert(true)
	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}

func (r *MongoInstagramConnectionRepository) Delete(ctx context.Context, creatorID string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"creator_id": creatorID})
	return err
}

// --------------------------------------------------------------------------

type MongoInstagramAutomationRepository struct {
	collection *mongo.Collection
}

func NewMongoInstagramAutomationRepository(db *mongo.Database) *MongoInstagramAutomationRepository {
	repo := &MongoInstagramAutomationRepository{
		collection: db.Collection("instagram_automations"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *MongoInstagramAutomationRepository) ensureIndexes() {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "creator_id", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}, {Key: "keyword", Value: 1}},
			Options: options.Index().SetUnique(true), // One unique keyword per creator
		},
	}
	r.collection.Indexes().CreateMany(context.Background(), indexes)
}

func (r *MongoInstagramAutomationRepository) FindByCreatorID(ctx context.Context, creatorID string) ([]*domain.InstagramAutomation, error) {
	var automations []*domain.InstagramAutomation
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID})
	if err != nil {
		return nil, err
	}
	if err = cursor.All(ctx, &automations); err != nil {
		return nil, err
	}
	return automations, nil
}

func (r *MongoInstagramAutomationRepository) FindByID(ctx context.Context, id string) (*domain.InstagramAutomation, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid id format")
	}
	var automation domain.InstagramAutomation
	err = r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&automation)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &automation, nil
}

func (r *MongoInstagramAutomationRepository) FindByKeyword(ctx context.Context, creatorID string, keyword string) (*domain.InstagramAutomation, error) {
	var automation domain.InstagramAutomation
	// Keywords might be case-insensitive, we can use regex or exact match based on implementation.
	// For now, assume exact match and case-insensitivity is handled before querying (e.g., lowercasing during save and query).
	err := r.collection.FindOne(ctx, bson.M{"creator_id": creatorID, "keyword": keyword}).Decode(&automation)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &automation, nil
}

func (r *MongoInstagramAutomationRepository) Create(ctx context.Context, automation *domain.InstagramAutomation) error {
	res, err := r.collection.InsertOne(ctx, automation)
	if err != nil {
		return err
	}
	automation.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *MongoInstagramAutomationRepository) Update(ctx context.Context, automation *domain.InstagramAutomation) error {
	filter := bson.M{"_id": automation.ID}
	update := bson.M{"$set": automation}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *MongoInstagramAutomationRepository) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid id format")
	}
	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

func (r *MongoInstagramAutomationRepository) IncrementDMCount(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid id format")
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$inc": bson.M{"dm_count": 1}})
	return err
}
