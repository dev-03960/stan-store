package http

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// RouterDeps holds dependencies needed by the router.
type RouterDeps struct {
	FrontendURL           string
	JWTService            *services.JWTService
	UserRepo              domain.UserRepository
	AuthHandler           *AuthHandler
	UsernameHandler       *UsernameHandler
	ProfileHandler        *ProfileHandler
	ProductHandler        *ProductHandler
	UploadHandler         *UploadHandler
	StoreHandler          *StoreHandler
	PaymentHandler        *PaymentHandler
	OrderHandler          *OrderHandler
	WalletHandler         *WalletHandler
	AdminHandler          *AdminHandler
	BuyerHandler          *BuyerHandler
	PayoutHandler         *PayoutHandler
	SubscriberHandler     *SubscriberHandler
	CouponHandler         *CouponHandler
	BookingHandler        *BookingHandler
	CourseHandler         *CourseHandler
	AIHandler             *AIHandler
	EmailTemplateHandler  *EmailTemplateHandler
	CampaignHandler       *CampaignHandler
	TestimonialHandler    *TestimonialHandler
	InstagramHandler      *InstagramHandler
	GoogleCalendarHandler *GoogleCalendarHandler
	AffiliateHandler      *AffiliateHandler
	AnalyticsHandler      *AnalyticsHandler
	NewsletterHandler     *NewsletterHandler
	BlogHandler           *BlogHandler
	WorkerService         *services.WorkerService
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

	// Generalized limit reached handler for 429
	limitReachedHandler := func(c *fiber.Ctx) error {
		c.Set("Retry-After", "60")
		return SendError(c, fiber.StatusTooManyRequests, "ERR_TOO_MANY_REQUESTS", "Rate limit exceeded", nil)
	}

	// Analytics routes (public, rate limited)
	v1.Post("/analytics/events", limiter.New(limiter.Config{
		Max:          100,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
	}), deps.AnalyticsHandler.TrackEvent)

	// Auth routes (public)
	auth := v1.Group("/auth")
	auth.Get("/google", deps.AuthHandler.GoogleLogin)
	auth.Get("/google/callback", deps.AuthHandler.GoogleCallback)
	auth.Get("/username/check", deps.UsernameHandler.CheckAvailability) // public

	// Buyer auth routes (public)
	buyerAuth := auth.Group("/buyer")
	buyerAuth.Get("/google", deps.AuthHandler.BuyerGoogleLogin)
	buyerAuth.Post("/magic-link", deps.AuthHandler.BuyerMagicLinkRequest)
	buyerAuth.Get("/verify", deps.AuthHandler.BuyerMagicLinkVerify)

	// Creator email/password auth routes (public, rate limited)
	creatorAuth := auth.Group("/creator")
	creatorAuth.Post("/signup", limiter.New(limiter.Config{
		Max:          5,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
	}), deps.AuthHandler.CreatorSignup)
	creatorAuth.Post("/verify-otp", limiter.New(limiter.Config{
		Max:          10,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
	}), deps.AuthHandler.CreatorVerifyOTP)
	creatorAuth.Post("/login", limiter.New(limiter.Config{
		Max:          10,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
	}), deps.AuthHandler.CreatorLogin)

	// Buyer functionality routes (protected)
	buyer := v1.Group("/buyer")
	buyer.Get("/purchases", authRequired, RoleRequired("buyer"), deps.BuyerHandler.GetPurchases)

	// Auth routes (protected)
	auth.Get("/me", authRequired, banCheck, deps.AuthHandler.GetMe)
	auth.Post("/logout", authRequired, deps.AuthHandler.Logout)
	auth.Post("/username", authRequired, banCheck, deps.UsernameHandler.ClaimUsername)

	// Creator routes (protected)
	creator := v1.Group("/creator")
	creator.Get("/profile", authRequired, banCheck, deps.ProfileHandler.GetProfile)
	creator.Put("/profile", authRequired, banCheck, deps.ProfileHandler.UpdateProfile)
	creator.Post("/payout-settings", authRequired, banCheck, deps.PayoutHandler.SavePayoutSettings)
	creator.Get("/payout-settings", authRequired, banCheck, deps.PayoutHandler.GetPayoutSettings)

	// Concurrency limiter for withdrawals
	var withdrawMu sync.Map
	preventConcurrentWithdrawals := func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*domain.User)
		if !ok || user == nil {
			return c.Next()
		}
		uid := user.ID.Hex()
		if _, loaded := withdrawMu.LoadOrStore(uid, true); loaded {
			return SendError(c, fiber.StatusTooManyRequests, "ERR_CONCURRENT", "Withdrawal already in progress", nil)
		}
		defer withdrawMu.Delete(uid)
		return c.Next()
	}
	creator.Post("/payouts/withdraw", authRequired, banCheck, preventConcurrentWithdrawals, deps.PayoutHandler.WithdrawFunds)

	creator.Get("/payouts", authRequired, banCheck, deps.PayoutHandler.GetPayoutHistory)
	creator.Get("/payouts/balance", authRequired, banCheck, deps.PayoutHandler.GetBalance)
	creator.Get("/subscribers", authRequired, banCheck, deps.SubscriberHandler.GetSubscribers)
	if deps.NewsletterHandler != nil {
		creator.Post("/newsletter", authRequired, banCheck, deps.NewsletterHandler.SendNewsletter)
	}
	creator.Get("/analytics", authRequired, banCheck, deps.AnalyticsHandler.GetDashboardMetrics)

	creator.Get("/email-templates/:type", authRequired, banCheck, deps.EmailTemplateHandler.GetTemplate)
	creator.Put("/email-templates/:type", authRequired, banCheck, deps.EmailTemplateHandler.UpdateTemplate)

	creator.Post("/campaigns", authRequired, banCheck, deps.CampaignHandler.CreateCampaign)
	creator.Get("/campaigns", authRequired, banCheck, deps.CampaignHandler.GetCampaigns)
	creator.Patch("/campaigns/:id", authRequired, banCheck, deps.CampaignHandler.UpdateCampaignStatus)

	// Instagram Creator Automations (protected)
	creator.Get("/automations/instagram", authRequired, banCheck, deps.InstagramHandler.GetAutomations)
	creator.Post("/automations/instagram", authRequired, banCheck, limiter.New(limiter.Config{
		Max:          50,
		Expiration:   24 * time.Hour,
		LimitReached: limitReachedHandler,
		KeyGenerator: func(c *fiber.Ctx) string {
			if user, ok := c.Locals("user").(*domain.User); ok && user != nil {
				return "ig:" + user.ID.Hex()
			}
			return c.IP()
		},
	}), deps.InstagramHandler.CreateAutomation)
	creator.Delete("/automations/instagram/:id", authRequired, banCheck, deps.InstagramHandler.DeleteAutomation)

	// Affiliate Protected Routes
	creator.Post("/products/:id/affiliates", deps.AffiliateHandler.EnableAffiliate)
	creator.Get("/affiliates", deps.AffiliateHandler.GetCreatorAffiliates)

	// Coupon routes (protected)
	coupons := v1.Group("/coupons", authRequired, banCheck)
	coupons.Post("/", deps.CouponHandler.CreateCoupon)
	coupons.Get("/", deps.CouponHandler.GetCoupons)
	coupons.Patch("/:id", deps.CouponHandler.UpdateCoupon)
	coupons.Delete("/:id", deps.CouponHandler.DeleteCoupon)

	// Coupon validation (public — called from storefront)
	v1.Post("/coupons/validate", limiter.New(limiter.Config{
		Max:          20,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
	}), deps.CouponHandler.ValidateCoupon)

	// Product slots route (public - called from storefront)
	v1.Get("/products/:id/slots", deps.BookingHandler.GetSlots)

	// Course structure route (requires auth to check if buyer actually bought it)
	v1.Get("/products/:id/course", authRequired, banCheck, deps.CourseHandler.GetCourse)

	// Public Testimonials route (called from storefront)
	v1.Get("/products/:id/testimonials", deps.TestimonialHandler.GetPublic)

	// Product routes (protected)
	products := v1.Group("/products")
	products.Use(authRequired, banCheck)
	products.Post("/", deps.ProductHandler.CreateProduct)
	products.Get("/", deps.ProductHandler.GetProducts)
	products.Put("/:id", deps.ProductHandler.UpdateProduct)
	products.Delete("/:id", deps.ProductHandler.DeleteProduct)
	products.Patch("/:id/visibility", deps.ProductHandler.UpdateVisibility)
	products.Put("/:id/bump", deps.ProductHandler.UpdateBumpConfig)
	products.Patch("/reorder", deps.ProductHandler.ReorderProducts)

	// Protected testimonial sub-routes
	products.Post("/:id/testimonials", deps.TestimonialHandler.Create)
	products.Put("/:id/testimonials/:tid", deps.TestimonialHandler.Update)
	products.Delete("/:id/testimonials/:tid", deps.TestimonialHandler.Delete)
	products.Patch("/:id/testimonials/reorder", deps.TestimonialHandler.Reorder)

	// Course sub-routes (nested under products)
	// GET course structure is public if checking permissions inside handler, or we can make it public
	// Actually we should place GET /api/v1/products/:id/course outside auth checks if buyers need to see it,
	// but the handler uses `user` context. Let's put it outside the protected `products` group.

	// Protected Course CRUD routes
	products.Post("/:id/course/modules", deps.CourseHandler.CreateModule)

	// Integrations (protected)
	integrations := v1.Group("/integrations")
	integrations.Get("/instagram/oauth/url", authRequired, banCheck, deps.InstagramHandler.GetOAuthURL)
	integrations.Get("/instagram/connection", authRequired, banCheck, deps.InstagramHandler.GetConnection)
	integrations.Delete("/instagram/connection", authRequired, banCheck, deps.InstagramHandler.Disconnect)

	// Integrations (public / callbacks)
	v1.Get("/integrations/instagram/oauth/callback", deps.InstagramHandler.OAuthCallback)
	v1.Get("/integrations/instagram/webhook", deps.InstagramHandler.VerifyWebhook)
	v1.Post("/integrations/instagram/webhook", deps.InstagramHandler.HandleWebhook)

	// Google Calendar Integration (protected)
	if deps.GoogleCalendarHandler != nil {
		integrations.Get("/google-calendar/oauth/url", authRequired, banCheck, deps.GoogleCalendarHandler.GetOAuthURL)
		integrations.Get("/google-calendar/connection", authRequired, banCheck, deps.GoogleCalendarHandler.GetConnection)
		integrations.Delete("/google-calendar/connection", authRequired, banCheck, deps.GoogleCalendarHandler.Disconnect)
		v1.Get("/integrations/google-calendar/oauth/callback", deps.GoogleCalendarHandler.OAuthCallback)
	}

	// Affiliates (public)
	affiliates := v1.Group("/affiliates")
	affiliates.Post("/register", limiter.New(limiter.Config{
		Max:          5,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
	}), deps.AffiliateHandler.RegisterAffiliate)
	affiliates.Get("/my-stats", deps.AffiliateHandler.GetMyStats)
	affiliates.Post("/track", deps.AffiliateHandler.TrackClick)

	products.Put("/:id/course/modules/:modId", deps.CourseHandler.UpdateModule)
	products.Delete("/:id/course/modules/:modId", deps.CourseHandler.DeleteModule)
	products.Post("/:id/course/modules/:modId/lessons", deps.CourseHandler.CreateLesson)
	products.Put("/:id/course/modules/:modId/lessons/:lesId", deps.CourseHandler.UpdateLesson)
	products.Delete("/:id/course/modules/:modId/lessons/:lesId", deps.CourseHandler.DeleteLesson)
	products.Put("/:id/course/reorder", deps.CourseHandler.ReorderStructure)

	// Booking routes (protected)
	bookings := v1.Group("/bookings", authRequired, banCheck)
	bookings.Post("/:id/cancel", deps.BookingHandler.CancelBooking)

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
	orders.Post("/", limiter.New(limiter.Config{
		Max:          10,
		Expiration:   1 * time.Minute,
		LimitReached: limitReachedHandler,
		KeyGenerator: func(c *fiber.Ctx) string {
			var body struct {
				CustomerEmail string `json:"customer_email"`
			}
			if err := json.Unmarshal(c.Body(), &body); err == nil && body.CustomerEmail != "" {
				return "order:" + body.CustomerEmail
			}
			return "order:" + c.IP()
		},
	}), deps.OrderHandler.CreateOrder)
	orders.Get("/:id", deps.OrderHandler.GetOrder)
	orders.Get("/:id/download", deps.OrderHandler.DownloadOrder)

	// AI routes (Protected)
	if deps.AIHandler != nil {
		v1.Post("/ai/generate-copy", authRequired, banCheck, limiter.New(limiter.Config{
			Max:          10,
			Expiration:   24 * time.Hour,
			LimitReached: limitReachedHandler,
			KeyGenerator: func(c *fiber.Ctx) string {
				if user, ok := c.Locals("user").(*domain.User); ok && user != nil {
					return "ai:" + user.ID.Hex()
				}
				return c.IP()
			},
		}), deps.AIHandler.GenerateCopy)
	}

	// Sales routes (Creator - Protected)
	sales := v1.Group("/sales")
	sales.Get("/", authRequired, banCheck, deps.OrderHandler.GetSalesHistory)

	// Wallet routes (Creator - Protected)
	wallet := v1.Group("/wallet")
	wallet.Get("/", authRequired, banCheck, deps.WalletHandler.GetWalletDetails)

	// Storefront routes (PUBLIC)
	store := v1.Group("/store")
	store.Get("/:username", deps.StoreHandler.GetStore)

	// Blog routes (PUBLIC)
	blogs := v1.Group("/blogs")
	blogs.Get("/", deps.BlogHandler.GetPublicBlogs)
	blogs.Get("/:slug", deps.BlogHandler.GetBlogBySlug)

	// Admin routes (Protected - Admin Role)
	admin := v1.Group("/admin")
	admin.Get("/metrics", authRequired, RoleRequired("admin"), deps.AdminHandler.GetMetrics)
	admin.Post("/creators/:id/ban", authRequired, RoleRequired("admin"), deps.AdminHandler.BanCreator)
	admin.Post("/creators/:id/unban", authRequired, RoleRequired("admin"), deps.AdminHandler.UnbanCreator)
	admin.Get("/cache/stats", authRequired, RoleRequired("admin"), deps.AdminHandler.GetCacheStats)
	if deps.WorkerService != nil {
		admin.Get("/jobs/stats", authRequired, RoleRequired("admin"), deps.AdminHandler.GetJobStats)
	}
	admin.Get("/webhooks/stats", authRequired, RoleRequired("admin"), deps.AdminHandler.GetWebhookStats)

	// Blog Admin routes
	admin.Get("/blogs", authRequired, RoleRequired("admin"), deps.BlogHandler.AdminListBlogs)
	admin.Post("/blogs", authRequired, RoleRequired("admin"), deps.BlogHandler.CreateBlog)
	admin.Get("/blogs/:id", authRequired, RoleRequired("admin"), deps.BlogHandler.GetBlogByID)
	admin.Put("/blogs/:id", authRequired, RoleRequired("admin"), deps.BlogHandler.UpdateBlog)
	admin.Delete("/blogs/:id", authRequired, RoleRequired("admin"), deps.BlogHandler.DeleteBlog)

	// Protected buyer routes (with CSRF protection for state-changing endpoints)
	buyers := v1.Group("/buyer", authRequired, banCheck, CsrfProtection())
	buyers.Get("/orders", deps.BuyerHandler.GetPurchases)
	buyers.Get("/courses/:id", deps.CourseHandler.GetCourse)
	buyers.Get("/subscriptions", deps.BuyerHandler.GetSubscriptions)
	buyers.Post("/subscriptions/:id/cancel", deps.BuyerHandler.CancelSubscription)

	// 404 handler for unmatched routes
	app.Use(func(c *fiber.Ctx) error {
		return SendError(c, fiber.StatusNotFound,
			ErrNotFound, "Route not found", nil)
	})
}
