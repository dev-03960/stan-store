package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TransactionType defines the type of transaction
type TransactionType string

const (
	TransactionTypeCredit TransactionType = "credit"
	TransactionTypeDebit  TransactionType = "debit"
)

// TransactionSource defines the source of the transaction
type TransactionSource string

const (
	TransactionSourceOrder  TransactionSource = "order"
	TransactionSourcePayout TransactionSource = "payout"
)

// Transaction represents a financial record in the immutable ledger
type Transaction struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID   primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Amount      int64              `bson:"amount" json:"amount"` // In paise/cents. Positive for Credit, Negative for Debit? Or just absolute value with Type. Let's use absolute value + Type.
	Type        TransactionType    `bson:"type" json:"type"`
	Source      TransactionSource  `bson:"source" json:"source"`
	ReferenceID string             `bson:"reference_id" json:"reference_id"` // OrderID or PayoutID
	Description string             `bson:"description" json:"description"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
}

// TransactionRepository defines the interface for transaction storage
type TransactionRepository interface {
	Create(ctx context.Context, tx *Transaction) error
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Transaction, error)
	GetBalance(ctx context.Context, creatorID primitive.ObjectID) (int64, error)
}
