# EPIC-04: Checkout & Payment Processing

## Epic Goal

Buyers can complete a frictionless "Buy Now" purchase via Razorpay (UPI, Cards, Netbanking) without needing an account or a shopping cart.

## In Scope

- Creator payment settings API (Razorpay key storage with AES-256 encryption)
- Order creation with Razorpay Orders API integration
- Server-side payment signature verification (HMAC-SHA256)
- Razorpay webhook handler with idempotency
- Frontend bottom-sheet checkout with form validation and Razorpay SDK integration

## Out of Scope

- PhonePe native integration (Phase 2)
- Shopping cart or multi-product checkout
- Refund processing
- Subscription/recurring payments
- Coupon codes or discounts

## Dependencies

- **EPIC-01** — Requires backend skeleton, MongoDB, Redis
- **EPIC-02** — Requires authentication middleware (for creator payment settings)
- **EPIC-03** — Requires products collection and public storefront (checkout references a product)

## User Stories

### STORY-4.1: Razorpay Integration & Payment Settings API

As a creator,
I want to connect my Razorpay account to receive payments,
So that I can start earning money from my store.

**Acceptance Criteria:**

- **Given** an authenticated creator
- **When** they submit `POST /api/v1/creator/payment-settings` with `{"razorpay_key_id": "rzp_...", "razorpay_key_secret": "..."}` (or `upi_id` for direct UPI)
- **Then** the API keys are encrypted (AES-256 field-level encryption) before storage in the `creators` collection
- **And** `GET /api/v1/creator/payment-settings` returns a masked version: `{"razorpay_key_id": "rzp_***abc", "has_secret": true}`
- **And** raw secrets are NEVER returned in any API response
- **And** a test ping to Razorpay validates the key pair before saving (returns 422 if invalid)
- **And** `DELETE /api/v1/creator/payment-settings` removes the stored credentials

**FRs covered:** FR11

### STORY-4.2: Order Creation & Razorpay Order API

As a system,
I want to create a Razorpay order when a buyer initiates checkout,
So that the payment can be tracked and verified.

**Acceptance Criteria:**

- **Given** a buyer initiates checkout for a product
- **When** they submit `POST /api/v1/orders` with `{"product_id": "...", "buyer_name": "...", "buyer_email": "...", "buyer_phone": "..."}`
- **Then** a new document is created in the `orders` collection: `_id`, `product_id`, `creator_id`, `buyer_name`, `buyer_email`, `buyer_phone`, `amount` (copied from product price), `currency` ("INR"), `status` ("pending"), `gateway_order_id`, `created_at`, `updated_at`
- **And** a Razorpay Order is created via their Orders API using the creator's decrypted API keys
- **And** the `gateway_order_id` from Razorpay is stored on the order document
- **And** the response includes `gateway_order_id` and `razorpay_key_id` (public key only) for frontend SDK
- **And** buyer input validation: `buyer_email` is valid format, `buyer_phone` matches Indian mobile pattern (10 digits)
- **And** no authentication is required (guest checkout — FR5)

**FRs covered:** FR5, FR13

### STORY-4.3: Payment Verification & Signature Validation

As a system,
I want to verify Razorpay payment signatures server-side,
So that only legitimate, confirmed payments update order status.

**Acceptance Criteria:**

- **Given** a buyer has completed payment on the frontend
- **When** the frontend submits `POST /api/v1/orders/:id/verify` with `{"razorpay_payment_id": "...", "razorpay_order_id": "...", "razorpay_signature": "..."}`
- **Then** the server computes HMAC-SHA256 of `razorpay_order_id|razorpay_payment_id` using the creator's secret key
- **And** if the computed signature matches the provided one, the order `status` is updated to "paid"
- **And** if the signature doesn't match, the order `status` is updated to "failed" and a 400 error is returned
- **And** the `razorpay_payment_id` is stored on the order document
- **And** duplicate verification attempts for the same order are idempotent (same response, no side effects)
- **And** an immutable transaction log entry is created in the `transactions` collection

**FRs covered:** FR15

### STORY-4.4: Razorpay Webhook Handler

As a system,
I want to receive and process Razorpay payment webhooks,
So that order status is updated reliably even if the buyer closes the browser.

**Acceptance Criteria:**

