package http

import (
	"strconv"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SubscriberHandler handles email subscriber endpoints.
type SubscriberHandler struct {
	repo domain.EmailSubscriberRepository
}

// NewSubscriberHandler creates a new SubscriberHandler.
func NewSubscriberHandler(repo domain.EmailSubscriberRepository) *SubscriberHandler {
	return &SubscriberHandler{repo: repo}
}

// GetSubscribers handles GET /api/v1/creator/subscribers
func (h *SubscriberHandler) GetSubscribers(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	// Pagination
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit := int64(50)
	offset := (page - 1) * limit

	subs, err := h.repo.FindAllByCreatorID(c.Context(), creatorID, limit, offset)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch subscribers", err)
	}

	count, _ := h.repo.Count(c.Context(), creatorID)

	return SendOK(c, fiber.Map{
		"subscribers": subs,
		"total":       count,
		"page":        page,
		"per_page":    limit,
	})
}
