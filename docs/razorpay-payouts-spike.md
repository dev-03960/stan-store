# Razorpay Payouts API — Spike Findings

**Date:** 2026-02-21
**Story:** 13.0 — Razorpay Payout API Integration Spike
**Verdict:** ✅ GO — No blockers. SDK and API fully support our payout requirements.

---

## 1. API Overview

Razorpay Payouts (RazorpayX) enables programmatic fund transfers from a Razorpay business account to any bank account or UPI VPA. The flow requires 3 sequential API calls:

```
Contact (recipient) → Fund Account (bank details) → Payout (transfer money)
```

### Base URL
- **Live:** `https://api.razorpay.com/v1`
- **Test:** Same URL with test API keys (`rzp_test_*`)

### Authentication
- **Basic Auth** — same `key_id:key_secret` pattern we already use for payment orders.
- Our existing `PaymentService` auth setup is directly reusable.

---

## 2. API Endpoints

### 2.1 Contacts (Recipient Identity)

A Contact represents the person or entity receiving the payout.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/contacts` | Create a contact |
| `GET` | `/contacts/:id` | Fetch a contact |
| `PATCH` | `/contacts/:id` | Update a contact |

**Request: Create Contact**
```json
{
  "name": "Devansh Bhargava",
  "email": "devansh@example.com",
  "contact": "9876543210",
  "type": "vendor",
  "reference_id": "creator_<user_id>"
}
```

**Response:**
```json
{
  "id": "cont_ExampleId12345",
  "entity": "contact",
  "name": "Devansh Bhargava",
  "email": "devansh@example.com",
  "type": "vendor",
  "active": true
}
```

**Go SDK:**
```go
data := map[string]interface{}{
    "name":         "Devansh Bhargava",
    "email":        "devansh@example.com",
    "contact":      "9876543210",
    "type":         "vendor",
    "reference_id": "creator_" + userID,
}
contact, err := client.Contact.Create(data, nil)
```

### 2.2 Fund Accounts (Bank Details)

A Fund Account links a Contact to a bank account or VPA.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/fund_accounts` | Create a fund account |
| `GET` | `/fund_accounts/:id` | Fetch a fund account |
| `PATCH` | `/fund_accounts/:id` | Deactivate a fund account |

**Request: Create Fund Account (Bank)**
```json
{
  "contact_id": "cont_ExampleId12345",
  "account_type": "bank_account",
  "bank_account": {
    "name": "Devansh Bhargava",
    "ifsc": "SBIN0001234",
    "account_number": "12345678901234"
  }
}
```

**Response:**
```json
{
  "id": "fa_ExampleFaId123",
  "entity": "fund_account",
  "contact_id": "cont_ExampleId12345",
  "account_type": "bank_account",
  "bank_account": {
    "ifsc": "SBIN0001234",
    "bank_name": "State Bank of India",
    "name": "Devansh Bhargava",
    "account_number": "12345678901234"
  },
  "active": true
}
```

**Go SDK:**
```go
data := map[string]interface{}{
    "contact_id":   contactID,
    "account_type": "bank_account",
    "bank_account": map[string]interface{}{
        "name":           "Devansh Bhargava",
        "ifsc":           "SBIN0001234",
        "account_number": "12345678901234",
    },
}
fundAccount, err := client.FundAccount.Create(data, nil)
```

### 2.3 Payouts (Transfer Funds)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payouts` | Create a payout |
| `GET` | `/payouts` | List all payouts |
| `GET` | `/payouts/:id` | Fetch a payout |
| `PATCH` | `/payouts/:id/cancel` | Cancel a queued payout |

**Request: Create Payout**
```json
{
  "account_number": "<your_razorpay_account_number>",
  "fund_account_id": "fa_ExampleFaId123",
  "amount": 100000,
  "currency": "INR",
  "mode": "IMPS",
  "purpose": "payout",
  "reference_id": "payout_<payout_id>",
  "narration": "Stan Store Payout"
}
```

