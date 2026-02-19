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

type MongoTransactionRepository struct {
	collection *mongo.Collection
}

func NewMongoTransactionRepository(db *mongo.Database) *MongoTransactionRepository {
	return &MongoTransactionRepository{
		collection: db.Collection("transactions"),
	}
}

func (r *MongoTransactionRepository) Create(ctx context.Context, tx *domain.Transaction) error {
	tx.CreatedAt = time.Now()
	tx.ID = primitive.NewObjectID()
	_, err := r.collection.InsertOne(ctx, tx)
	return err
}

func (r *MongoTransactionRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Transaction, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var transactions []*domain.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}
	return transactions, nil
}

func (r *MongoTransactionRepository) GetBalance(ctx context.Context, creatorID primitive.ObjectID) (int64, error) {
	// Aggregation pipeline to calculate balance
	// Balance = Sum(Credit) - Sum(Debit)
	// Or if we stored debits as negative numbers, just Sum(Amount).
	// Since we stored absolute values and Type, we need $cond.

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"creator_id": creatorID}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: nil},
			{Key: "balance", Value: bson.D{
				{Key: "$sum", Value: bson.D{
					{Key: "$cond", Value: bson.A{
						bson.D{{Key: "$eq", Value: bson.A{"$type", domain.TransactionTypeCredit}}},
						"$amount",
						bson.D{{Key: "$multiply", Value: bson.A{"$amount", -1}}},
					}},
				}},
			}},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result struct {
		Balance int64 `bson:"balance"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return 0, err
		}
		return result.Balance, nil
	}

	return 0, nil
}

func (r *MongoTransactionRepository) SumAllRevenue(ctx context.Context) (int64, error) {
	// Filter for credit transactions
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"type": domain.TransactionTypeCredit}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: nil},
			{Key: "total_revenue", Value: bson.D{{Key: "$sum", Value: "$amount"}}},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result struct {
		TotalRevenue int64 `bson:"total_revenue"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return 0, err
		}
		return result.TotalRevenue, nil
	}

	return 0, nil
}
