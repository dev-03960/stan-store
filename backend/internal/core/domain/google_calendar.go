package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GoogleCalendarConnection represents a creator's linked Google Calendar via OAuth.
type GoogleCalendarConnection struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID             string             `bson:"creator_id" json:"creatorId"`
	Email                 string             `bson:"email" json:"email"`
	EncryptedAccessToken  string             `bson:"encrypted_access_token" json:"-"`
	EncryptedRefreshToken string             `bson:"encrypted_refresh_token" json:"-"`
	TokenExpiry           time.Time          `bson:"token_expiry" json:"tokenExpiry"`
	IsActive              bool               `bson:"is_active" json:"isActive"`
	CreatedAt             time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt             time.Time          `bson:"updated_at" json:"updatedAt"`
}

// GoogleCalendarConnectionRepository defines the data-access interface for Google Calendar OAuth records.
type GoogleCalendarConnectionRepository interface {
	FindByCreatorID(ctx context.Context, creatorID string) (*GoogleCalendarConnection, error)
	CreateOrUpdate(ctx context.Context, conn *GoogleCalendarConnection) error
	Delete(ctx context.Context, creatorID string) error
}
