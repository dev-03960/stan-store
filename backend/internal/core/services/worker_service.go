package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"github.com/hibiken/asynq"
)

// Task names
const (
	TypeEmailSend          = "email:send"
	TypeEmailAbandonedCart = "email:abandoned_cart"
	TypePostPurchase       = "email:post_purchase"
	TypeEmailDrip          = "email:drip_campaign"
	TypeAnalyticsAggregate = "analytics:aggregate"
	TypeInstagramDM        = "instagram:dm"
)

// Payload structs definition
type EmailPayload struct {
	ToAddress string `json:"to_address"`
	Subject   string `json:"subject"`
	BodyHTML  string `json:"body_html"`
}

type AbandonedCartPayload struct {
	OrderID string `json:"order_id"`
}

type PostPurchasePayload struct {
	OrderID string `json:"order_id"`
}

type DripCampaignPayload struct {
	CreatorID string `json:"creator_id"`
	ProductID string `json:"product_id"`
	UserEmail string `json:"user_email"`
	QueueID   string `json:"queue_id,omitempty"` // Included if we are actively traversing the queue
}

type AnalyticsPayload struct {
	CreatorID string `json:"creator_id"`
	Date      string `json:"date"`
}

type InstagramDMPayload struct {
	CreatorID string `json:"creator_id"`
	IGUserID  string `json:"ig_user_id"`
	Message   string `json:"message"`
}

type IGDeliverService interface {
	SendDM(ctx context.Context, creatorID string, recipientIGID string, message string) error
}

// WorkerService handles initialization and routing of background jobs
type WorkerService struct {
	server       *asynq.Server
	client       *asynq.Client
	mux          *asynq.ServeMux
	redisOpt     asynq.RedisClientOpt
	inspector    *asynq.Inspector
	orderService *OrderService
	emailService domain.EmailService
	igConnRepo   domain.InstagramConnectionRepository
	igAutoRepo   domain.InstagramAutomationRepository
	igDeliverSvc IGDeliverService
	analyticsSvc *AnalyticsService
	dailyRepo    domain.AnalyticsDailyRepository
	aggregator   interface {
		AggregateDailyMetrics(ctx context.Context, dateStr string) ([]domain.AnalyticsDaily, error)
	}
}

// NewWorkerService instances a new WorkerService with the provided Redis connection
func NewWorkerService(redisURL string) *WorkerService {
	// Configure redis connection for Asynq
	redisOpt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		logger.Fatal("Failed to parse redis url for asynq", "error", err)
	}

	// For standard Redis URI, ParseRedisURI returns RedisClientOpt.
	// Make sure we can type assert it safely.
	clientOpt, ok := redisOpt.(asynq.RedisClientOpt)
	if !ok {
		logger.Fatal("Failed to cast redis opt to asynq.RedisClientOpt")
	}

	// Client to enqueue tasks
	client := asynq.NewClient(clientOpt)

	// Server to process tasks
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			// Specify how many concurrent workers to use
			Concurrency: 10,
			// Custom error handler for dead lettering/metrics
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				logger.Error("Job processing failed",
					"type", task.Type(),
					"payload", string(task.Payload()),
					"error", err.Error(),
				)
			}),
			// Configure retries if needed globally (can also be per-task)
			RetryDelayFunc: func(n int, e error, t *asynq.Task) time.Duration {
				// Exponential backoff: 30s, 1m, 5m, 30m
				delays := []time.Duration{
					30 * time.Second,
					1 * time.Minute,
					5 * time.Minute,
					30 * time.Minute,
				}
				if n < len(delays) {
					return delays[n]
				}
				return delays[len(delays)-1]
			},
		},
	)

	mux := asynq.NewServeMux()

	inspector := asynq.NewInspector(clientOpt)

	return &WorkerService{
		server:    server,
		client:    client,
		mux:       mux,
		redisOpt:  clientOpt,
		inspector: inspector,
	}
}

