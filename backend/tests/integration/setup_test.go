package integration

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	httpAdapter "github.com/devanshbhargava/stan-store/internal/adapters/http"
	"github.com/devanshbhargava/stan-store/internal/adapters/storage"
	"github.com/devanshbhargava/stan-store/internal/config"
	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const (
	testDBName    = "stanstore_test"
	testJWTSecret = "test_secret_key_12345"
)

// Helper to seed user directly into DB
func seedUser(t *testing.T, user *domain.User) {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://127.0.0.1:27017"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Fatalf("seeding failed to connect: %v", err)
	}
	defer client.Disconnect(ctx)

	coll := client.Database(testDBName).Collection("users")
	_, err = coll.InsertOne(ctx, user)
	if err != nil {
		t.Fatalf("seeding failed to insert user: %v", err)
	}
}

type MockFileStorage struct{}

func (m *MockFileStorage) GeneratePresignedURL(ctx context.Context, key string, contentType string, expiry time.Duration) (string, error) {
	return "https://mock-r2-bucket.r2.cloudflarestorage.com/" + key + "?signature=mock", nil
}

func (m *MockFileStorage) GeneratePresignedDownloadURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	return "https://mock-r2-bucket.r2.cloudflarestorage.com/" + key + "?signature=mock_download", nil
}

func (m *MockFileStorage) Delete(ctx context.Context, key string) error {
	return nil
}

type MockEmailService struct{}

func (m *MockEmailService) SendOrderConfirmation(ctx context.Context, order *domain.Order, product *domain.Product, downloadURL string) error {
	fmt.Printf("[MockEmailService] Sending confirmation for Order %s. URL: %s\n", order.ID.Hex(), downloadURL)
	return nil
}

