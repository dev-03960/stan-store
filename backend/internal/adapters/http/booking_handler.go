package http

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

// BookingHandler handles HTTP requests for coaching bookings
type BookingHandler struct {
	bookingService *services.BookingService
}

// NewBookingHandler creates a new BookingHandler
func NewBookingHandler(bookingService *services.BookingService) *BookingHandler {
	return &BookingHandler{
		bookingService: bookingService,
	}
}

// GetSlots returns available slots for a product on a given date
func (h *BookingHandler) GetSlots(c *fiber.Ctx) error {
	productIDStr := c.Params("id")
	dateStr := c.Query("date") // Format: YYYY-MM-DD

	if productIDStr == "" || dateStr == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Product ID and date are required", nil)
	}

	productID, err := primitive.ObjectIDFromHex(productIDStr)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid product ID", nil)
	}

	slots, err := h.bookingService.GetAvailableSlots(c.Context(), productID, dateStr)
	if err != nil {
		logger.Error("failed to get available slots", "error", err)
		if err.Error() == "product not found" || err.Error() == "product is not a booking product" {
			return SendError(c, fiber.StatusNotFound, ErrNotFound, err.Error(), nil)
		}
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to get availability", nil)
	}

	// Format slots to ISO8601 strings
	var formattedSlots []string
	for _, s := range slots {
		formattedSlots = append(formattedSlots, s.Format(time.RFC3339))
	}

	if formattedSlots == nil {
		formattedSlots = []string{}
	}

	return SendOK(c, formattedSlots)
}

// CancelBooking allows a user to cancel their booking if policy allows
func (h *BookingHandler) CancelBooking(c *fiber.Ctx) error {
	bookingIDStr := c.Params("id")
	bookingID, err := primitive.ObjectIDFromHex(bookingIDStr)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid booking ID", nil)
	}

	// Figure out if requester is buyer or creator
	// In our auth setup, creators have "user_id" locally, buyers might be authenticated too.
	// We'll rely on the service to enforce logic based on email or creator status.
	email := ""
	isCreator := false

	// Try extracting from context
	if role, ok := c.Locals("role").(string); ok && role == "creator" {
		isCreator = true
	} else if userEmail, ok := c.Locals("email").(string); ok {
		email = userEmail
	} else {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Unauthorized to cancel booking", nil)
	}

	err = h.bookingService.CancelBooking(c.Context(), bookingID, email, isCreator)
	if err != nil {
		logger.Error("failed to cancel booking", "error", err, "booking_id", bookingIDStr)
		if err.Error() == "booking not found" {
			return SendError(c, fiber.StatusNotFound, ErrNotFound, "Booking not found", nil)
		}
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, err.Error(), nil)
	}

	return SendOK(c, map[string]string{"message": "Booking cancelled successfully"})
}
