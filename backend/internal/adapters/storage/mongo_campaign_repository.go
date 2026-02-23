package storage

import (
	"context"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoCampaignRepository struct {
	collection *mongo.Collection
}

func NewMongoCampaignRepository(db *mongo.Database) *MongoCampaignRepository {
	return &MongoCampaignRepository{
		collection: db.Collection("campaigns"),
	}
}

func (r *MongoCampaignRepository) Create(ctx context.Context, campaign *domain.Campaign) error {
	now := time.Now()
	campaign.CreatedAt = now
	campaign.UpdatedAt = now
	if campaign.ID == primitive.NilObjectID {
		campaign.ID = primitive.NewObjectID()
	}

	_, err := r.collection.InsertOne(ctx, campaign)
	return err
}

func (r *MongoCampaignRepository) Update(ctx context.Context, campaign *domain.Campaign) error {
	campaign.UpdatedAt = time.Now()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": campaign.ID}, campaign)
	return err
}

func (r *MongoCampaignRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Campaign, error) {
	var campaign domain.Campaign
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&campaign)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &campaign, nil
}

func (r *MongoCampaignRepository) FindAllByCreator(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Campaign, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var campaigns []*domain.Campaign
	if err := cursor.All(ctx, &campaigns); err != nil {
		return nil, err
	}
	return campaigns, nil
}

func (r *MongoCampaignRepository) FindByTriggerProductAndStatus(ctx context.Context, productID primitive.ObjectID, status domain.CampaignStatus) ([]*domain.Campaign, error) {
	cursor, err := r.collection.Find(ctx, bson.M{
		"trigger_product_id": productID,
		"status":             status,
		"trigger_type":       "lead_magnet_signup",
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var campaigns []*domain.Campaign
	if err := cursor.All(ctx, &campaigns); err != nil {
		return nil, err
	}
	return campaigns, nil
}
