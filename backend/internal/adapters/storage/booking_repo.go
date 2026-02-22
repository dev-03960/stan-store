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

const bookingsCollection = "bookings"

// MongoBookingRepository implements domain.BookingRepository using MongoDB.
type MongoBookingRepository struct {
	*BaseRepository[domain.Booking]
}

// NewMongoBookingRepository creates a new MongoBookingRepository and ensures indexes.
func NewMongoBookingRepository(db *MongoDB) *MongoBookingRepository {
	repo := &MongoBookingRepository{
		BaseRepository: NewBaseRepository[domain.Booking](db, bookingsCollection),
	}
	repo.ensureIndexes()
	return repo
}

// ensureIndexes creates indexes for bookings collection.
func (r *MongoBookingRepository) ensureIndexes() {
	ctx := context.Background()
	col := r.Collection()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "product_id", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "buyer_email", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "slot_start", Value: 1}},
			Options: options.Index(),
		},
	}

	_, err := col.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		logger.Error("failed to create booking indexes", "error", err.Error())
	} else {
		logger.Info("booking indexes ensured", "collection", bookingsCollection)
	}
}

// Create inserts a new booking.
func (r *MongoBookingRepository) Create(ctx context.Context, booking *domain.Booking) error {
	booking.CreatedAt = time.Now()
	booking.UpdatedAt = time.Now()
	created, err := r.BaseRepository.Create(ctx, booking)
	if err != nil {
		return err
	}
	booking.ID = created.ID
	return nil
}

// GetByID returns a booking by its ID.
func (r *MongoBookingRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Booking, error) {
	var entity domain.Booking
	err := r.Collection().FindOne(ctx, bson.M{"_id": id}).Decode(&entity)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("get booking by id: %w", err)
	}
	return &entity, nil
}

// FindOverlapping returns confirmed bookings for a product that overlap with a given time range.
func (r *MongoBookingRepository) FindOverlapping(ctx context.Context, productID primitive.ObjectID, start, end time.Time) ([]*domain.Booking, error) {
	filter := bson.M{
		"product_id": productID,
		"status":     domain.BookingStatusConfirmed,
		"slot_start": bson.M{"$lt": end},
		"slot_end":   bson.M{"$gt": start},
	}

	cursor, err := r.Collection().Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("find overlapping bookings: %w", err)
	}
	defer cursor.Close(ctx)

	var results []*domain.Booking
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("decode overlapping bookings: %w", err)
	}
	return results, nil
}

// FindByProductID returns all bookings for a given product within a time range.
func (r *MongoBookingRepository) FindByProductID(ctx context.Context, productID primitive.ObjectID, from, to time.Time) ([]*domain.Booking, error) {
	filter := bson.M{
		"product_id": productID,
		"status":     domain.BookingStatusConfirmed,
		"slot_start": bson.M{"$gte": from},
		"slot_end":   bson.M{"$lte": to},
	}

	cursor, err := r.Collection().Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "slot_start", Value: 1}}))
	if err != nil {
		return nil, fmt.Errorf("find bookings by product id: %w", err)
	}
	defer cursor.Close(ctx)

	var results []*domain.Booking
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("decode product bookings: %w", err)
	}
	return results, nil
}

// FindByCreatorID returns all bookings for a creator.
func (r *MongoBookingRepository) FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Booking, error) {
	filter := bson.M{"creator_id": creatorID}
	opts := options.Find().SetSort(bson.D{{Key: "slot_start", Value: -1}})

	cursor, err := r.Collection().Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find bookings by creator id: %w", err)
	}
	defer cursor.Close(ctx)

	var results []*domain.Booking
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("decode creator bookings: %w", err)
	}
	return results, nil
}

// FindByBuyerEmail returns all bookings for a specific buyer.
func (r *MongoBookingRepository) FindByBuyerEmail(ctx context.Context, email string) ([]*domain.Booking, error) {
	filter := bson.M{"buyer_email": email}
	opts := options.Find().SetSort(bson.D{{Key: "slot_start", Value: -1}})

	cursor, err := r.Collection().Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find bookings by buyer email: %w", err)
	}
	defer cursor.Close(ctx)

	var results []*domain.Booking
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("decode buyer bookings: %w", err)
	}
	return results, nil
}

// UpdateStatus updates the status of a booking.
func (r *MongoBookingRepository) UpdateStatus(ctx context.Context, id primitive.ObjectID, status domain.BookingStatus) error {
	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": time.Now(),
		},
	}
	_, err := r.Collection().UpdateByID(ctx, id, update)
	if err != nil {
		return fmt.Errorf("update booking status: %w", err)
	}
	return nil
}
