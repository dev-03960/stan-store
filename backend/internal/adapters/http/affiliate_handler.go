package http

import (
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AffiliateHandler struct {
	affiliateSvc *services.AffiliateService
	productSvc   *services.ProductService
}

func NewAffiliateHandler(affiliateSvc *services.AffiliateService, productSvc *services.ProductService) *AffiliateHandler {
	return &AffiliateHandler{
		affiliateSvc: affiliateSvc,
		productSvc:   productSvc,
	}
}

// EnableAffiliate (Creator Protected)
func (h *AffiliateHandler) EnableAffiliate(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	productID := c.Params("id")
	if productID == "" {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "product id required", nil)
	}

	_, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "invalid product id format", nil)
	}

	var req struct {
		Enabled        bool    `json:"enabled"`
		CommissionRate float64 `json:"commission_rate"`
	}

	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "invalid json body", nil)
	}

	if req.CommissionRate < 0 || req.CommissionRate > 100 {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "commission rate must be between 0 and 100", nil)
	}

	// Fetch existing product
	product, err := h.productSvc.GetProductByID(c.Context(), productID)
	if err != nil || product == nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "product not found", nil)
	}

	if product.CreatorID.Hex() != creatorID {
		return SendError(c, fiber.StatusForbidden, ErrForbidden, "unauthorized to edit this product", nil)
	}

	// Patch flags in memory
	product.AffiliateEnabled = req.Enabled
	product.CommissionRate = req.CommissionRate

	if err := h.productSvc.UpdateProductRaw(c.Context(), productID, product); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "failed to update product", err)
	}

	return SendOK(c, fiber.Map{"message": "affiliate program enabled", "product": product})
}

// GetCreatorAffiliates (Creator Protected)
func (h *AffiliateHandler) GetCreatorAffiliates(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	cID, _ := primitive.ObjectIDFromHex(creatorID)

	affiliates, err := h.affiliateSvc.GetCreatorAffiliates(c.Context(), cID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "failed to get affiliates", err)
	}

	return SendOK(c, affiliates)
}

// RegisterAffiliate (Public)
func (h *AffiliateHandler) RegisterAffiliate(c *fiber.Ctx) error {
	var req struct {
		CreatorID string `json:"creator_id"`
		Email     string `json:"email"`
		Name      string `json:"name"`
	}

	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "invalid json body", nil)
	}

	cID, err := primitive.ObjectIDFromHex(req.CreatorID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "invalid creator id", nil)
	}

	aff, err := h.affiliateSvc.Register(c.Context(), cID, req.Email, req.Name)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "failed to register affiliate: "+err.Error(), nil)
	}

	return SendOK(c, fiber.Map{
		"message":       "successfully registered",
		"referral_code": aff.ReferralCode,
	})
}

// Ensure the affiliate user endpoint loads aggregated states dynamically
func (h *AffiliateHandler) GetMyStats(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return SendError(c, fiber.StatusBadRequest, ErrValidation, "referral code required query arg", nil)
	}

	stats, err := h.affiliateSvc.GetAffiliateStats(c.Context(), code)
	if err != nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "invalid referral code", err)
	}

	return SendOK(c, stats)
}

// TrackClick increments visit volumes dynamically directly via public hits (usually triggered in UI loader)
func (h *AffiliateHandler) TrackClick(c *fiber.Ctx) error {
	var req struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&req); err != nil || req.Code == "" {
		return c.SendStatus(fiber.StatusNoContent)
	}
	_ = h.affiliateSvc.TrackClick(c.Context(), req.Code)
	_ = h.affiliateSvc.TrackClick(c.Context(), req.Code)

	c.Cookie(&fiber.Cookie{
		Name:     "stan_ref",
		Value:    req.Code,
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60, // 30 days
		Secure:   true,
		HTTPOnly: true,
		SameSite: "None", // Required for cross-origin
	})

	// Return 204 No Content transparently since it's just telemetry mapping
	return c.SendStatus(fiber.StatusNoContent)
}
