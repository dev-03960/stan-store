package http

import (
	"html"

	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
)

type TestimonialHandler struct {
	service *services.TestimonialService
}

func NewTestimonialHandler(service *services.TestimonialService) *TestimonialHandler {
	return &TestimonialHandler{service: service}
}

type CreateTestimonialReq struct {
	CustomerName string `json:"customer_name" validate:"required"`
	Text         string `json:"text" validate:"required,max=300"`
	Rating       int    `json:"rating" validate:"required,min=1,max=5"`
	AvatarURL    string `json:"avatar_url"`
}

type ReorderTestimonialsReq struct {
	TestimonialIDs []string `json:"testimonial_ids" validate:"required"`
}

// Create handles POST /api/v1/products/:id/testimonials
func (h *TestimonialHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	productID := c.Params("id")

	var req CreateTestimonialReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	sanitizedName := html.EscapeString(req.CustomerName)
	sanitizedText := html.EscapeString(req.Text)

	testimonial, err := h.service.CreateTestimonial(c.Context(), userID, productID, sanitizedName, sanitizedText, req.Rating, req.AvatarURL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Testimonial created successfully",
		"data":    testimonial,
	})
}

// GetPublic handles GET /api/v1/products/:id/testimonials
func (h *TestimonialHandler) GetPublic(c *fiber.Ctx) error {
	productID := c.Params("id")

	testimonials, err := h.service.GetPublicTestimonials(c.Context(), productID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": testimonials,
	})
}

// Update handles PUT /api/v1/products/:id/testimonials/:tid
func (h *TestimonialHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	// productID isn't strictly needed if we look up by tid, but it's in the route
	testimonialID := c.Params("tid")

	var req CreateTestimonialReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	sanitizedName := html.EscapeString(req.CustomerName)
	sanitizedText := html.EscapeString(req.Text)

	testimonial, err := h.service.UpdateTestimonial(c.Context(), userID, testimonialID, sanitizedName, sanitizedText, req.Rating, req.AvatarURL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Testimonial updated successfully",
		"data":    testimonial,
	})
}

// Delete handles DELETE /api/v1/products/:id/testimonials/:tid
func (h *TestimonialHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	testimonialID := c.Params("tid")

	if err := h.service.DeleteTestimonial(c.Context(), userID, testimonialID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Testimonial deleted successfully"})
}

// Reorder handles PATCH /api/v1/products/:id/testimonials/reorder
func (h *TestimonialHandler) Reorder(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	productID := c.Params("id")

	var req ReorderTestimonialsReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.service.ReorderTestimonials(c.Context(), userID, productID, req.TestimonialIDs); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Testimonials reordered successfully"})
}
