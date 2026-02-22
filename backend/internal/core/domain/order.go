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

// LineItem represents a single product within an order (supports multi-product orders)
type LineItem struct {
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	Title       string             `bson:"title" json:"title"`
	Amount      int64              `bson:"amount" json:"amount"` // In paise
	ProductType ProductType        `bson:"product_type" json:"product_type"`
}

// Order represents a purchase order in the system
type Order struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID         primitive.ObjectID `bson:"product_id" json:"product_id"`           // Legacy: kept for backward compat
	LineItems         []LineItem         `bson:"line_items,omitempty" json:"line_items"` // Canonical multi-product field
	BookingSlotStart  *time.Time         `bson:"booking_slot_start,omitempty" json:"booking_slot_start,omitempty"`
	BookingSlotEnd    *time.Time         `bson:"booking_slot_end,omitempty" json:"booking_slot_end,omitempty"`
	CreatorID         primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	CustomerEmail     string             `bson:"customer_email" json:"customer_email"`
	CustomerName      string             `bson:"customer_name" json:"customer_name"`
	Amount            int64              `bson:"amount" json:"amount"` // In paise (total order amount)
	CouponCode        string             `bson:"coupon_code,omitempty" json:"coupon_code,omitempty"`
	DiscountAmount    int64              `bson:"discount_amount,omitempty" json:"discount_amount,omitempty"`
	PlatformFee       int64              `bson:"platform_fee,omitempty" json:"platform_fee,omitempty"` // In paise
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
	UpdatePlatformFee(ctx context.Context, orderID primitive.ObjectID, fee int64) error
	FindByRazorpayOrderID(ctx context.Context, razorpayOrderID string) (*Order, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Order, error)
	FindAllByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]*Order, error)
	FindAllByCustomerEmail(ctx context.Context, email string) ([]*Order, error)
}
