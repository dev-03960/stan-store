package http

import (
	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// AuthRequired middleware extracts and validates the JWT from the HTTP-Only cookie.
// On success, it sets c.Locals("userId") and c.Locals("role").
// On failure, it returns 401 ERR_UNAUTHORIZED.
func AuthRequired(jwtService *services.JWTService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractTokenFromCookie(c)
		if token == "" {
			return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
		}

		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Invalid or expired token", nil)
		}

		// Inject user identity into request context
		c.Locals("userId", claims.UserID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}

// RoleRequired middleware checks if the authenticated user's role is in the allowed list.
// Must be used AFTER AuthRequired in the middleware chain.
func RoleRequired(roles ...string) fiber.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role == "" {
			return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required", nil)
		}

		if !allowed[role] {
			return SendError(c, fiber.StatusForbidden, ErrForbidden, "Insufficient permissions", nil)
		}

		return c.Next()
	}
}
