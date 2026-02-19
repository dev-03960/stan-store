package integration

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

func TestCreatorBanAndModerationFlow(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// === SETUP: Create a Creator ===
	creatorID := primitive.NewObjectID()
	creator := &domain.User{
		ID:          creatorID,
		Email:       "ban_test_creator@example.com",
		DisplayName: "Ban Test Creator",
		Username:    "bantestcreator",
		GoogleID:    "ban_google_" + creatorID.Hex(),
		Role:        domain.RoleCreator,
		Status:      domain.UserStatusActive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	seedUser(t, creator)
	creatorToken := generateTestToken(t, creatorID.Hex(), domain.RoleCreator)

	// === SETUP: Create an Admin ===
	adminID := primitive.NewObjectID()
	admin := &domain.User{
		ID:          adminID,
		Email:       "moderation_admin@stan.store",
		DisplayName: "Moderation Admin",
		GoogleID:    "admin_google_" + adminID.Hex(),
		Role:        domain.RoleAdmin,
		Status:      domain.UserStatusActive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	seedUser(t, admin)
	adminToken := generateTestToken(t, adminID.Hex(), domain.RoleAdmin)

	// ──────────────────────────────────────────────
	// TEST 1: Non-admin cannot ban a creator → 403
	// ──────────────────────────────────────────────
	t.Run("Non-admin cannot ban a creator", func(t *testing.T) {
		body := []byte(`{"reason":"Spam content"}`)
		req := NewRequest(http.MethodPost, "/api/v1/admin/creators/"+creatorID.Hex()+"/ban", body)
		req.Header.Set("Authorization", "Bearer "+creatorToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	// ──────────────────────────────────────────────
	// TEST 2: Admin can ban a creator → 200
	// ──────────────────────────────────────────────
	t.Run("Admin can ban a creator", func(t *testing.T) {
		body := []byte(`{"reason":"Policy violation - spam content"}`)
		req := NewRequest(http.MethodPost, "/api/v1/admin/creators/"+creatorID.Hex()+"/ban", body)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data struct {
				Message string `json:"message"`
			} `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, "Creator banned successfully", response.Data.Message)
	})

	// ──────────────────────────────────────────────
	// TEST 3: Banned creator's public store → 403
	// ──────────────────────────────────────────────
	t.Run("Banned creator store returns 403", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/store/"+creator.Username, nil)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)

		var response struct {
			Error struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, "ERR_STORE_BANNED", response.Error.Code)
		assert.Equal(t, "This store has been suspended", response.Error.Message)
	})

	// ──────────────────────────────────────────────
	// TEST 4: Banned creator calling /auth/me → 403
	// ──────────────────────────────────────────────
	t.Run("Banned creator cannot access /auth/me", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+creatorToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)

		var response struct {
			Error struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, "ERR_ACCOUNT_BANNED", response.Error.Code)
	})

	// ──────────────────────────────────────────────
	// TEST 5: Banned creator cannot access products → 403
	// ──────────────────────────────────────────────
	t.Run("Banned creator cannot access protected routes", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/products", nil)
		req.Header.Set("Authorization", "Bearer "+creatorToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)

		var response struct {
			Error struct {
				Code string `json:"code"`
			} `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, "ERR_ACCOUNT_BANNED", response.Error.Code)
	})

	// ──────────────────────────────────────────────
	// TEST 6: Admin can unban a creator → 200
	// ──────────────────────────────────────────────
	t.Run("Admin can unban a creator", func(t *testing.T) {
		req := NewRequest(http.MethodPost, "/api/v1/admin/creators/"+creatorID.Hex()+"/unban", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data struct {
				Message string `json:"message"`
			} `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, "Creator unbanned successfully", response.Data.Message)
	})

	// ──────────────────────────────────────────────
	// TEST 7: Unbanned creator's store → 200
	// ──────────────────────────────────────────────
	t.Run("Unbanned creator store is accessible again", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/store/"+creator.Username, nil)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	// ──────────────────────────────────────────────
	// TEST 8: Unbanned creator can access /auth/me → 200
	// ──────────────────────────────────────────────
	t.Run("Unbanned creator can access /auth/me again", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+creatorToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	// ──────────────────────────────────────────────
	// EDGE CASES
	// ──────────────────────────────────────────────
	t.Run("Ban with missing reason returns 400", func(t *testing.T) {
		body := []byte(`{}`)
		req := NewRequest(http.MethodPost, "/api/v1/admin/creators/"+creatorID.Hex()+"/ban", body)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Ban non-existent user returns 404", func(t *testing.T) {
		fakeID := primitive.NewObjectID().Hex()
		body := []byte(`{"reason":"Test"}`)
		req := NewRequest(http.MethodPost, "/api/v1/admin/creators/"+fakeID+"/ban", body)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("Unban non-banned user returns 409", func(t *testing.T) {
		// Creator is already unbanned from test 6
		req := NewRequest(http.MethodPost, "/api/v1/admin/creators/"+creatorID.Hex()+"/unban", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)
	})
}
