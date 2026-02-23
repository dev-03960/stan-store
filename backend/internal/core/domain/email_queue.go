package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QueueStatus string

const (
	QueueStatusPending   QueueStatus = "pending"
	QueueStatusSent      QueueStatus = "sent"
	QueueStatusCancelled QueueStatus = "cancelled"
)

// EmailQueue tracks individual scheduled emails within a running drip sequence
type EmailQueue struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CampaignID      primitive.ObjectID `bson:"campaign_id" json:"campaign_id"`
	CreatorID       primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	SubscriberEmail string             `bson:"subscriber_email" json:"subscriber_email"`
	EmailIndex      int                `bson:"email_index" json:"email_index"` // Index into the Campaign.Emails array
	ScheduledAt     time.Time          `bson:"scheduled_at" json:"scheduled_at"`
	SentAt          *time.Time         `bson:"sent_at,omitempty" json:"sent_at,omitempty"`
	Status          QueueStatus        `bson:"status" json:"status"`
}

// EmailQueueRepository handles storage operations for scheduled and sent sequence emails
type EmailQueueRepository interface {
	Create(ctx context.Context, queue *EmailQueue) error
	Update(ctx context.Context, queue *EmailQueue) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*EmailQueue, error)
	MarkStatus(ctx context.Context, id primitive.ObjectID, status QueueStatus) error
	CountSentByCampaign(ctx context.Context, campaignID primitive.ObjectID) (int64, error)
}
