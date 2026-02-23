package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/hibiken/asynq"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderService struct {
	orderRepo         domain.OrderRepository
	productRepo       domain.ProductRepository
	userRepo          domain.UserRepository
	subscriberRepo    domain.EmailSubscriberRepository
	paymentSvc        *PaymentService
	uploadSvc         *UploadService
	walletSvc         *WalletService
	emailSvc          domain.EmailService
	bookingSvc        *BookingService
	subRepo           domain.SubscriptionRepository
	emailTemplateRepo domain.EmailTemplateRepository
	campaignRepo      domain.CampaignRepository
	emailQueueRepo    domain.EmailQueueRepository
	affiliateSvc      *AffiliateService // New tracking dependency
	workerClient      *asynq.Client
}

// NewOrderService creates a new OrderService
func NewOrderService(
	orderRepo domain.OrderRepository,
	productRepo domain.ProductRepository,
	userRepo domain.UserRepository,
	subscriberRepo domain.EmailSubscriberRepository,
	paymentSvc *PaymentService,
	uploadSvc *UploadService,
	walletSvc *WalletService,
	emailSvc domain.EmailService,
	bookingSvc *BookingService,
	subRepo domain.SubscriptionRepository,
	emailTemplateRepo domain.EmailTemplateRepository,
	campaignRepo domain.CampaignRepository,
	emailQueueRepo domain.EmailQueueRepository,
	affiliateSvc *AffiliateService,
) *OrderService {
	return &OrderService{
		orderRepo:         orderRepo,
		productRepo:       productRepo,
		userRepo:          userRepo,
		subscriberRepo:    subscriberRepo,
		paymentSvc:        paymentSvc,
		uploadSvc:         uploadSvc,
		walletSvc:         walletSvc,
		emailSvc:          emailSvc,
		bookingSvc:        bookingSvc,
		subRepo:           subRepo,
		emailTemplateRepo: emailTemplateRepo,
		campaignRepo:      campaignRepo,
		emailQueueRepo:    emailQueueRepo,
		affiliateSvc:      affiliateSvc,
	}
}

// SetWorkerClient attaches the enqueue bus to the order service
func (s *OrderService) SetWorkerClient(client *asynq.Client) {
	s.workerClient = client
}

