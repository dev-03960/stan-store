package config

import (
	"fmt"
	"os"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port               string `json:"port"`
	MongoURI           string `json:"mongoUri"`
	RedisURL           string `json:"redisUrl"`
	JWTSecret          string `json:"jwtSecret"`
	FrontendURL        string `json:"frontendUrl"`
	GoogleClientID     string `json:"googleClientId"`
	GoogleClientSecret string `json:"googleClientSecret"`
	GoogleRedirectURL  string `json:"googleRedirectUrl"`
}

// Load reads configuration from environment variables with sensible defaults.
// It returns an error if required variables are missing.
func Load() (*Config, error) {
	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		MongoURI:           getEnv("MONGO_URI", "mongodb://localhost:27017/stanstore"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback"),
	}

	if cfg.JWTSecret == "" {
		// In development, use a default; in production this should fail
		cfg.JWTSecret = "dev-secret-change-in-production"
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// validate checks that all required configuration is present.
func (c *Config) validate() error {
	if c.Port == "" {
		return fmt.Errorf("config: PORT is required")
	}
	if c.MongoURI == "" {
		return fmt.Errorf("config: MONGO_URI is required")
	}
	if c.RedisURL == "" {
		return fmt.Errorf("config: REDIS_URL is required")
	}
	return nil
}

// getEnv returns the value of an environment variable or a default value.
func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
