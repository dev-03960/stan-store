package http

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// GoogleCalendarHandler handles HTTP requests for Google Calendar OAuth integration.
type GoogleCalendarHandler struct {
	calendarService *services.GoogleCalendarService
	frontendURL     string
}

// NewGoogleCalendarHandler creates a new GoogleCalendarHandler.
func NewGoogleCalendarHandler(calendarService *services.GoogleCalendarService, frontendURL string) *GoogleCalendarHandler {
	return &GoogleCalendarHandler{
		calendarService: calendarService,
		frontendURL:     frontendURL,
	}
}

// GetOAuthURL returns the Google OAuth consent URL for calendar access.
func (h *GoogleCalendarHandler) GetOAuthURL(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok || creatorID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	state := "gcal_state_" + creatorID
	url := h.calendarService.GetOAuthURL(state)

	return SendOK(c, fiber.Map{"url": url})
}

// OAuthCallback handles the Google OAuth callback after user consent.
func (h *GoogleCalendarHandler) OAuthCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	state := c.Query("state")
	errorStr := c.Query("error")

	if errorStr != "" {
		return c.Redirect(h.frontendURL + "/dashboard/integrations?gcal_error=" + errorStr)
	}

	if !strings.HasPrefix(state, "gcal_state_") {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid state", nil)
	}

	creatorID := strings.TrimPrefix(state, "gcal_state_")

	err := h.calendarService.ExchangeCodeAndConnect(c.Context(), creatorID, code)
	if err != nil {
		return c.Redirect(h.frontendURL + "/dashboard/integrations?gcal_error=exchange_failed")
	}

	return c.Redirect(h.frontendURL + "/dashboard/integrations?gcal_success=true")
}

// GetConnection returns the Google Calendar connection status for the authenticated creator.
func (h *GoogleCalendarHandler) GetConnection(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok || creatorID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	conn, err := h.calendarService.GetConnection(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch connection", nil)
	}
	if conn == nil {
		return SendOK(c, fiber.Map{"connected": false})
	}
	return SendOK(c, fiber.Map{
		"connected": true,
		"email":     conn.Email,
		"createdAt": conn.CreatedAt,
	})
}

// Disconnect removes the Google Calendar connection for the authenticated creator.
func (h *GoogleCalendarHandler) Disconnect(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok || creatorID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	err := h.calendarService.Disconnect(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to disconnect", nil)
	}
	return SendOK(c, fiber.Map{"message": "Google Calendar disconnected successfully"})
}
