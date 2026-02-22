package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BuyerHandler struct {
	orderService *services.OrderService
	authService  *services.AuthService
}

func NewBuyerHandler(orderService *services.OrderService, authService *services.AuthService) *BuyerHandler {
	return &BuyerHandler{
		orderService: orderService,
		authService:  authService,
	}
}

// GetPurchases handles GET /api/v1/buyer/purchases
func (h *BuyerHandler) GetPurchases(c *fiber.Ctx) error {
	// The auth middleware guarantees a user ID in locals
	userIDStr, ok := c.Locals("userId").(string)
	if !ok || userIDStr == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "User ID not found in context", nil)
	}

	// Fetch user to get their email (purchases are keyed by customer_email currently)
	user, err := h.authService.GetCurrentUser(c.Context(), userIDStr)
	if err != nil || user == nil {
		logger.Error("current user fetch failed", "error", err, "userId", userIDStr)
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user", nil)
	}

	orders, err := h.orderService.GetBuyerOrders(c.Context(), user.Email)
	if err != nil {
		logger.Error("buyer orders fetch failed", "error", err, "email", user.Email)
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch purchases", nil)
	}

	return SendOK(c, orders)
}

// GetSubscriptions handles GET /api/v1/buyer/subscriptions
func (h *BuyerHandler) GetSubscriptions(c *fiber.Ctx) error {
	userIDStr, ok := c.Locals("userId").(string)
	if !ok || userIDStr == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "User ID not found in context", nil)
	}

	user, err := h.authService.GetCurrentUser(c.Context(), userIDStr)
	if err != nil || user == nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user", nil)
	}

	subs, err := h.orderService.GetBuyerSubscriptions(c.Context(), user.Email)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch subscriptions", nil)
	}

	return SendOK(c, subs)
}

// CancelSubscription handles POST /api/v1/buyer/subscriptions/:id/cancel
func (h *BuyerHandler) CancelSubscription(c *fiber.Ctx) error {
	subIDStr := c.Params("id")
	subID, err := primitive.ObjectIDFromHex(subIDStr)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid subscription ID", nil)
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok || userIDStr == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "User ID not found in context", nil)
	}

	user, err := h.authService.GetCurrentUser(c.Context(), userIDStr)
	if err != nil || user == nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user", nil)
	}

	if err := h.orderService.CancelSubscription(c.Context(), subID, user.Email); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to cancel subscription", err)
	}

	return SendOK(c, map[string]string{"message": "Subscription cancelled successfully"})
}