// CreateOrder initiates a purchase for a product
func (s *OrderService) CreateOrder(ctx context.Context, productID primitive.ObjectID, customerName, customerEmail string, bumpAccepted bool, bookingSlotStartStr string, referralCode string) (*domain.Order, error) {
	// 1. Fetch Product
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch product: %w", err)
	}
	if product == nil {
		return nil, errors.New("product not found")
	}

	currency := "INR"

	// 2. Handle Order Bumps
	totalAmount := product.Price
	lineItems := []domain.LineItem{{
		ProductID:   product.ID,
		Title:       product.Title,
		Amount:      product.Price,
		ProductType: product.ProductType,
	}}

	if bumpAccepted && product.Bump != nil && product.Bump.BumpProductID != primitive.NilObjectID {
		bumpProduct, err := s.productRepo.FindByID(ctx, product.Bump.BumpProductID)
		if err == nil && bumpProduct != nil && bumpProduct.IsVisible && bumpProduct.CreatorID == product.CreatorID {
			bumpPrice := bumpProduct.Price
			if product.Bump.BumpDiscount > 0 && product.Bump.BumpDiscount <= bumpProduct.Price {
				bumpPrice -= product.Bump.BumpDiscount
			}

			lineItems = append(lineItems, domain.LineItem{
				ProductID:   bumpProduct.ID,
				Title:       bumpProduct.Title + " (Bump Offer)",
				Amount:      bumpPrice,
				ProductType: bumpProduct.ProductType,
			})
			totalAmount += bumpPrice
		}
	}

	// 3. Handle free products (lead magnets) — skip Razorpay
	if totalAmount == 0 || product.ProductType == domain.ProductTypeLeadMagnet {
		order := &domain.Order{
			ProductID:       product.ID,
			CreatorID:       product.CreatorID,
			LineItems:       lineItems,
			CustomerName:    customerName,
			CustomerEmail:   customerEmail,
			Amount:          0,
			Currency:        currency,
			RazorpayOrderID: "free_" + primitive.NewObjectID().Hex(),
			Status:          domain.OrderStatusPaid, // Immediately paid
			ReferralCode:    referralCode,
		}

		if err := s.orderRepo.Create(ctx, order); err != nil {
			return nil, fmt.Errorf("failed to save order: %w", err)
		}

		// Add subscriber (async, best-effort)
		if s.subscriberRepo != nil {
			go func() {
				sub := &domain.EmailSubscriber{
					CreatorID:    product.CreatorID,
					Email:        customerEmail,
					Name:         customerName,
					Source:       product.ID,
					ConsentGiven: true,
				}
				if err := s.subscriberRepo.Upsert(context.Background(), sub); err != nil {
					fmt.Printf("Failed to add subscriber: %v\n", err)
				}
			}()
		}

		// Send email with download link (async)
		go func() {
			bgCtx := context.Background()
			downloadURL, err := s.uploadSvc.GenerateDownloadURL(bgCtx, product.FileURL)
			if err != nil {
				downloadURL = "#"
			}
			_ = s.emailSvc.SendOrderConfirmation(bgCtx, order, product, downloadURL)
		}()

		// Trigger delayed sequence
		s.triggerPostPurchaseSequenceAsync(order)

		// Trigger potential drip campaign for lead magnet
		s.triggerDripCampaignAsync(order, product)

		// Free product conversions still attribute analytical clicks -> sales
		if s.affiliateSvc != nil {
			_ = s.affiliateSvc.TrackSale(context.Background(), order, product)
		}

		return order, nil
	}

	var razorpayOrderID string
	var errRP error

	if product.ProductType == domain.ProductTypeMembership {
		// Minimum fallback interval
		interval := product.SubscriptionInterval
		if interval == "" {
			interval = "monthly"
		}
		// 1. Create a dynamic Razorpay Plan for this membership checkout
		planID, err := s.paymentSvc.CreateRazorpayPlan(product.Title, product.Price, currency, interval)
		if err != nil {
			return nil, fmt.Errorf("failed to create razorpay plan: %w", err)
		}
		// 2. Create the Subscription against the plan
		razorpayOrderID, errRP = s.paymentSvc.CreateRazorpaySubscription(planID)
		if errRP != nil {
			return nil, fmt.Errorf("failed to create razorpay subscription: %w", errRP)
		}

		// 3. Create Local Subscription Record
		sub := &domain.Subscription{
			ProductID:         product.ID,
			CreatorID:         product.CreatorID,
			CustomerEmail:     customerEmail,
			CustomerName:      customerName,
			Amount:            totalAmount,
			Currency:          currency,
			Interval:          interval,
			RazorpayPlanID:    planID,
			RazorpaySubID:     razorpayOrderID, // holds sub_xxxx
			Status:            domain.SubscriptionStatusCreated,
			CancelAtPeriodEnd: false,
		}
		if s.subRepo != nil {
			if errSub := s.subRepo.Create(ctx, sub); errSub != nil {
				return nil, fmt.Errorf("failed to save subscription record: %w", errSub)
			}
		}
	} else {
		// 4. Create Razorpay Order (paid one-time products)
		receipt := fmt.Sprintf("rcpt_%s_%d", productID.Hex(), primitive.NewObjectID().Timestamp().Unix())
		razorpayOrderID, errRP = s.paymentSvc.CreateRazorpayOrder(totalAmount, currency, receipt)
		if errRP != nil {
			return nil, fmt.Errorf("failed to create razorpay order: %w", errRP)
		}
	}

	var slotStart *time.Time
	var slotEnd *time.Time

	if product.ProductType == domain.ProductTypeBooking && bookingSlotStartStr != "" {
		parsedStart, err := time.Parse(time.RFC3339, bookingSlotStartStr)
		if err != nil {
			return nil, fmt.Errorf("invalid booking slot start format, expected RFC3339: %w", err)
		}
		duration := product.DurationMinutes
		if duration <= 0 {
			duration = 30 // fallback
		}
		parsedEnd := parsedStart.Add(time.Duration(duration) * time.Minute)

		slotStart = &parsedStart
		slotEnd = &parsedEnd
	}

	// 5. Create Local Order
	order := &domain.Order{
		ProductID:        product.ID,
		CreatorID:        product.CreatorID,
		LineItems:        lineItems,
		BookingSlotStart: slotStart,
		BookingSlotEnd:   slotEnd,
		CustomerName:     customerName,
		CustomerEmail:    customerEmail,
		Amount:           totalAmount,
		Currency:         currency,
		RazorpayOrderID:  razorpayOrderID,
		Status:           domain.OrderStatusCreated,
		ReferralCode:     referralCode,
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to save order: %w", err)
	}

	return order, nil
}

