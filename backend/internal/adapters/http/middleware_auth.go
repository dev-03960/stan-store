package http

import (
	"context"

	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// AuthRequired middleware extracts and validates the JWT from the HTTP-Only cookie.
// On success, it sets c.Locals("userId") and c.Locals("role").
// On failure, it returns 401 ERR_UNAUTHORIZED.
func AuthRequired(jwtService *services.JWTService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractTokenFromCookie(c)
		if token == "" {
			// Fallback to Authorization header
			authHeader := c.Get("Authorization")
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				token = authHeader[7:]
			}
		}

		if token == "" {
			return SendError(c, fiber.StatusUnauthorized, ErrUnauthorized, "Authentication required - No Token", nil)
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

// BanCheck middleware verifies that the authenticated user is not banned.
// Must be used AFTER AuthRequired in the middleware chain.
// Admin users bypass this check so they can still manage bans.
func BanCheck(userRepo domain.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userId").(string)
		if !ok || userID == "" {
			return c.Next() // Let AuthRequired handle missing userId
		}

		// Admin users bypass ban check
		role, _ := c.Locals("role").(string)
		if role == domain.RoleAdmin {
			return c.Next()
		}

		user, err := userRepo.FindByID(context.Background(), userID)
		if err != nil || user == nil {
			// If user not found in DB, let the request through —
			// other handlers will handle missing users appropriately.
			return c.Next()
		}

		if user.Status == domain.UserStatusBanned {
			return SendError(c, fiber.StatusForbidden, ErrAccountBanned, "Your account has been suspended", nil)
		}

		return c.Next()
	}
}
