package http

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

type InstagramHandler struct {
	instagramService *services.InstagramService
	appSecret        string
	verifyToken      string
	frontendURL      string
}

func NewInstagramHandler(service *services.InstagramService, appSecret string, verifyToken string, frontendURL string) *InstagramHandler {
	return &InstagramHandler{
		instagramService: service,
		appSecret:        appSecret,
		verifyToken:      verifyToken,
		frontendURL:      frontendURL,
	}
}

// OAuth endpoints

func (h *InstagramHandler) GetOAuthURL(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok || creatorID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	// generate state tied to creator
	state := "ig_state_" + creatorID
	url := h.instagramService.GetOAuthURL(state)

	return SendOK(c, fiber.Map{"url": url})
}

func (h *InstagramHandler) OAuthCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	state := c.Query("state")
	errorStr := c.Query("error")

	if errorStr != "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "OAuth failed: "+errorStr, nil)
	}

	if !strings.HasPrefix(state, "ig_state_") {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid state", nil)
	}

	creatorID := strings.TrimPrefix(state, "ig_state_")

	err := h.instagramService.ExchangeCodeAndConnect(c.Context(), creatorID, code)
	if err != nil {
		logger.Error("Instagram OAuthCallback failed", "error", err.Error(), "creatorID", creatorID)
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to connect Instagram account", nil)
	}

	// Redirect back to frontend dashboard integrations
	return c.Redirect(h.frontendURL + "/dashboard/integrations?ig_success=true")
}

func (h *InstagramHandler) GetConnection(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok || creatorID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	conn, err := h.instagramService.GetConnection(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch connection", nil)
	}
	if conn == nil {
		return SendOK(c, fiber.Map{"connected": false})
	}
	return SendOK(c, fiber.Map{
		"connected":  true,
		"igUsername": conn.IGUsername,
		"createdAt":  conn.CreatedAt,
	})
}

func (h *InstagramHandler) Disconnect(c *fiber.Ctx) error {
	creatorID, ok := c.Locals("userId").(string)
	if !ok || creatorID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	err := h.instagramService.Disconnect(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to disconnect", nil)
	}
	return c.JSON(fiber.Map{"message": "Disconnected successfully"})
}

// Webhook Handlers

func (h *InstagramHandler) VerifyWebhook(c *fiber.Ctx) error {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode == "subscribe" && token == h.verifyToken {
		return c.SendString(challenge) // must respond with strictly the challenge
	}

	return c.SendStatus(fiber.StatusForbidden)
}

func (h *InstagramHandler) HandleWebhook(c *fiber.Ctx) error {
	// 1. Verify Signature (X-Hub-Signature-256)
	signature := c.Get("X-Hub-Signature-256")
	if signature == "" {
		return c.SendStatus(fiber.StatusForbidden)
	}

	body := c.Body()

	hash := hmac.New(sha256.New, []byte(h.appSecret))
	hash.Write(body)
	expectedSignature := "sha256=" + hex.EncodeToString(hash.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		return c.SendStatus(fiber.StatusForbidden)
	}

	// 2. Process async to respond 200 OK immediately
	go h.instagramService.ProcessWebhook(context.Background(), body)

	return c.SendStatus(fiber.StatusOK)
}

// Automations

func (h *InstagramHandler) GetAutomations(c *fiber.Ctx) error {
	creatorID := c.Locals("userId").(string)

	autos, err := h.instagramService.GetAutomations(c.Context(), creatorID)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch automations", nil)
	}
	return SendOK(c, autos)
}

type CreateAuthReq struct {
	Keyword      string `json:"keyword"`
	ResponseText string `json:"responseText"`
	ProductID    string `json:"productId"`
}

func (h *InstagramHandler) CreateAutomation(c *fiber.Ctx) error {
	creatorID := c.Locals("userId").(string)

	var req CreateAuthReq
	if err := c.BodyParser(&req); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid body", nil)
	}

	auto, err := h.instagramService.CreateAutomation(c.Context(), creatorID, req.Keyword, req.ResponseText, req.ProductID)
	if err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, err.Error(), nil)
	}
	return SendOK(c, auto)
}

func (h *InstagramHandler) DeleteAutomation(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.SendStatus(fiber.StatusBadRequest)
	}
	err := h.instagramService.DeleteAutomation(c.Context(), id)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Delete failed", nil)
	}
	return c.SendStatus(fiber.StatusOK)
}
