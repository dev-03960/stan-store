---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Stan-store - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Stan-store, decomposing the requirements from the PRD, Architecture, and UX Design Specification into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Sign up/Login via Google OAuth.
- FR2: Claim unique `username` (`stan.store/username`).
- FR3: Prevent duplicate emails/usernames.
- FR4: View Subscription Tier (Free/Pro).
- FR5: Guest Checkout for Buyers.
- FR6: Customize Profile (Pic, Bio, Socials).
- FR7: Create "Digital Download" Product (Title, Price, Image, File).
- FR8: Toggle Product Visibility.
- FR9: Drag-and-drop Product Reordering.
- FR10: Auto-generate mobile-optimized public page.
- FR11: Connect Razorpay (API Key input).
- FR12: "Buy Now" flow (No Cart).
- FR13: Generate Dynamic Gateway Order IDs.
- FR14: Support Mobile Intent Flow (`upi://`).
- FR15: Validate Payment Signatures (HMAC).
- FR16: Generate Signed URLs (S3/GCS) upon success.
- FR17: Send Transactional Email with Link.
- FR18: View Order History (Creator Dashboard).
- FR19: Immutable Transaction Logging.
- FR20: View Aggregated Metrics (GMV, Users).
- FR21: Ban Creators (404/403 access).

### NonFunctional Requirements

- NFR1: LCP < 1.2s on 4G Networks.
- NFR2: Core API Latency < 100ms (95th %ile).
- NFR3: Checkout Interaction Latency < 500ms.
- NFR4: Encryption at Rest (AES-256) & Transit (TLS 1.3).
- NFR5: No Public Access to Digital Assets (Signed URLs only).
- NFR6: No Raw Card Data Storage.
- NFR7: 99.99% Webhook Resilience (Dead-letter Queues).
- NFR8: 99.9% Storefront Uptime.
- NFR9: Handle 10k Concurrent Users (Traffic Spike).
- NFR10: Database Sharding/Partitioning strategy ready for 1M+ orders.

### Additional Requirements

**From Architecture:**
- Monorepo initialization (Backend Go/Fiber + Frontend React/Vite) is the first implementation story.
- MongoDB connection with Repository pattern using strict Go Structs + BSON tags.
- Redis caching layer for sub-100ms storefront reads.
- JWT Authentication stored in HTTP-Only Cookies.
- RBAC Middleware in Fiber (Creator, Buyer, Admin roles).
- Standardized JSON API response envelope (`data`, `meta`, `error`).
- Docker + Docker Compose for local dev orchestration.
- OpenAPI v3 documentation (auto-generated).
- Structured logging via central `logger` package.
- TanStack Query for frontend server state management.
- Feature-Sliced frontend architecture (`src/features/{name}`).
- Clean Architecture backend (`internal/core/{domain,services}`, `internal/adapters/{http,storage}`).

**From UX Design Specification:**
- Mobile-first design; storefront single-column max-width 480px.
- Bottom-sheet checkout pattern (not full-page redirect).
- Skeleton loading states for all data-heavy screens.
- Button hierarchy: Primary (solid purple 48px), Secondary (outline 40px), Destructive (red outline), Ghost (text-only).
- Toast notification system: success (green, auto-dismiss 4s), error (red, persistent), warning (yellow, 6s), info (blue, 4s).
- Form validation: real-time on blur, inline error messages, auto-focus first error.
- `inputmode` attributes for mobile keyboards (email, tel, numeric).
- WCAG 2.1 AA compliance: 4.5:1 contrast, 44×44px touch targets, semantic HTML, ARIA labels.
- `prefers-reduced-motion` support for all animations.
- Creator Purple (`#6C5CE7`) as primary brand color.
- Outfit (headings) + Inter (body) Google Fonts.

**Integration Requirements:**
- Razorpay: Orders API, Signature Verification (HMAC-SHA256), Webhooks.
- PhonePe: Checksum (Base64+Salt), S2S Status Checks, Intent Flow.
- Google OAuth: Social login with scopes.
- AWS S3/GCS: Pre-signed URL generation for secure asset delivery.
- SES/SendGrid: Transactional email delivery.