// GetBuyerSubscriptions returns all subscriptions for a buyer
func (s *OrderService) GetBuyerSubscriptions(ctx context.Context, email string) ([]*domain.Subscription, error) {
	if s.subRepo == nil {
		return []*domain.Subscription{}, nil
	}
	return s.subRepo.FindAllByCustomerEmail(ctx, email)
}

// CancelSubscription cancels a subscription
func (s *OrderService) CancelSubscription(ctx context.Context, subID primitive.ObjectID, email string) error {
	if s.subRepo == nil {
		return errors.New("subscription repository not initialized")
	}

	sub, err := s.subRepo.FindByID(ctx, subID)
	if err != nil {
		return fmt.Errorf("failed to fetch subscription: %w", err)
	}

	if sub.CustomerEmail != email {
		return errors.New("unauthorized to cancel this subscription")
	}

	if sub.Status == domain.SubscriptionStatusCancelled {
		return errors.New("subscription is already cancelled")
	}

	if err := s.paymentSvc.CancelRazorpaySubscription(sub.RazorpaySubID); err != nil {
		return fmt.Errorf("failed to cancel razorpay subscription: %w", err)
	}

	sub.Status = domain.SubscriptionStatusCancelled
	return s.subRepo.Update(ctx, sub)
}

// HandleSubscriptionEvent processes Razorpay subscription webhooks
func (s *OrderService) HandleSubscriptionEvent(ctx context.Context, eventName string, payload map[string]interface{}) error {
	if s.subRepo == nil {
		return nil
	}
	subscriptionData, ok := payload["subscription"].(map[string]interface{})
	if !ok {
		return errors.New("missing subscription object in payload")
	}
	entity, ok := subscriptionData["entity"].(map[string]interface{})
	if !ok {
		return errors.New("missing entity inside subscription")
	}

	subID, _ := entity["id"].(string)
	if subID == "" {
		return errors.New("missing subscription id")
	}

	sub, err := s.subRepo.FindByRazorpaySubID(ctx, subID)
	if err != nil {
		return fmt.Errorf("failed to find subscription: %w", err)
	}

	status, _ := entity["status"].(string)
	paidCountFloat, _ := entity["paid_count"].(float64)

	sub.Status = domain.SubscriptionStatus(status)
	sub.PaidCount = int(paidCountFloat)

	// Update start_at and end_at if present
	if startAt, ok := entity["start_at"].(float64); ok && startAt > 0 {
		t := time.Unix(int64(startAt), 0)
		sub.CurrentStart = &t
	}
	if endAt, ok := entity["end_at"].(float64); ok && endAt > 0 {
		t := time.Unix(int64(endAt), 0)
		sub.CurrentEnd = &t
	}

	if err := s.subRepo.Update(ctx, sub); err != nil {
		return fmt.Errorf("failed to update subscription: %w", err)
	}

	// For MVP, we'll mark the initial Order as Paid on the first charge so the dashboard shows the sale.
	if eventName == "subscription.charged" && sub.PaidCount == 1 {
		order, _ := s.orderRepo.FindByRazorpayOrderID(ctx, subID)
		if order != nil && order.Status != domain.OrderStatusPaid {
			paymentData, ok := payload["payment"].(map[string]interface{})
			if ok {
				paymentEntity, ok := paymentData["entity"].(map[string]interface{})
				if ok {
					paymentID, _ := paymentEntity["id"].(string)
					_ = s.HandlePaymentSuccess(ctx, subID, paymentID)
				}
			}
		}
	}

	return nil
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

	// 3. Calculate Platform Fee and credit net amount to Creator Wallet
	creator, err := s.userRepo.FindByID(ctx, order.CreatorID.Hex())
	feeRate := 5.0 // Default 5%
	if err == nil && creator != nil && creator.PlatformFeeRate > 0 {
		feeRate = creator.PlatformFeeRate
	}
	platformFee := int64(float64(order.Amount) * feeRate / 100)
	netAmount := order.Amount - platformFee

	// Store platform fee on order (best-effort update)
	if platformFee > 0 {
		order.PlatformFee = platformFee
		// Update order with fee (fire-and-forget — we prioritize wallet credit)
		_ = s.orderRepo.UpdatePlatformFee(ctx, order.ID, platformFee)
	}

	if err := s.walletSvc.CreditTransaction(ctx, order.CreatorID, netAmount, "Order Payment via "+paymentID+fmt.Sprintf(" (net after %.1f%% fee)", feeRate), order.ID.Hex(), domain.TransactionSourceOrder); err != nil {
		fmt.Printf("CRITICAL: Failed to credit wallet for order %s: %v\n", order.ID.Hex(), err)
	}

	// 4. Send Order Confirmation Email
	// This should ideally happen asynchronously (e.g., Goroutine or Worker) to not block webhook response.
	// For MVP simplicity, we'll run it in a goroutine so webhook returns fast.
	go func() {
		// Use a detached context for async work
		bgCtx := context.Background()

		// Determine the primary product ID (LineItems-first, fallback to legacy ProductID)
		primaryProductID := order.ProductID
		if len(order.LineItems) > 0 {
			primaryProductID = order.LineItems[0].ProductID
		}

		// Fetch Product for email details
		product, err := s.productRepo.FindByID(bgCtx, primaryProductID)
		if err != nil {
			fmt.Printf("Error fetching product for email: %v\n", err)
			return
		}
		if product == nil {
			fmt.Printf("Product not found for email: %s\n", primaryProductID.Hex())
			return
		}

		// Handle Bookings for Coaching Products
		if product.ProductType == domain.ProductTypeBooking && order.BookingSlotStart != nil && order.BookingSlotEnd != nil {
			booking := &domain.Booking{
				ProductID:  product.ID,
				CreatorID:  product.CreatorID,
				OrderID:    order.ID,
				BuyerEmail: order.CustomerEmail,
				BuyerName:  order.CustomerName,
				SlotStart:  *order.BookingSlotStart,
				SlotEnd:    *order.BookingSlotEnd,
			}
			if err := s.bookingSvc.CreateBooking(bgCtx, booking); err != nil {
				fmt.Printf("Error creating booking for order %s: %v\n", order.ID.Hex(), err)
			}
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

	// Trigger delayed sequence
	s.triggerPostPurchaseSequenceAsync(order)

	// Execute Affiliate Commission generation asynchronously capturing the sale safely without blocking razorpay
	if s.affiliateSvc != nil {
		go func() {
			bgCtx := context.Background()
			primaryProdID := order.ProductID
			if len(order.LineItems) > 0 {
				primaryProdID = order.LineItems[0].ProductID
			}
			prod, err := s.productRepo.FindByID(bgCtx, primaryProdID)
			if err == nil && prod != nil {
				_ = s.affiliateSvc.TrackSale(bgCtx, order, prod)
			}
		}()
	}

	return nil
}

// GetOrderDownloadURL verifies order status and returns a download link.
func (s *OrderService) GetOrderDownloadURL(ctx context.Context, orderID primitive.ObjectID, requestedProductID string) (string, error) {
	// 1. Fetch Order
	// Note: We currently don't have FindByID in OrderRepo interface exposed plainly,
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch order: %w", err)
	}
	if order == nil {
		return "", errors.New("order not found")
	}

	// 2. Validate Payment
	if order.Status != domain.OrderStatusPaid {
		return "", errors.New("order not paid")
	}

	// 3. Determine Product ID
	productID := order.ProductID
	if requestedProductID != "" {
		reqID, err := primitive.ObjectIDFromHex(requestedProductID)
		if err == nil {
			productID = reqID
		}
	} else if len(order.LineItems) > 0 {
		productID = order.LineItems[0].ProductID
	}

	// Validate that the productID is actually part of the order
	valid := false
	if order.ProductID == productID {
		valid = true
	} else {
		for _, li := range order.LineItems {
			if li.ProductID == productID {
				valid = true
				break
			}
		}
	}
	if !valid {
		return "", errors.New("product not found in this order")
	}

	// 4. Fetch Product
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch product: %w", err)
	}
	if product == nil {
		return "", errors.New("product not found")
	}

	// 5. Verify Product Type & File presence
	if product.ProductType != domain.ProductTypeDownload && product.ProductType != domain.ProductTypeCourse {
		// allow digital products
	}
	if product.FileURL == "" {
		return "", errors.New("product has no file")
	}

	// 6. Generate URL
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

// GetBuyerOrders fetches all purchases made by a specific buyer email
func (s *OrderService) GetBuyerOrders(ctx context.Context, email string) ([]*domain.Order, error) {
	orders, err := s.orderRepo.FindAllByCustomerEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch buyer orders: %w", err)
	}

	// Filter down to only paid or completed orders for the buyer dashboard
	// You might want to show failed ones too, but usually buyers just want to see what they own
	var successfulOrders []*domain.Order
	for _, order := range orders {
		if order.Status == domain.OrderStatusPaid {
			successfulOrders = append(successfulOrders, order)
		}
	}

	return successfulOrders, nil
}

