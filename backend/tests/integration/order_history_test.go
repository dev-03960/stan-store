package integration

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/stretchr/testify/assert"
)

func TestOrderHistory(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Create Creator
	token, creator := createAuthenticatedUser(t)
	creatorID := creator.ID

	// 2. Create Product (via API)
	createProductPayload := map[string]interface{}{
		"title":       "History Product",
		"description": "Desc",
		"price":       1000,
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

	// 3. Create Orders (Public API)
	// Order 1
	createOrderPayload := map[string]interface{}{
		"product_id":     productID.Hex(),
		"customer_name":  "Customer 1",
		"customer_email": "c1@example.com",
	}
	body, _ = json.Marshal(createOrderPayload)
	req = NewRequest("POST", "/api/v1/orders", body)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	// Order 2
	req = NewRequest("POST", "/api/v1/orders", body)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	// 4. Fetch Sales History (Creator API)
	req = NewRequest("GET", "/api/v1/sales", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var historyResp struct {
		Data []domain.Order `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&historyResp)

	// 5. Assertions
	assert.Len(t, historyResp.Data, 2)
	assert.Equal(t, productID, historyResp.Data[0].ProductID)
	assert.Equal(t, creatorID, historyResp.Data[0].CreatorID)
}
