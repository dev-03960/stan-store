package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

func TestStorefrontIntegration(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Seed User
	userID := primitive.NewObjectID()
	username := "validuser"
	user := &domain.User{
		ID:          userID,
		Email:       "test@example.com",
		DisplayName: "Test Creator",
		Username:    username,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	seedUser(t, user)

	// 2. Seed Products (via API)
	// We need a token for this user
	token := generateTestToken(t, userID.Hex(), "creator")

	// Create 1 visible product
	reqBody1 := domain.Product{
		Title:       "Visible Product",
		Price:       1000,
		ProductType: "download",
		IsVisible:   true,
	}
	body1, _ := json.Marshal(reqBody1)
	req1 := httptest.NewRequest("POST", "/api/v1/products", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	req1.AddCookie(&http.Cookie{Name: "stan_token", Value: token})
	app.Test(req1)

	// Create 1 hidden product (Default is visible, so we create & then update or assume default true and we need to hide)
	// Actually Product struct default IsVisible is bool(false)? No, we handled Default=true in service.
	// Creating product sets IsVisible=true.
	// So we create, then toggle to false.
	reqBody2 := domain.Product{
		Title:       "Hidden Product",
		Price:       2000,
		ProductType: "download",
	}
	body2, _ := json.Marshal(reqBody2)
	req2 := httptest.NewRequest("POST", "/api/v1/products", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	req2.AddCookie(&http.Cookie{Name: "stan_token", Value: token})
	resp2, _ := app.Test(req2)

	// Get ID from resp2 to hide it
	var result2 map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&result2)
	data2 := result2["data"].(map[string]interface{})
	hiddenProductID := data2["id"].(string)

	// Hide it
	hideBody := map[string]bool{"is_visible": false}
	hideJson, _ := json.Marshal(hideBody)
	reqHide := httptest.NewRequest("PATCH", "/api/v1/products/"+hiddenProductID+"/visibility", bytes.NewReader(hideJson))
	reqHide.Header.Set("Content-Type", "application/json")
	reqHide.AddCookie(&http.Cookie{Name: "stan_token", Value: token})
	app.Test(reqHide)

	t.Run("Get_Store_Success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/store/"+username, nil)
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)

		data := result["data"].(map[string]interface{})
		creator := data["creator"].(map[string]interface{})
		products := data["products"].([]interface{})

		// Verify Creator
		assert.Equal(t, username, creator["username"])
		assert.Equal(t, "Test Creator", creator["displayName"])

		// Verify Products (Should only have 1 Visible)
		assert.Equal(t, 1, len(products))
		prod := products[0].(map[string]interface{})
		assert.Equal(t, "Visible Product", prod["title"])
	})

	t.Run("Get_Store_NotFound", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/store/nonexistentuser", nil)
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
}
