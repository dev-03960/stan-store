package domain

import (
	"context"
	"time"
)

// FileStorage defines the interface for interacting with object storage (S3/GCS/R2).
type FileStorage interface {
	// GeneratePresignedURL generates a pre-signed URL for uploading a file.
	GeneratePresignedURL(ctx context.Context, key string, contentType string, expiry time.Duration) (string, error)

	// GeneratePresignedDownloadURL generates a pre-signed URL for downloading a file.
	GeneratePresignedDownloadURL(ctx context.Context, key string, expiry time.Duration) (string, error)

	// Delete removes a file from storage.
	Delete(ctx context.Context, key string) error
}
