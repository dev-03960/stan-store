package http

import (
	"html"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"github.com/microcosm-cc/bluemonday"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CampaignHandler struct {
	service   *services.CampaignService
	queueRepo domain.EmailQueueRepository // Temporary direct inject to fetch lightweight stats
}

func NewCampaignHandler(service *services.CampaignService, queueRepo domain.EmailQueueRepository) *CampaignHandler {
	return &CampaignHandler{service: service, queueRepo: queueRepo}
}

func (h *CampaignHandler) CreateCampaign(c *fiber.Ctx) error {
	creatorID, err := h.getCreatorID(c)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Creator not authenticated", err)
	}

	var req services.CreateCampaignRequest
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, "INVALID_INPUT", "Failed to parse Request", err)
	}

	// Sanitize against XSS attacks but allow basic rich HTML formats through bluemonday UGCPolicy
	p := bluemonday.UGCPolicy()
	for i := range req.Emails {
		req.Emails[i].Subject = html.EscapeString(req.Emails[i].Subject)
		req.Emails[i].BodyHTML = p.Sanitize(req.Emails[i].BodyHTML)
	}

	campaign, err := h.service.CreateCampaign(c.Context(), creatorID, &req)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, "CREATE_FAILED", "Failed creating sequence", err)
	}

	return SendCreated(c, map[string]interface{}{
		"campaign":   campaign,
		"sent_total": 0,
	})
}

func (h *CampaignHandler) GetCampaigns(c *fiber.Ctx) error {
	creatorID, err := h.getCreatorID(c)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Creator not authenticated", err)
	}

	campaigns, err := h.service.GetCreatorCampaigns(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to retrieve sequences", err)
	}

	// Attach aggregate stats
	var response []map[string]interface{}
	for _, camp := range campaigns {
		sentCount, _ := h.queueRepo.CountSentByCampaign(c.Context(), camp.ID)
		response = append(response, map[string]interface{}{
			"campaign":   camp,
			"sent_total": sentCount,
		})
	}

	return SendOK(c, response)
}

func (h *CampaignHandler) UpdateCampaignStatus(c *fiber.Ctx) error {
	creatorID, err := h.getCreatorID(c)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Creator not authenticated", err)
	}

	id := c.Params("id")
	campaignID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid sequence reference", err)
	}

	var req struct {
		Status domain.CampaignStatus `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, "INVALID_INPUT", "Payload incorrect", err)
	}

	err = h.service.UpdateCampaignStatus(c.Context(), campaignID, creatorID, req.Status)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, "UPDATE_FAILED", "Update denied", err)
	}

	return SendOK(c, map[string]string{"message": "Campaign status updated"})
}

// Helper function logic typically found in other handlers to extract creator ID
func (h *CampaignHandler) getCreatorID(c *fiber.Ctx) (primitive.ObjectID, error) {
	creatorIDStr := c.Locals("userId").(string)
	return primitive.ObjectIDFromHex(creatorIDStr)
}