**Infrastructure Requirements:**
- Region: ap-south-1 (Mumbai) for data residency.
- Multi-stage Docker builds (Alpine) for small image sizes.
- Background payment reconciliation (Go routines in API binary for MVP).

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 2 | Google OAuth Login |
| FR2 | Epic 2 | Unique Username Claim |
| FR3 | Epic 2 | Duplicate Prevention |
| FR4 | Epic 2 | Subscription Tier View |
| FR5 | Epic 4 | Guest Checkout |
| FR6 | Epic 2 | Profile Customization |
| FR7 | Epic 3 | Digital Download Creation |
| FR8 | Epic 3 | Product Visibility Toggle |
| FR9 | Epic 3 | Drag-and-Drop Reorder |
| FR10 | Epic 3 | Auto-gen Public Page |
| FR11 | Epic 4 | Razorpay Connection |
| FR12 | Epic 4 | Buy Now Flow |
| FR13 | Epic 4 | Dynamic Order IDs |
| FR14 | Epic 4 | UPI Intent Flow |
| FR15 | Epic 4 | HMAC Signature Validation |
| FR16 | Epic 5 | Signed URL Generation |
| FR17 | Epic 5 | Transactional Email |
| FR18 | Epic 5 | Order History |
| FR19 | Epic 5 | Immutable Tx Logging |
| FR20 | Epic 6 | Aggregated Metrics |
| FR21 | Epic 6 | Creator Banning |

## Epic List

### Epic 1: Project Foundation & Dev Environment
Developers can clone, run, and develop against a fully configured monorepo with all infrastructure running locally.
**FRs covered:** Architecture Requirements (Monorepo Init, Docker Compose, CI skeleton)

### Epic 2: Creator Identity & Onboarding
Creators can sign up via Google, claim a unique store URL, and have a complete profile.
**FRs covered:** FR1, FR2, FR3, FR4, FR6

### Epic 3: Storefront & Product Management
Creators can add digital download products, customize their store, and publish a mobile-optimized public page.
**FRs covered:** FR7, FR8, FR9, FR10

### Epic 4: Checkout & Payment Processing
Buyers can discover a product and complete a frictionless "Buy Now" purchase via Razorpay (UPI, Cards, Netbanking).
**FRs covered:** FR5, FR11, FR12, FR13, FR14, FR15

### Epic 5: Order Fulfillment & Digital Delivery
After successful payment, buyers automatically receive a secure download link via email. Creators see their order history.
**FRs covered:** FR16, FR17, FR18, FR19

### Epic 6: Platform Administration & Analytics
Platform admins can view aggregated metrics and manage creators. Creators see basic sales analytics.
**FRs covered:** FR20, FR21

### Epic 7: Performance, Reliability & Security Hardening
The platform meets all NFRs — sub-second loads, webhook resilience, encryption, and traffic spike handling.
**FRs covered:** NFR1–NFR10 (Cross-cutting)

---

## Epic 1: Project Foundation & Dev Environment

**Goal:** Developers can clone the repo, run `docker-compose up`, and have a fully working local development environment with Backend, Frontend, Database, and Cache running.

### Story 1.1: Monorepo Initialization & Project Scaffolding

As a developer,
I want a properly structured monorepo with Go backend and React frontend scaffolding,
So that I can start developing features against a clean, standard project structure.

**Acceptance Criteria:**

**Given** the repository is freshly cloned
**When** I inspect the project structure
**Then** it matches the architecture document: `backend/` (Go module with `cmd/api`, `internal/core`, `internal/adapters`, `pkg/`) and `frontend/` (Vite + React + TypeScript with `src/features/`, `src/components/ui/`, `src/lib/`)
**And** `go mod tidy` succeeds with Fiber v2 and MongoDB driver installed
**And** `npm install` in `frontend/` succeeds with React 19, Vite, Tailwind CSS v4, React Router v7, and TanStack Query installed
**And** a root `Makefile` exists with targets: `dev`, `test`, `build`, `lint`
**And** `.env.example` exists with all required environment variable placeholders

### Story 1.2: Docker Compose Local Development Stack

As a developer,
I want a single command to spin up all infrastructure dependencies locally,
So that I can develop and test without installing MongoDB or Redis manually.

**Acceptance Criteria:**

**Given** Docker and Docker Compose are installed
**When** I run `docker-compose up -d`
**Then** MongoDB (v7+) starts on port 27017 with a `stanstore` database
**And** Redis (v7+) starts on port 6379
**And** health checks pass for both services within 30 seconds
**And** persistent volumes are configured so data survives container restarts
**And** a `.dockerignore` file excludes `node_modules/`, `vendor/`, and build artifacts

### Story 1.3: Backend API Skeleton with Health Check

As a developer,
I want a running Go/Fiber HTTP server with structured error handling and a health endpoint,
So that I can verify the backend is operational and start adding route handlers.

**Acceptance Criteria:**

**Given** the backend is started with `go run ./cmd/api`
**When** I send `GET /api/v1/health`
**Then** I receive a 200 response with `{"data": {"status": "ok", "version": "0.1.0"}, "meta": null, "error": null}`
**And** the response follows the standardized JSON envelope format
**And** the `config` package loads environment variables (PORT, MONGO_URI, REDIS_URL, JWT_SECRET)
**And** the `logger` package outputs structured JSON logs (not `fmt.Println`)
**And** unhandled routes return 404 with a proper error envelope
**And** panic recovery middleware is active and logs stack traces

