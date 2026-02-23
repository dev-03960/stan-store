package storage

import (
	"context"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoEmailTemplateRepository struct {
	collection *mongo.Collection
}

func NewMongoEmailTemplateRepository(db *mongo.Database) *MongoEmailTemplateRepository {
	return &MongoEmailTemplateRepository{
		collection: db.Collection("email_templates"),
	}
}

func (r *MongoEmailTemplateRepository) FindByCreatorAndType(ctx context.Context, creatorID primitive.ObjectID, templateType domain.EmailTemplateType) (*domain.EmailTemplate, error) {
	filter := bson.M{
		"creator_id":    creatorID,
		"template_type": templateType,
	}

	var template domain.EmailTemplate
	err := r.collection.FindOne(ctx, filter).Decode(&template)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // Not found is a valid state if they haven't customized one yet
		}
		return nil, err
	}

	return &template, nil
}

func (r *MongoEmailTemplateRepository) Upsert(ctx context.Context, template *domain.EmailTemplate) error {
	filter := bson.M{
		"creator_id":    template.CreatorID,
		"template_type": template.TemplateType,
	}

	now := time.Now()
	template.UpdatedAt = now

	update := bson.M{
		"$set": bson.M{
			"subject":    template.Subject,
			"body_html":  template.BodyHTML,
			"delay_days": template.DelayDays,
			"is_active":  template.IsActive,
			"updated_at": template.UpdatedAt,
		},
		"$setOnInsert": bson.M{
			"created_at": now,
		},
	}

	opts := options.Update().SetUpsert(true)

	// Execute UpdateOne with Upsert option
	// Note: While this updates/inserts, it does not re-populate the strict ObjectID into the reference struct
	// unless explicitly searched, however since the frontend mostly cares about the state update success, this is highly efficient.
	_, err := r.collection.UpdateOne(ctx, filter, update, opts)
	return err
}
