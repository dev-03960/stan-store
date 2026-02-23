package services_test

import (
	"context"
	"testing"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Mock Repositories

type MockAffiliateRepo struct {
	mock.Mock
}

func (m *MockAffiliateRepo) Create(ctx context.Context, aff *domain.Affiliate) error {
	args := m.Called(ctx, aff)
	aff.ID = primitive.NewObjectID()
	return args.Error(0)
}

func (m *MockAffiliateRepo) FindByCode(ctx context.Context, code string) (*domain.Affiliate, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Affiliate), args.Error(1)
}

func (m *MockAffiliateRepo) FindByEmailAndCreator(ctx context.Context, email string, creatorID primitive.ObjectID) (*domain.Affiliate, error) {
	args := m.Called(ctx, email, creatorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Affiliate), args.Error(1)
}

func (m *MockAffiliateRepo) FindAllByCreator(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Affiliate, error) {
	args := m.Called(ctx, creatorID)
	return args.Get(0).([]*domain.Affiliate), args.Error(1)
}

func (m *MockAffiliateRepo) UpdateStats(ctx context.Context, id primitive.ObjectID, earned int64, isSale bool, isClick bool) error {
	args := m.Called(ctx, id, earned, isSale, isClick)
	return args.Error(0)
}

func (m *MockAffiliateRepo) UpdateStatus(ctx context.Context, id primitive.ObjectID, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

type MockAffiliateSaleRepo struct {
	mock.Mock
}

func (m *MockAffiliateSaleRepo) Create(ctx context.Context, sale *domain.AffiliateSale) error {
	args := m.Called(ctx, sale)
	return args.Error(0)
}

func (m *MockAffiliateSaleRepo) FindAllByAffiliate(ctx context.Context, affiliateID primitive.ObjectID) ([]*domain.AffiliateSale, error) {
	args := m.Called(ctx, affiliateID)
	return args.Get(0).([]*domain.AffiliateSale), args.Error(1)
}

func (m *MockAffiliateSaleRepo) FindPendingByAffiliate(ctx context.Context, affiliateID primitive.ObjectID) ([]*domain.AffiliateSale, error) {
	args := m.Called(ctx, affiliateID)
	return args.Get(0).([]*domain.AffiliateSale), args.Error(1)
}

func (m *MockAffiliateSaleRepo) UpdateStatus(ctx context.Context, saleID primitive.ObjectID, status domain.AffiliateSaleStatus) error {
	args := m.Called(ctx, saleID, status)
	return args.Error(0)
}

type MockUserRepo struct {
	mock.Mock
}

func (m *MockUserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepo) FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error) {
	args := m.Called(ctx, googleID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepo) FindByUsername(ctx context.Context, username string) (*domain.User, error) {
	args := m.Called(ctx, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepo) Create(ctx context.Context, user *domain.User) (*domain.User, error) {
	args := m.Called(ctx, user)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepo) Update(ctx context.Context, id string, user *domain.User) (*domain.User, error) {
	args := m.Called(ctx, id, user)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepo) FindMany(ctx context.Context, filter domain.Filter, pagination *domain.Pagination, sort *domain.Sort) ([]domain.User, *domain.PaginationMeta, error) {
	args := m.Called(ctx, filter, pagination, sort)
	var users []domain.User
	if args.Get(0) != nil {
		users = args.Get(0).([]domain.User)
	}
	var meta *domain.PaginationMeta
	if args.Get(1) != nil {
		meta = args.Get(1).(*domain.PaginationMeta)
	}
	return users, meta, args.Error(2)
}

func (m *MockUserRepo) UpdateStatus(ctx context.Context, id string, status string, reason string) error {
	args := m.Called(ctx, id, status, reason)
	return args.Error(0)
}

func (m *MockUserRepo) Count(ctx context.Context, filter domain.Filter) (int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockUserRepo) UpdatePayoutConfig(ctx context.Context, userID primitive.ObjectID, config *domain.PayoutConfig) error {
	args := m.Called(ctx, userID, config)
	return args.Error(0)
}

func (m *MockUserRepo) UpdatePlatformFee(ctx context.Context, userID primitive.ObjectID, rate float64) error {
	args := m.Called(ctx, userID, rate)
	return args.Error(0)
}

func (m *MockUserRepo) FindByDateRange(ctx context.Context, start, end time.Time) ([]*domain.User, error) {
	args := m.Called(ctx, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.User), args.Error(1)
}

func (m *MockUserRepo) Ban(ctx context.Context, id primitive.ObjectID, reason string) error {
	args := m.Called(ctx, id, reason)
	return args.Error(0)
}

func (m *MockUserRepo) Unban(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepo) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// Tests

func TestAffiliateService_Register(t *testing.T) {
	creatorID := primitive.NewObjectID()
	mockUser := &domain.User{ID: creatorID}
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		mockAffRepo := new(MockAffiliateRepo)
		mockSaleRepo := new(MockAffiliateSaleRepo)
		mockUserRepo := new(MockUserRepo)
		svc := services.NewAffiliateService(mockAffRepo, mockSaleRepo, mockUserRepo)

		mockUserRepo.On("FindByID", ctx, creatorID.Hex()).Return(mockUser, nil)
		mockAffRepo.On("FindByEmailAndCreator", ctx, "test@test.com", creatorID).Return(nil, nil)
		mockAffRepo.On("Create", ctx, mock.AnythingOfType("*domain.Affiliate")).Return(nil)

		aff, err := svc.Register(ctx, creatorID, "test@test.com", "Test User")
		assert.NoError(t, err)
		assert.NotNil(t, aff)
		assert.Equal(t, "test@test.com", aff.Email)
		assert.NotEmpty(t, aff.ReferralCode)
	})

	t.Run("Already Exists", func(t *testing.T) {
		mockAffRepo := new(MockAffiliateRepo)
		mockSaleRepo := new(MockAffiliateSaleRepo)
		mockUserRepo := new(MockUserRepo)
		svc := services.NewAffiliateService(mockAffRepo, mockSaleRepo, mockUserRepo)

		mockUserRepo.On("FindByID", ctx, creatorID.Hex()).Return(mockUser, nil)

		existing := &domain.Affiliate{Email: "test@test.com"}
		mockAffRepo.On("FindByEmailAndCreator", ctx, "test@test.com", creatorID).Return(existing, nil)

		aff, err := svc.Register(ctx, creatorID, "test@test.com", "Test User")
		assert.Error(t, err)
		assert.Nil(t, aff)
	})
}

