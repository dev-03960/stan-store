package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"

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

	// 5. Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	authService := services.NewAuthService(userRepo, jwtService)
	usernameService := services.NewUsernameService(userRepo)
	profileService := services.NewProfileService(userRepo)

	// 6. Initialize handlers
	authHandler := httpAdapter.NewAuthHandler(
		authService,
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleRedirectURL,
	)
	usernameHandler := httpAdapter.NewUsernameHandler(usernameService)
	profileHandler := httpAdapter.NewProfileHandler(profileService)

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
		AuthHandler:     authHandler,
		UsernameHandler: usernameHandler,
		ProfileHandler:  profileHandler,
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