- **Given** Razorpay sends a webhook to `POST /api/v1/webhooks/razorpay`
- **When** the webhook payload is received
- **Then** the webhook signature is verified using HMAC-SHA256 with the webhook secret
- **And** invalid signatures are rejected with 401 and logged as security events
- **And** `payment.captured` events update the corresponding order to "paid" (idempotent)
- **And** `payment.failed` events update the corresponding order to "failed"
- **And** duplicate webhooks (same `event_id`) are detected and return 200 without re-processing
- **And** a 200 response is returned immediately (processing happens after response)
- **And** failed webhook processing is retried via a dead-letter queue mechanism (log for MVP)
- **And** all webhook events are logged in the `transactions` collection with full payload

**FRs covered:** FR15

### STORY-4.5: Frontend Checkout Bottom-Sheet

As a buyer,
I want to purchase a product with minimal friction using a bottom-sheet checkout,
So that I can buy in under 30 seconds without leaving the page.

**Acceptance Criteria:**

- **Given** a buyer is viewing a creator's storefront
- **When** they tap "Buy ₹{price}" on a product card
- **Then** a bottom-sheet overlay slides up (300ms ease-out animation) with:
- **And** — Handle bar for swipe-to-dismiss
- **And** — Product name and price at the top
- **And** — 3 input fields: Name, Email, Phone (with `inputmode` attributes: text, email, tel)
- **And** — "Pay ₹{price} via UPI" primary CTA button (48px height, solid purple)
- **And** — Trust strip at the bottom (lock icon + "Secured by Razorpay")
- **And** the form validates on blur: email format, phone 10-digit Indian mobile
- **And** on submit, an order is created via `POST /api/v1/orders`
- **And** Razorpay checkout SDK opens inline with the gateway order ID
- **And** on payment success: bottom-sheet transitions to "✅ Thank You!" with confetti animation
- **And** on payment failure: error message with "Try Again" button (no form re-entry needed)
- **And** `Escape` key and backdrop tap dismiss the sheet (focus trap when open)

**FRs covered:** FR5, FR12, FR14

## UX References

- **CheckoutSheet Component:** Bottom-sheet with handle bar, frosted glass — see `ux-design-specification.md` § Component Strategy → CheckoutSheet
- **Intent-Flow Checkout:** Combined bottom-sheet, UPI Intent, no cart — see `ux-design-specification.md` § Defining Core Experience → Novel Pattern
- **Buyer Purchase Flow:** "See → Buy → Get" 30-second journey — see `ux-design-specification.md` § User Journey Flows → Journey 1
- **Form Validation:** Real-time on blur, `inputmode` attributes — see `ux-design-specification.md` § UX Consistency Patterns → Forms
- **Celebration Moments:** Confetti on "Thank You!" — see `ux-design-specification.md` § Emotional Response

## API / Data Notes

- **`orders` collection schema:** `_id`, `product_id`, `creator_id`, `buyer_name`, `buyer_email`, `buyer_phone`, `amount`, `currency`, `status` (pending|paid|failed), `gateway_order_id`, `razorpay_payment_id`, `download_url`, `download_expires_at`, `email_sent_at`, `email_status`, `created_at`, `updated_at`
- **`transactions` collection schema:** `_id`, `order_id`, `event_type`, `gateway`, `gateway_event_id`, `amount`, `status`, `raw_payload`, `created_at`, `ip_address` (append-only)
- **Payment Settings:** Stored encrypted on `users` document — `razorpay_key_id`, `razorpay_key_secret` (AES-256), `upi_id`
- **API Endpoints:**
  - `POST /api/v1/creator/payment-settings` — Save payment keys
  - `GET /api/v1/creator/payment-settings` — Get masked settings
  - `DELETE /api/v1/creator/payment-settings` — Remove credentials
  - `POST /api/v1/orders` — Create order (guest, no auth)
  - `POST /api/v1/orders/:id/verify` — Verify payment signature
  - `POST /api/v1/webhooks/razorpay` — Webhook handler

## Definition of Done

- [ ] Creator can save Razorpay keys (encrypted at rest, masked on retrieval)
- [ ] Order creation calls Razorpay Orders API and stores `gateway_order_id`
- [ ] Payment signature verification works with HMAC-SHA256
- [ ] Webhook handler processes `payment.captured` and `payment.failed` idempotently
- [ ] Bottom-sheet checkout renders with form validation and Razorpay SDK
- [ ] Guest checkout works without authentication
- [ ] Transaction log entries created for all payment events
- [ ] No raw secrets or card data in API responses or logs
