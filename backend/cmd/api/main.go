package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"

	"github.com/devanshbhargava/stan-store/internal/adapters/email"
	httpAdapter "github.com/devanshbhargava/stan-store/internal/adapters/http"
	"github.com/devanshbhargava/stan-store/internal/adapters/storage"
	"github.com/devanshbhargava/stan-store/internal/config"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

func main() {
	// 1. Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", "error", err.Error())
	}

	logger.Info("config loaded", "port", cfg.Port)

	// 2. Connect to MongoDB
	mongoDB, err := storage.ConnectMongoDB(cfg.MongoURI, "stanstore")
	if err != nil {
		logger.Fatal("failed to connect to mongodb", "error", err.Error())
	}

	// 3. Connect to Redis (graceful degradation — warns on failure, doesn't crash)
	redisClient := storage.ConnectRedis(cfg.RedisURL)
	cache := storage.NewRedisCache(redisClient)
	_ = cache // Will be passed to services in later stories

	// 4. Initialize repositories
	userRepo := storage.NewMongoUserRepository(mongoDB)
	productRepo := storage.NewMongoProductRepository(mongoDB)
	orderRepo := storage.NewMongoOrderRepository(mongoDB.Database)

	// 5. Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	authService := services.NewAuthService(userRepo, jwtService)
	usernameService := services.NewUsernameService(userRepo)
	profileService := services.NewProfileService(userRepo)
	productService := services.NewProductService(productRepo)
	storeService := services.NewStoreService(userRepo, productRepo)

	// Convert *MongoDB to *mongo.Database if needed, or update repo constructor.
	paymentRepo := storage.NewMongoPaymentRepository(mongoDB.Database)
	paymentService := services.NewPaymentService(paymentRepo, cfg)

	// ... (S3 storage init) ...
	fileStorage, err := storage.NewS3Storage(
		cfg.R2AccountID,
		cfg.R2AccessKeyID,
		cfg.R2SecretAccessKey,
		cfg.R2BucketName,
		cfg.R2Endpoint,
	)
	if err != nil {
		logger.Error("failed to initialize s3 storage", "error", err.Error())
		// non-fatal for now to allow app to start even if storage is misconfigured (unless it's critical)
	}

	uploadService := services.NewUploadService(fileStorage)

	// Initialize Email Service
	emailAdapter := email.NewSMTPEmailAdapter(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUser,
		cfg.SMTPPass,
		cfg.SMTPFrom,
	)

	// Initialize Wallet Service
	transactionRepo := storage.NewMongoTransactionRepository(mongoDB.Database)
	walletService := services.NewWalletService(transactionRepo)

	orderService := services.NewOrderService(orderRepo, productRepo, paymentService, uploadService, walletService, emailAdapter)
	uploadHandler := httpAdapter.NewUploadHandler(uploadService)

	// 6. Initialize handlers
	authHandler := httpAdapter.NewAuthHandler(
		authService,
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleRedirectURL,
		cfg.FrontendURL,
	)
	usernameHandler := httpAdapter.NewUsernameHandler(usernameService)
	profileHandler := httpAdapter.NewProfileHandler(profileService)
	productHandler := httpAdapter.NewProductHandler(productService)
	storeHandler := httpAdapter.NewStoreHandler(storeService)
	// Pass OrderService and Webhook Secret
	paymentHandler := httpAdapter.NewPaymentHandler(paymentService, orderService, cfg.RazorpayWebhookSecret)
	orderHandler := httpAdapter.NewOrderHandler(orderService)
	walletHandler := httpAdapter.NewWalletHandler(walletService)

	adminService := services.NewAdminService(userRepo, transactionRepo, orderRepo)
	adminHandler := httpAdapter.NewAdminHandler(adminService)

	// 7. Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:               "Stan-store API v0.1.0",
		DisableStartupMessage: true,
		ErrorHandler:          globalErrorHandler,
	})

	// 8. Setup routes and middleware
	httpAdapter.SetupRouter(app, &httpAdapter.RouterDeps{
		FrontendURL:     cfg.FrontendURL,
		JWTService:      jwtService,
		UserRepo:        userRepo,
		AuthHandler:     authHandler,
		UsernameHandler: usernameHandler,
		ProfileHandler:  profileHandler,

		ProductHandler: productHandler,
		UploadHandler:  uploadHandler,
		StoreHandler:   storeHandler,
		PaymentHandler: paymentHandler,
		OrderHandler:   orderHandler,
		WalletHandler:  walletHandler,
		AdminHandler:   adminHandler,
	})

	// 9. Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		logger.Info("shutdown signal received, shutting down gracefully...")

		if err := app.Shutdown(); err != nil {
			logger.Error("fiber shutdown error", "error", err.Error())
		}

		mongoDB.Disconnect()
		redisClient.Disconnect()

		logger.Info("shutdown complete")
	}()

	// 10. Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	logger.Info("server starting", "address", addr)

	if err := app.Listen(addr); err != nil {
		logger.Fatal("server failed to start", "error", err.Error())
	}
}

// globalErrorHandler handles Fiber-level errors and wraps them in the standard envelope.
func globalErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "An unexpected error occurred"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	errCode := httpAdapter.ErrInternalServer
	switch code {
	case fiber.StatusNotFound:
		errCode = httpAdapter.ErrNotFound
	case fiber.StatusBadRequest:
		errCode = httpAdapter.ErrBadRequest
	case fiber.StatusUnauthorized:
		errCode = httpAdapter.ErrUnauthorized
	case fiber.StatusForbidden:
		errCode = httpAdapter.ErrForbidden
	case fiber.StatusTooManyRequests:
		errCode = httpAdapter.ErrTooManyRequests
	}

	logger.Error("request error",
		"status", code,
		"error", message,
		"path", c.Path(),
	)

	return httpAdapter.SendError(c, code, errCode, message, nil)
}
