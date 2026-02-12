package storage

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const (
	redisPoolSize    = 20
	redisMinIdleConn = 5
	redisPingTimeout = 5 * time.Second
)

// RedisClient holds the Redis client reference.
type RedisClient struct {
	Client *redis.Client
}

// ConnectRedis establishes a connection to Redis.
// Unlike MongoDB, connection failure logs a WARNING and returns a nil-safe client
// (graceful degradation — the app continues without caching).
func ConnectRedis(redisURL string) *RedisClient {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		logger.Warn("redis url parse failed, caching disabled",
			"error", err.Error(),
			"url", redisURL,
		)
		return &RedisClient{Client: nil}
	}

	opts.PoolSize = redisPoolSize
	opts.MinIdleConns = redisMinIdleConn

	client := redis.NewClient(opts)

	// Ping to verify connection
	ctx, cancel := context.WithTimeout(context.Background(), redisPingTimeout)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		logger.Warn("redis connection failed, caching disabled",
			"error", err.Error(),
		)
		return &RedisClient{Client: nil}
	}

	logger.Info("redis connected")

	return &RedisClient{Client: client}
}

// Disconnect gracefully closes the Redis connection.
func (r *RedisClient) Disconnect() {
	if r.Client == nil {
		return
	}

	if err := r.Client.Close(); err != nil {
		logger.Error("redis disconnect error", "error", err.Error())
		return
	}

	logger.Info("redis disconnected")
}

// IsAvailable returns true if the Redis client is connected.
func (r *RedisClient) IsAvailable() bool {
	return r.Client != nil
}