### Story 1.4: MongoDB Connection & Repository Pattern Base

As a developer,
I want a reusable MongoDB connection layer with the Repository pattern,
So that all future data access follows a consistent, testable interface.

**Acceptance Criteria:**

**Given** the backend API starts and `MONGO_URI` is configured
**When** the application initializes
**Then** a MongoDB client connects to the configured URI with connection pooling
**And** a `Repository` interface is defined in `internal/core/domain/` with standard CRUD method signatures
**And** a base MongoDB repository implementation exists in `internal/adapters/storage/`
**And** the connection is gracefully closed on application shutdown (SIGTERM/SIGINT)
**And** connection failure logs an error and exits with a non-zero code
**And** all Go structs that interact with MongoDB use `bson:"..."` and `json:"..."` tags

### Story 1.5: Redis Connection & Caching Layer Base

As a developer,
I want a Redis client connection with a caching abstraction,
So that I can cache storefront data for sub-100ms reads.

**Acceptance Criteria:**

**Given** the backend API starts and `REDIS_URL` is configured
**When** the application initializes
**Then** a Redis client connects with connection pooling
**And** a `Cache` interface is defined in `internal/core/domain/` with `Get`, `Set`, `Delete`, and `SetWithTTL` methods
**And** a Redis implementation of the `Cache` interface exists in `internal/adapters/storage/`
**And** the connection is gracefully closed on application shutdown
**And** connection failure logs a warning but does NOT crash the app (graceful degradation)

### Story 1.6: Frontend App Shell with Design System Tokens

As a developer,
I want a running React app with routing, design system tokens, and base layout,
So that I can start building feature pages with consistent styling.

**Acceptance Criteria:**

**Given** the frontend is started with `npm run dev`
**When** I open `http://localhost:5173` in a browser
**Then** the app renders a root layout with React Router v7 configured
**And** Tailwind CSS v4 is configured with custom design tokens: Creator Purple (`#6C5CE7`), semantic colors, spacing scale (4px base unit)
**And** Google Fonts (Outfit for headings, Inter for body) are loaded
**And** an API client wrapper exists in `src/lib/api.ts` with base URL configuration and the standardized response envelope type
**And** TanStack Query Provider is configured at the app root
**And** a placeholder route exists for `/` (storefront) and `/dashboard` (creator)

---

## Epic 2: Creator Identity & Onboarding

**Goal:** Creators can sign up via Google OAuth, claim a unique store URL (`stan.store/username`), set up their profile, and have a complete identity in the system.

### Story 2.1: Google OAuth Backend Integration

As a creator,
I want to sign up and log in using my Google account,
So that I can start building my store without remembering another password.

**Acceptance Criteria:**

**Given** Google OAuth client credentials are configured in `.env`
**When** a user initiates Google login via `GET /api/v1/auth/google`
**Then** they are redirected to Google's consent screen with `email` and `profile` scopes
**And** after consent, Google redirects back to `GET /api/v1/auth/google/callback`
**And** the callback creates a new `users` document if the email doesn't exist, or finds the existing user
**And** a JWT token is generated and set as an HTTP-Only, Secure, SameSite=Strict cookie
**And** the `users` collection document includes: `_id`, `email`, `display_name`, `avatar_url`, `google_id`, `subscription_tier` (default: "free"), `created_at`, `updated_at`
**And** duplicate emails are rejected (unique index on `email`)
**And** the response redirects to `/dashboard` or `/onboarding` based on whether `username` is already claimed

### Story 2.2: Username Claim & Store URL

As a creator,
I want to claim a unique username that becomes my store URL,
So that I can share a clean link (`stan.store/myname`) with my audience.

**Acceptance Criteria:**

**Given** an authenticated creator with no username yet
**When** they submit `POST /api/v1/auth/username` with `{"username": "priyafit"}`
**Then** the username is validated: 3-30 chars, lowercase alphanumeric + hyphens only, no leading/trailing hyphens
**And** a case-insensitive uniqueness check is performed against the `users` collection
**And** if available, the `username` field is set on the user document
**And** if taken, a 409 Conflict is returned with `{"error": {"code": "USERNAME_TAKEN", "message": "This username is already claimed"}}`
**And** a unique index on `username` prevents race conditions
**And** reserved usernames (admin, api, www, store, help, support) are rejected with a 422 error

### Story 2.3: Auth Middleware & RBAC

As a developer,
I want authentication and role-based access control middleware,
So that protected endpoints verify identity and permissions consistently.

**Acceptance Criteria:**

