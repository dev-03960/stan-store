package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// UsernameHandler handles username-related HTTP endpoints.
type UsernameHandler struct {
	usernameService *services.UsernameService
}

// NewUsernameHandler creates a new UsernameHandler.
func NewUsernameHandler(usernameService *services.UsernameService) *UsernameHandler {
	return &UsernameHandler{
		usernameService: usernameService,
	}
}

// ClaimUsername sets a username on the authenticated user's document.
// POST /api/v1/auth/username (protected by AuthRequired middleware)
func (h *UsernameHandler) ClaimUsername(c *fiber.Ctx) error {
	// User ID injected by AuthRequired middleware
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	// Parse request body
	var req struct {
		Username string `json:"username"`
	}
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	if req.Username == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Username is required", nil)
	}

	// Claim username
	user, usernameErr := h.usernameService.ClaimUsername(c.Context(), userID, req.Username)
	if usernameErr != nil {
		switch usernameErr.Code {
		case "ERR_VALIDATION":
			return SendError(c, fiber.StatusUnprocessableEntity, ErrValidation, usernameErr.Message, nil)
		case "USERNAME_TAKEN":
			return SendError(c, fiber.StatusConflict, "USERNAME_TAKEN", usernameErr.Message, nil)
		case "USERNAME_ALREADY_SET":
			return SendError(c, fiber.StatusConflict, "USERNAME_ALREADY_SET", usernameErr.Message, nil)
		default:
			return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, usernameErr.Message, nil)
		}
	}

	return SendSuccess(c, fiber.StatusOK, user, nil)
}

// CheckAvailability checks if a username is available.
// GET /api/v1/auth/username/check?username=xxx (public)
func (h *UsernameHandler) CheckAvailability(c *fiber.Ctx) error {
	username := c.Query("username")
	if username == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Username query parameter is required", nil)
	}

	available, usernameErr := h.usernameService.CheckAvailability(c.Context(), username)
	if usernameErr != nil {
		if usernameErr.Code == "ERR_VALIDATION" {
			return SendSuccess(c, fiber.StatusOK, fiber.Map{
				"available": false,
				"username":  username,
				"reason":    usernameErr.Message,
			}, nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, usernameErr.Message, nil)
	}

	return SendSuccess(c, fiber.StatusOK, fiber.Map{
		"available": available,
		"username":  username,
	}, nil)
}
