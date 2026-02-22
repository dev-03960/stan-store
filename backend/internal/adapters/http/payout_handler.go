package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PayoutHandler handles payout configuration and withdrawal endpoints.
type PayoutHandler struct {
	service *services.PayoutService
}

// NewPayoutHandler creates a new PayoutHandler.
func NewPayoutHandler(service *services.PayoutService) *PayoutHandler {
	return &PayoutHandler{service: service}
}

// SavePayoutSettings handles POST /api/v1/creator/payout-settings
func (h *PayoutHandler) SavePayoutSettings(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	var req domain.BankDetails
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	config, err := h.service.SavePayoutConfig(c.Context(), creatorID, req)
	if err != nil {
		if isValidationError(err) {
			return SendError(c, fiber.StatusBadRequest, ErrBadRequest, err.Error(), nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to save payout settings", err)
	}

	return SendOK(c, config)
}

// GetPayoutSettings handles GET /api/v1/creator/payout-settings
func (h *PayoutHandler) GetPayoutSettings(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	config, err := h.service.GetPayoutConfig(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch payout settings", err)
	}

	if config == nil {
		return SendOK(c, map[string]interface{}{
			"configured": false,
			"message":    "No payout settings configured yet",
		})
	}

	return SendOK(c, config)
}

// WithdrawFunds handles POST /api/v1/creator/payouts/withdraw
func (h *PayoutHandler) WithdrawFunds(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	var req struct {
		Amount int64 `json:"amount"` // In paise
	}
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}
	if req.Amount <= 0 {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Amount must be positive", nil)
	}

	payout, err := h.service.WithdrawFunds(c.Context(), creatorID, req.Amount)
	if err != nil {
		msg := err.Error()
		if msg == "payout already in progress" {
			return SendError(c, fiber.StatusTooManyRequests, "PAYOUT_IN_PROGRESS", msg, nil)
		}
		if msg == "payout settings not configured" {
			return SendError(c, fiber.StatusBadRequest, ErrBadRequest, msg, nil)
		}
		if len(msg) > 20 && msg[:20] == "insufficient balance" {
			return SendError(c, fiber.StatusUnprocessableEntity, "INSUFFICIENT_BALANCE", msg, nil)
		}
		if len(msg) > 18 && msg[:18] == "minimum withdrawal" {
			return SendError(c, fiber.StatusUnprocessableEntity, "MINIMUM_NOT_MET", msg, nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to initiate withdrawal", err)
	}

	return SendCreated(c, payout)
}

// GetPayoutHistory handles GET /api/v1/creator/payouts
func (h *PayoutHandler) GetPayoutHistory(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	payouts, err := h.service.GetPayoutHistory(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch payout history", err)
	}

	return SendOK(c, payouts)
}

// GetBalance handles GET /api/v1/creator/payouts/balance
func (h *PayoutHandler) GetBalance(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	summary, err := h.service.GetBalanceSummary(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch balance", err)
	}

	return SendOK(c, summary)
}

// isValidationError checks if an error is a user input validation error.
func isValidationError(err error) bool {
	msg := err.Error()
	return msg == "account holder name is required" ||
		msg == "invalid account number: must be 9-18 digits" ||
		msg == "invalid IFSC code: must match format XXXX0XXXXXX"
}