**Key Fields:**
- `account_number`: Your RazorpayX business account number (not the creator's)
- `amount`: In paise (100000 = ₹1,000)
- `mode`: `IMPS` (instant), `NEFT` (1-2 hours), `RTGS` (same day, ≥₹2L), `UPI` (instant via VPA)
- `purpose`: `"payout"` for vendor payouts

**Response:**
```json
{
  "id": "pout_ExamplePoutId",
  "entity": "payout",
  "fund_account_id": "fa_ExampleFaId123",
  "amount": 100000,
  "currency": "INR",
  "status": "processing",
  "mode": "IMPS",
  "purpose": "payout",
  "reference_id": "payout_123"
}
```

**Go SDK:**
```go
data := map[string]interface{}{
    "account_number":  razorpayAccountNumber,
    "fund_account_id": fundAccountID,
    "amount":          100000,
    "currency":        "INR",
    "mode":            "IMPS",
    "purpose":         "payout",
    "reference_id":    "payout_" + payoutID,
    "narration":       "Stan Store Payout",
}
payout, err := client.Payout.Create(data, nil)
```

---

## 3. Payout Lifecycle & Statuses

```
queued → processing → processed (success)
                    → reversed (bank rejected)
                    → failed
                    → cancelled (manual)
```

| Status | Meaning |
|---|---|
| `queued` | Payout is in queue (if insufficient balance or approval needed) |
| `processing` | Payout is being processed by the bank |
| `processed` | ✅ Funds successfully transferred |
| `reversed` | Bank rejected (wrong IFSC, closed account, etc.) |
| `failed` | Payout failed |
| `cancelled` | Manually cancelled while in `queued` state |

---

## 4. Webhook Events

| Event | When |
|---|---|
| `payout.queued` | Payout enters queue |
| `payout.initiated` | Payout sent to bank |
| `payout.processed` | ✅ Funds transferred |
| `payout.reversed` | Bank reversed the payout |
| `payout.failed` | Payout failed |

**Webhook payload structure is identical to our existing payment webhooks:**
- HMAC-SHA256 signature in `X-Razorpay-Signature` header
- Same verification logic from our existing `webhook_handler.go`

---

## 5. Rate Limits & Constraints

| Constraint | Value |
|---|---|
| API Rate Limit | 20 requests/second (per key) |
| Min Payout Amount | ₹1 (100 paise) |
| Max Payout (IMPS) | ₹5,00,000 per transaction |
| Payout Processing | IMPS: instant, NEFT: 1-2 hours, RTGS: same business day |
| Test Mode | Full sandbox support — no real money moves |
| IP Allowlisting | Required in production (not sandbox) |

---

## 6. Recommended Adapter Design

### Interface (in `internal/core/domain/payout.go`)

```go
type PayoutService interface {
    // CreateContact registers a creator as a payout recipient
    CreateContact(ctx context.Context, creator *User) (contactID string, err error)

    // CreateFundAccount links a bank account to a contact
    CreateFundAccount(ctx context.Context, contactID string, bankDetails BankDetails) (fundAccountID string, err error)

    // InitiatePayout sends funds to a creator's fund account
    InitiatePayout(ctx context.Context, fundAccountID string, amount int64, referenceID string) (payoutID string, err error)

    // GetPayoutStatus checks current payout status
    GetPayoutStatus(ctx context.Context, payoutID string) (string, error)
}

type BankDetails struct {
    AccountNumber     string `json:"account_number"`
    IFSC              string `json:"ifsc"`
    AccountHolderName string `json:"account_holder_name"`
}
```

### Adapter (in `internal/adapters/payment/payout_adapter.go`)

- Wraps `razorpay-go` SDK client
- Takes same `key_id` and `key_secret` as existing payment adapter
- New env var needed: `RAZORPAY_ACCOUNT_NUMBER` (your RazorpayX business account number)

### User Model Extension (for Story 13.1)

```go
// In user.go
type PayoutConfig struct {
    ContactID       string `bson:"contact_id" json:"-"`
    FundAccountID   string `bson:"fund_account_id" json:"-"`
    AccountNumber   string `bson:"account_number" json:"account_number"`  // Encrypted
    IFSC            string `bson:"ifsc" json:"ifsc"`
    HolderName      string `bson:"holder_name" json:"holder_name"`
    IsVerified      bool   `bson:"is_verified" json:"is_verified"`
}
```

---

## 7. Integration with Existing Codebase

| Existing Component | Reusable? | Notes |
|---|---|---|
| `razorpay-go` SDK | ✅ Yes | Already in `go.mod`, same auth pattern |
| HMAC webhook verification | ✅ Yes | Same `X-Razorpay-Signature` header |
| AES-256 encryption | ✅ Yes | For encrypting bank details (same as Razorpay keys) |
| Transaction log | ✅ Yes | Debit transaction for payouts |
| `PaymentService` init | 🔄 Extend | Add payout client init alongside payment client |

---

## 8. Action Items for Story 13.1

1. Add `RAZORPAY_ACCOUNT_NUMBER` to `.env` and `config.go`
2. Create `internal/core/domain/payout.go` with `PayoutService` interface and `BankDetails` struct
3. Create `internal/adapters/payment/payout_adapter.go` implementing the interface
4. Extend `User` model with `PayoutConfig` struct
5. Create `POST /api/v1/creator/payout-settings` and `GET /api/v1/creator/payout-settings` endpoints
6. Encrypt bank details using existing AES-256 utility before storage

---

## 9. Risks & Gotchas

| Risk | Mitigation |
|---|---|
| IP Allowlisting in production | Must configure before going live; not needed for sandbox |
| RazorpayX account activation takes 2-3 business days | Apply early; sandbox works immediately |
| Insufficient balance in RazorpayX account | Payout goes to `queued` state; handle via webhook |
| Bank account validation | Razorpay does penny-drop validation on fund account creation |
| Concurrent payouts | Our system should enforce single pending payout per creator |
