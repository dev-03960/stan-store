package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PlatformSubscriptionHandler handles platform subscription endpoints.
type PlatformSubscriptionHandler struct {
	service *services.PlatformSubscriptionService
}

// NewPlatformSubscriptionHandler creates a new handler.
func NewPlatformSubscriptionHandler(service *services.PlatformSubscriptionService) *PlatformSubscriptionHandler {
	return &PlatformSubscriptionHandler{service: service}
}

// GetMySubscription returns the current creator's subscription status.
// If no subscription exists, auto-starts a 30-day trial.
// GET /api/v1/platform/subscription
func (h *PlatformSubscriptionHandler) GetMySubscription(c *fiber.Ctx) error {
	userID, _ := c.Locals("userId").(string)
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid user ID", nil)
	}

	sub, err := h.service.GetSubscriptionStatus(c.Context(), objID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch subscription", err)
	}

	// Auto-start trial for creators who don't have a subscription yet
	if sub == nil {
		role, _ := c.Locals("role").(string)
		if role == "creator" {
			// We need user info for denormalized fields
			if err := h.service.StartTrial(c.Context(), objID, "", ""); err != nil {
				return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to start trial", err)
			}
			// Re-fetch after creating
			sub, _ = h.service.GetSubscriptionStatus(c.Context(), objID)
		}
	}

	if sub == nil {
		return SendSuccess(c, fiber.StatusOK, map[string]interface{}{
			"status":         "none",
			"has_access":     false,
			"days_remaining": 0,
		}, nil)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]interface{}{
		"subscription":   sub,
		"status":         sub.Status,
		"has_access":     sub.IsAccessAllowed(),
		"days_remaining": sub.DaysRemaining(),
	}, nil)
}

// --- Admin Endpoints ---

// ListSubscriptions returns all platform subscriptions with optional filtering.
// GET /api/v1/admin/subscriptions?status=active&page=1&pageSize=20
func (h *PlatformSubscriptionHandler) ListSubscriptions(c *fiber.Ctx) error {
	filter := domain.Filter{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filter["creator_email"] = primitive.Regex{Pattern: search, Options: "i"}
	}

	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("pageSize", "20"), 10, 64)

	subs, meta, err := h.service.ListSubscriptions(c.Context(), filter, &domain.Pagination{
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to list subscriptions", err)
	}

	return SendSuccess(c, fiber.StatusOK, subs, meta)
}

// GetAnalytics returns subscription analytics for the admin dashboard.
// GET /api/v1/admin/subscriptions/analytics
func (h *PlatformSubscriptionHandler) GetAnalytics(c *fiber.Ctx) error {
	analytics, err := h.service.GetAnalytics(c.Context())
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to get analytics", err)
	}

	return SendSuccess(c, fiber.StatusOK, analytics, nil)
}

// GrantSubscription manually grants a subscription to a creator.
// POST /api/v1/admin/subscriptions/grant
func (h *PlatformSubscriptionHandler) GrantSubscription(c *fiber.Ctx) error {
	var body struct {
		CreatorID string `json:"creator_id" validate:"required"`
		Months    int    `json:"months" validate:"required,min=1"`
	}
	if err := c.BodyParser(&body); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	objID, err := primitive.ObjectIDFromHex(body.CreatorID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid creator ID", nil)
	}

	if err := h.service.AdminGrantSubscription(c.Context(), objID, body.Months); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to grant subscription", err)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Subscription granted successfully"}, nil)
}

// RevokeSubscription revokes a creator's subscription.
// POST /api/v1/admin/subscriptions/revoke
func (h *PlatformSubscriptionHandler) RevokeSubscription(c *fiber.Ctx) error {
	var body struct {
		CreatorID string `json:"creator_id" validate:"required"`
	}
	if err := c.BodyParser(&body); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	objID, err := primitive.ObjectIDFromHex(body.CreatorID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid creator ID", nil)
	}

	if err := h.service.AdminRevokeSubscription(c.Context(), objID); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to revoke subscription", err)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Subscription revoked successfully"}, nil)
}

// AddCreator creates a new creator user with a trial subscription.
// POST /api/v1/admin/creators
func (h *PlatformSubscriptionHandler) AddCreator(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email" validate:"required,email"`
		Name  string `json:"name" validate:"required"`
	}
	if err := c.BodyParser(&body); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}
	if body.Email == "" || body.Name == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Email and Name are required", nil)
	}

	user, err := h.service.AdminAddCreator(c.Context(), body.Email, body.Name)
	if err != nil {
		if err.Error() == "user with this email already exists" {
			return SendError(c, fiber.StatusConflict, ErrConflict, err.Error(), nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to add creator", err)
	}

	return SendSuccess(c, fiber.StatusCreated, user, nil)
}
