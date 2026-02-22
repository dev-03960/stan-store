package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderHandler struct {
	service *services.OrderService
}

func NewOrderHandler(service *services.OrderService) *OrderHandler {
	return &OrderHandler{
		service: service,
	}
}

// CreateOrder handles POST /api/v1/orders
func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
	var req struct {
		ProductID        string `json:"product_id" validate:"required"`
		CustomerName     string `json:"customer_name" validate:"required"`
		CustomerEmail    string `json:"customer_email" validate:"required,email"`
		BumpAccepted     bool   `json:"bump_accepted"`
		BookingSlotStart string `json:"booking_slot_start,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	// Validate Product ID
	productID, err := primitive.ObjectIDFromHex(req.ProductID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid Product ID", nil)
	}

	// Create Order
	order, err := h.service.CreateOrder(c.Context(), productID, req.CustomerName, req.CustomerEmail, req.BumpAccepted, req.BookingSlotStart)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to create order", err)
	}

	return SendCreated(c, order)
}

// GetOrder handles GET /api/v1/orders/:id
func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	orderIDHex := c.Params("id")
	orderID, err := primitive.ObjectIDFromHex(orderIDHex)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid order ID", nil)
	}

	order, err := h.service.GetOrder(c.Context(), orderID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch order", err)
	}
	if order == nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "Order not found", nil)
	}

	return SendOK(c, order)
}

// DownloadOrder generates a secure download link for a purchased product.
func (h *OrderHandler) DownloadOrder(c *fiber.Ctx) error {
	orderIDHex := c.Params("id")
	orderID, err := primitive.ObjectIDFromHex(orderIDHex)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid order ID", nil)
	}

	url, err := h.service.GetOrderDownloadURL(c.Context(), orderID, c.Query("product_id"))
	if err != nil {
		// Differentiate errors if needed (Order Not Found vs Not Paid vs System Error)
		// For now generic 400 or 500
		if err.Error() == "order not found" || err.Error() == "product not found" {
			return SendError(c, fiber.StatusNotFound, ErrNotFound, err.Error(), nil)
		}
		if err.Error() == "order not paid" {
			return SendError(c, fiber.StatusForbidden, ErrForbidden, "Order is not paid", nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to generate download link", err)
	}

	return SendOK(c, map[string]string{
		"download_url": url,
	})
}

// GetSalesHistory handles GET /api/v1/sales (Creator only)
func (h *OrderHandler) GetSalesHistory(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	orders, err := h.service.GetCreatorOrders(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch sales history", err)
	}

	return SendOK(c, orders)
}
