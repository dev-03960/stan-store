# EPIC-07: Performance, Reliability & Security Hardening

## Epic Goal

The platform meets all NFRs — sub-second loads, webhook resilience, encryption, and traffic spike handling.

## In Scope

- Redis caching optimization for storefront performance (NFR1, NFR2)
- Background payment reconciliation worker (reliability)
- Webhook dead-letter queue with retry mechanism (NFR7)
- Security hardening: TLS, CORS, rate limiting, encryption, security headers (NFR4, NFR5, NFR6)
- Load testing and performance validation (NFR9)

## Out of Scope

- Database sharding implementation (strategy documented but not executed in MVP)
- CDN configuration
- WAF (Web Application Firewall)
- Penetration testing by external vendor
- Microservices decomposition

## Dependencies

- **EPIC-01** — Requires Redis caching layer
- **EPIC-03** — Requires storefront API (caching target)
- **EPIC-04** — Requires webhook handler and orders collection (reconciliation, DLQ)
- **All Epics** — Cross-cutting security concerns apply to all endpoints

## User Stories

### STORY-7.1: Redis Caching for Storefront Performance

As a buyer,
I want storefront pages to load in under 1 second,
So that I don't abandon the page while waiting.

**Acceptance Criteria:**

- **Given** a buyer requests a creator's storefront
- **When** the `GET /api/v1/store/:username` endpoint is called
- **Then** the response is served from Redis cache if available (cache hit: < 5ms response)
- **And** cache TTL is 60 seconds for storefront data
- **And** cache is invalidated when the creator updates their profile or products
- **And** cache miss falls through to MongoDB query and populates the cache
- **And** LCP is measurably < 1.2s on simulated 4G connection (NFR1)
- **And** API latency is < 100ms at the 95th percentile under normal load (NFR2)

**NFRs covered:** NFR1, NFR2

### STORY-7.2: Background Payment Reconciliation Worker

As a platform,
I want a background process that reconciles pending payments,
So that network failures don't result in lost orders.

**Acceptance Criteria:**

- **Given** orders exist with `status: "pending"` for more than 5 minutes
- **When** the background reconciler runs (every 2 minutes via Go routine)
- **Then** it queries Razorpay's Payment API for each pending order's `gateway_order_id`
- **And** if Razorpay reports "captured", the order is updated to "paid" and delivery is triggered
- **And** if Razorpay reports "failed" or "expired", the order is updated accordingly
- **And** each reconciliation attempt is logged in the `transactions` collection
- **And** the reconciler handles API rate limits gracefully (exponential backoff)
- **And** a maximum of 100 pending orders are processed per cycle to avoid overload

**NFRs covered:** NFR7, NFR8

### STORY-7.3: Webhook Dead-Letter Queue & Retry Mechanism

As a platform,
I want failed webhook events to be retried reliably,
So that 99.99% of webhooks are processed successfully (NFR7).

**Acceptance Criteria:**

- **Given** a webhook event fails to process (database error, timeout)
- **When** the failure occurs
- **Then** the webhook payload is stored in a `webhook_dlq` collection with `retry_count`, `next_retry_at`, `error_message`
- **And** a background Go routine processes the DLQ every 30 seconds
- **And** retries use exponential backoff: 30s, 1min, 5min, 30min, 1hr (max 5 retries)
- **And** after 5 failed retries, the event is marked as "dead" and an alert is logged
- **And** successfully retried events are removed from the DLQ
- **And** metrics are available: `dlq_size`, `events_retried`, `events_dead`

**NFRs covered:** NFR7

### STORY-7.4: Security Hardening & Data Protection

As a platform,
I want all sensitive data encrypted and all endpoints secured,
So that creator and buyer data is protected (NFR4, NFR5, NFR6).

**Acceptance Criteria:**

- **Given** the application is deployed
- **When** security is validated
- **Then** TLS 1.3 is enforced for all HTTP connections
- **And** Razorpay API keys are encrypted at rest using AES-256 field-level encryption
- **And** JWT tokens expire after 7 days and are refreshed on activity
- **And** CORS is configured to allow only the frontend domain
- **And** rate limiting is applied: 100 req/min for public endpoints, 300 req/min for authenticated
- **And** all file uploads are scanned for content-type validity (not just extension)
- **And** S3/GCS buckets have no public access policy; files are accessible only via pre-signed URLs (NFR5)
- **And** no raw card data is stored or logged (NFR6) — all payment data stays with Razorpay
- **And** security headers are set: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`

**NFRs covered:** NFR4, NFR5, NFR6

### STORY-7.5: Load Testing & Performance Validation

As a developer,
I want to validate the system handles 10k concurrent users,
So that we're confident about handling "creator drop" traffic spikes (NFR9).

**Acceptance Criteria:**

- **Given** a load testing tool (k6 or Artillery) is configured
- **When** a load test simulates 10,000 concurrent users hitting the storefront endpoint
- **Then** the 95th percentile response time remains < 100ms (NFR2)
- **And** the 99th percentile response time remains < 500ms
- **And** zero 5xx errors occur during the test
- **And** MongoDB connection pool handles concurrency without exhaustion
- **And** Redis cache hit ratio exceeds 95% during the load test
- **And** a load test script exists in `backend/tests/load/` and can be run via `make load-test`
- **And** results are documented with baseline metrics for future comparison

**NFRs covered:** NFR2, NFR9

## UX References

- **Performance Targets:** LCP < 1.2s on 4G — see `ux-design-specification.md` § Responsive Design & Accessibility → Performance
- **Skeleton Loading:** Critical for perceived performance — see `ux-design-specification.md` § UX Consistency Patterns → Loading States
- **Reduced Motion:** `prefers-reduced-motion` support — see `ux-design-specification.md` § Accessibility Considerations

## API / Data Notes

- **`webhook_dlq` collection schema:** `_id`, `webhook_payload`, `event_type`, `retry_count`, `next_retry_at`, `error_message`, `status` (pending|dead), `created_at`
- **Cache Keys:** `store:{username}` with 60s TTL; invalidated on profile/product updates
- **Rate Limiting:** Fiber middleware — 100 req/min (public), 300 req/min (authenticated)
- **Background Workers:** Go routines within API binary (no separate worker binary for MVP)
  - Reconciler: runs every 2 minutes, processes max 100 pending orders
  - DLQ Processor: runs every 30 seconds, exponential backoff retries

## Definition of Done

- [ ] Storefront API serves cached responses < 5ms on cache hit
- [ ] Cache invalidation triggers on profile/product updates
- [ ] Background reconciler detects and resolves pending orders
- [ ] Webhook DLQ captures failed events and retries with exponential backoff
- [ ] TLS 1.3, CORS, rate limiting, and security headers are configured
- [ ] AES-256 encryption active for payment credentials at rest
- [ ] S3/GCS buckets have no public access policy
- [ ] Load test (10k concurrent) passes with < 100ms p95, 0 errors, > 95% cache hit
- [ ] Load test script and baseline results documented