// ProcessAbandonedCarts runs periodically to sweep for orphaned checkouts.
func (s *OrderService) ProcessAbandonedCarts(ctx context.Context) error {
	now := time.Now()
	since := now.Add(-1 * time.Hour)
	until := now.Add(-24 * time.Hour)

	orders, err := s.orderRepo.FindAbandonedOrders(ctx, since, until)
	if err != nil {
		return fmt.Errorf("failed fetching abandoned carts: %w", err)
	}

	for _, order := range orders {
		creator, err := s.userRepo.FindByID(ctx, order.CreatorID.Hex())
		if err != nil || creator == nil {
			continue
		}

		if creator.AbandonedCartEnabled {
			// Enqueue the task
			if s.workerClient != nil {
				EnqueueAbandonedCartTask(s.workerClient, order.ID.Hex())
			}
		}

		// Mark to avoid reprocessing whether skipped or enqueued
		_ = s.orderRepo.MarkReminderSent(ctx, order.ID)
	}
	return nil
}

// ExecuteAbandonedCartReminder runs inside the worker to fire the actual email
func (s *OrderService) ExecuteAbandonedCartReminder(ctx context.Context, orderID string, emailSvc domain.EmailService) error {
	oid, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return err
	}

	order, err := s.orderRepo.FindByID(ctx, oid)
	if err != nil {
		return fmt.Errorf("failed to fetch order %s: %w", orderID, err)
	}

	if order == nil {
		return fmt.Errorf("order %s not found", orderID)
	}

	// Double check it's STILL created, maybe they paid during the queue wait!
	if order.Status != domain.OrderStatusCreated {
		return nil // Graceful skip
	}

	// Send Email
	productTitle := "your items"
	if len(order.LineItems) > 0 {
		productTitle = order.LineItems[0].Title
	}

	price := fmt.Sprintf("₹%.2f", float64(order.Amount)/100.0)

	subject := "You left something behind!"
	body := fmt.Sprintf(`
		<p>Hi %s,</p>
		<p>We noticed you started checking out but didn't finish.</p>
		<p>Complete your purchase of <strong>%s</strong> for %s!</p>
		<p><a href="http://localhost:5173/store/checkout-recovery/%s">Click here to resume your checkout</a></p>
	`, order.CustomerName, productTitle, price, order.ID.Hex())

	err = emailSvc.Send(ctx, order.CustomerEmail, subject, body)
	if err != nil {
		return fmt.Errorf("failed sending abandoned cart email limits: %w", err)
	}

	return nil
}

