package http

import (
	"fmt"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentHandler struct {
	service       *services.PaymentService
	orderService  *services.OrderService
	payoutSvc     *services.PayoutService
	webhookSecret string
	webhookRepo   domain.WebhookEventRepository
}

func NewPaymentHandler(
	service *services.PaymentService,
	orderService *services.OrderService,
	payoutSvc *services.PayoutService,
	webhookSecret string,
	webhookRepo domain.WebhookEventRepository,
) *PaymentHandler {
	return &PaymentHandler{
		service:       service,
		orderService:  orderService,
		payoutSvc:     payoutSvc,
		webhookSecret: webhookSecret,
		webhookRepo:   webhookRepo,
	}
}

// GetSettings handles GET /api/v1/payments/settings
func (h *PaymentHandler) GetSettings(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Unauthorized", nil)
	}

	settings, err := h.service.GetSettings(c.Context(), userID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch payment settings", nil)
	}

	return SendSuccess(c, fiber.StatusOK, settings, nil)
}

// UpdateSettings handles PUT /api/v1/payments/settings
func (h *PaymentHandler) UpdateSettings(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Unauthorized", nil)
	}

	var req struct {
		Enabled bool `json:"enabled"`
	}

	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	settings, err := h.service.UpdateSettings(c.Context(), userID, req.Enabled)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to update payment settings", nil)
	}

	return SendSuccess(c, fiber.StatusOK, settings, nil)
}

// Helper to extract UserID from context (assuming auth middleware sets it)
func getUserIDFromContext(c *fiber.Ctx) (primitive.ObjectID, error) {
	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		if oid, ok := c.Locals("userId").(primitive.ObjectID); ok {
			return oid, nil
		}
		return primitive.NilObjectID, fiber.ErrUnauthorized
	}
	return primitive.ObjectIDFromHex(userIDStr)
}

// HandleWebhook handles POST /api/v1/payments/webhook
// Implements immutable logging, idempotency, and resilient event processing.
func (h *PaymentHandler) HandleWebhook(c *fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	if signature == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Missing signature header", nil)
	}

	body := string(c.Body())

	// Parse event payload first to extract event_id and event type
	var event map[string]interface{}
	if err := c.BodyParser(&event); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid event payload", nil)
	}

	eventName, _ := event["event"].(string)
	eventID, _ := event["event_id"].(string) // Razorpay includes event_id in webhook payloads
	if eventName == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid event type", nil)
	}

	// 1. Immutable logging — persist the event BEFORE any processing
	var webhookEvent *domain.WebhookEvent
	if h.webhookRepo != nil && eventID != "" {
		// Check for duplicate (idempotency)
		existing, _ := h.webhookRepo.FindByEventID(c.Context(), eventID)
		if existing != nil && existing.Status == domain.WebhookEventStatusProcessed {
			// Already processed — return 200 OK immediately
			return SendOK(c, map[string]string{"status": "already_processed"})
		}

		if existing != nil {
			// Re-attempt of a previously failed event
			webhookEvent = existing
		} else {
			// New event — log immutably
			webhookEvent = &domain.WebhookEvent{
				EventID:   eventID,
				EventType: eventName,
				Payload:   body,
				Status:    domain.WebhookEventStatusPending,
			}
			if err := h.webhookRepo.Create(c.Context(), webhookEvent); err != nil {
				// Log creation failure but don't block processing
				fmt.Printf("WARNING: failed to log webhook event %s: %v\n", eventID, err)
			}
		}
	}

	// 2. Verify Signature
	if !h.service.VerifyWebhookSignature(body, signature, h.webhookSecret) {
		if webhookEvent != nil && h.webhookRepo != nil {
			_ = h.webhookRepo.UpdateStatus(c.Context(), webhookEvent.ID, domain.WebhookEventStatusFailed)
			_ = h.webhookRepo.IncrementRetryCount(c.Context(), webhookEvent.ID, "invalid signature")
		}
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid signature", nil)
	}

	// 3. Process event
	var processingErr error

	switch {
	case eventName == "order.paid":
		payload, _ := event["payload"].(map[string]interface{})
		payment, _ := payload["payment"].(map[string]interface{})
		entity, _ := payment["entity"].(map[string]interface{})
		razorpayOrderID, _ := entity["order_id"].(string)
		paymentID, _ := entity["id"].(string)

		if razorpayOrderID != "" && paymentID != "" {
			processingErr = h.orderService.HandlePaymentSuccess(c.Context(), razorpayOrderID, paymentID)
		}

	case eventName == "subscription.charged" || eventName == "subscription.halted" ||
		eventName == "subscription.cancelled" || eventName == "subscription.completed":
		payload, _ := event["payload"].(map[string]interface{})
		processingErr = h.orderService.HandleSubscriptionEvent(c.Context(), eventName, payload)

	case eventName == "payout.processed" || eventName == "payout.failed" || eventName == "payout.reversed":
		if h.payoutSvc != nil {
			payload, _ := event["payload"].(map[string]interface{})
			payoutData, _ := payload["payout"].(map[string]interface{})
			entity, _ := payoutData["entity"].(map[string]interface{})
			razorpayPayoutID, _ := entity["id"].(string)

			if razorpayPayoutID != "" {
				var status domain.PayoutStatus
				switch eventName {
				case "payout.processed":
					status = domain.PayoutStatusCompleted
				case "payout.failed":
					status = domain.PayoutStatusFailed
				case "payout.reversed":
					status = domain.PayoutStatusReversed
				}
				processingErr = h.payoutSvc.HandlePayoutWebhook(c.Context(), razorpayPayoutID, status)
			}
		}
	}

	// 4. Update webhook event status
	if webhookEvent != nil && h.webhookRepo != nil {
		if processingErr != nil {
			_ = h.webhookRepo.IncrementRetryCount(c.Context(), webhookEvent.ID, processingErr.Error())
			// Mark as dead-lettered if too many retries
			if webhookEvent.RetryCount >= 4 { // Will be 5 after this increment
				_ = h.webhookRepo.UpdateStatus(c.Context(), webhookEvent.ID, domain.WebhookEventStatusDeadLettered)
			} else {
				_ = h.webhookRepo.UpdateStatus(c.Context(), webhookEvent.ID, domain.WebhookEventStatusFailed)
			}
		} else {
			_ = h.webhookRepo.UpdateStatus(c.Context(), webhookEvent.ID, domain.WebhookEventStatusProcessed)
		}
	}

	if processingErr != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to process webhook event", nil)
	}

	return SendOK(c, map[string]string{"status": "received"})
}

// VerifyPayment handles POST /api/v1/payments/verify
// Called by frontend after Razorpay checkout success callback
func (h *PaymentHandler) VerifyPayment(c *fiber.Ctx) error {
	var req struct {
		RazorpayOrderID   string `json:"razorpay_order_id" validate:"required"`
		RazorpayPaymentID string `json:"razorpay_payment_id" validate:"required"`
		RazorpaySignature string `json:"razorpay_signature" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	if req.RazorpayOrderID == "" || req.RazorpayPaymentID == "" || req.RazorpaySignature == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Missing required fields", nil)
	}

	// Verify signature
	if !h.service.VerifyPayment(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature) {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid payment signature", nil)
	}

	// Update order status
	if err := h.orderService.HandlePaymentSuccess(c.Context(), req.RazorpayOrderID, req.RazorpayPaymentID); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to process payment", err)
	}

	return SendOK(c, map[string]string{"status": "verified"})
}