**Given** the Fiber app has middleware registered
**When** a request hits a protected endpoint
**Then** the `AuthRequired` middleware extracts and validates the JWT from the HTTP-Only cookie
**And** invalid/expired tokens return 401 with `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}`
**And** the authenticated user's ID and role are injected into the Fiber context (`c.Locals`)
**And** a `RoleRequired(roles ...string)` middleware checks if the user's role is in the allowed list
**And** unauthorized role access returns 403 with `{"error": {"code": "FORBIDDEN", "message": "Insufficient permissions"}}`
**And** three roles exist: `creator`, `buyer` (ephemeral/guest), `admin`

### Story 2.4: Creator Profile Setup & Edit

As a creator,
I want to customize my store profile with a photo, bio, and social links,
So that my store page reflects my brand and builds trust with buyers.

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they submit `PUT /api/v1/creator/profile` with `display_name`, `bio`, `avatar_url`, `social_links` (array of `{platform, url}`)
**Then** the profile fields are updated on the `users` document
**And** `bio` is limited to 160 characters (matching Instagram bio length)
**And** `social_links` supports platforms: instagram, youtube, twitter, linkedin, tiktok (max 5 links)
**And** `avatar_url` accepts a valid URL (image upload is a separate concern)
**And** `GET /api/v1/creator/profile` returns the full profile including `username`, `display_name`, `bio`, `avatar_url`, `social_links`, `subscription_tier`
**And** the response shape follows the standard JSON envelope

### Story 2.5: Frontend Auth Flow & Onboarding Wizard

As a creator,
I want a guided onboarding experience after signing up,
So that I can set up my store in under 5 minutes without confusion.

**Acceptance Criteria:**

**Given** a new creator who has just authenticated via Google OAuth
**When** they land on the app without a claimed username
**Then** they are redirected to a 4-step onboarding wizard (as defined in UX spec)
**And** Step 1: Claim username (real-time availability check via `GET /api/v1/auth/username/check?username=xxx`)
**And** Step 2: Set display name and upload/enter avatar URL
**And** Step 3: Add bio and social links
**And** Step 4: Connect payment method (placeholder — completed in Epic 4)
**And** a progress bar shows completion (using the `OnboardingWizard` component spec)
**And** each step auto-saves on "Next" (optimistic UI)
**And** "Skip" is available for non-critical steps (bio, socials)
**And** on completion, redirect to `/dashboard` with a "Store is LIVE!" celebration toast

---

## Epic 3: Storefront & Product Management

**Goal:** Creators can add digital download products, manage their visibility, and publish an auto-generated mobile-optimized public storefront page.

### Story 3.1: Product Domain Model & CRUD API

As a creator,
I want to create, read, update, and delete digital download products,
So that I can manage the items I'm selling from my store.

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they submit `POST /api/v1/products` with `title`, `description`, `price` (integer, paise), `cover_image_url`, `file_url`, `product_type` ("download")
**Then** a new document is created in the `products` collection with: `_id`, `creator_id`, `title`, `description`, `price`, `cover_image_url`, `file_url`, `product_type`, `is_visible` (default: true), `sort_order`, `created_at`, `updated_at`
**And** `GET /api/v1/products` returns only the authenticated creator's products (filtered by `creator_id`)
**And** `PUT /api/v1/products/:id` updates the product (only if `creator_id` matches)
**And** `DELETE /api/v1/products/:id` soft-deletes the product (sets `deleted_at`)
**And** price validation ensures `price >= 100` (₹1 minimum) and `price <= 10000000` (₹1,00,000 max)
**And** `title` is required, max 100 characters; `description` max 500 characters

### Story 3.2: File Upload to S3/GCS

As a creator,
I want to upload my digital product file and cover image,
So that they are securely stored and ready for delivery to buyers.

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they request `POST /api/v1/uploads/presigned` with `{"file_name": "workout.pdf", "content_type": "application/pdf", "purpose": "product_file"}`
**Then** the server generates a pre-signed upload URL for S3/GCS (valid for 15 minutes)
**And** the response includes `upload_url` (pre-signed PUT URL) and `file_key` (storage path)
**And** file size limit is 100MB for product files, 5MB for cover images
**And** allowed content types: PDF, ZIP, MP4, MP3, PNG, JPG, JPEG, WEBP
**And** the storage path follows: `creators/{creator_id}/products/{uuid}.{ext}`
**And** uploaded files are **private by default** (no public access)
**And** the `file_key` is stored on the product document for later signed URL generation

### Story 3.3: Product Visibility Toggle & Reordering

As a creator,
I want to toggle products visible/hidden and reorder them via drag-and-drop,
So that I can control what my audience sees and in what order.

**Acceptance Criteria:**

