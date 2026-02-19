package domain

import (
	"context"
)

// EmailService defines the interface for sending emails.
type EmailService interface {
	// SendOrderConfirmation sends an email to the customer with purchase details and download link.
	SendOrderConfirmation(ctx context.Context, order *Order, product *Product, downloadURL string) error
}