// Start begins processing background jobs (blocking call, run in goroutine)
func (s *WorkerService) Start() error {
	s.registerHandlers()
	logger.Info("Starting background worker server...")
	return s.server.Run(s.mux)
}

// Stop gracefully shuts down the worker
func (s *WorkerService) Stop() {
	logger.Info("Stopping background worker server...")
	s.server.Shutdown()
	s.client.Close()
}

// GetClient returns the asynq client for enqueueing jobs from other services
func (s *WorkerService) GetClient() *asynq.Client {
	return s.client
}

// GetInspector returns a tool to inspect the queue remotely
func (s *WorkerService) GetInspector() *asynq.Inspector {
	return s.inspector
}

// Register Handlers maps task types to handler functions
func (s *WorkerService) registerHandlers() {
	s.mux.HandleFunc(TypeEmailSend, s.handleEmailSend)
	s.mux.HandleFunc(TypeEmailAbandonedCart, s.handleAbandonedCart)
	s.mux.HandleFunc(TypePostPurchase, s.handlePostPurchase)
	s.mux.HandleFunc(TypeEmailDrip, s.handleDripCampaign)
	s.mux.HandleFunc(TypeAnalyticsAggregate, s.handleAnalyticsAggregate)
	s.mux.HandleFunc(TypeInstagramDM, s.handleInstagramDM)
}

func (s *WorkerService) SetDependencies(
	orderService *OrderService,
	emailService domain.EmailService,
	igConnRepo domain.InstagramConnectionRepository,
	igAutoRepo domain.InstagramAutomationRepository,
	analyticsSvc *AnalyticsService,
	dailyRepo domain.AnalyticsDailyRepository,
	aggregator interface {
		AggregateDailyMetrics(ctx context.Context, dateStr string) ([]domain.AnalyticsDaily, error)
	},
) {
	s.orderService = orderService
	s.emailService = emailService
	s.igConnRepo = igConnRepo
	s.igAutoRepo = igAutoRepo
	s.analyticsSvc = analyticsSvc
	s.dailyRepo = dailyRepo
	s.aggregator = aggregator
}

func (s *WorkerService) SetInstagramDeliverService(svc IGDeliverService) {
	s.igDeliverSvc = svc
}

// --- Handlers ---

func (s *WorkerService) handleEmailSend(ctx context.Context, t *asynq.Task) error {
	var payload EmailPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry) // SkipRetry if payload is invalid
	}
	logger.Info("Simulating Email Send", "to", payload.ToAddress, "subject", payload.Subject)
	// TODO: Integrate actual email service
	return nil
}

func (s *WorkerService) handleAbandonedCart(ctx context.Context, t *asynq.Task) error {
	var payload AbandonedCartPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}
	logger.Info("Processing abandoned cart queue", "order_id", payload.OrderID)

	if s.orderService == nil || s.emailService == nil {
		return fmt.Errorf("dependencies missing in worker service")
	}

	err := s.orderService.ExecuteAbandonedCartReminder(ctx, payload.OrderID, s.emailService)
	if err != nil {
		logger.Error("Failed to execute abandoned cart reminder", "error", err)
		return err
	}

	return nil
}

// handlePostPurchase processes the delayed post-purchase follow-up
func (s *WorkerService) handlePostPurchase(ctx context.Context, t *asynq.Task) error {
	var payload PostPurchasePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}
	logger.Info("Processing post purchase queue", "order_id", payload.OrderID)

	if s.orderService == nil || s.emailService == nil {
		return fmt.Errorf("dependencies missing in worker service")
	}

	err := s.orderService.ExecutePostPurchaseSequence(ctx, payload.OrderID, s.emailService)
	if err != nil {
		logger.Error("Failed to execute post-purchase sequence", "error", err)
		return err
	}

	return nil
}

