package storage

import (
	"context"
	"fmt"
	"math"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

// BaseRepository provides a generic MongoDB implementation of domain.Repository.
// Embed this in entity-specific repositories to inherit standard CRUD operations.
type BaseRepository[T any] struct {
	collection *mongo.Collection
}

// NewBaseRepository creates a new BaseRepository for the given collection.
func NewBaseRepository[T any](db *MongoDB, collectionName string) *BaseRepository[T] {
	return &BaseRepository[T]{
		collection: db.Collection(collectionName),
	}
}

// FindByID retrieves a single document by its ObjectID.
func (r *BaseRepository[T]) FindByID(ctx context.Context, id string) (*T, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var entity T
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&entity)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // Not found returns nil, not error
		}
		return nil, fmt.Errorf("find by id: %w", err)
	}

	return &entity, nil
}

// FindMany retrieves documents matching the filter with pagination and sorting.
func (r *BaseRepository[T]) FindMany(
	ctx context.Context,
	filter domain.Filter,
	pagination *domain.Pagination,
	sort *domain.Sort,
) ([]T, *domain.PaginationMeta, error) {
	bsonFilter := r.buildFilter(filter)
	opts := options.Find()

	// Apply sorting
	if sort != nil && sort.Field != "" {
		opts.SetSort(bson.D{{Key: sort.Field, Value: int(sort.Order)}})
	} else {
		opts.SetSort(bson.D{{Key: "created_at", Value: -1}}) // Default: newest first
	}

	// Count total documents
	totalCount, err := r.collection.CountDocuments(ctx, bsonFilter)
	if err != nil {
		return nil, nil, fmt.Errorf("count documents: %w", err)
	}

	// Apply pagination
	var meta *domain.PaginationMeta
	if pagination != nil {
		page := pagination.Page
		if page < 1 {
			page = 1
		}
		pageSize := pagination.PageSize
		if pageSize < 1 {
			pageSize = 20
		}
		if pageSize > 100 {
			pageSize = 100
		}

		skip := (page - 1) * pageSize
		opts.SetSkip(skip)
		opts.SetLimit(pageSize)

		meta = &domain.PaginationMeta{
			Page:       page,
			PageSize:   pageSize,
			TotalCount: totalCount,
			TotalPages: int64(math.Ceil(float64(totalCount) / float64(pageSize))),
		}
	}

	cursor, err := r.collection.Find(ctx, bsonFilter, opts)
	if err != nil {
		return nil, nil, fmt.Errorf("find many: %w", err)
	}
	defer cursor.Close(ctx)

	var entities []T
	if err := cursor.All(ctx, &entities); err != nil {
		return nil, nil, fmt.Errorf("decode cursor: %w", err)
	}

	if entities == nil {
		entities = []T{} // Return empty slice, not nil
	}

	return entities, meta, nil
}

// Create inserts a new document and returns it.
func (r *BaseRepository[T]) Create(ctx context.Context, entity *T) (*T, error) {
	result, err := r.collection.InsertOne(ctx, entity)
	if err != nil {
		return nil, fmt.Errorf("insert: %w", err)
	}

	// Fetch the inserted document to return with the generated _id
	var created T
	err = r.collection.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&created)
	if err != nil {
		return nil, fmt.Errorf("fetch created: %w", err)
	}

	return &created, nil
}

// Update modifies an existing document by ID.
func (r *BaseRepository[T]) Update(ctx context.Context, id string, entity *T) (*T, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	result := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": entity},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updated T
	if err := result.Decode(&updated); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("update: %w", err)
	}

	return &updated, nil
}

// Delete removes a document by ID.
func (r *BaseRepository[T]) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid id: %w", err)
	}

	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return fmt.Errorf("delete: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("document not found")
	}

	return nil
}

// Count returns the number of documents matching the filter.
func (r *BaseRepository[T]) Count(ctx context.Context, filter domain.Filter) (int64, error) {
	bsonFilter := r.buildFilter(filter)
	count, err := r.collection.CountDocuments(ctx, bsonFilter)
	if err != nil {
		return 0, fmt.Errorf("count: %w", err)
	}
	return count, nil
}

// Collection returns the underlying mongo.Collection for advanced queries.
func (r *BaseRepository[T]) Collection() *mongo.Collection {
	return r.collection
}

// buildFilter converts a domain.Filter to a bson.M filter.
func (r *BaseRepository[T]) buildFilter(filter domain.Filter) bson.M {
	if filter == nil {
		return bson.M{}
	}

	bsonFilter := bson.M{}
	for key, value := range filter {
		bsonFilter[key] = value
	}
	return bsonFilter
}
