package http

import (
	"github.com/gofiber/fiber/v2"
)

// HealthResponse is the response body for the health check endpoint.
type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

// HealthHandler returns the health check handler.
func HealthHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return SendOK(c, HealthResponse{
			Status:  "ok",
			Version: "0.1.0",
		})
	}
}
