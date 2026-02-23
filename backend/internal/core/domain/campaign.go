package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CampaignStatus string

const (
	CampaignStatusActive CampaignStatus = "active"
	CampaignStatusPaused CampaignStatus = "paused"
)

// CampaignEmail represents a single email configuration step inside a drip sequence
type CampaignEmail struct {
	Subject      string `bson:"subject" json:"subject"`
	BodyHTML     string `bson:"body_html" json:"body_html"`
	DelayMinutes int    `bson:"delay_minutes" json:"delay_minutes"` // Delay from the PREVIOUS email/trigger
}

// Campaign represents an automated drip sequence
type Campaign struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID        primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Name             string             `bson:"name" json:"name"`
	TriggerType      string             `bson:"trigger_type" json:"trigger_type"` // e.g., "lead_magnet_signup"
	TriggerProductID primitive.ObjectID `bson:"trigger_product_id" json:"trigger_product_id"`
	Emails           []CampaignEmail    `bson:"emails" json:"emails"`
	Status           CampaignStatus     `bson:"status" json:"status"`
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time          `bson:"updated_at" json:"updated_at"`
}

// CampaignRepository handles storage operations for the Campaign model
type CampaignRepository interface {
	Create(ctx context.Context, campaign *Campaign) error
	Update(ctx context.Context, campaign *Campaign) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*Campaign, error)
	FindAllByCreator(ctx context.Context, creatorID primitive.ObjectID) ([]*Campaign, error)
	FindByTriggerProductAndStatus(ctx context.Context, productID primitive.ObjectID, status CampaignStatus) ([]*Campaign, error)
}
