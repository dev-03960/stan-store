# EPIC-02: Creator Identity & Onboarding

## Epic Goal

Creators can sign up via Google OAuth, claim a unique store URL (`stan.store/username`), set up their profile, and have a complete identity in the system.

## In Scope

- Google OAuth login/signup backend integration
- Unique username claim with validation and reservation
- JWT authentication with HTTP-Only cookies
- RBAC middleware (Creator, Buyer, Admin roles)
- Creator profile CRUD (display name, bio, avatar, social links)
- Frontend onboarding wizard (4-step guided flow)
- Frontend auth flow (login, session management)

## Out of Scope

- Payment method setup (handled in Epic 4, placeholder in onboarding step 4)
- Email/password authentication
- Two-factor authentication
- Creator subscription billing (tier is stored but not billed in MVP)

## Dependencies

- **EPIC-01** — Requires running backend skeleton, MongoDB connection, Redis connection, and frontend app shell

## User Stories

### STORY-2.1: Google OAuth Backend Integration

As a creator,
I want to sign up and log in using my Google account,
So that I can start building my store without remembering another password.

**Acceptance Criteria:**

- **Given** Google OAuth client credentials are configured in `.env`
- **When** a user initiates Google login via `GET /api/v1/auth/google`
- **Then** they are redirected to Google's consent screen with `email` and `profile` scopes
- **And** after consent, Google redirects back to `GET /api/v1/auth/google/callback`
- **And** the callback creates a new `users` document if the email doesn't exist, or finds the existing user
- **And** a JWT token is generated and set as an HTTP-Only, Secure, SameSite=Strict cookie
- **And** the `users` collection document includes: `_id`, `email`, `display_name`, `avatar_url`, `google_id`, `subscription_tier` (default: "free"), `created_at`, `updated_at`
- **And** duplicate emails are rejected (unique index on `email`)
- **And** the response redirects to `/dashboard` or `/onboarding` based on whether `username` is already claimed

**FRs covered:** FR1, FR3, FR4

### STORY-2.2: Username Claim & Store URL

As a creator,
I want to claim a unique username that becomes my store URL,
So that I can share a clean link (`stan.store/myname`) with my audience.

**Acceptance Criteria:**

- **Given** an authenticated creator with no username yet
- **When** they submit `POST /api/v1/auth/username` with `{"username": "priyafit"}`
- **Then** the username is validated: 3-30 chars, lowercase alphanumeric + hyphens only, no leading/trailing hyphens
- **And** a case-insensitive uniqueness check is performed against the `users` collection
- **And** if available, the `username` field is set on the user document
- **And** if taken, a 409 Conflict is returned with `{"error": {"code": "USERNAME_TAKEN", "message": "This username is already claimed"}}`
- **And** a unique index on `username` prevents race conditions
- **And** reserved usernames (admin, api, www, store, help, support) are rejected with a 422 error

**FRs covered:** FR2, FR3

### STORY-2.3: Auth Middleware & RBAC

As a developer,
I want authentication and role-based access control middleware,
So that protected endpoints verify identity and permissions consistently.

**Acceptance Criteria:**

- **Given** the Fiber app has middleware registered
- **When** a request hits a protected endpoint
- **Then** the `AuthRequired` middleware extracts and validates the JWT from the HTTP-Only cookie
- **And** invalid/expired tokens return 401 with `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}`
- **And** the authenticated user's ID and role are injected into the Fiber context (`c.Locals`)
- **And** a `RoleRequired(roles ...string)` middleware checks if the user's role is in the allowed list
- **And** unauthorized role access returns 403 with `{"error": {"code": "FORBIDDEN", "message": "Insufficient permissions"}}`
- **And** three roles exist: `creator`, `buyer` (ephemeral/guest), `admin`

### STORY-2.4: Creator Profile Setup & Edit

As a creator,
I want to customize my store profile with a photo, bio, and social links,
So that my store page reflects my brand and builds trust with buyers.

**Acceptance Criteria:**

- **Given** an authenticated creator
- **When** they submit `PUT /api/v1/creator/profile` with `display_name`, `bio`, `avatar_url`, `social_links` (array of `{platform, url}`)
- **Then** the profile fields are updated on the `users` document
- **And** `bio` is limited to 160 characters (matching Instagram bio length)
- **And** `social_links` supports platforms: instagram, youtube, twitter, linkedin, tiktok (max 5 links)
- **And** `avatar_url` accepts a valid URL (image upload is a separate concern)
- **And** `GET /api/v1/creator/profile` returns the full profile including `username`, `display_name`, `bio`, `avatar_url`, `social_links`, `subscription_tier`
- **And** the response shape follows the standard JSON envelope

**FRs covered:** FR6

### STORY-2.5: Frontend Auth Flow & Onboarding Wizard

As a creator,
I want a guided onboarding experience after signing up,
So that I can set up my store in under 5 minutes without confusion.

**Acceptance Criteria:**

- **Given** a new creator who has just authenticated via Google OAuth
- **When** they land on the app without a claimed username
- **Then** they are redirected to a 4-step onboarding wizard (as defined in UX spec)
- **And** Step 1: Claim username (real-time availability check via `GET /api/v1/auth/username/check?username=xxx`)
- **And** Step 2: Set display name and upload/enter avatar URL
- **And** Step 3: Add bio and social links
- **And** Step 4: Connect payment method (placeholder — completed in Epic 4)
- **And** a progress bar shows completion (using the `OnboardingWizard` component spec)
- **And** each step auto-saves on "Next" (optimistic UI)
- **And** "Skip" is available for non-critical steps (bio, socials)
- **And** on completion, redirect to `/dashboard` with a "Store is LIVE!" celebration toast

**FRs covered:** FR1, FR2, FR6

## UX References

- **Onboarding Wizard:** 4-step progressive flow with progress bar — see `ux-design-specification.md` § User Journey Flows → Creator Onboarding
- **Celebration Moments:** Toast + confetti on "Store is LIVE!" — see `ux-design-specification.md` § Emotional Response → "Celebrate Every Win"
- **Form Patterns:** Real-time validation on blur, inline errors, `inputmode` attributes — see `ux-design-specification.md` § UX Consistency Patterns → Forms

## API / Data Notes

- **`users` collection schema:** `_id`, `email`, `display_name`, `username`, `avatar_url`, `google_id`, `subscription_tier`, `social_links[]`, `status`, `created_at`, `updated_at`
- **Indexes:** Unique on `email`, unique on `username` (both case-insensitive)
- **JWT:** Stored in HTTP-Only, Secure, SameSite=Strict cookie; payload includes `user_id`, `role`
- **API Endpoints:**
  - `GET /api/v1/auth/google` — Initiate OAuth
  - `GET /api/v1/auth/google/callback` — OAuth callback
  - `POST /api/v1/auth/username` — Claim username
  - `GET /api/v1/auth/username/check` — Check availability
  - `GET /api/v1/creator/profile` — Read profile
  - `PUT /api/v1/creator/profile` — Update profile

## Definition of Done

- [ ] Google OAuth login flow works end-to-end (Google → callback → JWT cookie → redirect)
- [ ] Username claim validates, checks uniqueness, and sets on user document
- [ ] Auth middleware blocks unauthenticated and unauthorized requests with correct error codes
- [ ] Profile CRUD works with all validation rules (bio length, social link limits)
- [ ] Onboarding wizard renders 4 steps with progress bar and auto-save
- [ ] New users redirect to onboarding; returning users redirect to dashboard
- [ ] Reserved usernames are rejected
