package http

import (
	"html"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/gofiber/fiber/v2"
	"github.com/microcosm-cc/bluemonday"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// NewsletterHandler handles newsletter-related endpoints.
type NewsletterHandler struct {
	subscriberRepo domain.EmailSubscriberRepository
	emailService   domain.EmailService
}

// NewNewsletterHandler creates a new NewsletterHandler.
func NewNewsletterHandler(subscriberRepo domain.EmailSubscriberRepository, emailService domain.EmailService) *NewsletterHandler {
	return &NewsletterHandler{
		subscriberRepo: subscriberRepo,
		emailService:   emailService,
	}
}

type sendNewsletterRequest struct {
	Subject  string `json:"subject"`
	BodyHTML string `json:"body_html"`
}

// SendNewsletter handles POST /api/v1/creator/newsletter
func (h *NewsletterHandler) SendNewsletter(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	var req sendNewsletterRequest
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", err)
	}

	if req.Subject == "" || req.BodyHTML == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Subject and body are required", nil)
	}

	// Sanitize HTML
	p := bluemonday.UGCPolicy()
	req.Subject = html.EscapeString(req.Subject)
	req.BodyHTML = p.Sanitize(req.BodyHTML)

	// Fetch all subscribers for this creator
	subs, err := h.subscriberRepo.FindAllByCreatorID(c.Context(), creatorID, 10000, 0)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch subscribers", err)
	}

	if len(subs) == 0 {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "No subscribers to send to", nil)
	}

	// Send email to each subscriber in the background
	sentCount := 0
	failedCount := 0
	for _, sub := range subs {
		if err := h.emailService.Send(c.Context(), sub.Email, req.Subject, req.BodyHTML); err != nil {
			failedCount++
		} else {
			sentCount++
		}
	}

	return SendOK(c, fiber.Map{
		"message":      "Newsletter sent",
		"sent_count":   sentCount,
		"failed_count": failedCount,
		"total":        len(subs),
	})
}
