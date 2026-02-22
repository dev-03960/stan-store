package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
)

// AIHandler handles requests related to AI features
type AIHandler struct {
	aiService *services.AIService
}

// NewAIHandler constructor
func NewAIHandler(aiService *services.AIService) *AIHandler {
	return &AIHandler{
		aiService: aiService,
	}
}

// GenerateCopyRequest represents the request body
type GenerateCopyRequest struct {
	Prompt string `json:"prompt"`
}

// GenerateCopy handles POST /api/v1/ai/generate-copy
func (h *AIHandler) GenerateCopy(c *fiber.Ctx) error {
	// Require authentication
	userID, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	role, _ := c.Locals("role").(string)
	if role != "creator" && role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Only creators can use AI tools"})
	}

	var req GenerateCopyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.Prompt == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Prompt is required"})
	}

	result, err := h.aiService.GenerateCopy(c.Context(), userID, req.Prompt)
	if err != nil {
		if err.Error() == "rate limit exceeded: maximum 10 generations per day" {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
}
