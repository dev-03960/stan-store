package storage

import (
	"context"
	"errors"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoOrderRepository struct {
	collection *mongo.Collection
}

func NewMongoOrderRepository(db *mongo.Database) *MongoOrderRepository {
	return &MongoOrderRepository{
		collection: db.Collection("orders"),
	}
}

func (r *MongoOrderRepository) Create(ctx context.Context, order *domain.Order) error {
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()
	order.ID = primitive.NewObjectID()

	_, err := r.collection.InsertOne(ctx, order)
	return err
}

func (r *MongoOrderRepository) UpdateStatus(ctx context.Context, razorpayOrderID string, status domain.OrderStatus, paymentID string) error {
	filter := bson.M{"razorpay_order_id": razorpayOrderID}
	update := bson.M{
		"$set": bson.M{
			"status":              status,
			"razorpay_payment_id": paymentID,
			"updated_at":          time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return errors.New("order not found")
	}
	return nil
}

func (r *MongoOrderRepository) FindByRazorpayOrderID(ctx context.Context, razorpayOrderID string) (*domain.Order, error) {
	var order domain.Order
	err := r.collection.FindOne(ctx, bson.M{"razorpay_order_id": razorpayOrderID}).Decode(&order)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil // Or specific ErrNotFound
		}
		return nil, err
	}
	return &order, nil
}

func (r *MongoOrderRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Order, error) {
	var order domain.Order
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&order)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *MongoOrderRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Order, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []*domain.Order
	if err = cursor.All(ctx, &orders); err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *MongoOrderRepository) Count(ctx context.Context) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{})
}
