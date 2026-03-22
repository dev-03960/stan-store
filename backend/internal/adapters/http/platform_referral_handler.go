package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PlatformReferralHandler struct {
	service *services.PlatformReferralService
}

func NewPlatformReferralHandler(service *services.PlatformReferralService) *PlatformReferralHandler {
	return &PlatformReferralHandler{service: service}
}

// GetMyReferrals returns platform referrals and commission stats for the logged-in creator.
// GET /api/v1/creator/referrals
func (h *PlatformReferralHandler) GetMyReferrals(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid user ID", nil)
	}

	dashboardData, err := h.service.GetReferralDashboard(c.Context(), objID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch dashboard data", err)
	}

	return SendSuccess(c, fiber.StatusOK, dashboardData, nil)
}
