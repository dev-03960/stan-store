package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"

	"github.com/devanshbhargava/stan-store/internal/adapters/storage"
	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

func TestUploadIntegration(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// Seed a test user
	// Connect to DB directly for seeding
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}
	// We need to match ConnectMongoDB signature from storage package
	testStorageDB, err := storage.ConnectMongoDB(mongoURI, "stanstore_test")
	if err != nil {
		t.Fatalf("failed to connect to test db: %v", err)
	}
	defer testStorageDB.Client.Disconnect(context.Background())

	usersCollection := testStorageDB.Database.Collection("users")
	userID := "65d4f1b2c3a1e2d3f4a5b6c7"
	_, err = usersCollection.InsertOne(context.TODO(), bson.M{
		"_id": userID,
	})
	if err != nil {
		// Ignore if user already exists
	}

	token := generateTestToken(t, userID, "creator")

	t.Run("Generate_Presigned_URL_-_Success", func(t *testing.T) {
		reqBody := domain.UploadRequest{
			FileName:    "my-product.pdf",
			ContentType: "application/pdf",
			Purpose:     domain.PurposeProductFile,
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/v1/uploads/presigned", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		// Manually set cookie because standard request might not handle it easily without helpers,
		// but Fiber middleware reads from "jwt" cookie.
		req.AddCookie(&http.Cookie{
			Name:  "stan_token",
			Value: token,
		})

		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)

		data := response["data"].(map[string]interface{})
		assert.Contains(t, data["upload_url"], "mock-r2-bucket")
		assert.Contains(t, data["file_key"], "creators/"+userID+"/products/files/")
		assert.Contains(t, data["file_key"], ".pdf")
	})

	t.Run("Generate_Presigned_URL_-_Invalid_Extension_For_Product", func(t *testing.T) {
		reqBody := domain.UploadRequest{
			FileName:    "malicious.exe",
			ContentType: "application/x-msdos-program",
			Purpose:     domain.PurposeProductFile,
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/v1/uploads/presigned", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{
			Name:  "stan_token",
			Value: token,
		})

		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Generate_Presigned_URL_-_Invalid_Purpose", func(t *testing.T) {
		reqBody := domain.UploadRequest{
			FileName:    "test.pdf",
			ContentType: "application/pdf",
			Purpose:     "hacker_upload",
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/v1/uploads/presigned", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{
			Name:  "stan_token",
			Value: token,
		})

		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}
