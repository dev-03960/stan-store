package storage

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoCouponRepository implements domain.CouponRepository.
type MongoCouponRepository struct {
	collection *mongo.Collection
}

// NewMongoCouponRepository creates a new coupon repository with indexes.
func NewMongoCouponRepository(db *mongo.Database) *MongoCouponRepository {
	repo := &MongoCouponRepository{
		collection: db.Collection("coupons"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *MongoCouponRepository) ensureIndexes() {
	ctx := context.Background()
	_, err := r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "creator_id", Value: 1}, {Key: "code", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		logger.Error("failed to create coupon index", "error", err.Error())
	}
}

// Create inserts a new coupon.
func (r *MongoCouponRepository) Create(ctx context.Context, coupon *domain.Coupon) error {
	coupon.ID = primitive.NewObjectID()
	coupon.Code = strings.ToUpper(coupon.Code)
	coupon.CreatedAt = time.Now()
	coupon.UpdatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, coupon)
	return err
}

// FindByID finds a coupon by its ID.
func (r *MongoCouponRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Coupon, error) {
	var coupon domain.Coupon
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&coupon)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &coupon, nil
}

// FindByCode finds a coupon by creator ID and code (case-insensitive).
func (r *MongoCouponRepository) FindByCode(ctx context.Context, creatorID primitive.ObjectID, code string) (*domain.Coupon, error) {
	var coupon domain.Coupon
	err := r.collection.FindOne(ctx, bson.M{
		"creator_id": creatorID,
		"code":       strings.ToUpper(code),
	}).Decode(&coupon)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &coupon, nil
}

// FindAllByCreatorID returns all coupons for a creator, newest first.
func (r *MongoCouponRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Coupon, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var coupons []*domain.Coupon
	if err = cursor.All(ctx, &coupons); err != nil {
		return nil, err
	}
	return coupons, nil
}

// Update replaces a coupon document.
func (r *MongoCouponRepository) Update(ctx context.Context, coupon *domain.Coupon) error {
	coupon.UpdatedAt = time.Now()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": coupon.ID}, coupon)
	return err
}

// IncrementUsage atomically increments the times_used counter.
func (r *MongoCouponRepository) IncrementUsage(ctx context.Context, couponID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": couponID},
		bson.M{"$inc": bson.M{"times_used": 1}},
	)
	return err
}
