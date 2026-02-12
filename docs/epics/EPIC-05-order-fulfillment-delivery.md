# EPIC-05: Order Fulfillment & Digital Delivery

## Epic Goal

After successful payment, buyers automatically receive a secure download link via email. Creators see their order history on the dashboard.

## In Scope

- Signed URL generation for purchased digital products (S3/GCS)
- Token-protected download endpoint
- Transactional email delivery (SES/SendGrid) with branded HTML template
- Order history API with pagination, filtering, and summary
- Immutable transaction log (append-only audit trail)
- Frontend earnings dashboard and order history

## Out of Scope

- Refund processing and refund emails
- Advanced analytics (conversion funnels, buyer demographics)
- Download tracking and analytics
- Multiple download attempts or download limits

## Dependencies

- **EPIC-01** — Requires backend skeleton, MongoDB, Redis
- **EPIC-02** — Requires authentication middleware (for creator order history)
- **EPIC-03** — Requires products collection (product files stored in S3/GCS)
- **EPIC-04** — Requires orders collection and payment processing (triggers fulfillment)

## User Stories

### STORY-5.1: Signed URL Generation & Download Endpoint

As a buyer,
I want to receive a secure, time-limited download link after purchase,
So that I can access my purchased digital product.

**Acceptance Criteria:**

- **Given** an order with `status: "paid"`
- **When** the system processes the successful payment (triggered by verification or webhook)
- **Then** a pre-signed download URL is generated for the product's `file_key` in S3/GCS
- **And** the signed URL has a TTL of 24 hours
- **And** the signed URL is stored on the order document as `download_url` with `download_expires_at`
- **And** `GET /api/v1/orders/:id/download` returns the signed URL (validates order status is "paid")
- **And** expired URLs return 410 Gone with a message to contact the creator
- **And** the download endpoint is protected by a token-based access (email link contains a signed JWT with order ID)

**FRs covered:** FR16

### STORY-5.2: Transactional Email Delivery

As a buyer,
I want to receive an email with my download link immediately after purchase,
So that I have a permanent record and can access my product anytime (within 24h).

**Acceptance Criteria:**

- **Given** an order transitions to `status: "paid"` and a signed URL is generated
- **When** the email trigger fires
- **Then** a transactional email is sent to `buyer_email` via SES/SendGrid
- **And** the email includes: product title, creator name, payment amount, download button/link, creator's contact link
- **And** the email is HTML-formatted with the Stan-store branding (Creator Purple header)
- **And** email delivery status is logged on the order document (`email_sent_at`, `email_status`)
- **And** failed email sends are retried up to 3 times with exponential backoff
- **And** the from address is `noreply@stan.store` with the creator's display name

**FRs covered:** FR17

### STORY-5.3: Order History API (Creator Dashboard)

As a creator,
I want to see all my orders with buyer details and payment status,
So that I can track my revenue and fulfillment.

**Acceptance Criteria:**

- **Given** an authenticated creator
- **When** they request `GET /api/v1/creator/orders`
- **Then** orders are returned paginated (20 per page, cursor-based) sorted by `created_at` descending
- **And** each order includes: `buyer_name`, `buyer_email`, `product_title`, `amount`, `status`, `created_at`, `gateway_order_id`
- **And** filtering is supported by `status` (pending, paid, failed) and date range
- **And** a summary endpoint `GET /api/v1/creator/orders/summary` returns: `total_revenue`, `total_orders`, `orders_today`, `revenue_today`
- **And** only orders for the authenticated creator's products are returned (creator_id filter)

**FRs covered:** FR18

### STORY-5.4: Immutable Transaction Log

As a platform,
I want an immutable audit trail of all financial transactions,
So that we maintain compliance and can debug payment issues.

**Acceptance Criteria:**

- **Given** any payment-related event occurs (order created, payment attempted, signature verified, webhook received, refund issued)
- **When** the event is processed
- **Then** a new document is inserted into the `transactions` collection (append-only, never updated)
- **And** each document includes: `_id`, `order_id`, `event_type`, `gateway`, `gateway_event_id`, `amount`, `status`, `raw_payload` (stringified), `created_at`, `ip_address`
- **And** the collection has NO update or delete operations in the repository (append-only pattern)
- **And** an index on `order_id` enables fast lookups
- **And** retention policy comment documents: 5-year minimum retention per PCI-DSS

**FRs covered:** FR19

### STORY-5.5: Frontend Order History & Earnings Dashboard

As a creator,
I want to see my earnings and recent orders on my dashboard,
So that I feel motivated to keep selling and can track my progress.

**Acceptance Criteria:**

- **Given** an authenticated creator on `/dashboard`
- **When** the dashboard loads
- **Then** the `EarningsHero` component displays today's earnings prominently ("₹4,990 earned today")
- **And** the hero shows a trend arrow (up/down vs yesterday) and a period selector (Today/Week/Month)
- **And** zero-state shows: "No sales yet — share your link!" with a "Copy Store Link" CTA
- **And** below the hero, a recent orders list shows the last 10 orders with buyer name, product, amount, status badge
- **And** "View All Orders" links to `/dashboard/orders` with the full paginated table
- **And** the `EarningsHero` uses `aria-live="polite"` for real-time value updates
- **And** toast notification appears when a new sale arrives: "₹499 received from Rahul!"

**FRs covered:** FR18

## UX References

- **EarningsHero Component:** Prominent earnings display with trend arrow — see `ux-design-specification.md` § Component Strategy → EarningsHero
- **Revenue Visibility Principle:** "Revenue visibility is paramount" — see `ux-design-specification.md` § Design System Foundation
- **Empty States:** "No sales yet" with action CTA — see `ux-design-specification.md` § UX Consistency Patterns → Empty States
- **Toast Notifications:** "₹499 received!" success toast — see `ux-design-specification.md` § UX Consistency Patterns → Feedback

## API / Data Notes

- **Order document additions:** `download_url`, `download_expires_at`, `email_sent_at`, `email_status` fields added to `orders` collection
- **`transactions` collection:** Append-only, 5-year retention. NO update/delete repository methods.
- **Email:** SES/SendGrid, from `noreply@stan.store`, HTML-branded with Creator Purple header
- **API Endpoints:**
  - `GET /api/v1/orders/:id/download` — Get signed download URL (token-protected)
  - `GET /api/v1/creator/orders` — Paginated order history
  - `GET /api/v1/creator/orders/summary` — Revenue summary

## Definition of Done

- [ ] Signed download URL generated within seconds of successful payment
- [ ] Download endpoint validates order status and token before serving URL
- [ ] Expired URLs return 410 Gone with clear user messaging
- [ ] Transactional email sent with branded HTML and download link
- [ ] Email retries on failure (3 attempts, exponential backoff)
- [ ] Order history API returns paginated, filterable results
- [ ] Summary endpoint returns accurate revenue totals
- [ ] Transaction log is append-only with no update/delete operations
- [ ] Dashboard shows earnings hero, recent orders, and empty state
