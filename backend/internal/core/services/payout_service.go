package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	razorpay "github.com/razorpay/razorpay-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var ifscRegex = regexp.MustCompile(`^[A-Z]{4}0[A-Z0-9]{6}$`)
var acctNumRegex = regexp.MustCompile(`^\d{9,18}$`)

const minWithdrawalAmount int64 = 10000 // ₹100 in paise

// PayoutService implements payout configuration and withdrawal logic.
type PayoutService struct {
	rzpClient       *razorpay.Client
	userRepo        domain.UserRepository
	payoutRepo      domain.PayoutRepository
	transactionRepo domain.TransactionRepository
	accountNumber   string // RazorpayX business account number
	keyID           string
	keySecret       string
}

// NewPayoutService creates a new PayoutService.
func NewPayoutService(
	rzpClient *razorpay.Client,
	userRepo domain.UserRepository,
	payoutRepo domain.PayoutRepository,
	transactionRepo domain.TransactionRepository,
	accountNumber, keyID, keySecret string,
) *PayoutService {
	return &PayoutService{
		rzpClient:       rzpClient,
		userRepo:        userRepo,
		payoutRepo:      payoutRepo,
		transactionRepo: transactionRepo,
		accountNumber:   accountNumber,
		keyID:           keyID,
		keySecret:       keySecret,
	}
}

// ─── Configuration Methods ───

// SavePayoutConfig orchestrates Contact → Fund Account → DB update.
func (s *PayoutService) SavePayoutConfig(ctx context.Context, creatorID primitive.ObjectID, details domain.BankDetails) (*domain.PayoutConfig, error) {
	if details.AccountHolderName == "" {
		return nil, fmt.Errorf("account holder name is required")
	}
	if !acctNumRegex.MatchString(details.AccountNumber) {
		return nil, fmt.Errorf("invalid account number: must be 9-18 digits")
	}
	if !ifscRegex.MatchString(details.IFSC) {
		return nil, fmt.Errorf("invalid IFSC code: must match format XXXX0XXXXXX")
	}

	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	// Create or reuse Razorpay Contact
	contactID := ""
	if user.PayoutConfig != nil && user.PayoutConfig.RazorpayContactID != "" {
		contactID = user.PayoutConfig.RazorpayContactID
	} else {
		cID, err := s.createRazorpayContact(user)
		if err != nil {
			return nil, fmt.Errorf("failed to create razorpay contact: %w", err)
		}
		contactID = cID
	}

	// Create Fund Account via SDK
	faData := map[string]interface{}{
		"contact_id":   contactID,
		"account_type": "bank_account",
		"bank_account": map[string]interface{}{
			"name":           details.AccountHolderName,
			"ifsc":           details.IFSC,
			"account_number": details.AccountNumber,
		},
	}
	fundAccount, err := s.rzpClient.FundAccount.Create(faData, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create razorpay fund account: %w", err)
	}
	fundAccountID := fundAccount["id"].(string)

	payoutCfg := &domain.PayoutConfig{
		AccountHolderName:   details.AccountHolderName,
		AccountNumberMasked: maskAccountNumber(details.AccountNumber),
		IFSC:                details.IFSC,
		RazorpayContactID:   contactID,
		RazorpayFundAcctID:  fundAccountID,
		IsVerified:          true,
	}

	user.PayoutConfig = payoutCfg
	user.UpdatedAt = time.Now()
	if _, err := s.userRepo.Update(ctx, creatorID.Hex(), user); err != nil {
		return nil, fmt.Errorf("failed to save payout config: %w", err)
	}

	return payoutCfg, nil
}

// GetPayoutConfig retrieves the current payout configuration.
func (s *PayoutService) GetPayoutConfig(ctx context.Context, creatorID primitive.ObjectID) (*domain.PayoutConfig, error) {
	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	return user.PayoutConfig, nil
}

// ─── Withdrawal Methods ───

// BalanceSummary represents a creator's financial summary.
type BalanceSummary struct {
	AvailableBalance int64 `json:"available_balance"`
	PendingPayout    int64 `json:"pending_payout"`
	TotalEarned      int64 `json:"total_earned"`
	TotalWithdrawn   int64 `json:"total_withdrawn"`
}

// WithdrawFunds initiates a payout to the creator's bank account.
func (s *PayoutService) WithdrawFunds(ctx context.Context, creatorID primitive.ObjectID, amount int64) (*domain.Payout, error) {
	// 1. Validate minimum amount
	if amount < minWithdrawalAmount {
		return nil, fmt.Errorf("minimum withdrawal amount is ₹100 (10000 paise)")
	}

	// 2. Check no pending payout exists
	pendingPayout, err := s.payoutRepo.FindPendingByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to check pending payouts: %w", err)
	}
	if pendingPayout != nil {
		return nil, fmt.Errorf("payout already in progress")
	}

	// 3. Check available balance
	balance, err := s.transactionRepo.GetBalance(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}
	if amount > balance {
		return nil, fmt.Errorf("insufficient balance: available ₹%.2f", float64(balance)/100)
	}

	// 4. Verify payout config exists
	user, err := s.userRepo.FindByID(ctx, creatorID.Hex())
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	if user == nil || user.PayoutConfig == nil || user.PayoutConfig.RazorpayFundAcctID == "" {
		return nil, fmt.Errorf("payout settings not configured")
	}

	// 5. Initiate Razorpay Payout via direct HTTP (SDK v1.3 lacks Payout resource)
	razorpayPayoutID, err := s.createRazorpayPayout(user.PayoutConfig.RazorpayFundAcctID, amount, creatorID.Hex())
	if err != nil {
		return nil, fmt.Errorf("failed to initiate razorpay payout: %w", err)
	}

	// 6. Create payout record
	payout := &domain.Payout{
		CreatorID:        creatorID,
		Amount:           amount,
		PlatformFee:      0, // No fee on payouts for now
		NetAmount:        amount,
		RazorpayPayoutID: razorpayPayoutID,
		Status:           domain.PayoutStatusProcessing,
	}
	if err := s.payoutRepo.Create(ctx, payout); err != nil {
		return nil, fmt.Errorf("failed to save payout record: %w", err)
	}

	// 7. Create debit transaction
	debitTx := &domain.Transaction{
		CreatorID:   creatorID,
		Amount:      amount,
		Type:        domain.TransactionTypeDebit,
		Source:      domain.TransactionSourcePayout,
		ReferenceID: payout.ID.Hex(),
		Description: fmt.Sprintf("Payout withdrawal via %s", razorpayPayoutID),
	}
	if err := s.transactionRepo.Create(ctx, debitTx); err != nil {
		fmt.Printf("CRITICAL: Failed to create debit transaction for payout %s: %v\n", payout.ID.Hex(), err)
	}

	return payout, nil
}

