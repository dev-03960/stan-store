package http

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// RouterDeps holds dependencies needed by the router.
type RouterDeps struct {
	FrontendURL     string
	JWTService      *services.JWTService
	UserRepo        domain.UserRepository
	AuthHandler     *AuthHandler
	UsernameHandler *UsernameHandler
	ProfileHandler  *ProfileHandler
	ProductHandler  *ProductHandler
	UploadHandler   *UploadHandler
	StoreHandler    *StoreHandler
	PaymentHandler  *PaymentHandler
	OrderHandler    *OrderHandler
	WalletHandler   *WalletHandler
	AdminHandler    *AdminHandler
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
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Request-Id,X-Razorpay-Signature",
		AllowCredentials: true,
	}))

	// Auth middleware (reusable)
	authRequired := AuthRequired(deps.JWTService)
	banCheck := BanCheck(deps.UserRepo)

	// API v1 routes
	v1 := app.Group("/api/v1")
	v1.Get("/health", HealthHandler())

	// Auth routes (public)
	auth := v1.Group("/auth")
	auth.Get("/google", deps.AuthHandler.GoogleLogin)
	auth.Get("/google/callback", deps.AuthHandler.GoogleCallback)
	auth.Get("/username/check", deps.UsernameHandler.CheckAvailability) // public

	// Auth routes (protected)
	auth.Get("/me", authRequired, banCheck, deps.AuthHandler.GetMe)
	auth.Post("/logout", authRequired, deps.AuthHandler.Logout)
	auth.Post("/username", authRequired, banCheck, deps.UsernameHandler.ClaimUsername)

	// Creator routes (protected)
	creator := v1.Group("/creator")
	creator.Get("/profile", authRequired, banCheck, deps.ProfileHandler.GetProfile)
	creator.Put("/profile", authRequired, banCheck, deps.ProfileHandler.UpdateProfile)

	// Product routes (protected)
	products := v1.Group("/products")
	products.Use(authRequired, banCheck)
	products.Post("/", deps.ProductHandler.CreateProduct)
	products.Get("/", deps.ProductHandler.GetProducts)
	products.Put("/:id", deps.ProductHandler.UpdateProduct)
	products.Delete("/:id", deps.ProductHandler.DeleteProduct)
	products.Patch("/:id/visibility", deps.ProductHandler.UpdateVisibility)
	products.Patch("/reorder", deps.ProductHandler.ReorderProducts)

	// Upload routes (protected)
	uploads := v1.Group("/uploads")
	uploads.Use(authRequired, banCheck)
	uploads.Post("/presigned", deps.UploadHandler.GeneratePresignedURL)

	// Payment routes (protected/webhook)
	payments := v1.Group("/payments")
	payments.Post("/webhook", deps.PaymentHandler.HandleWebhook) // Public webhook
	payments.Post("/verify", deps.PaymentHandler.VerifyPayment)  // Public client-side verification
	// Protected settings routes
	payments.Get("/settings", authRequired, deps.PaymentHandler.GetSettings)
	payments.Put("/settings", authRequired, deps.PaymentHandler.UpdateSettings)

	// Order routes (Public/Customer)
	orders := v1.Group("/orders")
	orders.Post("/", deps.OrderHandler.CreateOrder)
	orders.Get("/:id", deps.OrderHandler.GetOrder)
	orders.Get("/:id/download", deps.OrderHandler.DownloadOrder)

	// Sales routes (Creator - Protected)
	sales := v1.Group("/sales")
	sales.Get("/", authRequired, banCheck, deps.OrderHandler.GetSalesHistory)

	// Wallet routes (Creator - Protected)
	wallet := v1.Group("/wallet")
	wallet.Get("/", authRequired, banCheck, deps.WalletHandler.GetWalletDetails)

	// Storefront routes (PUBLIC)
	store := v1.Group("/store")
	store.Get("/:username", deps.StoreHandler.GetStore)

	// Admin routes (Protected - Admin Role)
	admin := v1.Group("/admin")
	admin.Get("/metrics", authRequired, RoleRequired("admin"), deps.AdminHandler.GetMetrics)
	admin.Post("/creators/:id/ban", authRequired, RoleRequired("admin"), deps.AdminHandler.BanCreator)
	admin.Post("/creators/:id/unban", authRequired, RoleRequired("admin"), deps.AdminHandler.UnbanCreator)

	// 404 handler for unmatched routes
	app.Use(func(c *fiber.Ctx) error {
		return SendError(c, fiber.StatusNotFound,
			ErrNotFound, "Route not found", nil)
	})
}
