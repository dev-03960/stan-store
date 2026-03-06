package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

// GoogleUser holds user info from Google OAuth.
type GoogleUser struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// AuthResult holds the result of authentication.
type AuthResult struct {
	User        *domain.User `json:"user"`
	Token       string       `json:"token"`
	RedirectURL string       `json:"redirectUrl"`
	IsNewUser   bool         `json:"isNewUser"`
}

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo     domain.UserRepository
	jwtService   *JWTService
	redis        *redis.Client
	emailService domain.EmailService
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo domain.UserRepository, jwtService *JWTService, redisClient *redis.Client, emailService domain.EmailService) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		jwtService:   jwtService,
		redis:        redisClient,
		emailService: emailService,
	}
}

// HandleGoogleCallback processes the Google OAuth callback.
// It finds or creates a user, generates a JWT, and determines the redirect URL.
func (s *AuthService) HandleGoogleCallback(ctx context.Context, gUser *GoogleUser, requestedRole string) (*AuthResult, error) {
	email := strings.ToLower(gUser.Email)

	// Check if user exists by Google ID first, then by email
	user, err := s.userRepo.FindByGoogleID(ctx, gUser.ID)
	if err != nil {
		return nil, fmt.Errorf("find by google id: %w", err)
	}

	isNewUser := false

	if user == nil {
		// Try by email (in case user was created differently)
		user, err = s.userRepo.FindByEmail(ctx, email)
		if err != nil {
			return nil, fmt.Errorf("find by email: %w", err)
		}
	}

	if user == nil {
		// Create new user
		newUser := domain.NewUserFromGoogle(email, gUser.Name, gUser.Picture, gUser.ID)
		if requestedRole != "" {
			newUser.Role = requestedRole
		}
		user, err = s.userRepo.Create(ctx, newUser)
		if err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
		isNewUser = true
		logger.Info("new user created via google oauth", "email", email, "role", user.Role)
	}

	// Generate JWT (buyers get 24h expiry, creators get 7 days)
	var token string
	if user.Role == domain.RoleBuyer {
		token, err = s.jwtService.GenerateTokenWithExpiry(user.ID.Hex(), user.Role, BuyerJWTExpiry)
	} else {
		token, err = s.jwtService.GenerateToken(user.ID.Hex(), user.Role)
	}
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	// Determine redirect
	redirectURL := "/onboarding"
	if user.Role == domain.RoleBuyer {
		redirectURL = "/my-purchases"
	} else if user.HasUsername() {
		redirectURL = "/dashboard"
	}

	return &AuthResult{
		User:        user,
		Token:       token,
		RedirectURL: redirectURL,
		IsNewUser:   isNewUser,
	}, nil
}

// GetCurrentUser retrieves the current user by their ID.
func (s *AuthService) GetCurrentUser(ctx context.Context, userID string) (*domain.User, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

// GenerateMagicLinkToken generates a secure random token for emails.
func generateMagicLinkToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// HandleMagicLinkRequest generates and stores a magic link token for the buyer.
func (s *AuthService) HandleMagicLinkRequest(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return fmt.Errorf("email is required")
	}

	token := generateMagicLinkToken()
	key := fmt.Sprintf("auth:magic_link:%s", token)

	// Store in Redis for 15 minutes
	err := s.redis.Set(ctx, key, email, 15*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("redis set: %w", err)
	}

	// In a real system, we'd fire an event or call an email service here.
	// For now, log the token to the console so we can "click" it manually in dev.
	logger.Info("[MOCK EMAIL] MAGIC LINK GENERATED", "email", email, "token", token, "url", fmt.Sprintf("http://localhost:5173/verify?token=%s", token))

	return nil
}

// HandleMagicLinkVerify consumes the token, creates a buyer if needed, and logs them in.
func (s *AuthService) HandleMagicLinkVerify(ctx context.Context, token string) (*AuthResult, error) {
	key := fmt.Sprintf("auth:magic_link:%s", token)

	email, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("token invalid or expired")
	} else if err != nil {
		return nil, fmt.Errorf("redis get: %w", err)
	}

	// Immediately delete the token so it can't be reused
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		logger.Error("failed to delete used magic link token", "error", err, "token", token)
	}

	// Find or Create user as Buyer
	isNewUser := false
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("find by email: %w", err)
	}

	if user == nil {
		now := time.Now()
		newUser := &domain.User{
			Email:            email,
			DisplayName:      strings.Split(email, "@")[0], // Simple fallback
			Role:             domain.RoleBuyer,
			Status:           "active",
			SubscriptionTier: "free",
			CreatedAt:        now,
			UpdatedAt:        now,
		}
		user, err = s.userRepo.Create(ctx, newUser)
		if err != nil {
			return nil, fmt.Errorf("create buyer: %w", err)
		}
		isNewUser = true
		logger.Info("new buyer created via magic link", "email", email)
	}

	// Generate JWT (buyers get 24h expiry)
	jwtToken, err := s.jwtService.GenerateTokenWithExpiry(user.ID.Hex(), user.Role, BuyerJWTExpiry)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &AuthResult{
		User:        user,
		Token:       jwtToken,
		RedirectURL: "/my-purchases",
		IsNewUser:   isNewUser,
	}, nil
}

// generateOTP generates a 6-digit numeric OTP.
func generateOTP() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%06d", n.Int64()+100000)
}

