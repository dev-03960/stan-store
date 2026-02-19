package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port                  string `json:"port"`
	MongoURI              string `json:"mongoUri"`
	RedisURL              string `json:"redisUrl"`
	JWTSecret             string `json:"jwtSecret"`
	FrontendURL           string `json:"frontendUrl"`
	GoogleClientID        string `json:"googleClientId"`
	GoogleClientSecret    string `json:"googleClientSecret"`
	GoogleRedirectURL     string `json:"googleRedirectUrl"`
	R2AccountID           string `json:"r2AccountId"`
	R2AccessKeyID         string `json:"r2AccessKeyId"`
	R2SecretAccessKey     string `json:"r2SecretAccessKey"`
	R2BucketName          string `json:"r2BucketName"`
	R2Endpoint            string `json:"r2Endpoint"`
	RazorpayKeyID         string `json:"razorpayKeyId"`
	RazorpayKeySecret     string `json:"razorpayKeySecret"`
	RazorpayWebhookSecret string `json:"razorpayWebhookSecret"`
	SMTPHost              string `json:"smtpHost"`
	SMTPPort              string `json:"smtpPort"`
	SMTPUser              string `json:"smtpUser"`
	SMTPPass              string `json:"smtpPass"`
	SMTPFrom              string `json:"smtpFrom"`
}

// Load reads configuration from environment variables with sensible defaults.
// It returns an error if required variables are missing.
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		Port:                  getEnv("PORT", "8080"),
		MongoURI:              getEnv("MONGO_URI", "mongodb://localhost:27017/stanstore"),
		RedisURL:              getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:             os.Getenv("JWT_SECRET"),
		FrontendURL:           getEnv("FRONTEND_URL", "http://localhost:5173"),
		GoogleClientID:        os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret:    os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:     getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback"),
		R2AccountID:           os.Getenv("R2_ACCOUNT_ID"),
		R2AccessKeyID:         os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey:     os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2BucketName:          os.Getenv("R2_BUCKET_NAME"),
		R2Endpoint:            os.Getenv("R2_ENDPOINT"),
		RazorpayKeyID:         os.Getenv("RAZORPAY_KEY_ID"),
		RazorpayKeySecret:     os.Getenv("RAZORPAY_KEY_SECRET"),
		RazorpayWebhookSecret: os.Getenv("RAZORPAY_WEBHOOK_SECRET"),
		SMTPHost:              os.Getenv("SMTP_HOST"),
		SMTPPort:              getEnv("SMTP_PORT", "587"),
		SMTPUser:              os.Getenv("SMTP_USER"),
		SMTPPass:              os.Getenv("SMTP_PASS"),
		SMTPFrom:              getEnv("SMTP_FROM", "noreply@stanstore.com"),
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
	// For MVP, allow empty SMTP credentials if we are testing locally or using mock
	// But in production robust apps would check.
	return nil
}

// getEnv returns the value of an environment variable or a default value.
func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
