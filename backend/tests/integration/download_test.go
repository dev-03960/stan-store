package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestDownloadFlow(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Setup Data: Creator, Product (Downloadable)
	token, _ := createAuthenticatedUser(t)

	productReq := map[string]interface{}{
		"title":       "Ebook For Download",
		"description": "Best ebook ever",
		"price":       500,
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

	// Manually set FileURL in DB since API doesn't upload file in valid flow without S3
	mongoURI := "mongodb://127.0.0.1:27017"
	client, _ := mongodbConnect(mongoURI)
	defer client.Disconnect(context.Background())
	prodColl := client.Database("stanstore_test").Collection("products")
	_, err := prodColl.UpdateOne(context.TODO(), bson.M{"_id": productID}, bson.M{"$set": bson.M{"file_url": "creators/123/products/files/ebook.pdf"}})
	assert.NoError(t, err)

	// 2. Create Order & Mark Paid
	orderReq := map[string]string{
		"product_id":     productID.Hex(),
		"customer_name":  "Jane Doe",
		"customer_email": "jane@example.com",
	}
	body, _ = json.Marshal(orderReq)
	req = httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ = app.Test(req)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var orderResp struct {
		Data domain.Order `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&orderResp)
	orderID := orderResp.Data.ID

	// Mark as PAID directly in DB
	orderColl := client.Database("stanstore_test").Collection("orders")
	_, err = orderColl.UpdateOne(context.TODO(), bson.M{"_id": orderID}, bson.M{"$set": bson.M{"status": domain.OrderStatusPaid}})
	assert.NoError(t, err)

	// 3. Test Download Endpoint (Success)
	req = httptest.NewRequest("GET", "/api/v1/orders/"+orderID.Hex()+"/download", nil)
	resp, _ = app.Test(req)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var downloadResp struct {
		Data map[string]string `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&downloadResp)

	assert.Contains(t, downloadResp.Data["download_url"], "https://mock-r2-bucket.r2.cloudflarestorage.com/")
	assert.Contains(t, downloadResp.Data["download_url"], "creators/123/products/files/ebook.pdf")
	assert.Contains(t, downloadResp.Data["download_url"], "signature=mock_download")

	// 4. Test Download Endpoint (Not Paid) - create another order
	req = httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ = app.Test(req)
	var unpaidOrderResp struct {
		Data domain.Order `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&unpaidOrderResp)
	unpaidOrderID := unpaidOrderResp.Data.ID

	req = httptest.NewRequest("GET", "/api/v1/orders/"+unpaidOrderID.Hex()+"/download", nil)
	resp, _ = app.Test(req)
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
}