// HandleCreatorSignup registers a new creator with email/password and sends OTP for verification.
func (s *AuthService) HandleCreatorSignup(ctx context.Context, email, password string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return fmt.Errorf("email and password are required")
	}
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}

	// Check if user already exists
	existing, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("lookup failed: %w", err)
	}
	if existing != nil && existing.EmailVerified {
		return fmt.Errorf("an account with this email already exists")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	// Store signup data in Redis (pending verification)
	key := fmt.Sprintf("auth:signup:%s", email)
	data := fmt.Sprintf("%s", string(hash))
	if err := s.redis.Set(ctx, key, data, 10*time.Minute).Err(); err != nil {
		return fmt.Errorf("redis set: %w", err)
	}

	// Generate and store OTP
	otp := generateOTP()
	otpKey := fmt.Sprintf("auth:otp:%s", email)
	if err := s.redis.Set(ctx, otpKey, otp, 5*time.Minute).Err(); err != nil {
		return fmt.Errorf("redis set otp: %w", err)
	}

	// Send OTP email
	subject := "Verify your Mio Store account"
	body := fmt.Sprintf(
		"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;'>"+
			"<h2 style='color:#6C5CE7;'>Welcome to Mio Store!</h2>"+
			"<p>Your verification code is:</p>"+
			"<div style='font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a2e;text-align:center;padding:20px;background:#f5f3ff;border-radius:12px;margin:16px 0;'>%s</div>"+
			"<p style='color:#888;font-size:14px;'>This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>"+
			"</div>",
		otp,
	)

	if s.emailService != nil {
		if err := s.emailService.Send(ctx, email, subject, body); err != nil {
			logger.Error("failed to send OTP email", "error", err, "email", email)
			// Don't fail the signup if email fails — log for dev debugging
		}
	}

	logger.Info("[CREATOR SIGNUP] OTP generated", "email", email, "otp", otp)
	return nil
}

// HandleCreatorVerifyOTP verifies the OTP and creates the creator account.
func (s *AuthService) HandleCreatorVerifyOTP(ctx context.Context, email, otp string) (*AuthResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	// Verify OTP
	otpKey := fmt.Sprintf("auth:otp:%s", email)
	storedOTP, err := s.redis.Get(ctx, otpKey).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("OTP expired or invalid")
	} else if err != nil {
		return nil, fmt.Errorf("redis get: %w", err)
	}

	if storedOTP != otp {
		return nil, fmt.Errorf("incorrect OTP")
	}

	// Delete OTP
	s.redis.Del(ctx, otpKey)

	// Get stored password hash
	signupKey := fmt.Sprintf("auth:signup:%s", email)
	passwordHash, err := s.redis.Get(ctx, signupKey).Result()
	if err != nil {
		return nil, fmt.Errorf("signup data expired, please sign up again")
	}
	s.redis.Del(ctx, signupKey)

	// Check if user already exists (maybe created via Google in the meantime)
	existing, _ := s.userRepo.FindByEmail(ctx, email)
	if existing != nil {
		// Link password to existing account
		existing.PasswordHash = passwordHash
		existing.EmailVerified = true
		existing.UpdatedAt = time.Now()
		if existing.Role == domain.RoleBuyer {
			existing.Role = domain.RoleCreator
		}
		updated, err := s.userRepo.Update(ctx, existing.ID.Hex(), existing)
		if err != nil {
			return nil, fmt.Errorf("update user: %w", err)
		}
		token, err := s.jwtService.GenerateToken(updated.ID.Hex(), updated.Role)
		if err != nil {
			return nil, fmt.Errorf("generate token: %w", err)
		}
		redirectURL := "/onboarding"
		if updated.HasUsername() {
			redirectURL = "/dashboard"
		}
		return &AuthResult{User: updated, Token: token, RedirectURL: redirectURL, IsNewUser: false}, nil
	}

	// Create new creator
	now := time.Now()
	newUser := &domain.User{
		Email:                email,
		DisplayName:          strings.Split(email, "@")[0],
		PasswordHash:         passwordHash,
		EmailVerified:        true,
		Role:                 domain.RoleCreator,
		Status:               domain.UserStatusActive,
		Theme:                "minimal",
		SubscriptionTier:     "free",
		PlatformFeeRate:      5.0,
		AbandonedCartEnabled: true,
		SocialLinks:          []domain.SocialLink{},
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	user, err := s.userRepo.Create(ctx, newUser)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	token, err := s.jwtService.GenerateToken(user.ID.Hex(), user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	logger.Info("new creator created via email/password", "email", email)

	return &AuthResult{
		User:        user,
		Token:       token,
		RedirectURL: "/onboarding",
		IsNewUser:   true,
	}, nil
}

// HandleCreatorLogin authenticates a creator with email and password.
func (s *AuthService) HandleCreatorLogin(ctx context.Context, email, password string) (*AuthResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("lookup failed: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	if user.PasswordHash == "" {
		return nil, fmt.Errorf("this account uses Google sign-in, please use the Google button")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	if user.Status == domain.UserStatusBanned {
		return nil, fmt.Errorf("account has been suspended")
	}

	token, err := s.jwtService.GenerateToken(user.ID.Hex(), user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	redirectURL := "/onboarding"
	if user.HasUsername() {
		redirectURL = "/dashboard"
	}

	return &AuthResult{
		User:        user,
		Token:       token,
		RedirectURL: redirectURL,
		IsNewUser:   false,
	}, nil
}
