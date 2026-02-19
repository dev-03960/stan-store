package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestProductIntegration(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Create a test user (Creator)
	creatorID := primitive.NewObjectID()
	creatorToken := generateTestToken(t, creatorID.Hex(), "creator")

	// 2. Create another user (Attacker)
	attackerID := primitive.NewObjectID()
	attackerToken := generateTestToken(t, attackerID.Hex(), "creator")

	var createdProductID string

	t.Run("Create Product - Success", func(t *testing.T) {
		payload := map[string]interface{}{
			"title":           "My Workout PDF",
			"description":     "Lose fat in 30 days",
			"price":           49900, // ₹499
			"cover_image_url": "https://example.com/cover.jpg",
			"file_url":        "s3://bucket/file.pdf",
			"product_type":    "download",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "/api/v1/products", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Cookie", "stan_token="+creatorToken)

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		data := result["data"].(map[string]interface{})

		createdProductID = data["id"].(string)
		assert.Equal(t, "My Workout PDF", data["title"])
		assert.Equal(t, float64(49900), data["price"])
		assert.Equal(t, creatorID.Hex(), data["creator_id"])
	})

	t.Run("Create Product - Invalid Price", func(t *testing.T) {
		payload := map[string]interface{}{
			"title": "Cheap PDF",
			"price": 50, // Too low (< 100)
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "/api/v1/products", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Cookie", "stan_token="+creatorToken)

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Get Products - Success", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/products", nil)
		req.Header.Set("Cookie", "stan_token="+creatorToken)

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		data := result["data"].([]interface{})

		// Should have at least the one we created
		found := false
		for _, p := range data {
			prod := p.(map[string]interface{})
			if prod["id"] == createdProductID {
				found = true
				break
			}
		}
		assert.True(t, found)
	})

	t.Run("Update Product - Success", func(t *testing.T) {
		payload := map[string]interface{}{
			"title": "Updated Workout PDF",
			"price": 59900,
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("PUT", "/api/v1/products/"+createdProductID, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Cookie", "stan_token="+creatorToken)

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		data := result["data"].(map[string]interface{})

		assert.Equal(t, "Updated Workout PDF", data["title"])
		assert.Equal(t, float64(59900), data["price"])
	})

	t.Run("Update Product - Unauthorized (Ownership Check)", func(t *testing.T) {
		payload := map[string]interface{}{
			"title": "Hacked PDF",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("PUT", "/api/v1/products/"+createdProductID, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Cookie", "stan_token="+attackerToken) // Different user

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("Delete Product - Success", func(t *testing.T) {
		req, _ := http.NewRequest("DELETE", "/api/v1/products/"+createdProductID, nil)
		req.Header.Set("Cookie", "stan_token="+creatorToken)

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Verify deletion (soft delete, so should not return in GetProducts)
		// Or GetProductByID logic (not implemented in handler yet, only GetProducts list)
		// But FindAllByCreatorID excludes deleted.
	})

	t.Run("Verify Soft Delete", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/products", nil)
		req.Header.Set("Cookie", "stan_token="+creatorToken)

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		products := result["data"].([]interface{})

		found := false
		for _, p := range products {
			prod := p.(map[string]interface{})
			if prod["id"] == createdProductID {
				found = true
				break
			}
		}
		assert.False(t, found, "Deleted product should not be listed")
	})
}
