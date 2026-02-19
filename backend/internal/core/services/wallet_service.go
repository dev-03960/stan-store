package services

import (
	"context"
	"fmt"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WalletService struct {
	repo domain.TransactionRepository
}

func NewWalletService(repo domain.TransactionRepository) *WalletService {
	return &WalletService{
		repo: repo,
	}
}

// CreditTransaction adds a credit transaction to the creator's wallet
func (s *WalletService) CreditTransaction(ctx context.Context, creatorID primitive.ObjectID, amount int64, description string, refID string, source domain.TransactionSource) error {
	tx := &domain.Transaction{
		CreatorID:   creatorID,
		Amount:      amount,
		Type:        domain.TransactionTypeCredit,
		Source:      source,
		ReferenceID: refID,
		Description: description,
	}
	if err := s.repo.Create(ctx, tx); err != nil {
		return fmt.Errorf("failed to create credit transaction: %w", err)
	}
	return nil
}

// GetWalletDetails returns the current balance and recent transactions
func (s *WalletService) GetWalletDetails(ctx context.Context, creatorID primitive.ObjectID) (int64, []*domain.Transaction, error) {
	balance, err := s.repo.GetBalance(ctx, creatorID)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to get balance: %w", err)
	}

	transactions, err := s.repo.FindAllByCreatorID(ctx, creatorID)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	return balance, transactions, nil
}
