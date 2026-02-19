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
