package services

import (
	"context"
	"fmt"

	"github.com/devanshbhargava/stan-store/internal/config"
	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/razorpay/razorpay-go"
	"github.com/razorpay/razorpay-go/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentService struct {
	repo              domain.PaymentRepository
	client            *razorpay.Client
	razorpayKeyID     string
	razorpayKeySecret string
}

func NewPaymentService(repo domain.PaymentRepository, cfg *config.Config) *PaymentService {
	client := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpayKeySecret)
	return &PaymentService{
		repo:              repo,
		client:            client,
		razorpayKeyID:     cfg.RazorpayKeyID,
		razorpayKeySecret: cfg.RazorpayKeySecret,
	}
}

func (s *PaymentService) GetSettings(ctx context.Context, userID primitive.ObjectID) (*domain.PaymentSettings, error) {
	return s.repo.GetSettings(ctx, userID)
}

func (s *PaymentService) UpdateSettings(ctx context.Context, userID primitive.ObjectID, enabled bool) (*domain.PaymentSettings, error) {
	settings, err := s.repo.GetSettings(ctx, userID)
	if err != nil {
		return nil, err
	}

	settings.Enabled = enabled
	// Currency is fixed to INR for MVP, but could be updated here if needed

	if err := s.repo.UpdateSettings(ctx, settings); err != nil {
		return nil, err
	}

	return settings, nil
}

// CreateRazorpayOrder creates an order in Razorpay
func (s *PaymentService) CreateRazorpayOrder(amount int64, currency string, receipt string) (string, error) {
	data := map[string]interface{}{
		"amount":   amount,
		"currency": currency,
		"receipt":  receipt,
	}

	// Mock for testing
	if s.razorpayKeyID == "test_key" {
		return "order_mock_123456", nil
	}

	body, err := s.client.Order.Create(data, nil)
	if err != nil {
		return "", err
	}

	orderID, ok := body["id"].(string)
	if !ok {
		return "", fmt.Errorf("failed to cast razorpay order id")
	}

	return orderID, nil
}

// CreateRazorpayPlan creates a recurring billing plan in Razorpay
func (s *PaymentService) CreateRazorpayPlan(name string, amount int64, currency string, interval string) (string, error) {
	// period can be "daily", "weekly", "monthly", "yearly"
	period := "monthly"
	if interval == "yearly" {
		period = "yearly"
	}

	data := map[string]interface{}{
		"period":   period,
		"interval": 1,
		"item": map[string]interface{}{
			"name":     name,
			"amount":   amount,
			"currency": currency,
		},
	}

	if s.razorpayKeyID == "test_key" {
		return "plan_mock_123", nil
	}

	body, err := s.client.Plan.Create(data, nil)
	if err != nil {
		return "", err
	}

	planID, ok := body["id"].(string)
	if !ok {
		return "", fmt.Errorf("failed to cast razorpay plan id")
	}

	return planID, nil
}

// CreateRazorpaySubscription creates a subscription for a plan
func (s *PaymentService) CreateRazorpaySubscription(planID string) (string, error) {
	data := map[string]interface{}{
		"plan_id":         planID,
		"total_count":     1200, // Large number for ongoing subscription
		"customer_notify": 1,
	}

	if s.razorpayKeyID == "test_key" {
		return "sub_mock_123", nil
	}

	body, err := s.client.Subscription.Create(data, nil)
	if err != nil {
		return "", err
	}

	subID, ok := body["id"].(string)
	if !ok {
		return "", fmt.Errorf("failed to cast razorpay subscription id")
	}

	return subID, nil
}

// CancelRazorpaySubscription cancels an active subscription
func (s *PaymentService) CancelRazorpaySubscription(subID string) error {
	if s.razorpayKeyID == "test_key" {
		return nil
	}

	data := map[string]interface{}{
		"cancel_at_cycle_end": 0, // cancel immediately for MVP
	}

	_, err := s.client.Subscription.Cancel(subID, data, nil)
	return err
}

// VerifyWebhookSignature verifies the signature of the webhook payload
// body: raw request body as string
// signature: X-Razorpay-Signature header
// secret: webhook secret from config
func (s *PaymentService) VerifyWebhookSignature(body string, signature string, secret string) bool {
	// razorpay-go/utils package is needed for validation
	// Since we initialized client, we used "github.com/razorpay/razorpay-go"
	// The validation function is utils.VerifyWebhookSignature(body, signature, secret)
	// We need to import "github.com/razorpay/razorpay-go/utils"
	// For now, let's implement the HMAC SHA256 verification manually or import utils.
	// Importing utils is safer.
	return utils.VerifyWebhookSignature(body, signature, secret)
}

// VerifyPayment verifies the Razorpay payment signature from client-side callback
func (s *PaymentService) VerifyPayment(razorpayOrderID, razorpayPaymentID, razorpaySignature string) bool {
	params := map[string]interface{}{
		"razorpay_order_id":   razorpayOrderID,
		"razorpay_payment_id": razorpayPaymentID,
	}
	return utils.VerifyPaymentSignature(params, razorpaySignature, s.razorpayKeySecret)
}

// GetRazorpayClient exposes the client for other services (OrderService) to use
func (s *PaymentService) GetRazorpayClient() *razorpay.Client {
	return s.client
}