// triggerDripCampaignAsync checks for an active drip sequence tied to this lead magnet
func (s *OrderService) triggerDripCampaignAsync(order *domain.Order, product *domain.Product) {
	if s.workerClient == nil || product.ProductType != domain.ProductTypeLeadMagnet {
		return
	}

	_ = EnqueueStartDripCampaignTask(s.workerClient, order.CreatorID.Hex(), product.ID.Hex(), order.CustomerEmail)
}

// ExecuteDripCampaignStep handles a single drip sequence execution step via the Asynq worker
func (s *OrderService) ExecuteDripCampaignStep(ctx context.Context, payload DripCampaignPayload, emailSvc domain.EmailService, client *asynq.Client) error {
	prodID, err := primitive.ObjectIDFromHex(payload.ProductID)
	if err != nil {
		return err
	}

	// 1. Check if the subscriber has unsubscribed
	sub, err := s.subscriberRepo.FindByEmail(ctx, payload.UserEmail, payload.CreatorID)
	if err == nil && sub != nil && sub.UnsubscribedAt != nil {
		if payload.QueueID != "" {
			qid, _ := primitive.ObjectIDFromHex(payload.QueueID)
			_ = s.emailQueueRepo.MarkStatus(ctx, qid, domain.QueueStatusCancelled)
		}
		return nil // End gracefully
	}

	// 2. Fetch Active Campaigns tied to this product
	campaigns, err := s.campaignRepo.FindByTriggerProductAndStatus(ctx, prodID, domain.CampaignStatusActive)
	if err != nil || len(campaigns) == 0 {
		return nil // No active campaign found
	}

	c := campaigns[0] // Assume first one for now
	if len(c.Emails) == 0 {
		return nil
	}

	var qid primitive.ObjectID

	if payload.QueueID == "" {
		// New Sequence -> Enqueue EmailIndex 0
		creatorObjID, _ := primitive.ObjectIDFromHex(payload.CreatorID)
		queue := &domain.EmailQueue{
			CampaignID:      c.ID,
			CreatorID:       creatorObjID,
			SubscriberEmail: payload.UserEmail,
			EmailIndex:      0,
			ScheduledAt:     time.Now().Add(time.Duration(c.Emails[0].DelayMinutes) * time.Minute),
			Status:          domain.QueueStatusPending,
		}
		if err := s.emailQueueRepo.Create(ctx, queue); err != nil {
			return err
		}
		_ = EnqueueDripCampaignStepTask(client, queue.ID.Hex(), payload.CreatorID, payload.ProductID, payload.UserEmail, time.Duration(c.Emails[0].DelayMinutes)*time.Minute)
		return nil
	} else {
		// Existing Sequence
		qid, _ = primitive.ObjectIDFromHex(payload.QueueID)
		queueEntry, err := s.emailQueueRepo.FindByID(ctx, qid)
		if err != nil || queueEntry == nil {
			return errors.New("queue entry not found")
		}

		if queueEntry.Status != domain.QueueStatusPending {
			return nil // Already processed
		}

		// Prevent out of bounds
		if queueEntry.EmailIndex >= len(c.Emails) {
			_ = s.emailQueueRepo.MarkStatus(ctx, qid, domain.QueueStatusCancelled)
			return nil
		}

		// 3. Send Email
		currentEmail := c.Emails[queueEntry.EmailIndex]
		err = emailSvc.Send(ctx, payload.UserEmail, currentEmail.Subject, currentEmail.BodyHTML)
		if err != nil {
			return err
		}

		// 4. Mark Sent
		_ = s.emailQueueRepo.MarkStatus(ctx, qid, domain.QueueStatusSent)

		// 5. Schedule Next Email (if exists)
		nextIndex := queueEntry.EmailIndex + 1
		if nextIndex < len(c.Emails) {
			nextEmail := c.Emails[nextIndex]
			creatorObjID, _ := primitive.ObjectIDFromHex(payload.CreatorID)

			nextQueue := &domain.EmailQueue{
				CampaignID:      c.ID,
				CreatorID:       creatorObjID,
				SubscriberEmail: payload.UserEmail,
				EmailIndex:      nextIndex,
				ScheduledAt:     time.Now().Add(time.Duration(nextEmail.DelayMinutes) * time.Minute),
				Status:          domain.QueueStatusPending,
			}
			if err := s.emailQueueRepo.Create(ctx, nextQueue); err != nil {
				return err
			}
			_ = EnqueueDripCampaignStepTask(client, nextQueue.ID.Hex(), payload.CreatorID, payload.ProductID, payload.UserEmail, time.Duration(nextEmail.DelayMinutes)*time.Minute)
		}
	}

	return nil
}

