package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// InstagramConnection represents an established OAuth link with a Creator's IG Professional account.
type InstagramConnection struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID       string             `bson:"creator_id" json:"creatorId"`
	IGUserID        string             `bson:"ig_user_id" json:"igUserId"`
	IGUsername      string             `bson:"ig_username,omitempty" json:"igUsername,omitempty"`
	EncryptedToken  string             `bson:"encrypted_token" json:"-"` // Hidden from JSON responses
	TokenExpiresAt  time.Time          `bson:"token_expires_at" json:"tokenExpiresAt"`
	FacebookPageID  string             `bson:"facebook_page_id,omitempty" json:"facebookPageId,omitempty"`
	WebhookVerified bool               `bson:"webhook_verified" json:"webhookVerified"`
	IsActive        bool               `bson:"is_active" json:"isActive"`
	CreatedAt       time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updatedAt"`
}

// InstagramAutomation represents a keyword rule that triggers an Auto-DM response.
type InstagramAutomation struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID    string             `bson:"creator_id" json:"creatorId"`
	Keyword      string             `bson:"keyword" json:"keyword"`
	ResponseText string             `bson:"response_text" json:"responseText"`
	ProductID    string             `bson:"product_id,omitempty" json:"productId,omitempty"` // Optional link attachment
	IsActive     bool               `bson:"is_active" json:"isActive"`
	DMCount      int                `bson:"dm_count" json:"dmCount"`
	CreatedAt    time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updatedAt"`
}

// InstagramConnectionRepository defines the data-access interface for IG Auth records.
type InstagramConnectionRepository interface {
	FindByCreatorID(ctx context.Context, creatorID string) (*InstagramConnection, error)
	FindByIGUserID(ctx context.Context, igUserID string) (*InstagramConnection, error)
	CreateOrUpdate(ctx context.Context, conn *InstagramConnection) error
	Delete(ctx context.Context, creatorID string) error
}

// InstagramAutomationRepository defines the data-access interface for Keyword Auto-DM rules.
type InstagramAutomationRepository interface {
	FindByCreatorID(ctx context.Context, creatorID string) ([]*InstagramAutomation, error)
	FindByID(ctx context.Context, id string) (*InstagramAutomation, error)
	FindByKeyword(ctx context.Context, creatorID string, keyword string) (*InstagramAutomation, error)
	Create(ctx context.Context, automation *InstagramAutomation) error
	Update(ctx context.Context, automation *InstagramAutomation) error
	Delete(ctx context.Context, id string) error
	IncrementDMCount(ctx context.Context, id string) error
}
