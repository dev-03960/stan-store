package services

import (
	"context"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PlatformReferralService struct {
	referralRepo    domain.PlatformReferralRepository
	transactionRepo domain.TransactionRepository
}

func NewPlatformReferralService(
	referralRepo domain.PlatformReferralRepository,
	transactionRepo domain.TransactionRepository,
) *PlatformReferralService {
	return &PlatformReferralService{
		referralRepo:    referralRepo,
		transactionRepo: transactionRepo,
	}
}

// GetReferralDashboard returns metrics and a list of referrals for the creator dashboard.
func (s *PlatformReferralService) GetReferralDashboard(ctx context.Context, creatorID primitive.ObjectID) (map[string]interface{}, error) {
	referrals, err := s.referralRepo.FindAllByReferrerID(ctx, creatorID)
	if err != nil {
		return nil, err
	}

	txs, err := s.transactionRepo.FindAllByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, err
	}

	totalCommission := int64(0)
	for _, tx := range txs {
		if tx.Source == domain.TransactionSourceReferral && tx.Type == domain.TransactionTypeCredit {
			totalCommission += tx.Amount
		}
	}

	return map[string]interface{}{
		"referrals":        referrals,
		"total_referrals":  len(referrals),
		"total_commission": totalCommission,
	}, nil
}
