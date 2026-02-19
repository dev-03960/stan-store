package services

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

// UploadService handles file upload logic.
type UploadService struct {
	storage domain.FileStorage
}

// NewUploadService creates a new UploadService.
func NewUploadService(storage domain.FileStorage) *UploadService {
	return &UploadService{
		storage: storage,
	}
}

// GeneratePresignedURL validates the request and generates a pre-signed URL.
func (s *UploadService) GeneratePresignedURL(ctx context.Context, userID string, req *domain.UploadRequest) (*domain.UploadResponse, error) {
	// 1. Validate File Purpose & Size Limit (handled by frontend mostly, but good to know limits)
	// We can't enforce size limit purely via presigned URL without signing headers,
	// but for V1 we rely on client behavior + potentially bucket policy (if we could set it dynamically).
	// Here we validate extensions.

	ext := strings.ToLower(filepath.Ext(req.FileName))
	if ext == "" {
		return nil, fmt.Errorf("file extension required")
	}

	var validExts []string
	var prefix string

	switch req.Purpose {
	case domain.PurposeProductFile:
		validExts = []string{".pdf", ".zip", ".mp4", ".mp3"}
		prefix = "products/files"
	case domain.PurposeCoverImage:
		validExts = []string{".jpg", ".jpeg", ".png", ".webp"}
		prefix = "products/covers"
	default:
		return nil, fmt.Errorf("invalid purpose")
	}

	isValidExt := false
	for _, e := range validExts {
		if e == ext {
			isValidExt = true
			break
		}
	}
	if !isValidExt {
		return nil, fmt.Errorf("invalid file type for %s: %s", req.Purpose, ext)
	}

	// 2. Generate Unique Key
	// Key Format: creators/{creator_id}/{prefix}/{uuid}{ext}
	// Example: creators/123/products/files/abc-123.pdf
	fileUUID := uuid.New().String()
	fileKey := fmt.Sprintf("creators/%s/%s/%s%s", userID, prefix, fileUUID, ext)

	// 3. Generate Pre-signed URL
	// Expiry: 15 minutes
	expiry := 15 * time.Minute
	url, err := s.storage.GeneratePresignedURL(ctx, fileKey, req.ContentType, expiry)
	if err != nil {
		return nil, err
	}

	return &domain.UploadResponse{
		UploadURL: url,
		FileKey:   fileKey,
	}, nil
}

// GenerateDownloadURL generates a pre-signed URL for downloading a file.
func (s *UploadService) GenerateDownloadURL(ctx context.Context, key string) (string, error) {
	// Standard validation or transformation if needed
	// For now, just delegate
	// Expiry: 1 hour for downloads usually
	expiry := 1 * time.Hour
	return s.storage.GeneratePresignedDownloadURL(ctx, key, expiry)
}
