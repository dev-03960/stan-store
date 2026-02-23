package storage

import (
	"context"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoTestimonialRepository struct {
	collection *mongo.Collection
}

func NewMongoTestimonialRepository(db *mongo.Database) *MongoTestimonialRepository {
	repo := &MongoTestimonialRepository{
		collection: db.Collection("testimonials"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *MongoTestimonialRepository) ensureIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Index by product_id and sort_order for efficient fetching in correct order
	_, err := r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "product_id", Value: 1},
			{Key: "sort_order", Value: 1},
		},
	})

	if err != nil {
		logger.Error("failed to create testimonials index", "error", err.Error())
	}
}

func (r *MongoTestimonialRepository) Create(ctx context.Context, testimonial *domain.Testimonial) error {
	testimonial.CreatedAt = time.Now()
	testimonial.UpdatedAt = time.Now()
	if testimonial.ID.IsZero() {
		testimonial.ID = primitive.NewObjectID()
	}

	_, err := r.collection.InsertOne(ctx, testimonial)
	return err
}

func (r *MongoTestimonialRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Testimonial, error) {
	var testimonial domain.Testimonial
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&testimonial)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // Return nil, nil if not found
		}
		return nil, err
	}
	return &testimonial, nil
}

func (r *MongoTestimonialRepository) FindByProductID(ctx context.Context, productID primitive.ObjectID) ([]*domain.Testimonial, error) {
	opts := options.Find().SetSort(bson.D{{Key: "sort_order", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{"product_id": productID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var testimonials []*domain.Testimonial
	if err = cursor.All(ctx, &testimonials); err != nil {
		return nil, err
	}
	return testimonials, nil
}

func (r *MongoTestimonialRepository) Update(ctx context.Context, testimonial *domain.Testimonial) error {
	testimonial.UpdatedAt = time.Now()
	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": testimonial.ID},
		bson.M{"$set": testimonial},
	)
	return err
}

func (r *MongoTestimonialRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *MongoTestimonialRepository) CountByProductID(ctx context.Context, productID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"product_id": productID})
}
