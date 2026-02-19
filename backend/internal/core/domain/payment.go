package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PaymentSettings represents a user's payment configuration.
// For MVP, we use the platform's Razorpay keys, so this might just track if they enabled it,
// or store their specific Merchant ID if we use Razorpay Route later.
type PaymentSettings struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"userId"`
	Enabled   bool               `bson:"enabled" json:"enabled"`
	Currency  string             `bson:"currency" json:"currency"` // Default to INR
	UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}

// PaymentRepository defines methods for payment settings persistence
type PaymentRepository interface {
	GetSettings(ctx context.Context, userID primitive.ObjectID) (*PaymentSettings, error)
	UpdateSettings(ctx context.Context, settings *PaymentSettings) error
}
