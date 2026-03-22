package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Affiliate represents a registered partner driving traffic for a creator
type Affiliate struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID      primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Email          string             `bson:"email" json:"email"`
	Name           string             `bson:"name" json:"name"`
	ReferralCode   string             `bson:"referral_code" json:"referral_code"`     // Unique 8-char code
	CommissionRate float64            `bson:"commission_rate" json:"commission_rate"` // e.g. 10.5 (%)
	TotalClicks    int64              `bson:"total_clicks" json:"total_clicks"`
	TotalSales     int64              `bson:"total_sales" json:"total_sales"`
	TotalEarned    int64              `bson:"total_earned" json:"total_earned"` // in paise
	Status         string             `bson:"status" json:"status"`             // "active", "suspended"
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updated_at"`
}

type AffiliateSaleStatus string

const (
	AffiliateSalePending  AffiliateSaleStatus = "pending"
	AffiliateSalePaid     AffiliateSaleStatus = "paid"
	AffiliateSaleRefunded AffiliateSaleStatus = "refunded"
)

// AffiliateSale represents a captured commission logic for a parsed checkout
type AffiliateSale struct {
	ID               primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	AffiliateID      primitive.ObjectID  `bson:"affiliate_id" json:"affiliate_id"`
	OrderID          primitive.ObjectID  `bson:"order_id" json:"order_id"`
	ProductID        primitive.ObjectID  `bson:"product_id" json:"product_id"`
	OrderAmount      int64               `bson:"order_amount" json:"order_amount"`
	CommissionAmount int64               `bson:"commission_amount" json:"commission_amount"` // In paise
	Status           AffiliateSaleStatus `bson:"status" json:"status"`
	CreatedAt        time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time           `bson:"updated_at" json:"updated_at"`
}

// Repository Interfaces

type AffiliateRepository interface {
	Create(ctx context.Context, aff *Affiliate) error
	FindByCode(ctx context.Context, code string) (*Affiliate, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Affiliate, error)
	FindByEmailAndCreator(ctx context.Context, email string, creatorID primitive.ObjectID) (*Affiliate, error)
	FindAllByCreator(ctx context.Context, creatorID primitive.ObjectID) ([]*Affiliate, error)
	UpdateStats(ctx context.Context, affiliateID primitive.ObjectID, addedEarned int64, isSale bool, isClick bool) error
	UpdateStatus(ctx context.Context, affiliateID primitive.ObjectID, status string) error
	UpdateCommission(ctx context.Context, affiliateID primitive.ObjectID, rate float64) error
}

type AffiliateSaleRepository interface {
	Create(ctx context.Context, sale *AffiliateSale) error
	FindAllByAffiliate(ctx context.Context, affiliateID primitive.ObjectID) ([]*AffiliateSale, error)
	FindPendingByAffiliate(ctx context.Context, affiliateID primitive.ObjectID) ([]*AffiliateSale, error)
	FindAllByProduct(ctx context.Context, productID primitive.ObjectID) ([]*AffiliateSale, error)
	UpdateStatus(ctx context.Context, saleID primitive.ObjectID, status AffiliateSaleStatus) error
}
