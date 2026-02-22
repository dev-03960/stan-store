package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// GeminiGenerator implements the CopyGenerator interface using Google's Gemini API
type GeminiGenerator struct {
	client *genai.Client
}

// NewGeminiGenerator initializes a new Gemini client
func NewGeminiGenerator(ctx context.Context, apiKey string) (*GeminiGenerator, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create gemini client: %w", err)
	}
	return &GeminiGenerator{client: client}, nil
}

// GenerateCopy calls Gemini to generate the product copy
func (g *GeminiGenerator) GenerateCopy(ctx context.Context, prompt string) (*domain.CopyResult, error) {
	// gemini-2.5-flash is ideal for fast text generation
	model := g.client.GenerativeModel("gemini-2.5-flash")
	model.ResponseMIMEType = "application/json"

	fullPrompt := fmt.Sprintf(`You are an expert product copywriter. 
Generate a compelling product title (under 100 characters), a description (under 500 characters), and 3 to 5 persuasive bullet points based on the following product idea.
Respond STRICTLY with a JSON object in this format:
{
  "title": "Your Title Here",
  "description": "Your description here...",
  "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
}

Product idea: %s`, prompt)

	resp, err := model.GenerateContent(ctx, genai.Text(fullPrompt))
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no content returned from gemini")
	}

	part := resp.Candidates[0].Content.Parts[0]
	textPart, ok := part.(genai.Text)
	if !ok {
		return nil, fmt.Errorf("expected text response from gemini")
	}

	var result domain.CopyResult

	// Clean up markdown code blocks if gemini returned them (fallback)
	jsonStr := strings.TrimSpace(string(textPart))
	jsonStr = strings.TrimPrefix(jsonStr, "```json")
	jsonStr = strings.TrimPrefix(jsonStr, "```")
	jsonStr = strings.TrimSuffix(jsonStr, "```")
	jsonStr = strings.TrimSpace(jsonStr)

	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse gemini response as JSON: %w\nResponse was: %s", err, string(textPart))
	}

	return &result, nil
}
