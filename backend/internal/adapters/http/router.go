package http

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// RouterDeps holds dependencies needed by the router.
type RouterDeps struct {
	FrontendURL     string
	JWTService      *services.JWTService
	AuthHandler     *AuthHandler
	UsernameHandler *UsernameHandler
	ProfileHandler  *ProfileHandler
}

// SetupRouter configures all routes and middleware on the Fiber app.
func SetupRouter(app *fiber.App, deps *RouterDeps) {
	// Global middleware
	app.Use(RequestID())
	app.Use(Recovery())
	app.Use(RequestLogger())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     deps.FrontendURL,
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Request-Id",
		AllowCredentials: true,
	}))

	// Auth middleware (reusable)
	authRequired := AuthRequired(deps.JWTService)

	// API v1 routes
	v1 := app.Group("/api/v1")
	v1.Get("/health", HealthHandler())

	// Auth routes (public)
	auth := v1.Group("/auth")
	auth.Get("/google", deps.AuthHandler.GoogleLogin)
	auth.Get("/google/callback", deps.AuthHandler.GoogleCallback)
	auth.Get("/username/check", deps.UsernameHandler.CheckAvailability) // public

	// Auth routes (protected)
	auth.Get("/me", authRequired, deps.AuthHandler.GetMe)
	auth.Post("/logout", authRequired, deps.AuthHandler.Logout)
	auth.Post("/username", authRequired, deps.UsernameHandler.ClaimUsername)

	// Creator routes (protected)
	creator := v1.Group("/creator")
	creator.Get("/profile", authRequired, deps.ProfileHandler.GetProfile)
	creator.Put("/profile", authRequired, deps.ProfileHandler.UpdateProfile)

	// 404 handler for unmatched routes
	app.Use(func(c *fiber.Ctx) error {
		return SendError(c, fiber.StatusNotFound,
			ErrNotFound, "Route not found", nil)
	})
}