**Given** an authenticated creator with multiple products
**When** they submit `PATCH /api/v1/products/:id/visibility` with `{"is_visible": false}`
**Then** the product's `is_visible` field is updated and it no longer appears on the public storefront
**And** `PATCH /api/v1/products/reorder` with `{"product_ids": ["id1", "id2", "id3"]}` updates `sort_order` for all listed products in a single atomic operation
**And** only the creator's own products can be reordered (ownership check)
**And** the public storefront API returns products ordered by `sort_order` ascending, filtering out `is_visible: false`

### Story 3.4: Public Storefront Page (Backend API)

As a buyer,
I want to view a creator's store page by visiting their unique URL,
So that I can browse and purchase their products.

**Acceptance Criteria:**

**Given** a valid creator username
**When** a request is made to `GET /api/v1/store/:username`
**Then** the response includes: creator profile (`display_name`, `bio`, `avatar_url`, `social_links`) and visible products (sorted by `sort_order`)
**And** the product data includes `id`, `title`, `description`, `price`, `cover_image_url`, `product_type` (but NOT `file_url` — this is server-side only)
**And** the response is cached in Redis with a TTL of 60 seconds for sub-100ms reads
**And** if the username doesn't exist, a 404 is returned
**And** if the creator is banned, a 403 is returned
**And** no authentication is required to access this endpoint

### Story 3.5: Frontend Storefront Page (Mobile-Optimized)

As a buyer,
I want a beautifully designed, mobile-optimized storefront page,
So that I feel confident purchasing from this creator.

**Acceptance Criteria:**

**Given** a buyer navigates to `/:username` on the frontend
**When** the page loads
**Then** the `StoreHeader` component renders: gradient background, avatar, display name, bio, social links (as per UX spec)
**And** `ProductCard` components render for each visible product: cover image, title, description (2 lines), price badge, "Buy ₹{price}" CTA button
**And** the layout is single-column, max-width 480px, centered (identical on all screen sizes per UX spec)
**And** skeleton loading states show gray rectangles mimicking content layout while data loads
**And** the page renders correctly in Instagram's in-app browser
**And** LCP target is < 1.2s on 4G (skeleton renders immediately, data fills in)
**And** no navigation bar or sticky elements (maximize content area)

### Story 3.6: Frontend Dashboard — Product Management

As a creator,
I want a dashboard interface to manage my products,
So that I can add, edit, toggle visibility, and reorder my products easily.

**Acceptance Criteria:**

**Given** an authenticated creator on `/dashboard/products`
**When** the page loads
**Then** all products (including hidden) are displayed as cards with visibility status
**And** a "+ Add Product" primary CTA button is prominently visible
**And** clicking "+ Add Product" opens a form (dialog or inline) with: title, description, price, cover image upload, file upload
**And** each product card has a "more actions" dropdown: Edit, Toggle Visibility, Delete
**And** "Delete" triggers a confirmation dialog: "Delete this product?" with Cancel and Delete buttons
**And** drag-and-drop reordering of product cards is supported and auto-saves
**And** toast notifications appear for all actions: "Product created!", "Product updated!", "Product deleted"
**And** empty state shows illustration + "Create your first product" message with primary CTA

---

## Epic 4: Checkout & Payment Processing

**Goal:** Buyers can complete a frictionless "Buy Now" purchase via Razorpay (UPI, Cards, Netbanking) without needing an account or a shopping cart.

### Story 4.1: Razorpay Integration & Payment Settings API

As a creator,
I want to connect my Razorpay account to receive payments,
So that I can start earning money from my store.

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they submit `POST /api/v1/creator/payment-settings` with `{"razorpay_key_id": "rzp_...", "razorpay_key_secret": "..."}` (or `upi_id` for direct UPI)
**Then** the API keys are encrypted (AES-256 field-level encryption) before storage in the `creators` collection
**And** `GET /api/v1/creator/payment-settings` returns a masked version: `{"razorpay_key_id": "rzp_***abc", "has_secret": true}`
**And** raw secrets are NEVER returned in any API response
**And** a test ping to Razorpay validates the key pair before saving (returns 422 if invalid)
**And** `DELETE /api/v1/creator/payment-settings` removes the stored credentials

### Story 4.2: Order Creation & Razorpay Order API

As a system,
I want to create a Razorpay order when a buyer initiates checkout,
So that the payment can be tracked and verified.

**Acceptance Criteria:**

