package email

import (
	"context"
	"fmt"
	"net/smtp"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

type SMTPEmailAdapter struct {
	host     string
	port     string
	user     string
	pass     string
	fromAddr string
}

func NewSMTPEmailAdapter(host, port, user, pass, fromAddr string) *SMTPEmailAdapter {
	return &SMTPEmailAdapter{
		host:     host,
		port:     port,
		user:     user,
		pass:     pass,
		fromAddr: fromAddr,
	}
}

func (s *SMTPEmailAdapter) SendOrderConfirmation(ctx context.Context, order *domain.Order, product *domain.Product, downloadURL string) error {
	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	// Simple HTML Template
	subject := fmt.Sprintf("Order Confirmation: %s", product.Title)
	body := fmt.Sprintf(`
		<h1>Thank you for your purchase, %s!</h1>
		<p>You have successfully purchased <strong>%s</strong>.</p>
		<p>Order ID: %s</p>
		<p>Amount Paid: %s %.2f</p>
		<br/>
		<h3><a href="%s">Download your product here</a></h3>
		<p>If the link above doesn't work, verify your order details on our website.</p>
		<br/>
		<p>Best,<br/>Stan Store Team</p>
	`, order.CustomerName, product.Title, order.ID.Hex(), order.Currency, float64(order.Amount)/100, downloadURL)

	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"From: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
		"\r\n"+
		"%s", order.CustomerEmail, s.fromAddr, subject, body))

	// In a real production app, we might use a worker queue or a more robust library.
	// For MVP/Story 5.2, net/smtp is sufficient.

	// Check if we are in mock mode (integration testing) to avoid finding real SMTP servers
	// This is a simple check, better would remain interface mocking, but sometimes helpful.
	if s.host == "mock" {
		fmt.Printf("Mock Email Sent to %s: %s\n", order.CustomerEmail, subject)
		return nil
	}

	if err := smtp.SendMail(addr, auth, s.fromAddr, []string{order.CustomerEmail}, msg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
