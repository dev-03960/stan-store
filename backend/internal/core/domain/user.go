package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SocialLink represents a creator's social media link.
type SocialLink struct {
	Platform string `bson:"platform" json:"platform"` // instagram, youtube, twitter, linkedin, tiktok
	URL      string `bson:"url" json:"url"`
}

// User represents a user in the system.
type User struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email            string             `bson:"email" json:"email"`
	DisplayName      string             `bson:"display_name" json:"displayName"`
	Username         string             `bson:"username,omitempty" json:"username,omitempty"`
	AvatarURL        string             `bson:"avatar_url" json:"avatarUrl"`
	GoogleID         string             `bson:"google_id" json:"googleId"`
	SubscriptionTier string             `bson:"subscription_tier" json:"subscriptionTier"`
	Bio              string             `bson:"bio,omitempty" json:"bio,omitempty"`
	SocialLinks      []SocialLink       `bson:"social_links,omitempty" json:"socialLinks,omitempty"`
	Status           string             `bson:"status" json:"status"`
	CreatedAt        time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt        time.Time          `bson:"updated_at" json:"updatedAt"`
}

// NewUserFromGoogle creates a new User from Google OAuth data.
func NewUserFromGoogle(email, displayName, avatarURL, googleID string) *User {
	now := time.Now()
	return &User{
		Email:            email,
		DisplayName:      displayName,
		AvatarURL:        avatarURL,
		GoogleID:         googleID,
		SubscriptionTier: "free",
		Status:           "active",
		SocialLinks:      []SocialLink{},
		CreatedAt:        now,
		UpdatedAt:        now,
	}
}

// HasUsername returns true if the user has claimed a username.
func (u *User) HasUsername() bool {
	return u.Username != ""
}
