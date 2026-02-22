package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// BookingStatus defines the lifecycle status of a booking
type BookingStatus string

const (
	BookingStatusConfirmed BookingStatus = "confirmed"
	BookingStatusCancelled BookingStatus = "cancelled"
	BookingStatusCompleted BookingStatus = "completed"
)

// Booking represents a scheduled coaching arrangement
type Booking struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	CreatorID   primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	OrderID     primitive.ObjectID `bson:"order_id" json:"order_id"`
	BuyerEmail  string             `bson:"buyer_email" json:"buyer_email"`
	BuyerName   string             `bson:"buyer_name" json:"buyer_name"`
	SlotStart   time.Time          `bson:"slot_start" json:"slot_start"`
	SlotEnd     time.Time          `bson:"slot_end" json:"slot_end"`
	MeetingLink string             `bson:"meeting_link,omitempty" json:"meeting_link,omitempty"`
	Status      BookingStatus      `bson:"status" json:"status"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// BookingRepository defines the interface for booking storage
type BookingRepository interface {
	Create(ctx context.Context, booking *Booking) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*Booking, error)
	FindOverlapping(ctx context.Context, productID primitive.ObjectID, start, end time.Time) ([]*Booking, error)
	FindByProductID(ctx context.Context, productID primitive.ObjectID, from, to time.Time) ([]*Booking, error)
	FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Booking, error)
	FindByBuyerEmail(ctx context.Context, email string) ([]*Booking, error)
	UpdateStatus(ctx context.Context, id primitive.ObjectID, status BookingStatus) error
}
