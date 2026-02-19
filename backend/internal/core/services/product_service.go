package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

// ProductService handles business logic for products.
type ProductService struct {
	repo domain.ProductRepository
}

// NewProductService creates a new ProductService.
func NewProductService(repo domain.ProductRepository) *ProductService {
	return &ProductService{
		repo: repo,
	}
}

// CreateProduct creates a new product with validation.
func (s *ProductService) CreateProduct(ctx context.Context, input *domain.Product) (*domain.Product, error) {
	if err := s.validateProduct(input); err != nil {
		return nil, err
	}

	// Set default values
	input.ID = primitive.NewObjectID()
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()
	if input.ProductType == "" {
		input.ProductType = domain.ProductTypeDownload
	}
	// Default visibility is true, but bool defaults to false.
	// The handler should handle this or we can't distinguish false from missing.
	// Assuming handler sets it or we treat false as hidden. Logic says default true.
	// Let's assume input comes with correct bool or we set it here if nil? Go bool is value type.
	// We'll rely on handler/DTO mapping to set IsVisible to true by default if not tailored.

	if err := s.repo.Create(ctx, input); err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	return input, nil
}

// GetProductByID retrieves a product by ID.
func (s *ProductService) GetProductByID(ctx context.Context, id string) (*domain.Product, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid product ID")
	}

	product, err := s.repo.FindByID(ctx, oid)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, errors.New("product not found")
	}

	return product, nil
}

// GetCreatorProducts retrieves all products for a creator.
func (s *ProductService) GetCreatorProducts(ctx context.Context, creatorID string) ([]*domain.Product, error) {
	oid, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	return s.repo.FindAllByCreatorID(ctx, oid)
}

// UpdateProduct updates a product with ownership check.
func (s *ProductService) UpdateProduct(ctx context.Context, id string, creatorID string, updates *domain.Product) (*domain.Product, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid product ID")
	}

	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	// 1. Fetch existing product
	existing, err := s.repo.FindByID(ctx, oid)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("product not found")
	}

	// 2. Ownership check
	if existing.CreatorID != cID {
		return nil, errors.New("unauthorized: you do not own this product")
	}

	// 3. Apply updates
	if updates.Title != "" {
		existing.Title = updates.Title
	}
	if updates.Description != "" {
		existing.Description = updates.Description
	}
	if updates.Price != 0 {
		existing.Price = updates.Price
	}
	if updates.CoverImageURL != "" {
		existing.CoverImageURL = updates.CoverImageURL
	}
	// Note: We might want to allow updating visibility and sort order too.
	// Assuming 'updates' contains the fields to change.
	// Bool fields are tricky with zero values. Ideally we use a map or pointer fields for updates.
	// For now, let's assume if it's in the struct, we take it, but Price 0 is valid? No, min price is 100.

	// Re-validate known fields
	if err := s.validateProduct(existing); err != nil {
		return nil, err
	}

	existing.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return existing, nil
}

// DeleteProduct soft-deletes a product with ownership check.
func (s *ProductService) DeleteProduct(ctx context.Context, id string, creatorID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid product ID")
	}

	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	// 1. Fetch existing product
	existing, err := s.repo.FindByID(ctx, oid)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("product not found")
	}

	// 2. Ownership check
	if existing.CreatorID != cID {
		return errors.New("unauthorized: you do not own this product")
	}

	return s.repo.Delete(ctx, oid)
}

// validateProduct validates product fields.
func (s *ProductService) validateProduct(p *domain.Product) error {
	if p.Title == "" {
		return errors.New("title is required")
	}
	if len(p.Title) > 100 {
		return errors.New("title exceeds 100 characters")
	}
	if len(p.Description) > 500 {
		return errors.New("description exceeds 500 characters")
	}
	if p.Price < 100 {
		return errors.New("price must be at least ₹1 (100 paise)")
	}
	if p.Price > 10000000 {
		return errors.New("price exceeds limit of ₹1,00,000")
	}
	return nil
}

// ToggleVisibility updates the visibility of a product.
func (s *ProductService) ToggleVisibility(ctx context.Context, id string, creatorID string, isVisible bool) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid product ID")
	}

	cid, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	// 1. Fetch existing product to distinguish between NotFound and Unauthorized
	existing, err := s.repo.FindByID(ctx, oid)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("product not found")
	}

	// 2. Ownership check
	if existing.CreatorID != cid {
		return errors.New("unauthorized: you do not own this product")
	}

	// Repository handles ownership check via filter too, which is fine
	return s.repo.UpdateVisibility(ctx, oid, cid, isVisible)
}

// ReorderProducts updates the sort order of products.
func (s *ProductService) ReorderProducts(ctx context.Context, creatorID string, productIDs []string) error {
	cid, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	oids := make([]primitive.ObjectID, 0, len(productIDs))
	for _, id := range productIDs {
		oid, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			continue // Skip invalid IDs
		}
		oids = append(oids, oid)
	}

	if len(oids) == 0 {
		return nil
	}

	return s.repo.ReorderProducts(ctx, cid, oids)
}
