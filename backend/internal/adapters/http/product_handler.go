package http

import (
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// ProductHandler handles HTTP requests for products.
type ProductHandler struct {
	service *services.ProductService
}

// NewProductHandler creates a new ProductHandler.
func NewProductHandler(service *services.ProductService) *ProductHandler {
	return &ProductHandler{
		service: service,
	}
}

// CreateProductDTO defines the request body for creating a product.
type CreateProductDTO struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	Price         int64  `json:"price"` // In paise
	CoverImageURL string `json:"cover_image_url"`
	FileURL       string `json:"file_url"`
	ProductType   string `json:"product_type"`
}

// UpdateProductDTO defines the request body for updating a product.
type UpdateProductDTO struct {
	Title         string `json:"title,omitempty"`
	Description   string `json:"description,omitempty"`
	Price         int64  `json:"price,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
}

// CreateProduct handles POST /api/v1/products.
func (h *ProductHandler) CreateProduct(c *fiber.Ctx) error {
	// 1. Parse request body
	var req CreateProductDTO
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	// 2. Get authenticated user ID from context (set by AuthRequired middleware)
	userID := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "Invalid user ID",
			},
		})
	}

	// 3. Map DTO to Domain Model
	product := &domain.Product{
		CreatorID:     creatorID,
		Title:         req.Title,
		Description:   req.Description,
		Price:         req.Price,
		CoverImageURL: req.CoverImageURL,
		FileURL:       req.FileURL,
		ProductType:   domain.ProductType(req.ProductType),
		IsVisible:     true, // Default to visible
	}

	// 4. Call Service
	createdProduct, err := h.service.CreateProduct(c.Context(), product)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "PRODUCT_CREATION_FAILED",
				"message": err.Error(),
			},
		})
	}

	// 5. Return success response
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data":  createdProduct,
		"meta":  nil,
		"error": nil,
	})
}

// GetProducts handles GET /api/v1/products.
func (h *ProductHandler) GetProducts(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)

	products, err := h.service.GetCreatorProducts(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch products",
			},
		})
	}

	return c.JSON(fiber.Map{
		"data":  products,
		"meta":  nil,
		"error": nil,
	})
}

// UpdateProduct handles PUT /api/v1/products/:id.
func (h *ProductHandler) UpdateProduct(c *fiber.Ctx) error {
	productID := c.Params("id")
	userID := c.Locals("userId").(string)

	var req UpdateProductDTO
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	// Create a partial update object
	// Note: Zero values in DTO will be ignored by service logic if we just pass struct.
	// But service logic checks if value != "" or != 0.
	// This means we can't unset fields to empty/zero easily with this simple struct.
	// For MVP strict updates, this is acceptable.

	updateData := &domain.Product{
		Title:         req.Title,
		Description:   req.Description,
		Price:         req.Price,
		CoverImageURL: req.CoverImageURL,
		// FileURL is not updatable via this endpoint usually, maybe separate endpoint?
		// For now, simple textual updates.
	}

	updatedProduct, err := h.service.UpdateProduct(c.Context(), productID, userID, updateData)
	if err != nil {
		status := fiber.StatusInternalServerError
		if err.Error() == "unauthorized: you do not own this product" {
			status = fiber.StatusForbidden
		} else if err.Error() == "product not found" {
			status = fiber.StatusNotFound
		} else {
			status = fiber.StatusBadRequest
		}

		return c.Status(status).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UPDATE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"data":  updatedProduct,
		"meta":  nil,
		"error": nil,
	})
}

// DeleteProduct handles DELETE /api/v1/products/:id.
func (h *ProductHandler) DeleteProduct(c *fiber.Ctx) error {
	productID := c.Params("id")
	userID := c.Locals("userId").(string)

	err := h.service.DeleteProduct(c.Context(), productID, userID)
	if err != nil {
		status := fiber.StatusInternalServerError
		if err.Error() == "unauthorized: you do not own this product" {
			status = fiber.StatusForbidden
		} else if err.Error() == "product not found" {
			status = fiber.StatusNotFound
		}

		return c.Status(status).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "DELETE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"data":  fiber.Map{"message": "Product deleted successfully"},
		"meta":  nil,
		"error": nil,
	})
}

// UpdateVisibility handles PATCH /api/v1/products/:id/visibility.
func (h *ProductHandler) UpdateVisibility(c *fiber.Ctx) error {
	productID := c.Params("id")
	userID := c.Locals("userId").(string)

	var req domain.UpdateVisibilityRequest
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	err := h.service.ToggleVisibility(c.Context(), productID, userID, req.IsVisible)
	if err != nil {
		// Map errors to status codes
		// Using raw strings for now as service returns errors.New
		// Ideally we should use domain.ErrX types
		status := fiber.StatusInternalServerError
		if err.Error() == "unauthorized: you do not own this product" || err.Error() == "invalid creator ID" {
			status = fiber.StatusForbidden
		} else if err.Error() == "product not found" || err.Error() == "invalid product ID" || err.Error() == "product not found or unauthorized" {
			status = fiber.StatusNotFound
		}

		return SendError(c, status, "UPDATE_FAILED", err.Error(), nil)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Visibility updated successfully"}, nil)
}

// ReorderProducts handles PATCH /api/v1/products/reorder.
func (h *ProductHandler) ReorderProducts(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)

	var req domain.ReorderRequest
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	if len(req.ProductIDs) == 0 {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "No product IDs provided", nil)
	}

	err := h.service.ReorderProducts(c.Context(), userID, req.ProductIDs)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to reorder products", nil)
	}

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Products reordered successfully"}, nil)
}
