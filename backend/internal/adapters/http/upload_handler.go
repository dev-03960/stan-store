package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// UploadHandler handles HTTP requests for uploads.
type UploadHandler struct {
	service *services.UploadService
}

// NewUploadHandler creates a new UploadHandler.
func NewUploadHandler(service *services.UploadService) *UploadHandler {
	return &UploadHandler{
		service: service,
	}
}

// GeneratePresignedURL handles POST /api/v1/uploads/presigned.
func (h *UploadHandler) GeneratePresignedURL(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)

	var req domain.UploadRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	if req.FileName == "" || req.ContentType == "" || req.Purpose == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Missing required fields",
			},
		})
	}

	res, err := h.service.GeneratePresignedURL(c.Context(), userID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UPLOAD_ERROR",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"data":  res,
		"meta":  nil,
		"error": nil,
	})
}
