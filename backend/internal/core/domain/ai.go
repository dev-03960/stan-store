package domain

import "context"

// CopyResult represents the AI-generated copywriting output for a product
type CopyResult struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Bullets     []string `json:"bullets"`
}

// CopyGenerator defines the interface for an AI provider to generate product copy
type CopyGenerator interface {
	GenerateCopy(ctx context.Context, prompt string) (*CopyResult, error)
}
