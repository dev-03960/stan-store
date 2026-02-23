package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TestimonialService struct {
	repo        domain.TestimonialRepository
	productRepo domain.ProductRepository
	cache       domain.Cache
}

func NewTestimonialService(repo domain.TestimonialRepository, productRepo domain.ProductRepository, cache domain.Cache) *TestimonialService {
	return &TestimonialService{
		repo:        repo,
		productRepo: productRepo,
		cache:       cache,
	}
}

func (s *TestimonialService) invalidateCache(ctx context.Context, productID string) {
	if s.cache != nil {
		_ = s.cache.Delete(ctx, fmt.Sprintf("cache:testimonials:%s", productID))
	}
}

// CreateTestimonial adds a new review to a product
func (s *TestimonialService) CreateTestimonial(ctx context.Context, creatorID string, productID string, name string, text string, rating int, avatarURL string) (*domain.Testimonial, error) {
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	pID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return nil, errors.New("invalid product ID")
	}

	// Ensure the product exists and belongs to the creator
	product, err := s.productRepo.FindByID(ctx, pID)
	if err != nil || product == nil {
		return nil, errors.New("product not found")
	}
	if product.CreatorID != cID {
		return nil, errors.New("unauthorized: product does not belong to creator")
	}

	// Validate testimonial constraints
	if rating < 1 || rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}
	if len(text) > 300 {
		return nil, errors.New("testimonial text must be 300 characters or less")
	}

	// Enforce 10 testimonials max per product
	count, err := s.repo.CountByProductID(ctx, pID)
	if err != nil {
		return nil, fmt.Errorf("failed to count testimonials: %v", err)
	}
	if count >= 10 {
		return nil, errors.New("maximum of 10 testimonials allowed per product")
	}

	testimonial := &domain.Testimonial{
		ProductID:    pID,
		CreatorID:    cID,
		CustomerName: name,
		Text:         text,
		Rating:       rating,
		AvatarURL:    avatarURL,
		SortOrder:    int(count), // Append to the end by default
	}

	if err := s.repo.Create(ctx, testimonial); err != nil {
		return nil, fmt.Errorf("failed to create testimonial: %v", err)
	}

	s.invalidateCache(ctx, productID)

	return testimonial, nil
}

func (s *TestimonialService) GetPublicTestimonials(ctx context.Context, productID string) ([]*domain.Testimonial, error) {
	cacheKey := fmt.Sprintf("cache:testimonials:%s", productID)
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != "" {
			var testimonials []*domain.Testimonial
			if err := json.Unmarshal([]byte(cached), &testimonials); err == nil {
				return testimonials, nil
			}
		}
	}

	pID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return nil, errors.New("invalid product ID")
	}

	testimonials, err := s.repo.FindByProductID(ctx, pID)
	if err != nil {
		return nil, err
	}

	if s.cache != nil {
		if b, err := json.Marshal(testimonials); err == nil {
			_ = s.cache.Set(ctx, cacheKey, string(b), 30*time.Minute)
		}
	}

	return testimonials, nil
}

// UpdateTestimonial allows the creator to edit an existing testimonial
func (s *TestimonialService) UpdateTestimonial(ctx context.Context, creatorID string, testimonialID string, name string, text string, rating int, avatarURL string) (*domain.Testimonial, error) {
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	tID, err := primitive.ObjectIDFromHex(testimonialID)
	if err != nil {
		return nil, errors.New("invalid testimonial ID")
	}

	testimonial, err := s.repo.FindByID(ctx, tID)
	if err != nil || testimonial == nil {
		return nil, errors.New("testimonial not found")
	}

	if testimonial.CreatorID != cID {
		return nil, errors.New("unauthorized: testimonial does not belong to creator")
	}

	if rating < 1 || rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}
	if len(text) > 300 {
		return nil, errors.New("testimonial text must be 300 characters or less")
	}

	testimonial.CustomerName = name
	testimonial.Text = text
	testimonial.Rating = rating
	if avatarURL != "" {
		testimonial.AvatarURL = avatarURL
	}

	if err := s.repo.Update(ctx, testimonial); err != nil {
		return nil, err
	}

	s.invalidateCache(ctx, testimonial.ProductID.Hex())

	return testimonial, nil
}

// DeleteTestimonial allows a creator to remove a testimonial
func (s *TestimonialService) DeleteTestimonial(ctx context.Context, creatorID string, testimonialID string) error {
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	tID, err := primitive.ObjectIDFromHex(testimonialID)
	if err != nil {
		return errors.New("invalid testimonial ID")
	}

	testimonial, err := s.repo.FindByID(ctx, tID)
	if err != nil || testimonial == nil {
		return errors.New("testimonial not found")
	}

	if testimonial.CreatorID != cID {
		return errors.New("unauthorized: testimonial does not belong to creator")
	}

	if err := s.repo.Delete(ctx, tID); err != nil {
		return err
	}

	s.invalidateCache(ctx, testimonial.ProductID.Hex())
	return nil
}

// ReorderTestimonials updates the sort_order of testimonials for a specific product
func (s *TestimonialService) ReorderTestimonials(ctx context.Context, creatorID string, productID string, orderedIDs []string) error {
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	pID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return errors.New("invalid product ID")
	}

	// Fetch existing to verify ownership and existence
	testimonials, err := s.repo.FindByProductID(ctx, pID)
	if err != nil {
		return err
	}

	if len(testimonials) > 0 && testimonials[0].CreatorID != cID {
		return errors.New("unauthorized: testimonials do not belong to creator")
	}

	// We create a map for O(1) lookups
	tm := make(map[string]*domain.Testimonial)
	for _, t := range testimonials {
		tm[t.ID.Hex()] = t
	}

	// Update each testimonial's SortOrder based on the array position
	for index, strID := range orderedIDs {
		if t, ok := tm[strID]; ok {
			t.SortOrder = index
			_ = s.repo.Update(ctx, t)
		}
	}

	s.invalidateCache(ctx, productID)

	return nil
}
