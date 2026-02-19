package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// StoreHandler handles HTTP requests for the public storefront.
type StoreHandler struct {
	service *services.StoreService
}

// NewStoreHandler creates a new StoreHandler.
func NewStoreHandler(service *services.StoreService) *StoreHandler {
	return &StoreHandler{
		service: service,
	}
}

// GetStore handles GET /api/v1/store/:username.
// This endpoint is PUBLIC.
func (h *StoreHandler) GetStore(c *fiber.Ctx) error {
	username := c.Params("username")
	if username == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Username is required", nil)
	}

	store, err := h.service.GetStoreByUsername(c.Context(), username)
	if err != nil {
		if err.Error() == "creator not found" {
			return SendError(c, fiber.StatusNotFound, ErrNotFound, "Creator not found", nil)
		}
		if err.Error() == "store banned" {
			return SendError(c, fiber.StatusForbidden, ErrStoreBanned, "This store has been suspended", nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch store", nil)
	}

	return SendSuccess(c, fiber.StatusOK, store, nil)
}
