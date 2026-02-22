package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// EmailSubscriber represents a subscriber collected via lead magnets.
type EmailSubscriber struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID      primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Email          string             `bson:"email" json:"email"`
	Name           string             `bson:"name" json:"name"`
	Source         primitive.ObjectID `bson:"source" json:"source"` // Product ID that triggered subscription
	ConsentGiven   bool               `bson:"consent_given" json:"consent_given"`
	SubscribedAt   time.Time          `bson:"subscribed_at" json:"subscribed_at"`
	UnsubscribedAt *time.Time         `bson:"unsubscribed_at,omitempty" json:"unsubscribed_at,omitempty"`
}

// EmailSubscriberRepository defines the interface for subscriber storage.
type EmailSubscriberRepository interface {
	// Upsert creates or updates a subscriber (unique on creator_id + email)
	Upsert(ctx context.Context, sub *EmailSubscriber) error

	// FindAllByCreatorID returns all active subscribers for a creator (paginated)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID, limit, offset int64) ([]*EmailSubscriber, error)

	// Unsubscribe marks a subscriber as unsubscribed
	Unsubscribe(ctx context.Context, creatorID primitive.ObjectID, email string) error

	// Count returns the total subscriber count for a creator
	Count(ctx context.Context, creatorID primitive.ObjectID) (int64, error)
}
