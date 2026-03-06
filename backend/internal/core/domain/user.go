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

const (
	RoleCreator = "creator"
	RoleAdmin   = "admin"
	RoleBuyer   = "buyer"
)

const (
	UserStatusActive = "active"
	UserStatusBanned = "banned"
)

// PayoutConfig holds a creator's payout/bank account details.
type PayoutConfig struct {
	AccountHolderName   string `bson:"holder_name,omitempty" json:"holder_name,omitempty"`
	AccountNumberMasked string `bson:"account_number_masked,omitempty" json:"account_number_masked,omitempty"` // Last 4 digits only
	IFSC                string `bson:"ifsc,omitempty" json:"ifsc,omitempty"`
	RazorpayContactID   string `bson:"razorpay_contact_id,omitempty" json:"-"`   // Hidden from JSON
	RazorpayFundAcctID  string `bson:"razorpay_fund_acct_id,omitempty" json:"-"` // Hidden from JSON
	IsVerified          bool   `bson:"is_verified" json:"is_verified"`
}

// User represents a user in the system.
type User struct {
	ID                   primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email                string             `bson:"email" json:"email"`
	DisplayName          string             `bson:"display_name" json:"displayName"`
	Username             string             `bson:"username,omitempty" json:"username,omitempty"`
	AvatarURL            string             `bson:"avatar_url" json:"avatarUrl"`
	PasswordHash         string             `bson:"password_hash,omitempty" json:"-"`
	EmailVerified        bool               `bson:"email_verified" json:"emailVerified"`
	GoogleID             string             `bson:"google_id" json:"googleId"`
	SubscriptionTier     string             `bson:"subscription_tier" json:"subscriptionTier"`
	Role                 string             `bson:"role" json:"role"` // "creator" or "admin"
	Bio                  string             `bson:"bio,omitempty" json:"bio,omitempty"`
	Theme                string             `bson:"theme" json:"theme"`
	BrandColor           string             `bson:"brand_color,omitempty" json:"brandColor,omitempty"`
	FontFamily           string             `bson:"font_family,omitempty" json:"fontFamily,omitempty"`
	CoverPhotoURL        string             `bson:"cover_photo_url,omitempty" json:"coverPhotoUrl,omitempty"`
	SocialLinks          []SocialLink       `bson:"social_links,omitempty" json:"socialLinks,omitempty"`
	PayoutConfig         *PayoutConfig      `bson:"payout_config,omitempty" json:"payoutConfig,omitempty"`
	PlatformFeeRate      float64            `bson:"platform_fee_rate" json:"platformFeeRate"` // Percentage (e.g., 5.0 = 5%); default 5
	Status               string             `bson:"status" json:"status"`
	AbandonedCartEnabled bool               `bson:"abandoned_cart_enabled" json:"abandonedCartEnabled"`
	BannedAt             *time.Time         `bson:"banned_at,omitempty" json:"bannedAt,omitempty"`
	BanReason            string             `bson:"ban_reason,omitempty" json:"banReason,omitempty"`
	CreatedAt            time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt            time.Time          `bson:"updated_at" json:"updatedAt"`
}

// NewUserFromGoogle creates a new User from Google OAuth data.
func NewUserFromGoogle(email, displayName, avatarURL, googleID string) *User {
	now := time.Now()
	return &User{
		Email:                email,
		DisplayName:          displayName,
		AvatarURL:            avatarURL,
		GoogleID:             googleID,
		SubscriptionTier:     "free",
		Role:                 RoleBuyer, // Default to buyer
		Status:               UserStatusActive,
		Theme:                "minimal",
		PlatformFeeRate:      5.0, // Default 5%
		AbandonedCartEnabled: true,
		SocialLinks:          []SocialLink{},
		CreatedAt:            now,
		UpdatedAt:            now,
	}
}

// HasUsername returns true if the user has claimed a username.
func (u *User) HasUsername() bool {
	return u.Username != ""
}
