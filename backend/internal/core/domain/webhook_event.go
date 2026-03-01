package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// WebhookEventStatus defines the processing status of a webhook event.
type WebhookEventStatus string

const (
	WebhookEventStatusPending      WebhookEventStatus = "pending"
	WebhookEventStatusProcessed    WebhookEventStatus = "processed"
	WebhookEventStatusFailed       WebhookEventStatus = "failed"
	WebhookEventStatusDeadLettered WebhookEventStatus = "dead-lettered"
)

// WebhookEvent represents an immutable record of a received Razorpay webhook event.
type WebhookEvent struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	EventID      string             `bson:"event_id" json:"event_id"`           // Razorpay event ID for deduplication
	EventType    string             `bson:"event_type" json:"event_type"`       // e.g. "order.paid", "subscription.charged"
	Payload      string             `bson:"payload" json:"payload"`             // Raw JSON payload (immutable)
	Status       WebhookEventStatus `bson:"status" json:"status"`               // pending, processed, failed, dead-lettered
	RetryCount   int                `bson:"retry_count" json:"retry_count"`     // Number of processing attempts
	ErrorMessage string             `bson:"error_message" json:"error_message"` // Last error message if failed
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	ProcessedAt  *time.Time         `bson:"processed_at,omitempty" json:"processed_at,omitempty"`
}

// WebhookEventRepository defines the interface for webhook event persistence.
type WebhookEventRepository interface {
	// Create inserts a new webhook event (append-only — payload is never modified).
	Create(ctx context.Context, event *WebhookEvent) error
	// FindByEventID looks up a webhook event by its Razorpay event ID.
	FindByEventID(ctx context.Context, eventID string) (*WebhookEvent, error)
	// UpdateStatus sets the status and processed_at timestamp.
	UpdateStatus(ctx context.Context, id primitive.ObjectID, status WebhookEventStatus) error
	// IncrementRetryCount bumps retry_count and sets error_message.
	IncrementRetryCount(ctx context.Context, id primitive.ObjectID, errMsg string) error
	// GetStats returns aggregated counts grouped by status and event_type.
	GetStats(ctx context.Context) (map[string]interface{}, error)
}