**Given** a buyer initiates checkout for a product
**When** they submit `POST /api/v1/orders` with `{"product_id": "...", "buyer_name": "...", "buyer_email": "...", "buyer_phone": "..."}`
**Then** a new document is created in the `orders` collection: `_id`, `product_id`, `creator_id`, `buyer_name`, `buyer_email`, `buyer_phone`, `amount` (copied from product price), `currency` ("INR"), `status` ("pending"), `gateway_order_id`, `created_at`, `updated_at`
**And** a Razorpay Order is created via their Orders API using the creator's decrypted API keys
**And** the `gateway_order_id` from Razorpay is stored on the order document
**And** the response includes `gateway_order_id` and `razorpay_key_id` (public key only) for frontend SDK
**And** buyer input validation: `buyer_email` is valid format, `buyer_phone` matches Indian mobile pattern (10 digits)
**And** no authentication is required (guest checkout — FR5)

### Story 4.3: Payment Verification & Signature Validation

As a system,
I want to verify Razorpay payment signatures server-side,
So that only legitimate, confirmed payments update order status.

**Acceptance Criteria:**

**Given** a buyer has completed payment on the frontend
**When** the frontend submits `POST /api/v1/orders/:id/verify` with `{"razorpay_payment_id": "...", "razorpay_order_id": "...", "razorpay_signature": "..."}`
**Then** the server computes HMAC-SHA256 of `razorpay_order_id|razorpay_payment_id` using the creator's secret key
**And** if the computed signature matches the provided one, the order `status` is updated to "paid"
**And** if the signature doesn't match, the order `status` is updated to "failed" and a 400 error is returned
**And** the `razorpay_payment_id` is stored on the order document
**And** duplicate verification attempts for the same order are idempotent (same response, no side effects)
**And** an immutable transaction log entry is created in the `transactions` collection

### Story 4.4: Razorpay Webhook Handler

As a system,
I want to receive and process Razorpay payment webhooks,
So that order status is updated reliably even if the buyer closes the browser.

**Acceptance Criteria:**

**Given** Razorpay sends a webhook to `POST /api/v1/webhooks/razorpay`
**When** the webhook payload is received
**Then** the webhook signature is verified using HMAC-SHA256 with the webhook secret
**And** invalid signatures are rejected with 401 and logged as security events
**And** `payment.captured` events update the corresponding order to "paid" (idempotent)
**And** `payment.failed` events update the corresponding order to "failed"
**And** duplicate webhooks (same `event_id`) are detected and return 200 without re-processing
**And** a 200 response is returned immediately (processing happens after response)
**And** failed webhook processing is retried via a dead-letter queue mechanism (log for MVP)
**And** all webhook events are logged in the `transactions` collection with full payload

### Story 4.5: Frontend Checkout Bottom-Sheet

As a buyer,
I want to purchase a product with minimal friction using a bottom-sheet checkout,
So that I can buy in under 30 seconds without leaving the page.

**Acceptance Criteria:**

**Given** a buyer is viewing a creator's storefront
**When** they tap "Buy ₹{price}" on a product card
**Then** a bottom-sheet overlay slides up (300ms ease-out animation) with:
**And** — Handle bar for swipe-to-dismiss
**And** — Product name and price at the top
**And** — 3 input fields: Name, Email, Phone (with `inputmode` attributes: text, email, tel)
**And** — "Pay ₹{price} via UPI" primary CTA button (48px height, solid purple)
**And** — Trust strip at the bottom (lock icon + "Secured by Razorpay")
**And** the form validates on blur: email format, phone 10-digit Indian mobile
**And** on submit, an order is created via `POST /api/v1/orders`
**And** Razorpay checkout SDK opens inline with the gateway order ID
**And** on payment success: bottom-sheet transitions to "✅ Thank You!" with confetti animation
**And** on payment failure: error message with "Try Again" button (no form re-entry needed)
**And** `Escape` key and backdrop tap dismiss the sheet (focus trap when open)

---

## Epic 5: Order Fulfillment & Digital Delivery

**Goal:** After successful payment, buyers automatically receive a secure download link via email. Creators see their order history on the dashboard.

### Story 5.1: Signed URL Generation & Download Endpoint

As a buyer,
I want to receive a secure, time-limited download link after purchase,
So that I can access my purchased digital product.

**Acceptance Criteria:**

**Given** an order with `status: "paid"`
**When** the system processes the successful payment (triggered by verification or webhook)
**Then** a pre-signed download URL is generated for the product's `file_key` in S3/GCS
**And** the signed URL has a TTL of 24 hours
**And** the signed URL is stored on the order document as `download_url` with `download_expires_at`
**And** `GET /api/v1/orders/:id/download` returns the signed URL (validates order status is "paid")
**And** expired URLs return 410 Gone with a message to contact the creator
**And** the download endpoint is protected by a token-based access (email link contains a signed JWT with order ID)

### Story 5.2: Transactional Email Delivery

As a buyer,
I want to receive an email with my download link immediately after purchase,
So that I have a permanent record and can access my product anytime (within 24h).

**Acceptance Criteria:**

