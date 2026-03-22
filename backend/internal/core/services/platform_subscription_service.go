package services

import (
	"context"
	"fmt"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	TrialDurationDays = 30
)

// PlatformSubscriptionService handles platform subscription logic.
type PlatformSubscriptionService struct {
	subRepo         domain.PlatformSubscriptionRepository
	userRepo        domain.UserRepository
	referralRepo    domain.PlatformReferralRepository
	transactionRepo domain.TransactionRepository
}

// NewPlatformSubscriptionService creates a new PlatformSubscriptionService.
func NewPlatformSubscriptionService(
	subRepo domain.PlatformSubscriptionRepository,
	userRepo domain.UserRepository,
	referralRepo domain.PlatformReferralRepository,
	transactionRepo domain.TransactionRepository,
) *PlatformSubscriptionService {
	return &PlatformSubscriptionService{
		subRepo:         subRepo,
		userRepo:        userRepo,
		referralRepo:    referralRepo,
		transactionRepo: transactionRepo,
	}
}

// StartTrial creates a 30-day trial subscription for a new creator.
func (s *PlatformSubscriptionService) StartTrial(ctx context.Context, creatorID primitive.ObjectID, email, name string) error {
	// Check if subscription already exists
	existing, err := s.subRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("failed to check existing subscription: %w", err)
	}
	if existing != nil {
		return nil // Already has a subscription, skip
	}

	now := time.Now()
	sub := &domain.PlatformSubscription{
		CreatorID:    creatorID,
		Plan:         domain.SubTierTrial,
		Status:       domain.SubStatusTrial,
		TrialEndsAt:  now.AddDate(0, 0, TrialDurationDays),
		CreatorEmail: email,
		CreatorName:  name,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.subRepo.Create(ctx, sub); err != nil {
		return fmt.Errorf("failed to create trial subscription: %w", err)
	}

	// Update user tier
	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err == nil && user != nil {
		user.SubscriptionTier = domain.SubStatusTrial
		s.userRepo.Update(ctx, creatorID.Hex(), user)
	}

	return nil
}

// GetSubscriptionStatus returns the current subscription status for a creator.
func (s *PlatformSubscriptionService) GetSubscriptionStatus(ctx context.Context, creatorID primitive.ObjectID) (*domain.PlatformSubscription, error) {
	sub, err := s.subRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch subscription: %w", err)
	}

	if sub == nil {
		return nil, nil
	}

	// Auto-expire trials
	if sub.Status == domain.SubStatusTrial && time.Now().After(sub.TrialEndsAt) {
		sub.Status = domain.SubStatusExpired
		sub.UpdatedAt = time.Now()
		s.subRepo.Update(ctx, sub)

		// Update user tier
		user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
		if err == nil && user != nil {
			user.SubscriptionTier = domain.SubStatusExpired
			s.userRepo.Update(ctx, creatorID.Hex(), user)
		}
	}

	return sub, nil
}

// ActivateSubscription marks a creator's subscription as active (after Razorpay payment).
func (s *PlatformSubscriptionService) ActivateSubscription(ctx context.Context, creatorID primitive.ObjectID, razorpaySubID string, periodEnd time.Time) error {
	sub, err := s.subRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("failed to fetch subscription: %w", err)
	}

	now := time.Now()
	if sub == nil {
		// Create new if not exists (e.g., admin flow)
		sub = &domain.PlatformSubscription{
			CreatorID: creatorID,
			CreatedAt: now,
		}
	}

	sub.Plan = domain.SubTierBasic
	sub.Status = domain.SubStatusActive
	sub.RazorpaySubID = razorpaySubID
	sub.CurrentPeriodStart = now
	sub.CurrentPeriodEnd = periodEnd
	sub.UpdatedAt = now

	if sub.ID.IsZero() {
		if err := s.subRepo.Create(ctx, sub); err != nil {
			return fmt.Errorf("failed to create subscription: %w", err)
		}
	} else {
		if err := s.subRepo.Update(ctx, sub); err != nil {
			return fmt.Errorf("failed to update subscription: %w", err)
		}
	}

	// Update user tier
	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err == nil && user != nil {
		user.SubscriptionTier = domain.SubStatusActive
		s.userRepo.Update(ctx, creatorID.Hex(), user)
	}

	// Process referral commission (20% of ₹499 = ₹99.80 = 9980 paise)
	s.processReferralCommission(ctx, creatorID, sub)

	return nil
}

// CancelSubscription marks a creator's subscription as cancelled.
func (s *PlatformSubscriptionService) CancelSubscription(ctx context.Context, creatorID primitive.ObjectID) error {
	sub, err := s.subRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("failed to fetch subscription: %w", err)
	}
	if sub == nil {
		return fmt.Errorf("no subscription found")
	}

	sub.Status = domain.SubStatusCancelled
	sub.UpdatedAt = time.Now()

	if err := s.subRepo.Update(ctx, sub); err != nil {
		return fmt.Errorf("failed to cancel subscription: %w", err)
	}

	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err == nil && user != nil {
		user.SubscriptionTier = domain.SubStatusCancelled
		s.userRepo.Update(ctx, creatorID.Hex(), user)
	}

	return nil
}

// --- Admin Operations ---

