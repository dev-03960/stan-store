package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// EmailTemplateType denotes the purpose of the automated email
type EmailTemplateType string

const (
	TemplateTypePostPurchase EmailTemplateType = "post_purchase"
	// Future expansions: abandoned_cart, welcome_sequence, etc.
)

// EmailTemplate represents a customizable email sequence payload per creator
type EmailTemplate struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID    primitive.ObjectID `bson:"creator_id" json:"creatorId"`
	TemplateType EmailTemplateType  `bson:"template_type" json:"templateType"`
	Subject      string             `bson:"subject" json:"subject"`
	BodyHTML     string             `bson:"body_html" json:"bodyHtml"`
	DelayDays    int                `bson:"delay_days" json:"delayDays"`
	IsActive     bool               `bson:"is_active" json:"isActive"`
	CreatedAt    time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updatedAt"`
}

// EmailTemplateRepository defines operations for the EmailTemplate data access layer
type EmailTemplateRepository interface {
	FindByCreatorAndType(ctx context.Context, creatorID primitive.ObjectID, templateType EmailTemplateType) (*EmailTemplate, error)
	Upsert(ctx context.Context, template *EmailTemplate) error
}