func TestAffiliateService_TrackSale(t *testing.T) {
	mockAffRepo := new(MockAffiliateRepo)
	mockSaleRepo := new(MockAffiliateSaleRepo)
	mockUserRepo := new(MockUserRepo)
	svc := services.NewAffiliateService(mockAffRepo, mockSaleRepo, mockUserRepo)

	ctx := context.Background()
	affID := primitive.NewObjectID()
	referrerCode := "REFER123"

	mockAffiliate := &domain.Affiliate{
		ID:           affID,
		ReferralCode: referrerCode,
		Status:       "active",
	}

	t.Run("Calculates Commission Correctly", func(t *testing.T) {
		order := &domain.Order{
			ID:           primitive.NewObjectID(),
			Amount:       100000, // 1000 Rs
			ReferralCode: "REFER123",
		}
		product := &domain.Product{
			ID:               primitive.NewObjectID(),
			AffiliateEnabled: true,
			CommissionRate:   10.0, // 10%
		}

		mockAffRepo.On("FindByCode", ctx, "REFER123").Return(mockAffiliate, nil)
		mockSaleRepo.On("Create", ctx, mock.MatchedBy(func(s *domain.AffiliateSale) bool {
			return s.CommissionAmount == 10000 // 10% of 100000
		})).Return(nil)
		mockAffRepo.On("UpdateStats", ctx, affID, int64(10000), true, false).Return(nil)

		err := svc.TrackSale(ctx, order, product)
		assert.NoError(t, err)
	})

	t.Run("Ignores If Affiliate Disabled", func(t *testing.T) {
		order := &domain.Order{ReferralCode: "REFER123"}
		product := &domain.Product{AffiliateEnabled: false}

		err := svc.TrackSale(ctx, order, product)
		assert.NoError(t, err)
		mockAffRepo.AssertNotCalled(t, "FindByCode")
	})
}

func TestAffiliateService_TrackClick(t *testing.T) {
	mockAffRepo := new(MockAffiliateRepo)
	mockSaleRepo := new(MockAffiliateSaleRepo)
	svc := services.NewAffiliateService(mockAffRepo, mockSaleRepo, nil)
	ctx := context.Background()

	affID := primitive.NewObjectID()

	t.Run("Success", func(t *testing.T) {
		mockAffRepo.On("FindByCode", ctx, "VALID").Return(&domain.Affiliate{ID: affID, Status: "active"}, nil)
		mockAffRepo.On("UpdateStats", ctx, affID, int64(0), false, true).Return(nil)

		err := svc.TrackClick(ctx, "VALID")
		assert.NoError(t, err)
	})

	t.Run("Suspended Account", func(t *testing.T) {
		mockAffRepo.On("FindByCode", ctx, "SUSPEND").Return(&domain.Affiliate{Status: "suspended"}, nil)

		err := svc.TrackClick(ctx, "SUSPEND")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "suspended")
	})
}
