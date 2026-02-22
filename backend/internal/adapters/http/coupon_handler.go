package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CouponHandler handles coupon CRUD and validation endpoints.
type CouponHandler struct {
	service *services.CouponService
}

// NewCouponHandler creates a new CouponHandler.
func NewCouponHandler(service *services.CouponService) *CouponHandler {
	return &CouponHandler{service: service}
}

// CreateCoupon handles POST /api/v1/coupons
func (h *CouponHandler) CreateCoupon(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	var coupon domain.Coupon
	if err := c.BodyParser(&coupon); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}
	coupon.CreatorID = creatorID

	if err := h.service.CreateCoupon(c.Context(), &coupon); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, err.Error(), nil)
	}

	return SendCreated(c, coupon)
}

// GetCoupons handles GET /api/v1/coupons
func (h *CouponHandler) GetCoupons(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	coupons, err := h.service.GetCoupons(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch coupons", err)
	}

	return SendOK(c, coupons)
}

// UpdateCoupon handles PATCH /api/v1/coupons/:id
func (h *CouponHandler) UpdateCoupon(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	couponIDStr := c.Params("id")
	couponID, err := primitive.ObjectIDFromHex(couponIDStr)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid coupon ID", nil)
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	coupon, err := h.service.UpdateCoupon(c.Context(), couponID, creatorID, updates)
	if err != nil {
		msg := err.Error()
		if msg == "unauthorized" {
			return SendError(c, fiber.StatusForbidden, "FORBIDDEN", msg, nil)
		}
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, msg, nil)
	}

	return SendOK(c, coupon)
}

// DeleteCoupon handles DELETE /api/v1/coupons/:id
func (h *CouponHandler) DeleteCoupon(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	creatorID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid user ID", nil)
	}

	couponIDStr := c.Params("id")
	couponID, err := primitive.ObjectIDFromHex(couponIDStr)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid coupon ID", nil)
	}

	if err := h.service.DeleteCoupon(c.Context(), couponID, creatorID); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, err.Error(), nil)
	}

	return SendOK(c, fiber.Map{"message": "Coupon deactivated"})
}

// ValidateCoupon handles POST /api/v1/coupons/validate
func (h *CouponHandler) ValidateCoupon(c *fiber.Ctx) error {
	var req struct {
		Code        string `json:"code"`
		ProductID   string `json:"product_id"`
		OrderAmount int64  `json:"order_amount"`
		CreatorID   string `json:"creator_id"` // Public endpoint — creator ID from storefront
	}
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", nil)
	}

	creatorID, err := primitive.ObjectIDFromHex(req.CreatorID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid creator ID", nil)
	}

	productID, err := primitive.ObjectIDFromHex(req.ProductID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid product ID", nil)
	}

	result, err := h.service.ValidateCoupon(c.Context(), creatorID, req.Code, productID, req.OrderAmount)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Validation failed", err)
	}

	return SendOK(c, result)
}
