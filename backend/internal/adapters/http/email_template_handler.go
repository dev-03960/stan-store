package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
)

type EmailTemplateHandler struct {
	service *services.EmailTemplateService
}

func NewEmailTemplateHandler(service *services.EmailTemplateService) *EmailTemplateHandler {
	return &EmailTemplateHandler{service: service}
}

func (h *EmailTemplateHandler) GetTemplate(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	templateType := c.Params("type")

	if templateType == "" {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "Template type is required", nil)
	}

	template, err := h.service.GetTemplate(c.Context(), userID, templateType)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get template", nil)
	}

	return SendSuccess(c, fiber.StatusOK, "Template retrieved successfully", template)
}

func (h *EmailTemplateHandler) UpdateTemplate(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	templateType := c.Params("type")

	if templateType == "" {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "Template type is required", nil)
	}

	var input services.UpdateTemplateInput
	if err := c.BodyParser(&input); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "Invalid request body", nil)
	}

	if err := h.service.UpdateTemplate(c.Context(), userID, templateType, &input); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, err.Error(), nil)
	}

	// Fetch the updated template to return it
	updatedTemplate, _ := h.service.GetTemplate(c.Context(), userID, templateType)

	return SendSuccess(c, fiber.StatusOK, "Template updated successfully", updatedTemplate)
}
