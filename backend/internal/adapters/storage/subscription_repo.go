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

// MongoSubscriptionRepository implements domain.SubscriptionRepository using MongoDB.
type MongoSubscriptionRepository struct {
	*BaseRepository[domain.Subscription]
}

// NewMongoSubscriptionRepository creates a new repository for subscriptions.
func NewMongoSubscriptionRepository(db *MongoDB) *MongoSubscriptionRepository {
	repo := &MongoSubscriptionRepository{
		BaseRepository: NewBaseRepository[domain.Subscription](db, "subscriptions"),
	}

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "creator_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "customer_email", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "razorpay_sub_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}

	_, _ = repo.Collection().Indexes().CreateMany(ctx, indexes)

	return repo
}

// Create stores a new subscription and sets timing handles
func (r *MongoSubscriptionRepository) Create(ctx context.Context, sub *domain.Subscription) error {
	now := time.Now()
	sub.CreatedAt = now
	sub.UpdatedAt = now

	result, err := r.Collection().InsertOne(ctx, sub)
	if err != nil {
		return err
	}

	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		sub.ID = oid
	}
	return nil
}

// Update saves modifications to a subscription
func (r *MongoSubscriptionRepository) Update(ctx context.Context, sub *domain.Subscription) error {
	sub.UpdatedAt = time.Now()
	filter := bson.M{"_id": sub.ID}
	update := bson.M{"$set": sub}

	result, err := r.Collection().UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 && result.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

// FindByRazorpaySubID finds a subscription by its Razorpay ID
func (r *MongoSubscriptionRepository) FindByRazorpaySubID(ctx context.Context, razorpaySubID string) (*domain.Subscription, error) {
	filter := bson.M{"razorpay_sub_id": razorpaySubID}
	var sub domain.Subscription
	err := r.Collection().FindOne(ctx, filter).Decode(&sub)
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

// FindByID retrieves a subscription by its Mongo primitive.ObjectID
func (r *MongoSubscriptionRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Subscription, error) {
	filter := bson.M{"_id": id}
	var sub domain.Subscription
	err := r.Collection().FindOne(ctx, filter).Decode(&sub)
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *MongoSubscriptionRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Subscription, error) {
	filter := bson.M{"creator_id": creatorID}
	// Sort by newest first
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.Collection().Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subscriptions []*domain.Subscription
	if err = cursor.All(ctx, &subscriptions); err != nil {
		return nil, err
	}

	return subscriptions, nil
}

func (r *MongoSubscriptionRepository) FindAllByCustomerEmail(ctx context.Context, email string) ([]*domain.Subscription, error) {
	filter := bson.M{"customer_email": email}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.Collection().Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subscriptions []*domain.Subscription
	if err = cursor.All(ctx, &subscriptions); err != nil {
		return nil, err
	}

	return subscriptions, nil
}
