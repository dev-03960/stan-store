package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WalletHandler struct {
	service *services.WalletService
}

func NewWalletHandler(service *services.WalletService) *WalletHandler {
	return &WalletHandler{
		service: service,
	}
}

// GetWalletDetails handles GET /api/v1/wallet
func (h *WalletHandler) GetWalletDetails(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	balance, transactions, err := h.service.GetWalletDetails(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch wallet details", err)
	}

	return SendOK(c, fiber.Map{
		"balance":      balance,
		"transactions": transactions,
	})
}
