package http

import (
	"fmt"
	"runtime/debug"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/devanshbhargava/stan-store/pkg/logger"
)

// RequestID adds a unique request ID to each request via X-Request-Id header.
func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		requestID := c.Get("X-Request-Id")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("X-Request-Id", requestID)
		c.Locals("request_id", requestID)
		return c.Next()
	}
}

// RequestLogger logs each request with structured JSON output.
func RequestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		requestID, _ := c.Locals("request_id").(string)

		logger.Info("request",
			"method", c.Method(),
			"path", c.Path(),
			"status", c.Response().StatusCode(),
			"duration_ms", duration.Milliseconds(),
			"request_id", requestID,
			"ip", c.IP(),
		)

		return err
	}
}

// Recovery catches panics and returns a 500 error envelope.
func Recovery() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				stack := debug.Stack()
				requestID, _ := c.Locals("request_id").(string)

				logger.Error("panic recovered",
					"error", fmt.Sprintf("%v", r),
					"stack", string(stack),
					"request_id", requestID,
					"method", c.Method(),
					"path", c.Path(),
				)

				_ = SendError(c, fiber.StatusInternalServerError,
					ErrInternalServer, "An unexpected error occurred", nil)
			}
		}()
		return c.Next()
	}
}
