package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AnalyticsEventType string

const (
	EventPageView      AnalyticsEventType = "page_view"
	EventProductView   AnalyticsEventType = "product_view"
	EventCheckoutStart AnalyticsEventType = "checkout_start"
	EventPurchase      AnalyticsEventType = "purchase"
)

// AnalyticsEvent represents a single, raw tracking action.
type AnalyticsEvent struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	EventType AnalyticsEventType  `bson:"event_type" json:"event_type"`
	CreatorID primitive.ObjectID  `bson:"creator_id" json:"creator_id"`
	ProductID *primitive.ObjectID `bson:"product_id,omitempty" json:"product_id,omitempty"`
	VisitorID string              `bson:"visitor_id" json:"visitor_id"` // SHA-256 hash of IP+UserAgent, no PII
	Timestamp time.Time           `bson:"timestamp" json:"timestamp"`
	Metadata  map[string]string   `bson:"metadata,omitempty" json:"metadata,omitempty"` // e.g. referrer, utm params
}

// AnalyticsDaily represents the daily aggregated summary.
type AnalyticsDaily struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID      primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Date           string             `bson:"date" json:"date"` // Format: YYYY-MM-DD
	UniqueVisitors int                `bson:"unique_visitors" json:"unique_visitors"`
	PageViews      int                `bson:"page_views" json:"page_views"`
	ProductViews   int                `bson:"product_views" json:"product_views"`
	CheckoutStarts int                `bson:"checkout_starts" json:"checkout_starts"`
	Purchases      int                `bson:"purchases" json:"purchases"`
	Revenue        int                `bson:"revenue" json:"revenue"` // in paise
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updated_at"`
}

// AnalyticsRepository defines operations for raw analytics events.
type AnalyticsRepository interface {
	Repository[AnalyticsEvent]
	// specialized queries if needed
}

// AnalyticsDailyRepository defines operations for the aggregated daily summaries.
type AnalyticsDailyRepository interface {
	Repository[AnalyticsDaily]
	Upsert(ctx context.Context, daily *AnalyticsDaily) error
	FindByCreatorAndDateRange(ctx context.Context, creatorID primitive.ObjectID, startDate, endDate string) ([]AnalyticsDaily, error)
}
