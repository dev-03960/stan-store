package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

type AdminHandler struct {
	adminService *services.AdminService
}

func NewAdminHandler(adminService *services.AdminService) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
	}
}

// GetMetrics returns the platform-wide metrics.
// GET /api/v1/admin/metrics
func (h *AdminHandler) GetMetrics(c *fiber.Ctx) error {
	ctx := c.Context()

	metrics, err := h.adminService.GetPlatformMetrics(ctx)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch metrics", err)
	}

	return SendSuccess(c, fiber.StatusOK, metrics, nil)
}

// BanCreator bans a creator by setting their status to "banned".
// POST /api/v1/admin/creators/:id/ban
func (h *AdminHandler) BanCreator(c *fiber.Ctx) error {
	creatorID := c.Params("id")
	if creatorID == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Creator ID is required", nil)
	}

	var body struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&body); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}
	if body.Reason == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Ban reason is required", nil)
	}

	if err := h.adminService.BanCreator(c.Context(), creatorID, body.Reason); err != nil {
		if err.Error() == "user not found" {
			return SendError(c, fiber.StatusNotFound, ErrNotFound, "Creator not found", nil)
		}
		if err.Error() == "user is already banned" {
			return SendError(c, fiber.StatusConflict, ErrConflict, "Creator is already banned", nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to ban creator", err)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Creator banned successfully"}, nil)
}

// UnbanCreator restores a creator's status to "active".
// POST /api/v1/admin/creators/:id/unban
func (h *AdminHandler) UnbanCreator(c *fiber.Ctx) error {
	creatorID := c.Params("id")
	if creatorID == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Creator ID is required", nil)
	}

	if err := h.adminService.UnbanCreator(c.Context(), creatorID); err != nil {
		if err.Error() == "user not found" {
			return SendError(c, fiber.StatusNotFound, ErrNotFound, "Creator not found", nil)
		}
		if err.Error() == "user is not banned" {
			return SendError(c, fiber.StatusConflict, ErrConflict, "Creator is not banned", nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to unban creator", err)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Creator unbanned successfully"}, nil)
}
