package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SubscriptionStatus defines the status of a recurring subscription
type SubscriptionStatus string

const (
	SubscriptionStatusActive    SubscriptionStatus = "active"
	SubscriptionStatusHalted    SubscriptionStatus = "halted"
	SubscriptionStatusCancelled SubscriptionStatus = "cancelled"
	SubscriptionStatusCreated   SubscriptionStatus = "created"
	SubscriptionStatusPastDue   SubscriptionStatus = "past_due"
)

// Subscription represents a buyer's recurring plan
type Subscription struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID         primitive.ObjectID `bson:"product_id" json:"product_id"`
	CreatorID         primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	CustomerEmail     string             `bson:"customer_email" json:"customer_email"`
	CustomerName      string             `bson:"customer_name" json:"customer_name"`
	Amount            int64              `bson:"amount" json:"amount"` // In paise
	Currency          string             `bson:"currency" json:"currency"`
	Interval          string             `bson:"interval" json:"interval"` // "monthly", "yearly"
	RazorpayPlanID    string             `bson:"razorpay_plan_id" json:"razorpay_plan_id"`
	RazorpaySubID     string             `bson:"razorpay_sub_id" json:"razorpay_sub_id"` // Matches the actual Razorpay Subscription ID
	Status            SubscriptionStatus `bson:"status" json:"status"`
	CurrentStart      *time.Time         `bson:"current_start,omitempty" json:"current_start,omitempty"`
	CurrentEnd        *time.Time         `bson:"current_end,omitempty" json:"current_end,omitempty"`
	CancelAtPeriodEnd bool               `bson:"cancel_at_period_end" json:"cancel_at_period_end"`
	TotalCount        int                `bson:"total_count" json:"total_count"`
	PaidCount         int                `bson:"paid_count" json:"paid_count"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}

// SubscriptionRepository defines the interface for subscription storage
type SubscriptionRepository interface {
	Create(ctx context.Context, sub *Subscription) error
	Update(ctx context.Context, sub *Subscription) error
	FindByRazorpaySubID(ctx context.Context, razorpaySubID string) (*Subscription, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Subscription, error)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Subscription, error)
	FindAllByCustomerEmail(ctx context.Context, email string) ([]*Subscription, error)
}
