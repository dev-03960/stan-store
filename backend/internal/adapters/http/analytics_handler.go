package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AnalyticsHandler struct {
	service *services.AnalyticsService
}

func NewAnalyticsHandler(service *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{
		service: service,
	}
}

func (h *AnalyticsHandler) TrackEvent(c *fiber.Ctx) error {
	var req struct {
		EventType string            `json:"event_type" validate:"required"`
		CreatorID string            `json:"creator_id" validate:"required"`
		ProductID string            `json:"product_id,omitempty"`
		Metadata  map[string]string `json:"metadata,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "Invalid request body", nil)
	}

	creatorObjID, err := primitive.ObjectIDFromHex(req.CreatorID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "Invalid creator_id format", nil)
	}

	var productObjID *primitive.ObjectID
	if req.ProductID != "" {
		id, err := primitive.ObjectIDFromHex(req.ProductID)
		if err != nil {
			return SendError(c, fiber.StatusBadRequest, ErrValidation, "Invalid product_id format", nil)
		}
		productObjID = &id
	}

	// Try reading from cookie first
	visitorID := c.Cookies("stan_visitor_id")
	if visitorID == "" {
		// Fallback to IP + User-Agent generation
		ip := c.IP()
		userAgent := c.Get("User-Agent")
		visitorID = services.GenerateVisitorID(ip, userAgent)

		// Set the cookie for future tracking persistence (365 days max age)
		c.Cookie(&fiber.Cookie{
			Name:     "stan_visitor_id",
			Value:    visitorID,
			Path:     "/",
			MaxAge:   365 * 24 * 60 * 60,
			Secure:   true,
			HTTPOnly: true, // Prevent JS read for security since it's just a backend identifier
			SameSite: "None",
		})
	}

	// Track the event
	err = h.service.TrackEvent(
		c.Context(),
		domain.AnalyticsEventType(req.EventType),
		creatorObjID,
		productObjID,
		visitorID,
		req.Metadata,
	)

	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to capture event", err)
	}

	// Standard unauthenticated silent return
	return c.SendStatus(fiber.StatusNoContent)
}

// GetDashboardMetrics handles GET /api/v1/creator/analytics?period=...
func (h *AnalyticsHandler) GetDashboardMetrics(c *fiber.Ctx) error {
	// 1. Get user ID from context (set by AuthRequired middleware)
	userIDHex, ok := c.Locals("userId").(string)
	if !ok {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "User ID not found in context", nil)
	}

	creatorID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid User ID format", nil)
	}

	// 2. Extract period query parameter
	period := c.Query("period", "7d") // Default to 7d

	// 3. Fetch metrics
	metrics, err := h.service.GetDashboardMetrics(c.Context(), creatorID, period)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch analytics metrics", err)
	}

	return SendOK(c, metrics)
}
