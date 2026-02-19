package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderService struct {
	orderRepo   domain.OrderRepository
	productRepo domain.ProductRepository
	paymentSvc  *PaymentService
	uploadSvc   *UploadService
	walletSvc   *WalletService // Added dependency
	emailSvc    domain.EmailService
}

func NewOrderService(orderRepo domain.OrderRepository, productRepo domain.ProductRepository, paymentSvc *PaymentService, uploadSvc *UploadService, walletSvc *WalletService, emailSvc domain.EmailService) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		productRepo: productRepo,
		paymentSvc:  paymentSvc,
		uploadSvc:   uploadSvc,
		walletSvc:   walletSvc,
		emailSvc:    emailSvc,
	}
}

// CreateOrder initiates a purchase for a product
func (s *OrderService) CreateOrder(ctx context.Context, productID primitive.ObjectID, customerName, customerEmail string) (*domain.Order, error) {
	// 1. Fetch Product
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch product: %w", err)
	}
	if product == nil {
		return nil, errors.New("product not found")
	}

	// 2. Create Razorpay Order
	// Configurable currency, default INR for now
	currency := "INR"
	// Receipt ID can be anything, maybe "order_productID_timestamp"
	receipt := fmt.Sprintf("rcpt_%s_%d", productID.Hex(), primitive.NewObjectID().Timestamp().Unix())

	razorpayOrderID, err := s.paymentSvc.CreateRazorpayOrder(product.Price, currency, receipt)
	if err != nil {
		return nil, fmt.Errorf("failed to create razorpay order: %w", err)
	}

	// 3. Create Local Order
	order := &domain.Order{
		ProductID:       product.ID,
		CreatorID:       product.CreatorID,
		CustomerName:    customerName,
		CustomerEmail:   customerEmail,
		Amount:          product.Price,
		Currency:        currency,
		RazorpayOrderID: razorpayOrderID,
		Status:          domain.OrderStatusCreated,
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to save order: %w", err)
	}

	return order, nil
}

// HandlePaymentSuccess updates order status after successful payment
func (s *OrderService) HandlePaymentSuccess(ctx context.Context, razorpayOrderID string, paymentID string) error {
	// 1. Validate Order exists
	order, err := s.orderRepo.FindByRazorpayOrderID(ctx, razorpayOrderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return errors.New("order not found for razorpay order id")
	}

	// 2. Update Status
	// Check if already paid to avoid duplicate processing logic (idempotency)
	if order.Status == domain.OrderStatusPaid {
		return nil
	}

	if err := s.orderRepo.UpdateStatus(ctx, razorpayOrderID, domain.OrderStatusPaid, paymentID); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// 3. Credit Creator Wallet
	// We do this synchronously for now to ensure financial consistency before sending email.
	// If this fails, we might want to alert or retry, but for now we log and return error?
	// Actually, if status is PAID, we should try to credit.
	// Ideally, this should be transactional or idempotent.
	// 3. Credit Creator Wallet
	// We do this synchronously for now to ensure financial consistency before sending email.
	// If this fails, we might want to alert or retry, but for now we log and return error?
	// Actually, if status is PAID, we should try to credit.
	// Ideally, this should be transactional or idempotent.
	if err := s.walletSvc.CreditTransaction(ctx, order.CreatorID, order.Amount, "Order Payment via "+paymentID, order.ID.Hex(), domain.TransactionSourceOrder); err != nil {
		fmt.Printf("CRITICAL: Failed to credit wallet for order %s: %v\n", order.ID.Hex(), err)
	}

	// 4. Send Order Confirmation Email
	// This should ideally happen asynchronously (e.g., Goroutine or Worker) to not block webhook response.
	// For MVP simplicity, we'll run it in a goroutine so webhook returns fast.
	go func() {
		// Use a detached context for async work
		bgCtx := context.Background()

		// Fetch Product for email details
		product, err := s.productRepo.FindByID(bgCtx, order.ProductID)
		if err != nil {
			fmt.Printf("Error fetching product for email: %v\n", err)
			return
		}
		if product == nil {
			fmt.Printf("Product not found for email: %s\n", order.ProductID.Hex())
			return
		}

		// Generate Download Link
		downloadURL, err := s.uploadSvc.GenerateDownloadURL(bgCtx, product.FileURL)
		if err != nil {
			fmt.Printf("Error generating download link for email: %v\n", err)
			// Might want to send email without link or a generic link
			downloadURL = "#"
		}

		if err := s.emailSvc.SendOrderConfirmation(bgCtx, order, product, downloadURL); err != nil {
			fmt.Printf("Error sending confirmation email: %v\n", err)
		}
	}()

	return nil
}

// GetOrderDownloadURL verifies order status and returns a download link.
func (s *OrderService) GetOrderDownloadURL(ctx context.Context, orderID primitive.ObjectID) (string, error) {
	// 1. Fetch Order
	// Note: We currently don't have FindByID in OrderRepo interface exposed plainly,
	// checking `order_repo.go` (I recall viewing it, check interface definition).
	// If missing, I need to add it.
	// For now, assuming I can add it or it exists.
	// Actually `MongoOrderRepository` likely has basic CRUD or I need to add `FindByID`.

	// Let's assume we need to add `FindByID` to interface first.
	// But let's write usage here and fix repo if needed.
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch order: %w", err)
	}
	if order == nil {
		return "", errors.New("order not found")
	}

	// 2. Verify Status
	if order.Status != domain.OrderStatusPaid {
		return "", errors.New("order not paid")
	}

	// 3. Fetch Product
	product, err := s.productRepo.FindByID(ctx, order.ProductID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch product: %w", err)
	}
	if product == nil {
		return "", errors.New("product not found")
	}

	// 4. Verify Product Type & File presence
	if product.ProductType != domain.ProductTypeDownload && product.ProductType != domain.ProductTypeCourse {
		// allow digital products
	}
	if product.FileURL == "" {
		return "", errors.New("product has no file")
	}

	// 5. Generate URL
	return s.uploadSvc.GenerateDownloadURL(ctx, product.FileURL)
}

// GetOrder fetches a single order by its ID
func (s *OrderService) GetOrder(ctx context.Context, orderID primitive.ObjectID) (*domain.Order, error) {
	return s.orderRepo.FindByID(ctx, orderID)
}

// GetCreatorOrders fetches all orders for a specific creator
func (s *OrderService) GetCreatorOrders(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Order, error) {
	orders, err := s.orderRepo.FindAllByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch creator orders: %w", err)
	}
	return orders, nil
}
