package http

import (
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// CourseHandler handles HTTP requests for course structure.
type CourseHandler struct {
	service *services.CourseService
}

// NewCourseHandler creates a new CourseHandler.
func NewCourseHandler(service *services.CourseService) *CourseHandler {
	return &CourseHandler{
		service: service,
	}
}

// GetCourse retrieves the course structure for a product
func (h *CourseHandler) GetCourse(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	role, _ := c.Locals("role").(string)
	isCreator := role == "creator" || role == "admin"
	course, err := h.service.GetCourse(c.Context(), productID, userID, isCreator)
	if err != nil {
		if err.Error() == "unauthorized access to product" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized"})
		}
		// If buyer requested but no body/course exists, return not found
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Course not found"})
	}

	return c.JSON(course)
}

// CreateModuleRequest is the payload to add a module
type CreateModuleRequest struct {
	Title     string `json:"title"`
	SortOrder int    `json:"sort_order"`
}

func (h *CourseHandler) CreateModule(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var req CreateModuleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.CreateModule(c.Context(), productID, creatorID, req.Title, req.SortOrder)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(course)
}

func (h *CourseHandler) UpdateModule(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	moduleID := c.Params("modId")
	if err != nil || moduleID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID parameters"})
	}

	var req CreateModuleRequest // Reusing payload
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.UpdateModule(c.Context(), productID, creatorID, moduleID, req.Title, req.SortOrder)
	if err != nil {
		if err == services.ErrModuleNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Module not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(course)
}

func (h *CourseHandler) DeleteModule(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	moduleID := c.Params("modId")
	if err != nil || moduleID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID parameters"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.DeleteModule(c.Context(), productID, creatorID, moduleID)
	if err != nil {
		if err == services.ErrModuleNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Module not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(course)
}

func (h *CourseHandler) CreateLesson(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	moduleID := c.Params("modId")
	if err != nil || moduleID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID parameters"})
	}

	var req domain.Lesson
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.CreateLesson(c.Context(), productID, creatorID, moduleID, req)
	if err != nil {
		if err == services.ErrModuleNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Module not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(course)
}

func (h *CourseHandler) UpdateLesson(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	moduleID := c.Params("modId")
	lessonID := c.Params("lesId")
	if err != nil || moduleID == "" || lessonID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID parameters"})
	}

	var req domain.Lesson
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.UpdateLesson(c.Context(), productID, creatorID, moduleID, lessonID, req)
	if err != nil {
		if err == services.ErrLessonNotFound || err == services.ErrModuleNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Lesson/Module not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(course)
}

func (h *CourseHandler) DeleteLesson(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	moduleID := c.Params("modId")
	lessonID := c.Params("lesId")
	if err != nil || moduleID == "" || lessonID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID parameters"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.DeleteLesson(c.Context(), productID, creatorID, moduleID, lessonID)
	if err != nil {
		if err == services.ErrLessonNotFound || err == services.ErrModuleNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Lesson/Module not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(course)
}

func (h *CourseHandler) ReorderStructure(c *fiber.Ctx) error {
	productIDHex := c.Params("id")
	productID, err := primitive.ObjectIDFromHex(productIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var req []domain.Module
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	userIDStr, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User context not found"})
	}
	creatorID, _ := primitive.ObjectIDFromHex(userIDStr)

	course, err := h.service.ReorderStructure(c.Context(), productID, creatorID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(course)
}
