package storage

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const productsCollection = "products"

// MongoProductRepository implements domain.ProductRepository using MongoDB.
type MongoProductRepository struct {
	*BaseRepository[domain.Product]
}

// NewMongoProductRepository creates a new MongoProductRepository and ensures indexes.
func NewMongoProductRepository(db *MongoDB) *MongoProductRepository {
	repo := &MongoProductRepository{
		BaseRepository: NewBaseRepository[domain.Product](db, productsCollection),
	}
	repo.ensureIndexes()
	return repo
}

// ensureIndexes creates indexes for products collection.
func (r *MongoProductRepository) ensureIndexes() {
	ctx := context.Background()
	col := r.Collection()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "sort_order", Value: 1}},
			Options: options.Index(),
		},
	}

	_, err := col.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		logger.Error("failed to create product indexes", "error", err.Error())
	} else {
		logger.Info("product indexes ensured", "collection", productsCollection)
	}
}

// Create inserts a new product.
func (r *MongoProductRepository) Create(ctx context.Context, product *domain.Product) error {
	// BaseRepository.Create returns (*T, error), but we just need error and to populate ID
	created, err := r.BaseRepository.Create(ctx, product)
	if err != nil {
		return err
	}
	*product = *created
	return nil
}

// FindByID finds a product by ObjectID.
func (r *MongoProductRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Product, error) {
	// BaseRepository.FindByID expects hex string
	return r.BaseRepository.FindByID(ctx, id.Hex())
}

// FindAllByCreatorID finds all products for a specific creator, excluding soft-deleted ones.
func (r *MongoProductRepository) FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Product, error) {
	// We can't easily use BaseRepository.FindMany here because it expects domain.Filter map
	// and returns []T, but interface expects []*T.
	// Also we need to ensure deleted_at is null if not handled by base (it isn't by default).

	filter := bson.M{
		"creator_id": creatorID,
		"deleted_at": bson.M{"$exists": false},
	}

	opts := options.Find().SetSort(bson.D{{Key: "sort_order", Value: 1}, {Key: "created_at", Value: -1}})

	cursor, err := r.Collection().Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find all by creator: %w", err)
	}
	defer cursor.Close(ctx)

	var products []*domain.Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, fmt.Errorf("decode products: %w", err)
	}

	// Ensure we return empty slice instead of nil
	if products == nil {
		products = []*domain.Product{}
	}

	return products, nil
}

// FindVisibleByCreatorID finds all visible products for a specific creator.
func (r *MongoProductRepository) FindVisibleByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Product, error) {
	filter := bson.M{
		"creator_id": creatorID,
		"is_visible": true,
		"deleted_at": bson.M{"$exists": false},
	}

	// Sort by sort_order (0, 1, 2...) then created_at (newest first as tiebreaker)
	opts := options.Find().SetSort(bson.D{{Key: "sort_order", Value: 1}, {Key: "created_at", Value: -1}})

	cursor, err := r.Collection().Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find visible by creator: %w", err)
	}
	defer cursor.Close(ctx)

	var products []*domain.Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, fmt.Errorf("decode products: %w", err)
	}

	if products == nil {
		products = []*domain.Product{}
	}

	return products, nil
}

// Update modifies an existing product.
func (r *MongoProductRepository) Update(ctx context.Context, product *domain.Product) error {
	if product.ID.IsZero() {
		return fmt.Errorf("cannot update product without ID")
	}

	// BaseRepository.Update returns (*T, error) and takes (id string, entity *T)
	updated, err := r.BaseRepository.Update(ctx, product.ID.Hex(), product)
	if err != nil {
		return err
	}

	*product = *updated
	return nil
}

// Delete soft-deletes a product.
func (r *MongoProductRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	// We are doing soft delete, so we update the DeletedAt field.
	// BaseRepository.Delete does hard delete.

	filter := bson.M{"_id": id}
	update := bson.M{
		"$set": bson.M{"deleted_at": bson.M{"$currentDate": bson.M{"$type": "date"}}},
	}

	result, err := r.Collection().UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("soft delete: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// UpdateVisibility toggles the visibility of a product.
func (r *MongoProductRepository) UpdateVisibility(ctx context.Context, id primitive.ObjectID, creatorID primitive.ObjectID, isVisible bool) error {
	filter := bson.M{
		"_id":        id,
		"creator_id": creatorID,
		"deleted_at": bson.M{"$exists": false},
	}

	update := bson.M{
		"$set": bson.M{
			"is_visible": isVisible,
			"updated_at": time.Now(),
		},
	}

	result, err := r.Collection().UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("update visibility: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("product not found or unauthorized")
	}

	return nil
}

// ReorderProducts updates the sort_order of multiple products.
func (r *MongoProductRepository) ReorderProducts(ctx context.Context, creatorID primitive.ObjectID, productIDs []primitive.ObjectID) error {
	var models []mongo.WriteModel

	for i, id := range productIDs {
		filter := bson.M{
			"_id":        id,
			"creator_id": creatorID,
		}

		update := bson.M{
			"$set": bson.M{
				"sort_order": i,
			},
		}

		model := mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update)
		models = append(models, model)
	}

	if len(models) == 0 {
		return nil
	}

	// BulkWrite is atomic-ish (ordered by default)
	_, err := r.Collection().BulkWrite(ctx, models)
	if err != nil {
		return fmt.Errorf("reorder products: %w", err)
	}

	return nil
}

// UpdateBumpConfig updates the bump configuration for a product.
// Passing a nil bump config will remove the bump from the product.
func (r *MongoProductRepository) UpdateBumpConfig(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, bump *domain.BumpConfig) error {
	filter := bson.M{
		"_id":        productID,
		"creator_id": creatorID,
		"deleted_at": bson.M{"$exists": false},
	}

	var update bson.M
	if bump == nil {
		// Remove bump config
		update = bson.M{
			"$unset": bson.M{"bump": ""},
			"$set":   bson.M{"updated_at": time.Now()},
		}
	} else {
		// Set bump config
		update = bson.M{
			"$set": bson.M{
				"bump":       bump,
				"updated_at": time.Now(),
			},
		}
	}

	result, err := r.Collection().UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("update bump config: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("product not found or unauthorized")
	}

	return nil
}