// triggerPostPurchaseSequenceAsync checks for active template and enqueues task
func (s *OrderService) triggerPostPurchaseSequenceAsync(order *domain.Order) {
	if s.emailTemplateRepo == nil || s.workerClient == nil {
		return
	}
	bgCtx := context.Background()
	template, err := s.emailTemplateRepo.FindByCreatorAndType(bgCtx, order.CreatorID, domain.TemplateTypePostPurchase)
	if err == nil && template != nil && template.IsActive {
		_ = EnqueuePostPurchaseTask(s.workerClient, order.ID.Hex(), time.Duration(template.DelayDays)*24*time.Hour)
	}
}

// ExecutePostPurchaseSequence runs inside the worker to send the delayed follow-up
func (s *OrderService) ExecutePostPurchaseSequence(ctx context.Context, orderID string, emailSvc domain.EmailService) error {
	oid, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return err
	}

	order, err := s.orderRepo.FindByID(ctx, oid)
	if err != nil {
		return fmt.Errorf("failed fetching order: %w", err)
	}
	if order == nil {
		return errors.New("order not found for post purchase")
	}

	// Double check that it hasn't failed
	if order.Status == domain.OrderStatusFailed || order.Status == domain.OrderStatusCreated {
		return nil // End gracefully
	}

	// Does the user have an active template still?
	template, err := s.emailTemplateRepo.FindByCreatorAndType(ctx, order.CreatorID, domain.TemplateTypePostPurchase)
	if err != nil || template == nil || !template.IsActive {
		return nil // End gracefully, maybe they toggled it off while it was sleeping
	}

	creator, err := s.userRepo.FindByID(ctx, order.CreatorID.Hex())
	creatorName := "Creator"
	if err == nil && creator != nil {
		creatorName = creator.DisplayName
	}

	productTitle := "your recent purchase"
	if len(order.LineItems) > 0 {
		productTitle = order.LineItems[0].Title
	}

	// Simple merge tags replacement
	body := strings.ReplaceAll(template.BodyHTML, "{product_title}", "<strong>"+productTitle+"</strong>")
	body = strings.ReplaceAll(body, "{creator_name}", creatorName)

	subject := strings.ReplaceAll(template.Subject, "{product_title}", productTitle)
	subject = strings.ReplaceAll(subject, "{creator_name}", creatorName)

	err = emailSvc.Send(ctx, order.CustomerEmail, subject, body)
	if err != nil {
		return fmt.Errorf("failed sending post purchase template: %w", err)
	}

	return nil
}
