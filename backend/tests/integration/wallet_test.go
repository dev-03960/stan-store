package integration

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/stretchr/testify/assert"
)

func TestWalletFlow(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Create Creator
	// 1. Create Creator
	token, _ := createAuthenticatedUser(t)

	// 2. Create Product (via API or Helper if available)
	// We use API to be safe
	createProductPayload := map[string]interface{}{
		"title":       "Wallet Product",
		"description": "Earns Money",
		"price":       1000, // 10.00 INR
		"type":        "digital_download",
		"file_url":    "http://example.com/file",
	}
	body, _ := json.Marshal(createProductPayload)
	req := NewRequest("POST", "/api/v1/products", body)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var productResp struct {
		Data domain.Product `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&productResp)
	productID := productResp.Data.ID

	// 3. Create Order
	createOrderPayload := map[string]interface{}{
		"product_id":     productID.Hex(),
		"customer_name":  "Wallet Customer",
		"customer_email": "wc@example.com",
	}
	body, _ = json.Marshal(createOrderPayload)
	req = NewRequest("POST", "/api/v1/orders", body)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var orderResp struct {
		Data domain.Order `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&orderResp)
	razorpayOrderID := orderResp.Data.RazorpayOrderID

	// 4. Check Start Balance (Should be 0)
	req = NewRequest("GET", "/api/v1/wallet", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var walletResp struct {
		Data struct {
			Balance      int64                `json:"balance"`
			Transactions []domain.Transaction `json:"transactions"`
		} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&walletResp)
	assert.Equal(t, int64(0), walletResp.Data.Balance)
	assert.Empty(t, walletResp.Data.Transactions)

	// 5. Pay Order (Webhook Simulation)
	// This should trigger wallet credit
	webhookPayload := map[string]interface{}{
		"event": "order.paid",
		"payload": map[string]interface{}{
			"payment": map[string]interface{}{
				"entity": map[string]interface{}{
					"id":       "pay_wallet_123",
					"order_id": razorpayOrderID,
					"status":   "captured",
				},
			},
		},
	}
	body, _ = json.Marshal(webhookPayload)
	req = NewRequest("POST", "/api/v1/payments/webhook", body)
	// Add Signature if validation enabled (Test setup has mock config "test_webhook_secret")
	// Calculate signature? Or maybe mock disables it?
	// The `PaymentService.VerifyWebhookSignature` uses generic HMAC.
	// Let's assume we need to pass headers.
	// Actually, `setup_test.go` initializes `PaymentService` with mock config.
	// But `VerifyWebhookSignature` implements real HMAC check.
	// So we need to generate valid signature.
	// See `hmac` package.
	// "test_webhook_secret" is the key.
	// Signature = HMAC_SHA256(body, secret)
	// Import "crypto/hmac", "crypto/sha256", "encoding/hex"

	req.Header.Set("X-Razorpay-Signature", generateSignature(t, body, "test_webhook_secret"))
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Allow async goroutine (email) to allow potential race?
	// Wallet credit is synchronous in our implementation, so it should be immediate.

	// 6. Verify Wallet Balance (Should be 1000)
	req = NewRequest("GET", "/api/v1/wallet", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	json.NewDecoder(resp.Body).Decode(&walletResp)
	assert.Equal(t, int64(1000), walletResp.Data.Balance)
	assert.Len(t, walletResp.Data.Transactions, 1)
	assert.Equal(t, int64(1000), walletResp.Data.Transactions[0].Amount)
	assert.Equal(t, domain.TransactionTypeCredit, walletResp.Data.Transactions[0].Type)
	assert.Equal(t, domain.TransactionSourceOrder, walletResp.Data.Transactions[0].Source)
}

// Need imports for signature generation

func generateSignature(t *testing.T, body []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	return hex.EncodeToString(h.Sum(nil))
}
