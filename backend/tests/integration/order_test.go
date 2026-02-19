package integration

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TestOrderFlow(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Setup Data: Creator, Product
	token, _ := createAuthenticatedUser(t)

	productReq := map[string]interface{}{
		"title":       "Test Ebook",
		"description": "A test ebook",
		"price":       1000, // 10.00 INR
		"type":        "download",
	}
	body, _ := json.Marshal(productReq)
	req := httptest.NewRequest("POST", "/api/v1/products", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, _ := app.Test(req)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var productResp struct {
		Data domain.Product `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&productResp)
	productID := productResp.Data.ID

	// 2. Test Create Order (Public/Customer)
	t.Run("Create_Order", func(t *testing.T) {
		orderReq := map[string]string{
			"product_id":     productID.Hex(),
			"customer_name":  "John Doe",
			"customer_email": "john@example.com",
		}
		body, _ := json.Marshal(orderReq)
		req := httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var orderResp struct {
			Data domain.Order `json:"data"`
		}
		json.NewDecoder(resp.Body).Decode(&orderResp)

		assert.NotEmpty(t, orderResp.Data.ID)
		assert.Equal(t, "order_mock_123456", orderResp.Data.RazorpayOrderID)
		assert.Equal(t, domain.OrderStatusCreated, orderResp.Data.Status)
		assert.Equal(t, int64(1000), orderResp.Data.Amount)
	})

	// 3. Test Webhook (Payment Success)
	t.Run("Webhook_Payment_Success", func(t *testing.T) {
		// Construct Webhook Payload
		payload := map[string]interface{}{
			"event": "order.paid",
			"payload": map[string]interface{}{
				"payment": map[string]interface{}{
					"entity": map[string]interface{}{
						"id":       "pay_mock_987654",
						"order_id": "order_mock_123456",
					},
				},
			},
		}
		jsonBody, _ := json.Marshal(payload)
		bodyStr := string(jsonBody)

		// Generate Signature
		secret := "test_webhook_secret"
		signature := generateWebhookSignature(t, bodyStr, secret)

		req := httptest.NewRequest("POST", "/api/v1/payments/webhook", bytes.NewReader(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Razorpay-Signature", signature)

		resp, _ := app.Test(req)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Verify Order Updated in DB
		mongoURI := "mongodb://127.0.0.1:27017"
		client, _ := mongodbConnect(mongoURI)
		defer client.Disconnect(context.Background())
		coll := client.Database("stanstore_test").Collection("orders")

		var order domain.Order
		err := coll.FindOne(context.Background(), bson.M{"razorpay_order_id": "order_mock_123456"}).Decode(&order)
		assert.NoError(t, err)
		assert.Equal(t, domain.OrderStatusPaid, order.Status)
		assert.Equal(t, "pay_mock_987654", order.RazorpayPaymentID)
	})

	// 4. Test Webhook (Invalid Signature)
	t.Run("Webhook_Invalid_Signature", func(t *testing.T) {
		bodyStr := "{}"
		req := httptest.NewRequest("POST", "/api/v1/payments/webhook", bytes.NewReader([]byte(bodyStr)))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Razorpay-Signature", "invalid_signature")

		resp, _ := app.Test(req)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

// Helper for DB access in test
func mongodbConnect(uri string) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return mongo.Connect(ctx, options.Client().ApplyURI(uri))
}

func generateWebhookSignature(t *testing.T, body string, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(body))
	return hex.EncodeToString(h.Sum(nil))
}
