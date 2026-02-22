package services

import (
	"context"
	"fmt"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

// AIService orchestrates the AI copywriting generation with rate limiting.
type AIService struct {
	generator domain.CopyGenerator
	cache     domain.Cache
}

// NewAIService creates a new AIService instance.
func NewAIService(generator domain.CopyGenerator, cache domain.Cache) *AIService {
	return &AIService{
		generator: generator,
		cache:     cache,
	}
}

// GenerateCopy handles the rate limiting and triggers the generator.
func (s *AIService) GenerateCopy(ctx context.Context, creatorID string, prompt string) (*domain.CopyResult, error) {
	const maxRequestsPerDay = 10
	today := time.Now().UTC().Format("2006-01-02")
	rateLimitKey := fmt.Sprintf("ai:usage:%s:%s", creatorID, today)

	// Increment usage
	usage, err := s.cache.Increment(ctx, rateLimitKey)
	if err != nil {
		// Log error but allow process to continue for resilience / graceful degradation
		usage = 1 // Treat as first usage if cache error occurs
	}

	// If this is the first usage of the day, set expiration to 24 hours
	if usage == 1 {
		_ = s.cache.Expire(ctx, rateLimitKey, 24*time.Hour)
	}

	// Check limit
	if usage > maxRequestsPerDay {
		return nil, fmt.Errorf("rate limit exceeded: maximum 10 generations per day")
	}

	// Generate copy
	result, err := s.generator.GenerateCopy(ctx, prompt)
	if err != nil {
		return nil, err
	}

	return result, nil
}
