package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PlatformReferralStatus defines the lifecycle state of a referral.
type PlatformReferralStatus string

const (
	ReferralStatusPending   PlatformReferralStatus = "pending"   // User signed up, but trial active or not paid
	ReferralStatusActive    PlatformReferralStatus = "active"    // User paid for basic plan
	ReferralStatusCancelled PlatformReferralStatus = "cancelled" // User cancelled or was banned
)

// PlatformReferral represents a referral linking a new creator to their referrer.
type PlatformReferral struct {
	ID         primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	ReferrerID primitive.ObjectID     `bson:"referrer_id" json:"referrer_id"`
	ReferredID primitive.ObjectID     `bson:"referred_id" json:"referred_id"`
	Status     PlatformReferralStatus `bson:"status" json:"status"`
	CreatedAt  time.Time              `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time              `bson:"updated_at" json:"updated_at"`

	// Denormalized fields for dashboards
	ReferredName     string `bson:"referred_name" json:"referred_name"`
	ReferredEmail    string `bson:"referred_email" json:"referred_email"`
	ReferredUsername string `bson:"referred_username" json:"referred_username"`
}

// PlatformReferralRepository defines the interface for platform referral storage.
type PlatformReferralRepository interface {
	Create(ctx context.Context, referral *PlatformReferral) error
	FindByReferredID(ctx context.Context, referredID primitive.ObjectID) (*PlatformReferral, error)
	FindAllByReferrerID(ctx context.Context, referrerID primitive.ObjectID) ([]*PlatformReferral, error)
	UpdateStatus(ctx context.Context, id primitive.ObjectID, status PlatformReferralStatus) error
}
