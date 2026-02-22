package storage

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

var ErrCourseNotFound = errors.New("course not found")

const coursesCollection = "courses"

// MongoCourseRepository implements domain.CourseRepository using MongoDB.
type MongoCourseRepository struct {
	*BaseRepository[domain.Course]
}

// NewMongoCourseRepository creates a new MongoCourseRepository.
func NewMongoCourseRepository(db *MongoDB) *MongoCourseRepository {
	repo := &MongoCourseRepository{
		BaseRepository: NewBaseRepository[domain.Course](db, coursesCollection),
	}
	repo.ensureIndexes()
	return repo
}

// ensureIndexes creates indexes for courses collection.
func (r *MongoCourseRepository) ensureIndexes() {
	ctx := context.Background()
	col := r.Collection()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}},
			Options: options.Index().SetName("idx_creator_id"),
		},
		{
			Keys:    bson.D{{Key: "product_id", Value: 1}},
			Options: options.Index().SetName("idx_product_id").SetUnique(true),
		},
	}

	_, err := col.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		logger.Error("Failed to ensure indexes for courses", "error", err)
	}
}

// Create stores a new course and sets CreatedAt/UpdatedAt
func (r *MongoCourseRepository) Create(ctx context.Context, course *domain.Course) error {
	now := time.Now()
	course.CreatedAt = now
	course.UpdatedAt = now
	if course.Modules == nil {
		course.Modules = []domain.Module{}
	}

	result, err := r.Collection().InsertOne(ctx, course)
	if err != nil {
		return err
	}

	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		course.ID = oid
	}
	return nil
}

// FindByProductID finds a course by its associated product ID
func (r *MongoCourseRepository) FindByProductID(ctx context.Context, productID primitive.ObjectID) (*domain.Course, error) {
	var course domain.Course
	err := r.Collection().FindOne(ctx, bson.M{"product_id": productID}).Decode(&course)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrCourseNotFound
		}
		return nil, err
	}
	return &course, nil
}

// Update modifies an existing course Document
func (r *MongoCourseRepository) Update(ctx context.Context, course *domain.Course) error {
	course.UpdatedAt = time.Now()

	updateDoc := bson.M{
		"$set": bson.M{
			"modules":    course.Modules,
			"updated_at": course.UpdatedAt,
		},
	}

	result, err := r.Collection().UpdateByID(ctx, course.ID, updateDoc)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return ErrCourseNotFound
	}
	return nil
}

// DeleteByProductID removes the course document mapping to a specific product
func (r *MongoCourseRepository) DeleteByProductID(ctx context.Context, productID primitive.ObjectID) error {
	result, err := r.Collection().DeleteOne(ctx, bson.M{"product_id": productID})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return ErrCourseNotFound
	}
	return nil
}
