package integration

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

func TestAdminMetricsFlow(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// 1. Create a regular Creator
	token, creator := createAuthenticatedUser(t)
	require.NotEmpty(t, token)

	// 2. Create an Admin User
	adminID := primitive.NewObjectID()
	adminUser := &domain.User{
		ID:          adminID,
		Email:       "admin@stan.store",
		DisplayName: "Admin User",
		GoogleID:    "admin_google_id",
		Role:        "admin", // Manually set role
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	seedUser(t, adminUser)
	adminToken := generateTestToken(t, adminID.Hex(), "admin")

	// 3. Connect to DB to insert data directly
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://127.0.0.1:27017"
	}
	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	require.NoError(t, err)
	defer client.Disconnect(ctx)
	db := client.Database(testDBName)

	// 4. Create Product
	product := &domain.Product{
		ID:            primitive.NewObjectID(),
		CreatorID:     creator.ID,
		Title:         "Test Product",
		Description:   "Test Description",
		Price:         1000, // 10.00
		CoverImageURL: "http://cover.url",
		ProductType:   domain.ProductTypeDownload,
		IsVisible:     true,
		SortOrder:     0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	// Insert directly into DB
	_, err = db.Collection("products").InsertOne(ctx, product)
	require.NoError(t, err)

	// 5. Create Order
	order := &domain.Order{
		ID:              primitive.NewObjectID(),
		CreatorID:       creator.ID,
		ProductID:       product.ID,
		Amount:          product.Price,
		Currency:        "INR",
		Status:          domain.OrderStatusPaid,
		CustomerEmail:   "customer@example.com",
		RazorpayOrderID: "rzp_test_123",
		CreatedAt:       time.Now(),
	}
	_, err = db.Collection("orders").InsertOne(ctx, order)
	require.NoError(t, err)

	// 6. Create Transaction (Revenue)
	tx := &domain.Transaction{
		ID:          primitive.NewObjectID(),
		CreatorID:   creator.ID,
		Amount:      product.Price,
		Type:        domain.TransactionTypeCredit,
		Source:      domain.TransactionSourceOrder,
		ReferenceID: order.ID.Hex(),
		Description: "Sale",
		CreatedAt:   time.Now(),
	}
	_, err = db.Collection("transactions").InsertOne(ctx, tx)
	require.NoError(t, err)

	t.Run("Creator cannot access admin metrics", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/admin/metrics", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("Admin can access metrics", func(t *testing.T) {
		req := NewRequest(http.MethodGet, "/api/v1/admin/metrics", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data struct {
				TotalUsers     int64 `json:"total_users"`
				TotalRevenue   int64 `json:"total_revenue"`
				TotalOrders    int64 `json:"total_orders"`
				ActiveCreators int64 `json:"active_creators"`
			} `json:"data"`
		}

		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)

		// Assertions
		// Total Users: creator + admin = 2
		assert.GreaterOrEqual(t, response.Data.TotalUsers, int64(2))

		// Total Revenue: product.Price
		assert.Equal(t, product.Price, response.Data.TotalRevenue)

		// Total Orders: 1
		assert.Equal(t, int64(1), response.Data.TotalOrders)
	})
}