// AdminGrantSubscription manually grants a subscription to a creator.
func (s *PlatformSubscriptionService) AdminGrantSubscription(ctx context.Context, creatorID primitive.ObjectID, months int) error {
	sub, err := s.subRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("failed to fetch subscription: %w", err)
	}

	now := time.Now()
	periodEnd := now.AddDate(0, months, 0)

	if sub == nil {
		user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
		if err != nil {
			return fmt.Errorf("failed to find user: %w", err)
		}
		if user == nil {
			return fmt.Errorf("user not found")
		}
		sub = &domain.PlatformSubscription{
			CreatorID:    creatorID,
			CreatorEmail: user.Email,
			CreatorName:  user.DisplayName,
			CreatedAt:    now,
		}
	}

	sub.Plan = domain.SubTierBasic
	sub.Status = domain.SubStatusActive
	sub.GrantedByAdmin = true
	sub.CurrentPeriodStart = now
	sub.CurrentPeriodEnd = periodEnd
	sub.UpdatedAt = now

	if sub.ID.IsZero() {
		if err := s.subRepo.Create(ctx, sub); err != nil {
			return fmt.Errorf("failed to create subscription: %w", err)
		}
	} else {
		if err := s.subRepo.Update(ctx, sub); err != nil {
			return fmt.Errorf("failed to update subscription: %w", err)
		}
	}

	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err == nil && user != nil {
		user.SubscriptionTier = domain.SubStatusActive
		s.userRepo.Update(ctx, creatorID.Hex(), user)
	}

	// Process referral commission (20% of ₹499 = ₹99.80 = 9980 paise)
	s.processReferralCommission(ctx, creatorID, sub)

	return nil
}

// AdminRevokeSubscription revokes a creator's subscription.
func (s *PlatformSubscriptionService) AdminRevokeSubscription(ctx context.Context, creatorID primitive.ObjectID) error {
	return s.CancelSubscription(ctx, creatorID)
}

// AdminAddCreator creates a new creator user with a trial subscription.
func (s *PlatformSubscriptionService) AdminAddCreator(ctx context.Context, email, name string) (*domain.User, error) {
	// Check if user already exists
	existing, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("user with this email already exists")
	}

	now := time.Now()
	user := &domain.User{
		Email:                email,
		DisplayName:          name,
		SubscriptionTier:     domain.SubStatusTrial,
		Role:                 domain.RoleCreator,
		Status:               domain.UserStatusActive,
		Theme:                "minimal",
		PlatformFeeRate:      5.0,
		AbandonedCartEnabled: true,
		SocialLinks:          []domain.SocialLink{},
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	createdUser, err := s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Start trial for the new user
	if err := s.StartTrial(ctx, createdUser.ID, email, name); err != nil {
		return createdUser, fmt.Errorf("user created but failed to start trial: %w", err)
	}

	return createdUser, nil
}

// SubscriptionAnalytics holds aggregated subscription metrics.
type SubscriptionAnalytics struct {
	TotalActive    int64   `json:"total_active"`
	TotalTrial     int64   `json:"total_trial"`
	TotalCancelled int64   `json:"total_cancelled"`
	TotalExpired   int64   `json:"total_expired"`
	MRR            float64 `json:"mrr"`  // Monthly Recurring Revenue (you'll set the price)
	ChurnRate      float64 `json:"churn_rate"` // cancelled / (active + cancelled) * 100
}

// GetAnalytics returns platform subscription analytics for admin.
func (s *PlatformSubscriptionService) GetAnalytics(ctx context.Context) (*SubscriptionAnalytics, error) {
	counts, err := s.subRepo.CountByStatus(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription counts: %w", err)
	}

	active := counts[domain.SubStatusActive]
	trial := counts[domain.SubStatusTrial]
	cancelled := counts[domain.SubStatusCancelled]
	expired := counts[domain.SubStatusExpired]

	// MRR = active subscribers * monthly price (placeholder ₹499/month = 49900 paise)
	mrr := float64(active) * 499.0

	var churnRate float64
	total := active + cancelled
	if total > 0 {
		churnRate = float64(cancelled) / float64(total) * 100
	}

	return &SubscriptionAnalytics{
		TotalActive:    active,
		TotalTrial:     trial,
		TotalCancelled: cancelled,
		TotalExpired:   expired,
		MRR:            mrr,
		ChurnRate:      churnRate,
	}, nil
}

// ListSubscriptions returns all platform subscriptions with pagination and filtering.
func (s *PlatformSubscriptionService) ListSubscriptions(ctx context.Context, filter domain.Filter, pagination *domain.Pagination) ([]*domain.PlatformSubscription, *domain.PaginationMeta, error) {
	return s.subRepo.FindAll(ctx, filter, pagination)
}

func (s *PlatformSubscriptionService) processReferralCommission(ctx context.Context, creatorID primitive.ObjectID, sub *domain.PlatformSubscription) {
	referral, _ := s.referralRepo.FindByReferredID(ctx, creatorID)
	if referral != nil && referral.Status != domain.ReferralStatusCancelled {
		if referral.Status == domain.ReferralStatusPending {
			s.referralRepo.UpdateStatus(ctx, referral.ID, domain.ReferralStatusActive)
		}

		commissionAmount := int64(9980) // 20% of 499 INR

		tx := &domain.Transaction{
			CreatorID:   referral.ReferrerID,
			Amount:      commissionAmount,
			Type:        domain.TransactionTypeCredit,
			Source:      domain.TransactionSourceReferral,
			ReferenceID: sub.ID.Hex(),
			Description: fmt.Sprintf("Referral commission for %s's subscription", referral.ReferredUsername),
			CreatedAt:   time.Now(),
		}
		_ = s.transactionRepo.Create(ctx, tx)
	}
}
