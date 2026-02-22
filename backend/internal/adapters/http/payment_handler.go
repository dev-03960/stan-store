package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentHandler struct {
	service       *services.PaymentService
	orderService  *services.OrderService
	webhookSecret string
}

func NewPaymentHandler(service *services.PaymentService, orderService *services.OrderService, webhookSecret string) *PaymentHandler {
	return &PaymentHandler{
		service:       service,
		orderService:  orderService,
		webhookSecret: webhookSecret,
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
	// This depends on how your auth middleware sets the user ID.
	// Typically it's in c.Locals("userId") as a string or ObjectID.
	// For now, let's assume it's stored as "userId" in Locals by the middleware.
	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		// Try ObjectID directly if middleware sets that
		if oid, ok := c.Locals("userId").(primitive.ObjectID); ok {
			return oid, nil
		}
		return primitive.NilObjectID, fiber.ErrUnauthorized
	}
	return primitive.ObjectIDFromHex(userIDStr)
}

// HandleWebhook handles POST /api/v1/payments/webhook
func (h *PaymentHandler) HandleWebhook(c *fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	if signature == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Missing signature header", nil)
	}

	body := string(c.Body())

	// Verify Signature
	if !h.service.VerifyWebhookSignature(body, signature, h.webhookSecret) {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid signature", nil)
	}

	// Parse Webhook Event
	var event map[string]interface{}
	if err := c.BodyParser(&event); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid event payload", nil)
	}

	eventName, ok := event["event"].(string)
	if !ok {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid event type", nil)
	}

	// Handle specific events
	if eventName == "order.paid" {
		payload, _ := event["payload"].(map[string]interface{})
		payment, _ := payload["payment"].(map[string]interface{})
		entity, _ := payment["entity"].(map[string]interface{})

		razorpayOrderID, _ := entity["order_id"].(string)
		paymentID, _ := entity["id"].(string)

		if razorpayOrderID != "" && paymentID != "" {
			if err := h.orderService.HandlePaymentSuccess(c.Context(), razorpayOrderID, paymentID); err != nil {
				// Log error but verify signature was valid.
				return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to process order", nil)
			}
		}
	} else if eventName == "subscription.charged" || eventName == "subscription.halted" || eventName == "subscription.cancelled" || eventName == "subscription.completed" {
		payload, _ := event["payload"].(map[string]interface{})
		if err := h.orderService.HandleSubscriptionEvent(c.Context(), eventName, payload); err != nil {
			return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to process subscription event", nil)
		}
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