// handleDripCampaign processes a single email in the sequence and schedules the next
func (s *WorkerService) handleDripCampaign(ctx context.Context, t *asynq.Task) error {
	var payload DripCampaignPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	logger.Info("Validating and executing drip sequence", "trigger_product", payload.ProductID, "email", payload.UserEmail)

	if s.orderService == nil {
		return fmt.Errorf("dependencies missing in worker service")
	}

	err := s.orderService.ExecuteDripCampaignStep(ctx, payload, s.emailService, s.client)
	if err != nil {
		logger.Error("Failed to execute drip sequence", "error", err)
		return err
	}

	return nil
}

func (s *WorkerService) handleAnalyticsAggregate(ctx context.Context, t *asynq.Task) error {
	var payload AnalyticsPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}
	logger.Info("Aggregating analytics", "creator_id", payload.CreatorID, "date", payload.Date)
	// TODO: Aggregate daily stats
	return nil
}

func (s *WorkerService) handleInstagramDM(ctx context.Context, t *asynq.Task) error {
	var payload InstagramDMPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	if s.igConnRepo == nil || s.igAutoRepo == nil {
		return fmt.Errorf("instagram dependencies missing in worker service")
	}

	// 1. Fetch connection details
	conn, err := s.igConnRepo.FindByCreatorID(ctx, payload.CreatorID)
	if err != nil || conn == nil {
		return fmt.Errorf("instagram connection not found or error: %w", err)
	}

	if s.igDeliverSvc == nil {
		return fmt.Errorf("instagram deliver service missing in worker service")
	}

	logger.Info("Sending IG DM", "recipient", payload.IGUserID, "creator", payload.CreatorID)

	err = s.igDeliverSvc.SendDM(ctx, payload.CreatorID, payload.IGUserID, payload.Message)
	if err != nil {
		logger.Error("Failed to send IG DM", "error", err)
		return err
	}

	logger.Info("IG DM Sent successfully")

	return nil
}

// --- Task Enqueue Helpers ---

// EnqueueEmailTask helper function to fire off an email task
func EnqueueEmailTask(client *asynq.Client, payload EmailPayload) error {
	p, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	task := asynq.NewTask(TypeEmailSend, p, asynq.MaxRetry(4))
	info, err := client.Enqueue(task)
	if err != nil {
		return err
	}
	logger.Info("enqueued email task", "id", info.ID, "queue", info.Queue)
	return nil
}

// EnqueueAbandonedCartTask schedules a task to send an abandoned cart email using an injected client
func EnqueueAbandonedCartTask(client *asynq.Client, orderID string) error {
	payload := AbandonedCartPayload{OrderID: orderID}
	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	task := asynq.NewTask(TypeEmailAbandonedCart, bytes)
	_, err = client.Enqueue(task)
	return err
}

// EnqueuePostPurchaseTask schedules a delayed task to send the post-purchase flow
func EnqueuePostPurchaseTask(client *asynq.Client, orderID string, delay time.Duration) error {
	payload := PostPurchasePayload{OrderID: orderID}
	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	task := asynq.NewTask(TypePostPurchase, bytes)
	_, err = client.Enqueue(task, asynq.ProcessIn(delay))
	return err
}

// EnqueueStartDripCampaignTask triggers the initiation of a drip campaign sequence
func EnqueueStartDripCampaignTask(client *asynq.Client, creatorID string, productID string, userEmail string) error {
	payload := DripCampaignPayload{
		CreatorID: creatorID,
		ProductID: productID,
		UserEmail: userEmail,
	}
	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	// Note: We kick off the checking task immediately. Wait handling is delegated downstream.
	task := asynq.NewTask(TypeEmailDrip, bytes)
	_, err = client.Enqueue(task)
	return err
}

func EnqueueDripCampaignStepTask(client *asynq.Client, queueID string, creatorID string, productID string, userEmail string, delay time.Duration) error {
	payload := DripCampaignPayload{
		CreatorID: creatorID,
		ProductID: productID,
		UserEmail: userEmail,
		QueueID:   queueID,
	}
	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	task := asynq.NewTask(TypeEmailDrip, bytes)
	_, err = client.Enqueue(task, asynq.ProcessIn(delay))
	return err
}
