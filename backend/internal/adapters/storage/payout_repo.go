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

// MongoPayoutRepository implements domain.PayoutRepository.
type MongoPayoutRepository struct {
	collection *mongo.Collection
}

// NewMongoPayoutRepository creates a new MongoPayoutRepository.
func NewMongoPayoutRepository(db *mongo.Database) *MongoPayoutRepository {
	return &MongoPayoutRepository{
		collection: db.Collection("payouts"),
	}
}

// Create inserts a new payout record.
func (r *MongoPayoutRepository) Create(ctx context.Context, payout *domain.Payout) error {
	payout.ID = primitive.NewObjectID()
	payout.CreatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, payout)
	return err
}

// UpdateStatus updates payout status and sets completed_at for terminal states.
func (r *MongoPayoutRepository) UpdateStatus(ctx context.Context, razorpayPayoutID string, status domain.PayoutStatus) error {
	filter := bson.M{"razorpay_payout_id": razorpayPayoutID}
	update := bson.M{
		"$set": bson.M{
			"status": status,
		},
	}

	// Set completed_at for terminal states
	if status == domain.PayoutStatusCompleted || status == domain.PayoutStatusFailed || status == domain.PayoutStatusReversed {
		now := time.Now()
		update["$set"].(bson.M)["completed_at"] = now
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return errors.New("payout not found")
	}
	return nil
}

// FindPendingByCreatorID returns the currently processing payout for a creator, if any.
func (r *MongoPayoutRepository) FindPendingByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (*domain.Payout, error) {
	var payout domain.Payout
	err := r.collection.FindOne(ctx, bson.M{
		"creator_id": creatorID,
		"status":     domain.PayoutStatusProcessing,
	}).Decode(&payout)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &payout, nil
}

// FindAllByCreatorID returns all payouts for a creator, newest first.
func (r *MongoPayoutRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Payout, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var payouts []*domain.Payout
	if err = cursor.All(ctx, &payouts); err != nil {
		return nil, err
	}
	return payouts, nil
}

// FindByRazorpayPayoutID finds a payout by its Razorpay ID.
func (r *MongoPayoutRepository) FindByRazorpayPayoutID(ctx context.Context, razorpayPayoutID string) (*domain.Payout, error) {
	var payout domain.Payout
	err := r.collection.FindOne(ctx, bson.M{"razorpay_payout_id": razorpayPayoutID}).Decode(&payout)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &payout, nil
}
