package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// ProfileHandler handles creator profile HTTP endpoints.
type ProfileHandler struct {
	profileService *services.ProfileService
}

// NewProfileHandler creates a new ProfileHandler.
func NewProfileHandler(profileService *services.ProfileService) *ProfileHandler {
	return &ProfileHandler{profileService: profileService}
}

// GetProfile returns the current user's profile.
// GET /api/v1/creator/profile (protected by AuthRequired)
func (h *ProfileHandler) GetProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	user, err := h.profileService.GetProfile(c.Context(), userID)
	if err != nil || user == nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "Profile not found", nil)
	}

	return SendOK(c, user)
}

// UpdateProfile updates the current user's profile.
// PUT /api/v1/creator/profile (protected by AuthRequired)
func (h *ProfileHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	var input services.ProfileInput
	if err := c.BodyParser(&input); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	user, validationErrs := h.profileService.UpdateProfile(c.Context(), userID, &input)
	if validationErrs != nil {
		return SendError(c, fiber.StatusUnprocessableEntity, ErrValidation, validationErrs.Error(), validationErrs.Errors)
	}

	return SendOK(c, user)
}
