package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PayoutStatus defines the lifecycle state of a payout.
type PayoutStatus string

const (
	PayoutStatusProcessing PayoutStatus = "processing"
	PayoutStatusCompleted  PayoutStatus = "completed"
	PayoutStatusFailed     PayoutStatus = "failed"
	PayoutStatusReversed   PayoutStatus = "reversed"
)

// Payout represents a creator withdrawal record.
type Payout struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID        primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Amount           int64              `bson:"amount" json:"amount"`             // In paise
	PlatformFee      int64              `bson:"platform_fee" json:"platform_fee"` // Fee deducted (future)
	NetAmount        int64              `bson:"net_amount" json:"net_amount"`     // Amount after fee
	RazorpayPayoutID string             `bson:"razorpay_payout_id" json:"razorpay_payout_id"`
	Status           PayoutStatus       `bson:"status" json:"status"`
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
	CompletedAt      *time.Time         `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
}

// PayoutRepository defines the interface for payout storage.
type PayoutRepository interface {
	Create(ctx context.Context, payout *Payout) error
	UpdateStatus(ctx context.Context, razorpayPayoutID string, status PayoutStatus) error
	FindPendingByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (*Payout, error)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Payout, error)
	FindByRazorpayPayoutID(ctx context.Context, razorpayPayoutID string) (*Payout, error)
}
