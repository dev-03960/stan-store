package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AffiliateService struct {
	repo     domain.AffiliateRepository
	saleRepo domain.AffiliateSaleRepository
	userRepo domain.UserRepository
}

func NewAffiliateService(repo domain.AffiliateRepository, saleRepo domain.AffiliateSaleRepository, userRepo domain.UserRepository) *AffiliateService {
	return &AffiliateService{
		repo:     repo,
		saleRepo: saleRepo,
		userRepo: userRepo,
	}
}

// Generate unique 8 char referral code
func generateReferralCode() string {
	b := make([]byte, 6)
	rand.Read(b)
	return strings.ToUpper(base64.URLEncoding.EncodeToString(b)[:8])
}

// Register creates an affiliate record dynamically hooking to a target creator
func (s *AffiliateService) Register(ctx context.Context, creatorID primitive.ObjectID, email string, name string) (*domain.Affiliate, error) {
	// Simple validation
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || name == "" {
		return nil, errors.New("email and name are required")
	}

	// Make sure creator exists
	_, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err != nil {
		return nil, errors.New("invalid creator")
	}

	// Check if they already exist
	existing, _ := s.repo.FindByEmailAndCreator(ctx, email, creatorID)
	if existing != nil {
		return nil, errors.New("email already registered as an affiliate for this creator")
	}

	aff := &domain.Affiliate{
		CreatorID:      creatorID,
		Email:          email,
		Name:           name,
		ReferralCode:   generateReferralCode(),
		CommissionRate: 0, // This is superseded dynamically by the Product-level commission upon conversion
		TotalClicks:    0,
		TotalSales:     0,
		TotalEarned:    0,
		Status:         "active",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	err = s.repo.Create(ctx, aff)
	if err != nil {
		return nil, err
	}

	return aff, nil
}

func (s *AffiliateService) GetCreatorAffiliates(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Affiliate, error) {
	return s.repo.FindAllByCreator(ctx, creatorID)
}

func (s *AffiliateService) TrackClick(ctx context.Context, code string) error {
	aff, err := s.repo.FindByCode(ctx, code)
	if err != nil || aff == nil {
		return errors.New("invalid referral code")
	}

	if aff.Status != "active" {
		return errors.New("affiliate is suspended")
	}

	return s.repo.UpdateStats(ctx, aff.ID, 0, false, true) // Just a click
}

// TrackSale provisions the `domain.AffiliateSale` safely mapped structurally to the original proxy affiliate tracking
func (s *AffiliateService) TrackSale(ctx context.Context, order *domain.Order, product *domain.Product) error {
	if order.ReferralCode == "" {
		return nil // Not a referred sale
	}

	if !product.AffiliateEnabled || product.CommissionRate <= 0 {
		return nil // Product doesn't allow commission
	}

	aff, err := s.repo.FindByCode(ctx, order.ReferralCode)
	if err != nil || aff == nil {
		return errors.New("affiliate code not found or invalid")
	}

	if aff.Status != "active" {
		return errors.New("affiliate inactive")
	}

	// Calculate commission structurally inside Parse floats
	// e.g., product commission = 25.5%, amount = 100000 paise
	commissionRaw := float64(order.Amount) * (product.CommissionRate / 100.0)
	commissionAmount := int64(commissionRaw)

	sale := &domain.AffiliateSale{
		AffiliateID:      aff.ID,
		OrderID:          order.ID,
		ProductID:        product.ID,
		OrderAmount:      order.Amount,
		CommissionAmount: commissionAmount,
		Status:           domain.AffiliateSalePending,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.saleRepo.Create(ctx, sale); err != nil {
		return err
	}

	// Update raw counts
	order.AffiliateID = &aff.ID
	return s.repo.UpdateStats(ctx, aff.ID, commissionAmount, true, false)
}

// GetAffiliateStats fetches an individual affiliates stats transparently across Creator spaces structurally
func (s *AffiliateService) GetAffiliateStats(ctx context.Context, code string) (map[string]interface{}, error) {
	aff, err := s.repo.FindByCode(ctx, code)
	if err != nil || aff == nil {
		return nil, errors.New("affiliate not found")
	}

	// Fetch explicit pending volumes
	sales, err := s.saleRepo.FindPendingByAffiliate(ctx, aff.ID)
	if err != nil {
		return nil, err
	}

	var pendingEarned int64 = 0
	for _, s := range sales {
		pendingEarned += s.CommissionAmount
	}

	return map[string]interface{}{
		"affiliate":     aff,
		"pendingPaid":   pendingEarned,
		"availablePaid": aff.TotalEarned - pendingEarned,
	}, nil
}
