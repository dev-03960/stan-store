package storage

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache implements domain.Cache using Redis as the backing store.
// It supports graceful degradation — if the Redis client is nil, all operations
// return cache-miss results without errors.
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache creates a new RedisCache from a RedisClient.
func NewRedisCache(rc *RedisClient) *RedisCache {
	return &RedisCache{
		client: rc.Client,
	}
}

// Get retrieves a value by key. Returns empty string on cache miss or if Redis is unavailable.
func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	if c.client == nil {
		return "", nil // Graceful degradation: treat as cache miss
	}

	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", nil // Cache miss
	}
	if err != nil {
		return "", err
	}

	return val, nil
}

// Set stores a value with the given TTL. Use 0 for no expiration.
func (c *RedisCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	if c.client == nil {
		return nil // Graceful degradation: silently skip
	}

	return c.client.Set(ctx, key, value, ttl).Err()
}

// Delete removes a key from the cache.
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	if c.client == nil {
		return nil // Graceful degradation
	}

	return c.client.Del(ctx, key).Err()
}

// Exists checks if a key exists in the cache.
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	if c.client == nil {
		return false, nil // Graceful degradation: treat as not found
	}

	n, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}

	return n > 0, nil
}