// HandlePayoutWebhook processes Razorpay payout webhook events.
func (s *PayoutService) HandlePayoutWebhook(ctx context.Context, razorpayPayoutID string, status domain.PayoutStatus) error {
	// Update payout record
	if err := s.payoutRepo.UpdateStatus(ctx, razorpayPayoutID, status); err != nil {
		return fmt.Errorf("failed to update payout status: %w", err)
	}

	// If failed/reversed, create a credit (reversal) transaction
	if status == domain.PayoutStatusFailed || status == domain.PayoutStatusReversed {
		payout, err := s.payoutRepo.FindByRazorpayPayoutID(ctx, razorpayPayoutID)
		if err != nil || payout == nil {
			return fmt.Errorf("failed to find payout for reversal: %w", err)
		}

		reversalTx := &domain.Transaction{
			CreatorID:   payout.CreatorID,
			Amount:      payout.Amount,
			Type:        domain.TransactionTypeCredit,
			Source:      domain.TransactionSourcePayout,
			ReferenceID: payout.ID.Hex(),
			Description: fmt.Sprintf("Payout reversal — %s (%s)", razorpayPayoutID, status),
		}
		if err := s.transactionRepo.Create(ctx, reversalTx); err != nil {
			fmt.Printf("CRITICAL: Failed to create reversal transaction for payout %s: %v\n", payout.ID.Hex(), err)
		}
	}

	return nil
}

// GetPayoutHistory returns all payouts for a creator.
func (s *PayoutService) GetPayoutHistory(ctx context.Context, creatorID primitive.ObjectID) ([]*domain.Payout, error) {
	return s.payoutRepo.FindAllByCreatorID(ctx, creatorID)
}

// GetBalanceSummary returns the creator's financial overview.
func (s *PayoutService) GetBalanceSummary(ctx context.Context, creatorID primitive.ObjectID) (*BalanceSummary, error) {
	balance, err := s.transactionRepo.GetBalance(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}

	txns, err := s.transactionRepo.FindAllByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	var totalEarned, totalWithdrawn int64
	for _, tx := range txns {
		if tx.Type == domain.TransactionTypeCredit && tx.Source == domain.TransactionSourceOrder {
			totalEarned += tx.Amount
		}
		if tx.Type == domain.TransactionTypeDebit && tx.Source == domain.TransactionSourcePayout {
			totalWithdrawn += tx.Amount
		}
	}

	// Check for pending payout
	var pendingAmount int64
	pending, _ := s.payoutRepo.FindPendingByCreatorID(ctx, creatorID)
	if pending != nil {
		pendingAmount = pending.Amount
	}

	return &BalanceSummary{
		AvailableBalance: balance,
		PendingPayout:    pendingAmount,
		TotalEarned:      totalEarned,
		TotalWithdrawn:   totalWithdrawn,
	}, nil
}

// ─── Razorpay HTTP Helpers ───

func (s *PayoutService) createRazorpayContact(user *domain.User) (string, error) {
	payload := map[string]interface{}{
		"name":         user.DisplayName,
		"email":        user.Email,
		"type":         "vendor",
		"reference_id": "creator_" + user.ID.Hex(),
	}
	return s.razorpayPost("/contacts", payload)
}

func (s *PayoutService) createRazorpayPayout(fundAccountID string, amount int64, refID string) (string, error) {
	payload := map[string]interface{}{
		"account_number":  s.accountNumber,
		"fund_account_id": fundAccountID,
		"amount":          amount,
		"currency":        "INR",
		"mode":            "IMPS",
		"purpose":         "payout",
		"reference_id":    "payout_" + refID,
		"narration":       "Stan Store Payout",
	}
	return s.razorpayPost("/payouts", payload)
}

// razorpayPost makes a POST request to Razorpay API and returns the "id" field.
func (s *PayoutService) razorpayPost(path string, payload map[string]interface{}) (string, error) {
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.razorpay.com/v1"+path, bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(s.keyID, s.keySecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("razorpay API failed (%d): %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	id, ok := result["id"].(string)
	if !ok {
		return "", fmt.Errorf("unexpected response: missing 'id'")
	}
	return id, nil
}

func maskAccountNumber(acctNum string) string {
	if len(acctNum) <= 4 {
		return acctNum
	}
	return "XXXX" + acctNum[len(acctNum)-4:]
}
