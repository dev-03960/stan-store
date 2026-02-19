package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/stretchr/testify/assert"
)

func TestPaymentSettings(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Create and Login User
	token, user := createAuthenticatedUser(t)

	t.Run("Get Default Settings", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/payments/settings", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		resp, _ := app.Test(req)

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data  domain.PaymentSettings `json:"data"`
			Error *interface{}           `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&response)

		if response.Error != nil {
			t.Logf("Response failed: %+v", response)
		}

		assert.Nil(t, response.Error)
		assert.Equal(t, user.ID, response.Data.UserID)
		assert.False(t, response.Data.Enabled) // Default should be false
		assert.Equal(t, "INR", response.Data.Currency)
	})

	t.Run("Update Settings", func(t *testing.T) {
		payload := map[string]interface{}{
			"enabled": true,
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/v1/payments/settings", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		resp, _ := app.Test(req)

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data  domain.PaymentSettings `json:"data"`
			Error *interface{}           `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&response)

		assert.Nil(t, response.Error)
		assert.True(t, response.Data.Enabled)
	})

	t.Run("Get Updated Settings", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/payments/settings", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		resp, _ := app.Test(req)

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data  domain.PaymentSettings `json:"data"`
			Error *interface{}           `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&response)

		assert.True(t, response.Data.Enabled)
	})
}
