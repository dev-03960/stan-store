package http

import (
	"context"
	"encoding/json"
	"io"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const (
	cookieName    = "stan_token"
	cookieMaxAge  = 7 * 24 * 60 * 60 // 7 days in seconds
	googleUserURL = "https://www.googleapis.com/oauth2/v2/userinfo"
)

// AuthHandler handles authentication HTTP endpoints.
type AuthHandler struct {
	authService *services.AuthService
	oauthConfig *oauth2.Config
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *services.AuthService, clientID, clientSecret, redirectURL string) *AuthHandler {
	oauthConfig := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}

	return &AuthHandler{
		authService: authService,
		oauthConfig: oauthConfig,
	}
}

// GoogleLogin redirects the user to Google's consent screen.
// GET /api/v1/auth/google
func (h *AuthHandler) GoogleLogin(c *fiber.Ctx) error {
	// Use a state parameter for CSRF protection
	state := c.Query("redirect", "/dashboard")
	url := h.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return c.Redirect(url, fiber.StatusTemporaryRedirect)
}

// GoogleCallback handles the OAuth callback from Google.
// GET /api/v1/auth/google/callback
func (h *AuthHandler) GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Missing authorization code", nil)
	}

	// Exchange authorization code for access token
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	token, err := h.oauthConfig.Exchange(ctx, code)
	if err != nil {
		logger.Error("oauth code exchange failed", "error", err.Error())
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to exchange authorization code", nil)
	}

	// Fetch user info from Google
	client := h.oauthConfig.Client(ctx, token)
	resp, err := client.Get(googleUserURL)
	if err != nil {
		logger.Error("google user info fetch failed", "error", err.Error())
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to fetch user info", nil)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to read user info", nil)
	}

	var gUser services.GoogleUser
	if err := json.Unmarshal(body, &gUser); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to parse user info", nil)
	}

	// Process auth (find or create user, generate JWT)
	result, err := h.authService.HandleGoogleCallback(ctx, &gUser)
	if err != nil {
		logger.Error("auth callback failed", "error", err.Error(), "email", gUser.Email)
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Authentication failed", nil)
	}

	// Set JWT as HTTP-Only cookie
	c.Cookie(&fiber.Cookie{
		Name:     cookieName,
		Value:    result.Token,
		MaxAge:   cookieMaxAge,
		HTTPOnly: true,
		Secure:   c.Protocol() == "https",
		SameSite: "Strict",
		Path:     "/",
	})

	// Redirect to frontend
	frontendURL := c.Query("state", result.RedirectURL)
	if frontendURL == "" {
		frontendURL = result.RedirectURL
	}

	return c.Redirect(frontendURL, fiber.StatusTemporaryRedirect)
}

// GetMe returns the current authenticated user.
// GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
	}

	user, err := h.authService.GetCurrentUser(c.Context(), userID)
	if err != nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "User not found", nil)
	}

	return SendSuccess(c, fiber.StatusOK, user, nil)
}

// Logout clears the authentication cookie.
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     cookieName,
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   c.Protocol() == "https",
		SameSite: "Strict",
		Path:     "/",
	})

	return SendSuccess(c, fiber.StatusOK, map[string]string{"message": "Logged out successfully"}, nil)
}

// extractTokenFromCookie is a helper used by auth middleware.
func extractTokenFromCookie(c *fiber.Ctx) string {
	return c.Cookies(cookieName)
}
