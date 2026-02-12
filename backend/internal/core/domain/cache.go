package domain

import (
	"context"
	"time"
)

// Cache defines the caching interface for key-value storage.
// Implementations must handle graceful degradation — if the backing store
// is unavailable, operations should return cache-miss (not errors).
type Cache interface {
	// Get retrieves a value by key. Returns empty string and no error on cache miss.
	Get(ctx context.Context, key string) (string, error)

	// Set stores a value with the given TTL. Use 0 for no expiration.
	Set(ctx context.Context, key string, value string, ttl time.Duration) error

	// Delete removes a key from the cache.
	Delete(ctx context.Context, key string) error

	// Exists checks if a key exists in the cache.
	Exists(ctx context.Context, key string) (bool, error)
}