**Given** an order transitions to `status: "paid"` and a signed URL is generated
**When** the email trigger fires
**Then** a transactional email is sent to `buyer_email` via SES/SendGrid
**And** the email includes: product title, creator name, payment amount, download button/link, creator's contact link
**And** the email is HTML-formatted with the Stan-store branding (Creator Purple header)
**And** email delivery status is logged on the order document (`email_sent_at`, `email_status`)
**And** failed email sends are retried up to 3 times with exponential backoff
**And** the from address is `noreply@stan.store` with the creator's display name

### Story 5.3: Order History API (Creator Dashboard)

As a creator,
I want to see all my orders with buyer details and payment status,
So that I can track my revenue and fulfillment.

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they request `GET /api/v1/creator/orders`
**Then** orders are returned paginated (20 per page, cursor-based) sorted by `created_at` descending
**And** each order includes: `buyer_name`, `buyer_email`, `product_title`, `amount`, `status`, `created_at`, `gateway_order_id`
**And** filtering is supported by `status` (pending, paid, failed) and date range
**And** a summary endpoint `GET /api/v1/creator/orders/summary` returns: `total_revenue`, `total_orders`, `orders_today`, `revenue_today`
**And** only orders for the authenticated creator's products are returned (creator_id filter)

### Story 5.4: Immutable Transaction Log

As a platform,
I want an immutable audit trail of all financial transactions,
So that we maintain compliance and can debug payment issues.

**Acceptance Criteria:**

**Given** any payment-related event occurs (order created, payment attempted, signature verified, webhook received, refund issued)
**When** the event is processed
**Then** a new document is inserted into the `transactions` collection (append-only, never updated)
**And** each document includes: `_id`, `order_id`, `event_type`, `gateway`, `gateway_event_id`, `amount`, `status`, `raw_payload` (stringified), `created_at`, `ip_address`
**And** the collection has NO update or delete operations in the repository (append-only pattern)
**And** an index on `order_id` enables fast lookups
**And** retention policy comment documents: 5-year minimum retention per PCI-DSS

### Story 5.5: Frontend Order History & Earnings Dashboard

As a creator,
I want to see my earnings and recent orders on my dashboard,
So that I feel motivated to keep selling and can track my progress.

**Acceptance Criteria:**

**Given** an authenticated creator on `/dashboard`
**When** the dashboard loads
**Then** the `EarningsHero` component displays today's earnings prominently ("₹4,990 earned today")
**And** the hero shows a trend arrow (up/down vs yesterday) and a period selector (Today/Week/Month)
**And** zero-state shows: "No sales yet — share your link!" with a "Copy Store Link" CTA
**And** below the hero, a recent orders list shows the last 10 orders with buyer name, product, amount, status badge
**And** "View All Orders" links to `/dashboard/orders` with the full paginated table
**And** the `EarningsHero` uses `aria-live="polite"` for real-time value updates
**And** toast notification appears when a new sale arrives: "₹499 received from Rahul!"

---

## Epic 6: Platform Administration & Analytics

**Goal:** Platform admins can view aggregated metrics and manage creators. Creators see basic sales analytics.

### Story 6.1: Platform Admin Metrics API

As a platform admin,
I want to view aggregated metrics across all creators and orders,
So that I can monitor the platform's health and growth.

**Acceptance Criteria:**

**Given** an authenticated user with `role: "admin"`
**When** they request `GET /api/v1/admin/metrics`
**Then** the response includes: `total_gmv` (sum of all paid orders), `total_users` (creator count), `total_orders`, `active_stores` (creators with ≥1 product), `gmv_today`, `signups_today`
**And** metrics are computed from aggregation queries on `orders` and `users` collections
**And** non-admin users receive 403 Forbidden
**And** the response is cached in Redis for 5 minutes to avoid heavy aggregation queries on every request

### Story 6.2: Creator Ban & Moderation API

As a platform admin,
I want to ban a creator so their store becomes inaccessible,
So that I can enforce platform policies.

**Acceptance Criteria:**

**Given** an authenticated admin
**When** they submit `POST /api/v1/admin/creators/:id/ban` with `{"reason": "Policy violation"}`
**Then** the creator's `status` field is set to "banned" and `banned_at`, `ban_reason` are recorded
**And** the creator's storefront (`GET /api/v1/store/:username`) returns 403 with `{"error": {"code": "STORE_BANNED", "message": "This store has been suspended"}}`
**And** the creator's login is blocked (JWT validation checks `status !== "banned"`)
**And** `POST /api/v1/admin/creators/:id/unban` restores access
**And** ban/unban events are logged in the `transactions` collection as audit events
**And** Redis cache for the banned store is invalidated immediately

### Story 6.3: Frontend Admin Dashboard

