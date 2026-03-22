package storage

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

type MongoAffiliateRepository struct {
	db                  *mongo.Database
	affiliateCollection *mongo.Collection
}

type MongoAffiliateSaleRepository struct {
	db             *mongo.Database
	saleCollection *mongo.Collection
}

func NewMongoAffiliateRepository(db *mongo.Database) *MongoAffiliateRepository {
	repo := &MongoAffiliateRepository{
		db:                  db,
		affiliateCollection: db.Collection("affiliates"),
	}

	repo.createIndexes()
	return repo
}

func NewMongoAffiliateSaleRepository(db *mongo.Database) *MongoAffiliateSaleRepository {
	repo := &MongoAffiliateSaleRepository{
		db:             db,
		saleCollection: db.Collection("affiliate_sales"),
	}

	repo.createIndexes()
	return repo
}

func (r *MongoAffiliateRepository) createIndexes() {
	_, err := r.affiliateCollection.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "referral_code", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "creator_id", Value: 1}, {Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		logger.Error("Failed to create affiliate indexes", "error", err.Error())
	}
}

func (r *MongoAffiliateSaleRepository) createIndexes() {
	_, err := r.saleCollection.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "affiliate_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "order_id", Value: 1}},
		},
	})
	if err != nil {
		logger.Error("Failed to create affiliate sales indexes", "error", err.Error())
	}
}

// Affiliate Operations

func (r *MongoAffiliateRepository) Create(ctx context.Context, aff *domain.Affiliate) error {
	result, err := r.affiliateCollection.InsertOne(ctx, aff)
	if err != nil {
		return err
	}
	aff.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *MongoAffiliateRepository) FindByCode(ctx context.Context, code string) (*domain.Affiliate, error) {
	var aff domain.Affiliate
	err := r.affiliateCollection.FindOne(ctx, bson.M{"referral_code": code}).Decode(&aff)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &aff, nil
}

func (r *MongoAffiliateRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*domain.Affiliate, error) {
	var aff domain.Affiliate
	err := r.affiliateCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&aff)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &aff, nil
}

func (r *MongoAffiliateRepository) FindByEmailAndCreator(ctx context.Context, email string, creatorID primitive.ObjectID) (*domain.Affiliate, error) {
	var aff domain.Affiliate
	err := r.affiliateCollection.FindOne(ctx, bson.M{"email": email, "creator_id": creatorID}).Decode(&aff)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &aff, nil
}

func (r *MongoAffiliateRepository) FindAllByCreator(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Affiliate, error) {
	cursor, err := r.affiliateCollection.Find(ctx, bson.M{"creator_id": creatorID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var affiliates []*domain.Affiliate
	if err = cursor.All(ctx, &affiliates); err != nil {
		return nil, err
	}
	if affiliates == nil {
		return []*domain.Affiliate{}, nil
	}
	return affiliates, nil
}

func (r *MongoAffiliateRepository) UpdateStats(ctx context.Context, affiliateID primitive.ObjectID, addedEarned int64, isSale bool, isClick bool) error {
	incObj := bson.M{}
	if addedEarned > 0 {
		incObj["total_earned"] = addedEarned
	}
	if isSale {
		incObj["total_sales"] = 1
	}
	if isClick {
		incObj["total_clicks"] = 1
	}

	if len(incObj) == 0 {
		return nil // nothing to increment
	}

	_, err := r.affiliateCollection.UpdateOne(
		ctx,
		bson.M{"_id": affiliateID},
		bson.M{"$inc": incObj},
	)
	return err
}

func (r *MongoAffiliateRepository) UpdateStatus(ctx context.Context, affiliateID primitive.ObjectID, status string) error {
	_, err := r.affiliateCollection.UpdateOne(
		ctx,
		bson.M{"_id": affiliateID},
		bson.M{"$set": bson.M{"status": status}},
	)
	return err
}

func (r *MongoAffiliateRepository) UpdateCommission(ctx context.Context, affiliateID primitive.ObjectID, rate float64) error {
	_, err := r.affiliateCollection.UpdateOne(
		ctx,
		bson.M{"_id": affiliateID},
		bson.M{"$set": bson.M{"commission_rate": rate}},
	)
	return err
}

// AffiliateSale Operations

func (r *MongoAffiliateSaleRepository) Create(ctx context.Context, sale *domain.AffiliateSale) error {
	result, err := r.saleCollection.InsertOne(ctx, sale)
	if err != nil {
		return err
	}
	sale.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *MongoAffiliateSaleRepository) FindAllByAffiliate(ctx context.Context, affiliateID primitive.ObjectID) ([]*domain.AffiliateSale, error) {
	cursor, err := r.saleCollection.Find(ctx, bson.M{"affiliate_id": affiliateID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var sales []*domain.AffiliateSale
	if err = cursor.All(ctx, &sales); err != nil {
		return nil, err
	}
	if sales == nil {
		return []*domain.AffiliateSale{}, nil
	}
	return sales, nil
}

func (r *MongoAffiliateSaleRepository) FindPendingByAffiliate(ctx context.Context, affiliateID primitive.ObjectID) ([]*domain.AffiliateSale, error) {
	cursor, err := r.saleCollection.Find(ctx, bson.M{"affiliate_id": affiliateID, "status": domain.AffiliateSalePending})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var sales []*domain.AffiliateSale
	if err = cursor.All(ctx, &sales); err != nil {
		return nil, err
	}
	if sales == nil {
		return []*domain.AffiliateSale{}, nil
	}
	return sales, nil
}

func (r *MongoAffiliateSaleRepository) FindAllByProduct(ctx context.Context, productID primitive.ObjectID) ([]*domain.AffiliateSale, error) {
	cursor, err := r.saleCollection.Find(ctx, bson.M{"product_id": productID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var sales []*domain.AffiliateSale
	if err = cursor.All(ctx, &sales); err != nil {
		return nil, err
	}
	if sales == nil {
		return []*domain.AffiliateSale{}, nil
	}
	return sales, nil
}

func (r *MongoAffiliateSaleRepository) UpdateStatus(ctx context.Context, saleID primitive.ObjectID, status domain.AffiliateSaleStatus) error {
	_, err := r.saleCollection.UpdateOne(
		ctx,
		bson.M{"_id": saleID},
		bson.M{"$set": bson.M{"status": status}},
	)
	return err
}
