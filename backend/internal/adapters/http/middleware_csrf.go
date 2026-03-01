package http

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"

	"github.com/gofiber/fiber/v2"
)

const (
	csrfCookieName = "_csrf"
	csrfHeaderName = "X-CSRF-Token"
	csrfTokenLen   = 32 // 32 bytes = 64 hex chars
)

// CsrfProtection returns a middleware that enforces CSRF token validation
// on state-changing HTTP methods (POST, PUT, PATCH, DELETE).
//
// For safe methods (GET, HEAD, OPTIONS), it issues a fresh CSRF token cookie.
// The frontend must read the `_csrf` cookie and send it back as the `X-CSRF-Token` header.
func CsrfProtection() fiber.Handler {
	return func(c *fiber.Ctx) error {
		method := c.Method()

		// For safe methods: generate and set a CSRF token cookie
		if method == fiber.MethodGet || method == fiber.MethodHead || method == fiber.MethodOptions {
			token, err := generateCSRFToken()
			if err != nil {
				return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to generate CSRF token", nil)
			}

			c.Cookie(&fiber.Cookie{
				Name:     csrfCookieName,
				Value:    token,
				Path:     "/",
				MaxAge:   24 * 60 * 60, // 24 hours
				HTTPOnly: false,        // Frontend JS must be able to read this cookie
				Secure:   true,
				SameSite: "Strict",
			})

			return c.Next()
		}

		// For state-changing methods: validate the CSRF token
		cookieToken := c.Cookies(csrfCookieName)
		headerToken := c.Get(csrfHeaderName)

		if cookieToken == "" || headerToken == "" {
			return SendError(c, fiber.StatusForbidden, ErrForbidden, "CSRF token missing", nil)
		}

		if subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 {
			return SendError(c, fiber.StatusForbidden, ErrForbidden, "CSRF token mismatch", nil)
		}

		return c.Next()
	}
}

// generateCSRFToken generates a cryptographically secure random token.
func generateCSRFToken() (string, error) {
	b := make([]byte, csrfTokenLen)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
