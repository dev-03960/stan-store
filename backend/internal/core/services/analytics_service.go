package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AnalyticsService struct {
	repo      domain.AnalyticsRepository
	dailyRepo domain.AnalyticsDailyRepository
}

func NewAnalyticsService(repo domain.AnalyticsRepository, dailyRepo domain.AnalyticsDailyRepository) *AnalyticsService {
	return &AnalyticsService{
		repo:      repo,
		dailyRepo: dailyRepo,
	}
}

// TrackEvent validates the event and inserts it into the database.
func (s *AnalyticsService) TrackEvent(
	ctx context.Context,
	eventType domain.AnalyticsEventType,
	creatorID primitive.ObjectID,
	productID *primitive.ObjectID,
	visitorID string,
	metadata map[string]string,
) error {
	// Validate event type
	switch eventType {
	case domain.EventPageView, domain.EventProductView, domain.EventCheckoutStart, domain.EventPurchase:
		// Valid
	default:
		return errors.New("invalid event type")
	}

	if visitorID == "" {
		return errors.New("visitor ID is required")
	}

	event := &domain.AnalyticsEvent{
		EventType: eventType,
		CreatorID: creatorID,
		ProductID: productID,
		VisitorID: visitorID,
		Timestamp: time.Now(),
		Metadata:  metadata,
	}

	_, err := s.repo.Create(ctx, event)
	return err
}

// GenerateVisitorID returns a SHA-256 hash of the IP and User-Agent.
func GenerateVisitorID(ip, userAgent string) string {
	hasher := sha256.New()
	hasher.Write([]byte(ip + userAgent))
	return hex.EncodeToString(hasher.Sum(nil))
}

type DashboardMetrics struct {
	UniqueVisitors int `json:"unique_visitors"`
	PageViews      int `json:"page_views"`
	ProductViews   int `json:"product_views"`
	CheckoutStarts int `json:"checkout_starts"`
	Purchases      int `json:"purchases"`
	Revenue        int `json:"revenue"`
}

// GetDashboardMetrics returns the aggregated metrics for a specified time period.
// period can be "today", "7d", "30d", or "all".
func (s *AnalyticsService) GetDashboardMetrics(ctx context.Context, creatorID primitive.ObjectID, period string) (*DashboardMetrics, error) {
	now := time.Now().UTC()
	var startDate time.Time

	switch period {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	case "7d":
		startDate = now.AddDate(0, 0, -7)
	case "30d":
		startDate = now.AddDate(0, 0, -30)
	case "all", "":
		startDate = time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC) // Far past
	default:
		startDate = now.AddDate(0, 0, -7) // Default 7d
	}

	startStr := startDate.Format("2006-01-02")
	endStr := now.Format("2006-01-02")

	dailies, err := s.dailyRepo.FindByCreatorAndDateRange(ctx, creatorID, startStr, endStr)
	if err != nil {
		return nil, err
	}

	metrics := &DashboardMetrics{}
	for _, daily := range dailies {
		metrics.UniqueVisitors += daily.UniqueVisitors
		metrics.PageViews += daily.PageViews
		metrics.ProductViews += daily.ProductViews
		metrics.CheckoutStarts += daily.CheckoutStarts
		metrics.Purchases += daily.Purchases
		metrics.Revenue += daily.Revenue
	}

	return metrics, nil
}
