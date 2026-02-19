package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// OrderStatus defines the status of an order
type OrderStatus string

const (
	OrderStatusCreated OrderStatus = "created"
	OrderStatusPaid    OrderStatus = "paid"
	OrderStatusFailed  OrderStatus = "failed"
)

// Order represents a purchase order in the system
type Order struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID         primitive.ObjectID `bson:"product_id" json:"product_id"`
	CreatorID         primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	CustomerEmail     string             `bson:"customer_email" json:"customer_email"`
	CustomerName      string             `bson:"customer_name" json:"customer_name"`
	Amount            int64              `bson:"amount" json:"amount"` // In paise
	Currency          string             `bson:"currency" json:"currency"`
	RazorpayOrderID   string             `bson:"razorpay_order_id" json:"razorpay_order_id"`
	RazorpayPaymentID string             `bson:"razorpay_payment_id,omitempty" json:"razorpay_payment_id,omitempty"`
	Status            OrderStatus        `bson:"status" json:"status"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}

// OrderRepository defines the interface for order storage
type OrderRepository interface {
	Create(ctx context.Context, order *Order) error
	UpdateStatus(ctx context.Context, razorpayOrderID string, status OrderStatus, paymentID string) error
	FindByRazorpayOrderID(ctx context.Context, razorpayOrderID string) (*Order, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Order, error)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Order, error)
}
