# EPIC-06: Platform Administration & Analytics

## Epic Goal

Platform admins can view aggregated metrics and manage creators. Creators see basic sales analytics.

## In Scope

- Platform-wide aggregated metrics API (GMV, users, orders, active stores)
- Creator ban/unban API with audit logging
- Frontend admin dashboard with metrics cards and creator management
- Redis cache invalidation on ban actions

## Out of Scope

- Creator-level detailed analytics (revenue trends, buyer demographics)
- Support ticket system
- Content moderation (file scanning)
- Platform billing and invoicing
- Admin user creation (admin role assigned directly in DB for MVP)

## Dependencies

- **EPIC-01** — Requires backend skeleton, MongoDB, Redis
- **EPIC-02** — Requires authentication middleware and RBAC (`admin` role)
- **EPIC-03** — Requires products collection (active stores metric)
- **EPIC-04** — Requires orders collection (GMV calculation)

## User Stories

### STORY-6.1: Platform Admin Metrics API

As a platform admin,
I want to view aggregated metrics across all creators and orders,
So that I can monitor the platform's health and growth.

**Acceptance Criteria:**

- **Given** an authenticated user with `role: "admin"`
- **When** they request `GET /api/v1/admin/metrics`
- **Then** the response includes: `total_gmv` (sum of all paid orders), `total_users` (creator count), `total_orders`, `active_stores` (creators with ≥1 product), `gmv_today`, `signups_today`
- **And** metrics are computed from aggregation queries on `orders` and `users` collections
- **And** non-admin users receive 403 Forbidden
- **And** the response is cached in Redis for 5 minutes to avoid heavy aggregation queries on every request

**FRs covered:** FR20

### STORY-6.2: Creator Ban & Moderation API

As a platform admin,
I want to ban a creator so their store becomes inaccessible,
So that I can enforce platform policies.

**Acceptance Criteria:**

- **Given** an authenticated admin
- **When** they submit `POST /api/v1/admin/creators/:id/ban` with `{"reason": "Policy violation"}`
- **Then** the creator's `status` field is set to "banned" and `banned_at`, `ban_reason` are recorded
- **And** the creator's storefront (`GET /api/v1/store/:username`) returns 403 with `{"error": {"code": "STORE_BANNED", "message": "This store has been suspended"}}`
- **And** the creator's login is blocked (JWT validation checks `status !== "banned"`)
- **And** `POST /api/v1/admin/creators/:id/unban` restores access
- **And** ban/unban events are logged in the `transactions` collection as audit events
- **And** Redis cache for the banned store is invalidated immediately

**FRs covered:** FR21

### STORY-6.3: Frontend Admin Dashboard

As a platform admin,
I want a simple admin interface showing platform metrics and creator management,
So that I can monitor the platform without using raw database queries.

**Acceptance Criteria:**

- **Given** an authenticated admin on `/admin`
- **When** the page loads
- **Then** metric cards display: Total GMV, Total Users, Total Orders, Active Stores, Today's GMV, Today's Signups
- **And** a searchable creators list shows: username, email, product count, total revenue, status (active/banned)
- **And** each creator row has a "Ban" / "Unban" action button
- **And** ban triggers a confirmation dialog with reason input field
- **And** the admin route is protected via `RoleRequired("admin")` middleware
- **And** non-admin users are redirected to `/dashboard`

## UX References

- **Admin Dashboard:** Simple metric cards + data table — no specific UX spec component (admin is a utility interface)
- **Confirmation Dialog:** Uses `Dialog` Radix primitive — see `ux-design-specification.md` § Component Strategy → Dialog
- **Button Patterns:** Destructive button for Ban action — see `ux-design-specification.md` § UX Consistency Patterns → Button Hierarchy

## API / Data Notes

- **User document additions:** `status` (active|banned), `banned_at`, `ban_reason` fields
- **Metrics:** Computed via MongoDB aggregation pipelines on `orders` (sum paid amounts) and `users` (count)
- **Caching:** Metrics cached in Redis with 5-minute TTL; ban action invalidates store cache immediately
- **API Endpoints:**
  - `GET /api/v1/admin/metrics` — Platform metrics (admin only)
  - `POST /api/v1/admin/creators/:id/ban` — Ban creator (admin only)
  - `POST /api/v1/admin/creators/:id/unban` — Unban creator (admin only)

## Definition of Done

- [ ] Admin metrics API returns accurate aggregated data (GMV, users, orders)
- [ ] Metrics response is cached in Redis (5-min TTL)
- [ ] Ban API sets creator status to "banned" and blocks storefront + login
- [ ] Unban API restores creator access
- [ ] Ban/unban events logged to `transactions` collection
- [ ] Redis cache invalidated on ban action
- [ ] Admin dashboard renders metrics cards and searchable creator list
- [ ] Non-admin users receive 403 on admin endpoints and are redirected on frontend
