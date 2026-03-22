package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Platform subscription tier constants
const (
	SubTierTrial = "trial"
	SubTierBasic = "basic"
)

// Platform subscription status constants
const (
	SubStatusTrial     = "trial"
	SubStatusActive    = "active"
	SubStatusCancelled = "cancelled"
	SubStatusExpired   = "expired"
)

// PlatformSubscription represents a creator's subscription to the Miostore platform.
type PlatformSubscription struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID          primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Plan               string             `bson:"plan" json:"plan"`     // trial, basic
	Status             string             `bson:"status" json:"status"` // trial, active, cancelled, expired
	TrialEndsAt        time.Time          `bson:"trial_ends_at" json:"trial_ends_at"`
	CurrentPeriodStart time.Time          `bson:"current_period_start,omitempty" json:"current_period_start,omitempty"`
	CurrentPeriodEnd   time.Time          `bson:"current_period_end,omitempty" json:"current_period_end,omitempty"`
	RazorpaySubID      string             `bson:"razorpay_sub_id,omitempty" json:"razorpay_sub_id,omitempty"`
	GrantedByAdmin     bool               `bson:"granted_by_admin" json:"granted_by_admin"`
	CreatedAt          time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt          time.Time          `bson:"updated_at" json:"updated_at"`

	// Denormalized fields for admin listing
	CreatorEmail string `bson:"creator_email" json:"creator_email"`
	CreatorName  string `bson:"creator_name" json:"creator_name"`
}

// IsAccessAllowed returns true if the creator currently has platform access.
func (s *PlatformSubscription) IsAccessAllowed() bool {
	now := time.Now()
	switch s.Status {
	case SubStatusTrial:
		return now.Before(s.TrialEndsAt)
	case SubStatusActive:
		return true
	default:
		return false
	}
}

// DaysRemaining returns the number of days remaining in trial or current period.
func (s *PlatformSubscription) DaysRemaining() int {
	var end time.Time
	if s.Status == SubStatusTrial {
		end = s.TrialEndsAt
	} else if s.Status == SubStatusActive {
		end = s.CurrentPeriodEnd
	} else {
		return 0
	}
	days := int(time.Until(end).Hours() / 24)
	if days < 0 {
		return 0
	}
	return days
}

// PlatformSubscriptionRepository defines the interface for platform subscription storage.
type PlatformSubscriptionRepository interface {
	Create(ctx context.Context, sub *PlatformSubscription) error
	FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (*PlatformSubscription, error)
	Update(ctx context.Context, sub *PlatformSubscription) error
	FindAll(ctx context.Context, filter Filter, pagination *Pagination) ([]*PlatformSubscription, *PaginationMeta, error)
	CountByStatus(ctx context.Context) (map[string]int64, error)
}
