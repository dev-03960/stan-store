package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// S3Storage implements the FileStorage interface for S3-compatible services (AWS, R2, MinIO).
type S3Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	bucketName    string
}

// NewS3Storage initializes a new S3Storage adapter.
// It supports custom endpoints for R2/MinIO via R2_ENDPOINT env var.
func NewS3Storage(
	accountID string,
	accessKeyID string,
	secretAccessKey string,
	bucketName string,
	endpoint string,
) (*S3Storage, error) {
	// Create a custom endpoint resolver if an endpoint is provided (for R2/MinIO)
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if endpoint != "" {
			return aws.Endpoint{
				PartitionID:   "aws",
				URL:           endpoint,
				SigningRegion: "auto", // R2 uses 'auto' region
			}, nil
		}
		// Fallback to default resolution
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	presignClient := s3.NewPresignClient(client)

	return &S3Storage{
		client:        client,
		presignClient: presignClient,
		bucketName:    bucketName,
	}, nil
}

// GeneratePresignedURL generates a pre-signed PUT URL for uploading a file.
func (s *S3Storage) GeneratePresignedURL(ctx context.Context, key string, contentType string, expiry time.Duration) (string, error) {
	presignedReq, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expiry))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}

	return presignedReq.URL, nil
}

// GeneratePresignedDownloadURL generates a pre-signed URL for downloading a private file.
func (s *S3Storage) GeneratePresignedDownloadURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiry
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned download url: %w", err)
	}

	return req.URL, nil
}

// Delete removes a file from R2.
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}
	return nil
}
