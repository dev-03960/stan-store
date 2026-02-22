package domain

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// BankDetails holds the bank account information submitted by the creator.
type BankDetails struct {
	AccountHolderName string `json:"account_holder_name" validate:"required"`
	AccountNumber     string `json:"account_number" validate:"required"`
	IFSC              string `json:"ifsc" validate:"required"`
}

// PayoutServiceInterface defines the contract for payout operations.
type PayoutServiceInterface interface {
	// SavePayoutConfig orchestrates: Razorpay Contact → Fund Account → DB save
	SavePayoutConfig(ctx context.Context, creatorID primitive.ObjectID, details BankDetails) (*PayoutConfig, error)

	// GetPayoutConfig retrieves the current payout configuration for a creator
	GetPayoutConfig(ctx context.Context, creatorID primitive.ObjectID) (*PayoutConfig, error)
}
