package http

import (
	"github.com/gofiber/fiber/v2"
)

// Response is the standardized JSON envelope for all API responses.
type Response struct {
	Data  interface{} `json:"data"`
	Meta  interface{} `json:"meta"`
	Error *ErrorBody  `json:"error"`
}

// ErrorBody represents the error portion of the API response envelope.
type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Standard error codes
const (
	ErrNotFound        = "ERR_NOT_FOUND"
	ErrBadRequest      = "ERR_BAD_REQUEST"
	ErrUnauthorized    = "ERR_UNAUTHORIZED"
	ErrForbidden       = "ERR_FORBIDDEN"
	ErrInternalServer  = "ERR_INTERNAL_SERVER"
	ErrValidation      = "ERR_VALIDATION"
	ErrConflict        = "ERR_CONFLICT"
	ErrTooManyRequests = "ERR_TOO_MANY_REQUESTS"
	ErrAccountBanned   = "ERR_ACCOUNT_BANNED"
	ErrStoreBanned     = "ERR_STORE_BANNED"
)

// SendSuccess sends a successful response with the standardized envelope.
func SendSuccess(c *fiber.Ctx, status int, data interface{}, meta interface{}) error {
	return c.Status(status).JSON(Response{
		Data:  data,
		Meta:  meta,
		Error: nil,
	})
}

// SendError sends an error response with the standardized envelope.
func SendError(c *fiber.Ctx, status int, code string, message string, details interface{}) error {
	return c.Status(status).JSON(Response{
		Data: nil,
		Meta: nil,
		Error: &ErrorBody{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

// SendOK is a shorthand for 200 success responses.
func SendOK(c *fiber.Ctx, data interface{}) error {
	return SendSuccess(c, fiber.StatusOK, data, nil)
}

// SendCreated is a shorthand for 201 created responses.
func SendCreated(c *fiber.Ctx, data interface{}) error {
	return SendSuccess(c, fiber.StatusCreated, data, nil)
}