func setupTestApp(t *testing.T) (*fiber.App, func()) {
	// Load .env if present (optional for tests as we use defaults)
	_ = godotenv.Load("../../.env")

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://127.0.0.1:27017"
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Fatalf("failed to connect to mongodb: %v", err)
	}

	db := client.Database(testDBName)
	// Clear database before test
	if err := db.Drop(ctx); err != nil {
		t.Fatalf("failed to drop test database: %v", err)
	}

	// Initialize dependencies
	// We need to wrap mongo.Database into storage.MongoDB if possible,
	// but storage.ConnectMongoDB returns *storage.MongoDB which wraps *mongo.Database.
	// Let's see storage/mongodb.go.
	// Assuming storage.MongoDB is just *mongo.Database or a struct wrapper.
	// If it's a type alias or struct, we need to match it.
	// Let's guess it's a struct wrapper or type alias.
	// Actually, looking at main.go: `mongoDB, err := storage.ConnectMongoDB(...)`
	// And `storage.NewMongoUserRepository(mongoDB)`.
	// I'll assume storage.MongoDB is compatible or I can construct it.
	// Re-reading `base_repository.go` it says `func NewBaseRepository[T any](db *MongoDB, collectionName string)`
	// So `MongoDB` is a type in `storage` package.

	// Check storage/mongodb.go content? I saw it in file list but didn't read it.
	// I'll assume it's `type MongoDB struct { *mongo.Database }` or similar.
	// Let's try to verify or just use storage.ConnectMongoDB but with test DB name?
	// storage.ConnectMongoDB takes (uri, dbName). So I can use that.

	testStorageDB, err := storage.ConnectMongoDB(mongoURI, testDBName)
	if err != nil {
		t.Fatalf("failed to connect to test storage: %v", err)
	}

	userRepo := storage.NewMongoUserRepository(testStorageDB)
	productRepo := storage.NewMongoProductRepository(testStorageDB)

	// Since integration tests don't require an actual Redis connection for basic routes initially,
	// or we can mock it. For now pass a disconnected/nil-safe wrapper from `storage.ConnectRedis("")`
	// but we need the raw `*redis.Client` wrapped inside. `storage.ConnectRedis` returns `*storage.RedisClient`.
	// For testing, `nil` is fine if the methods handled check for it, or we use a mini-redis.
	// Since `HandleMagicLinkRequest` assumes a valid redis.Client, we will pass `nil` and skip testing magic links
	// in the old integration tests, or spin up a real test one later.
	jwtService := services.NewJWTService(testJWTSecret)
	authService := services.NewAuthService(userRepo, jwtService, nil)
	usernameService := services.NewUsernameService(userRepo)
	profileService := services.NewProfileService(userRepo)
	productService := services.NewProductService(productRepo)

	storeService := services.NewStoreService(userRepo, productRepo)

	// Mock Config for PaymentService
	mockCfg := &config.Config{
		RazorpayKeyID:         "test_key",
		RazorpayKeySecret:     "test_secret",
		RazorpayWebhookSecret: "test_webhook_secret",
	}
	paymentRepo := storage.NewMongoPaymentRepository(testStorageDB.Database)
	paymentService := services.NewPaymentService(paymentRepo, mockCfg)

	uploadSvc := services.NewUploadService(&MockFileStorage{})
	emailSvc := &MockEmailService{}

	orderRepo := storage.NewMongoOrderRepository(testStorageDB.Database)
	transactionRepo := storage.NewMongoTransactionRepository(testStorageDB.Database)
	walletSvc := services.NewWalletService(transactionRepo)
	orderService := services.NewOrderService(orderRepo, productRepo, userRepo, nil, paymentService, uploadSvc, walletSvc, emailSvc, nil, nil)

	authHandler := httpAdapter.NewAuthHandler(authService, "test_client", "test_secret", "http://localhost/callback", "http://localhost:3000")
	usernameHandler := httpAdapter.NewUsernameHandler(usernameService)
	profileHandler := httpAdapter.NewProfileHandler(profileService)
	productHandler := httpAdapter.NewProductHandler(productService)
	uploadHandler := httpAdapter.NewUploadHandler(services.NewUploadService(&MockFileStorage{}))
	storeHandler := httpAdapter.NewStoreHandler(storeService)
	paymentHandler := httpAdapter.NewPaymentHandler(paymentService, orderService, mockCfg.RazorpayWebhookSecret)
	orderHandler := httpAdapter.NewOrderHandler(orderService)

	// Setup Fiber
	app := fiber.New(fiber.Config{DisableStartupMessage: true})

	// We need to set context locals for tests?
	// AuthRequired middleware is used. We need to generate valid tokens.

	adminService := services.NewAdminService(userRepo, transactionRepo, orderRepo)
	adminHandler := httpAdapter.NewAdminHandler(adminService)

	httpAdapter.SetupRouter(app, &httpAdapter.RouterDeps{
		FrontendURL:     "http://localhost:3000",
		JWTService:      jwtService,
		UserRepo:        userRepo,
		AuthHandler:     authHandler,
		UsernameHandler: usernameHandler,
		ProfileHandler:  profileHandler,
		ProductHandler:  productHandler,
		UploadHandler:   uploadHandler,
		StoreHandler:    storeHandler,
		PaymentHandler:  paymentHandler,
		OrderHandler:    orderHandler,
		WalletHandler:   httpAdapter.NewWalletHandler(walletSvc),
		AdminHandler:    adminHandler,
	})

	cleanup := func() {
		if err := testStorageDB.Client.Disconnect(context.Background()); err != nil {
			logger.Error("failed to disconnect mongo", "error", err)
		}
	}

	return app, cleanup
}

func generateTestToken(t *testing.T, userID, role string) string {
	jwtService := services.NewJWTService(testJWTSecret)
	token, err := jwtService.GenerateToken(userID, role)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	return token
}

func createAuthenticatedUser(t *testing.T) (string, *domain.User) {
	userID := primitive.NewObjectID()
	user := &domain.User{
		ID:          userID,
		Email:       "test_payment_" + userID.Hex() + "@example.com",
		DisplayName: "Test Creator",
		Username:    "creator_" + userID.Hex(),
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	seedUser(t, user)
	token := generateTestToken(t, userID.Hex(), "creator")
	return token, user
}

func NewRequest(method, target string, body []byte) *http.Request {
	req := httptest.NewRequest(method, target, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return req
}
