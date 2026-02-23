package services

import (
	"context"
	"errors"
	"strings"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmailTemplateService struct {
	repo domain.EmailTemplateRepository
}

func NewEmailTemplateService(repo domain.EmailTemplateRepository) *EmailTemplateService {
	return &EmailTemplateService{repo: repo}
}

type UpdateTemplateInput struct {
	Subject   string `json:"subject"`
	BodyHTML  string `json:"bodyHtml"`
	DelayDays int    `json:"delayDays"`
	IsActive  bool   `json:"isActive"`
}

func (s *EmailTemplateService) GetTemplate(ctx context.Context, creatorIDStr string, templateType string) (*domain.EmailTemplate, error) {
	creatorID, err := primitive.ObjectIDFromHex(creatorIDStr)
	if err != nil {
		return nil, errors.New("invalid creator id")
	}

	tType := domain.EmailTemplateType(templateType)

	template, err := s.repo.FindByCreatorAndType(ctx, creatorID, tType)
	if err != nil {
		return nil, err
	}

	if template == nil {
		// Return a default populated struct if none exists yet
		// This makes the frontend integration strictly simpler instead of handling nulls
		defaultTemplate := &domain.EmailTemplate{
			CreatorID:    creatorID,
			TemplateType: tType,
			Subject:      "Checking in! How was your purchase?",
			BodyHTML:     "<p>Hi there,</p><p>You recently bought <strong>{product_title}</strong> from my store. I wanted to check in and see how you are enjoying it!</p><p>If you have any feedback, please hit reply. I read every email.</p><p><br></p><p>Best,</p><p>{creator_name}</p>",
			DelayDays:    3,
			IsActive:     false,
		}
		return defaultTemplate, nil
	}

	return template, nil
}

func (s *EmailTemplateService) UpdateTemplate(ctx context.Context, creatorIDStr string, templateType string, input *UpdateTemplateInput) error {
	creatorID, err := primitive.ObjectIDFromHex(creatorIDStr)
	if err != nil {
		return errors.New("invalid creator id")
	}

	tType := domain.EmailTemplateType(templateType)

	// Basic validation
	if strings.TrimSpace(input.Subject) == "" {
		return errors.New("subject is required")
	}
	if strings.TrimSpace(input.BodyHTML) == "" {
		return errors.New("body is required")
	}
	if input.DelayDays < 1 {
		input.DelayDays = 1
	}

	template := &domain.EmailTemplate{
		CreatorID:    creatorID,
		TemplateType: tType,
		Subject:      strings.TrimSpace(input.Subject),
		BodyHTML:     strings.TrimSpace(input.BodyHTML),
		DelayDays:    input.DelayDays,
		IsActive:     input.IsActive,
	}

	return s.repo.Upsert(ctx, template)
}
