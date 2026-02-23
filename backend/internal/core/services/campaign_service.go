package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CampaignService struct {
	campaignRepo domain.CampaignRepository
}

func NewCampaignService(campaignRepo domain.CampaignRepository) *CampaignService {
	return &CampaignService{
		campaignRepo: campaignRepo,
	}
}

func (s *CampaignService) CreateCampaign(ctx context.Context, creatorID primitive.ObjectID, req *CreateCampaignRequest) (*domain.Campaign, error) {
	if len(req.Emails) == 0 {
		return nil, errors.New("campaign must have at least one email sequence")
	}
	if len(req.Emails) > 5 {
		return nil, errors.New("maximum 5 emails allowed per campaign")
	}

	triggerProdObjID, err := primitive.ObjectIDFromHex(req.TriggerProductID)
	if err != nil {
		return nil, errors.New("invalid trigger product id")
	}

	var emails []domain.CampaignEmail
	for _, e := range req.Emails {
		if e.Subject == "" || e.BodyHTML == "" {
			return nil, errors.New("email subject and body cannot be empty")
		}
		if e.DelayMinutes < 0 {
			return nil, errors.New("delay minutes cannot be negative")
		}
		emails = append(emails, domain.CampaignEmail{
			Subject:      e.Subject,
			BodyHTML:     e.BodyHTML,
			DelayMinutes: e.DelayMinutes,
		})
	}

	campaign := &domain.Campaign{
		CreatorID:        creatorID,
		Name:             req.Name,
		TriggerType:      "lead_magnet_signup",
		TriggerProductID: triggerProdObjID,
		Emails:           emails,
		Status:           domain.CampaignStatusActive, // Defaults to active visually, can be manually paused explicitly
	}

	if err := s.campaignRepo.Create(ctx, campaign); err != nil {
		return nil, fmt.Errorf("failed to save campaign: %w", err)
	}

	return campaign, nil
}

func (s *CampaignService) GetCreatorCampaigns(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Campaign, error) {
	return s.campaignRepo.FindAllByCreator(ctx, creatorID)
}

func (s *CampaignService) UpdateCampaignStatus(ctx context.Context, campaignID primitive.ObjectID, creatorID primitive.ObjectID, status domain.CampaignStatus) error {
	campaign, err := s.campaignRepo.FindByID(ctx, campaignID)
	if err != nil {
		return err
	}
	if campaign == nil {
		return errors.New("campaign not found")
	}
	if campaign.CreatorID != creatorID {
		return errors.New("unauthorized")
	}

	if status != domain.CampaignStatusActive && status != domain.CampaignStatusPaused {
		return errors.New("invalid status")
	}

	campaign.Status = status
	return s.campaignRepo.Update(ctx, campaign)
}

type CreateCampaignRequest struct {
	Name             string `json:"name"`
	TriggerProductID string `json:"trigger_product_id"`
	Emails           []struct {
		Subject      string `json:"subject"`
		BodyHTML     string `json:"body_html"`
		DelayMinutes int    `json:"delay_minutes"`
	} `json:"emails"`
}