As a platform admin,
I want a simple admin interface showing platform metrics and creator management,
So that I can monitor the platform without using raw database queries.

**Acceptance Criteria:**

**Given** an authenticated admin on `/admin`
**When** the page loads
**Then** metric cards display: Total GMV, Total Users, Total Orders, Active Stores, Today's GMV, Today's Signups
**And** a searchable creators list shows: username, email, product count, total revenue, status (active/banned)
**And** each creator row has a "Ban" / "Unban" action button
**And** ban triggers a confirmation dialog with reason input field
**And** the admin route is protected via `RoleRequired("admin")` middleware
**And** non-admin users are redirected to `/dashboard`

---

## Epic 7: Performance, Reliability & Security Hardening

**Goal:** The platform meets all NFRs — sub-second loads, webhook resilience, encryption, and traffic spike handling.

### Story 7.1: Redis Caching for Storefront Performance

As a buyer,
I want storefront pages to load in under 1 second,
So that I don't abandon the page while waiting.

**Acceptance Criteria:**

**Given** a buyer requests a creator's storefront
**When** the `GET /api/v1/store/:username` endpoint is called
**Then** the response is served from Redis cache if available (cache hit: < 5ms response)
**And** cache TTL is 60 seconds for storefront data
**And** cache is invalidated when the creator updates their profile or products
**And** cache miss falls through to MongoDB query and populates the cache
**And** LCP is measurably < 1.2s on simulated 4G connection (NFR1)
**And** API latency is < 100ms at the 95th percentile under normal load (NFR2)

### Story 7.2: Background Payment Reconciliation Worker

As a platform,
I want a background process that reconciles pending payments,
So that network failures don't result in lost orders.

**Acceptance Criteria:**

**Given** orders exist with `status: "pending"` for more than 5 minutes
**When** the background reconciler runs (every 2 minutes via Go routine)
**Then** it queries Razorpay's Payment API for each pending order's `gateway_order_id`
**And** if Razorpay reports "captured", the order is updated to "paid" and delivery is triggered
**And** if Razorpay reports "failed" or "expired", the order is updated accordingly
**And** each reconciliation attempt is logged in the `transactions` collection
**And** the reconciler handles API rate limits gracefully (exponential backoff)
**And** a maximum of 100 pending orders are processed per cycle to avoid overload

### Story 7.3: Webhook Dead-Letter Queue & Retry Mechanism

As a platform,
I want failed webhook events to be retried reliably,
So that 99.99% of webhooks are processed successfully (NFR7).

**Acceptance Criteria:**

**Given** a webhook event fails to process (database error, timeout)
**When** the failure occurs
**Then** the webhook payload is stored in a `webhook_dlq` collection with `retry_count`, `next_retry_at`, `error_message`
**And** a background Go routine processes the DLQ every 30 seconds
**And** retries use exponential backoff: 30s, 1min, 5min, 30min, 1hr (max 5 retries)
**And** after 5 failed retries, the event is marked as "dead" and an alert is logged
**And** successfully retried events are removed from the DLQ
**And** metrics are available: `dlq_size`, `events_retried`, `events_dead`

### Story 7.4: Security Hardening & Data Protection

As a platform,
I want all sensitive data encrypted and all endpoints secured,
So that creator and buyer data is protected (NFR4, NFR5, NFR6).

**Acceptance Criteria:**

**Given** the application is deployed
**When** security is validated
**Then** TLS 1.3 is enforced for all HTTP connections
**And** Razorpay API keys are encrypted at rest using AES-256 field-level encryption
**And** JWT tokens expire after 7 days and are refreshed on activity
**And** CORS is configured to allow only the frontend domain
**And** rate limiting is applied: 100 req/min for public endpoints, 300 req/min for authenticated
**And** all file uploads are scanned for content-type validity (not just extension)
**And** S3/GCS buckets have no public access policy; files are accessible only via pre-signed URLs (NFR5)
**And** no raw card data is stored or logged (NFR6) — all payment data stays with Razorpay
**And** security headers are set: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`

### Story 7.5: Load Testing & Performance Validation

As a developer,
I want to validate the system handles 10k concurrent users,
So that we're confident about handling "creator drop" traffic spikes (NFR9).

**Acceptance Criteria:**

**Given** a load testing tool (k6 or Artillery) is configured
**When** a load test simulates 10,000 concurrent users hitting the storefront endpoint
**Then** the 95th percentile response time remains < 100ms (NFR2)
**And** the 99th percentile response time remains < 500ms
**And** zero 5xx errors occur during the test
**And** MongoDB connection pool handles concurrency without exhaustion
**And** Redis cache hit ratio exceeds 95% during the load test
**And** a load test script exists in `backend/tests/load/` and can be run via `make load-test`
**And** results are documented with baseline metrics for future comparison
