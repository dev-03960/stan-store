package storage

import (
	"context"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoPlatformReferralRepository struct {
	collection *mongo.Collection
}

func NewMongoPlatformReferralRepository(db *mongo.Database) *MongoPlatformReferralRepository {
	return &MongoPlatformReferralRepository{
		collection: db.Collection("platform_referrals"),
	}
}

func (r *MongoPlatformReferralRepository) Create(ctx context.Context, referral *domain.PlatformReferral) error {
	result, err := r.collection.InsertOne(ctx, referral)
	if err != nil {
		return err
	}
	referral.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *MongoPlatformReferralRepository) FindByReferredID(ctx context.Context, referredID primitive.ObjectID) (*domain.PlatformReferral, error) {
	var referral domain.PlatformReferral
	err := r.collection.FindOne(ctx, bson.M{"referred_id": referredID}).Decode(&referral)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &referral, nil
}

func (r *MongoPlatformReferralRepository) FindAllByReferrerID(ctx context.Context, referrerID primitive.ObjectID) ([]*domain.PlatformReferral, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"referrer_id": referrerID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var referrals []*domain.PlatformReferral
	if err := cursor.All(ctx, &referrals); err != nil {
		return nil, err
	}

	if referrals == nil {
		referrals = []*domain.PlatformReferral{}
	}
	return referrals, nil
}

func (r *MongoPlatformReferralRepository) UpdateStatus(ctx context.Context, id primitive.ObjectID, status domain.PlatformReferralStatus) error {
	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"status":     status,
				"updated_at": primitive.DateTime(time.Now().UnixMilli()),
			},
		},
	)
	return err
}
