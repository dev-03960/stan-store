package services

import (
	"context"
	"fmt"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

type AdminService struct {
	userRepo        domain.UserRepository
	transactionRepo interface {
		SumAllRevenue(ctx context.Context) (int64, error)
	}
	orderRepo interface {
		Count(ctx context.Context) (int64, error)
	}
}

// NewAdminService creates a new AdminService.
// We use interfaces here to allow for easy mocking and since the standard generic Repository
// interface doesn't include the specific aggregation methods we added.
func NewAdminService(
	userRepo domain.UserRepository,
	transactionRepo interface {
		SumAllRevenue(ctx context.Context) (int64, error)
	},
	orderRepo interface {
		Count(ctx context.Context) (int64, error)
	},
) *AdminService {
	return &AdminService{
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
		orderRepo:       orderRepo,
	}
}

// PlatformMetrics represents the high-level metrics of the platform.
type PlatformMetrics struct {
	TotalUsers     int64 `json:"total_users"`
	TotalRevenue   int64 `json:"total_revenue"`
	TotalOrders    int64 `json:"total_orders"`
	ActiveCreators int64 `json:"active_creators"`
}

// GetPlatformMetrics aggregates data from various repositories to provide a platform overview.
func (s *AdminService) GetPlatformMetrics(ctx context.Context) (*PlatformMetrics, error) {
	// 1. Total Users
	totalUsers, err := s.userRepo.Count(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// 2. Total Revenue (Net Platform Revenue could be different, but for now we sum all credit txns)
	totalRevenue, err := s.transactionRepo.SumAllRevenue(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to sum revenue: %w", err)
	}

	// 3. Total Orders
	totalOrders, err := s.orderRepo.Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count orders: %w", err)
	}

	// 4. Active Creators (Users with role='creator' or simply all users for now if we default to creator)
	// Let's filter by role if possible, but BaseRepository.Count accepts a filter map.
	activeCreators, err := s.userRepo.Count(ctx, domain.Filter{"role": domain.RoleCreator})
	if err != nil {
		return nil, fmt.Errorf("failed to count active creators: %w", err)
	}

	return &PlatformMetrics{
		TotalUsers:     totalUsers,
		TotalRevenue:   totalRevenue,
		TotalOrders:    totalOrders,
		ActiveCreators: activeCreators,
	}, nil
}

// BanCreator sets a creator's status to banned with a reason.
func (s *AdminService) BanCreator(ctx context.Context, creatorID string, reason string) error {
	// Verify user exists
	user, err := s.userRepo.FindByID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}
	if user.Status == domain.UserStatusBanned {
		return fmt.Errorf("user is already banned")
	}

	return s.userRepo.UpdateStatus(ctx, creatorID, domain.UserStatusBanned, reason)
}

// UnbanCreator restores a creator's status to active.
func (s *AdminService) UnbanCreator(ctx context.Context, creatorID string) error {
	// Verify user exists
	user, err := s.userRepo.FindByID(ctx, creatorID)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}
	if user.Status != domain.UserStatusBanned {
		return fmt.Errorf("user is not banned")
	}

	return s.userRepo.UpdateStatus(ctx, creatorID, domain.UserStatusActive, "")
}
