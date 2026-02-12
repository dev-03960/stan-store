# EPIC-03: Storefront & Product Management

## Epic Goal

Creators can add digital download products, manage their visibility, and publish an auto-generated mobile-optimized public storefront page.

## In Scope

- Product domain model and CRUD API (create, read, update, soft-delete)
- Pre-signed URL file upload to S3/GCS (product files + cover images)
- Product visibility toggle and drag-and-drop reordering
- Public storefront API with Redis caching
- Frontend mobile-optimized storefront page with skeleton loading
- Frontend dashboard product management interface

## Out of Scope

- Product types beyond "Digital Download" (courses, bookings — Phase 3)
- Product analytics and sales stats per product
- Product reviews or ratings
- Product categories or tags

## Dependencies

- **EPIC-01** — Requires backend skeleton, MongoDB, Redis, and frontend app shell
- **EPIC-02** — Requires authentication middleware and creator profile (storefront displays profile data)

## User Stories

### STORY-3.1: Product Domain Model & CRUD API

As a creator,
I want to create, read, update, and delete digital download products,
So that I can manage the items I'm selling from my store.

**Acceptance Criteria:**

- **Given** an authenticated creator
- **When** they submit `POST /api/v1/products` with `title`, `description`, `price` (integer, paise), `cover_image_url`, `file_url`, `product_type` ("download")
- **Then** a new document is created in the `products` collection with: `_id`, `creator_id`, `title`, `description`, `price`, `cover_image_url`, `file_url`, `product_type`, `is_visible` (default: true), `sort_order`, `created_at`, `updated_at`
- **And** `GET /api/v1/products` returns only the authenticated creator's products (filtered by `creator_id`)
- **And** `PUT /api/v1/products/:id` updates the product (only if `creator_id` matches)
- **And** `DELETE /api/v1/products/:id` soft-deletes the product (sets `deleted_at`)
- **And** price validation ensures `price >= 100` (₹1 minimum) and `price <= 10000000` (₹1,00,000 max)
- **And** `title` is required, max 100 characters; `description` max 500 characters

**FRs covered:** FR7

### STORY-3.2: File Upload to S3/GCS

As a creator,
I want to upload my digital product file and cover image,
So that they are securely stored and ready for delivery to buyers.

**Acceptance Criteria:**

- **Given** an authenticated creator
- **When** they request `POST /api/v1/uploads/presigned` with `{"file_name": "workout.pdf", "content_type": "application/pdf", "purpose": "product_file"}`
- **Then** the server generates a pre-signed upload URL for S3/GCS (valid for 15 minutes)
- **And** the response includes `upload_url` (pre-signed PUT URL) and `file_key` (storage path)
- **And** file size limit is 100MB for product files, 5MB for cover images
- **And** allowed content types: PDF, ZIP, MP4, MP3, PNG, JPG, JPEG, WEBP
- **And** the storage path follows: `creators/{creator_id}/products/{uuid}.{ext}`
- **And** uploaded files are **private by default** (no public access)
- **And** the `file_key` is stored on the product document for later signed URL generation

### STORY-3.3: Product Visibility Toggle & Reordering

As a creator,
I want to toggle products visible/hidden and reorder them via drag-and-drop,
So that I can control what my audience sees and in what order.

**Acceptance Criteria:**

- **Given** an authenticated creator with multiple products
- **When** they submit `PATCH /api/v1/products/:id/visibility` with `{"is_visible": false}`
- **Then** the product's `is_visible` field is updated and it no longer appears on the public storefront
- **And** `PATCH /api/v1/products/reorder` with `{"product_ids": ["id1", "id2", "id3"]}` updates `sort_order` for all listed products in a single atomic operation
- **And** only the creator's own products can be reordered (ownership check)
- **And** the public storefront API returns products ordered by `sort_order` ascending, filtering out `is_visible: false`

**FRs covered:** FR8, FR9

### STORY-3.4: Public Storefront Page (Backend API)

As a buyer,
I want to view a creator's store page by visiting their unique URL,
So that I can browse and purchase their products.

**Acceptance Criteria:**

- **Given** a valid creator username
- **When** a request is made to `GET /api/v1/store/:username`
- **Then** the response includes: creator profile (`display_name`, `bio`, `avatar_url`, `social_links`) and visible products (sorted by `sort_order`)
- **And** the product data includes `id`, `title`, `description`, `price`, `cover_image_url`, `product_type` (but NOT `file_url` — this is server-side only)
- **And** the response is cached in Redis with a TTL of 60 seconds for sub-100ms reads
- **And** if the username doesn't exist, a 404 is returned
- **And** if the creator is banned, a 403 is returned
- **And** no authentication is required to access this endpoint

**FRs covered:** FR10

### STORY-3.5: Frontend Storefront Page (Mobile-Optimized)

As a buyer,
I want a beautifully designed, mobile-optimized storefront page,
So that I feel confident purchasing from this creator.

**Acceptance Criteria:**

- **Given** a buyer navigates to `/:username` on the frontend
- **When** the page loads
- **Then** the `StoreHeader` component renders: gradient background, avatar, display name, bio, social links (as per UX spec)
- **And** `ProductCard` components render for each visible product: cover image, title, description (2 lines), price badge, "Buy ₹{price}" CTA button
- **And** the layout is single-column, max-width 480px, centered (identical on all screen sizes per UX spec)
- **And** skeleton loading states show gray rectangles mimicking content layout while data loads
- **And** the page renders correctly in Instagram's in-app browser
- **And** LCP target is < 1.2s on 4G (skeleton renders immediately, data fills in)
- **And** no navigation bar or sticky elements (maximize content area)

**FRs covered:** FR10

### STORY-3.6: Frontend Dashboard — Product Management

As a creator,
I want a dashboard interface to manage my products,
So that I can add, edit, toggle visibility, and reorder my products easily.

**Acceptance Criteria:**

- **Given** an authenticated creator on `/dashboard/products`
- **When** the page loads
- **Then** all products (including hidden) are displayed as cards with visibility status
- **And** a "+ Add Product" primary CTA button is prominently visible
- **And** clicking "+ Add Product" opens a form (dialog or inline) with: title, description, price, cover image upload, file upload
- **And** each product card has a "more actions" dropdown: Edit, Toggle Visibility, Delete
- **And** "Delete" triggers a confirmation dialog: "Delete this product?" with Cancel and Delete buttons
- **And** drag-and-drop reordering of product cards is supported and auto-saves
- **And** toast notifications appear for all actions: "Product created!", "Product updated!", "Product deleted"
- **And** empty state shows illustration + "Create your first product" message with primary CTA

**FRs covered:** FR7, FR8, FR9

## UX References

- **StoreHeader Component:** Gradient background, avatar, social links — see `ux-design-specification.md` § Component Strategy → StoreHeader
- **ProductCard Component:** Cover image, title, 2-line description, price badge, "Buy" CTA — see `ux-design-specification.md` § Component Strategy → ProductCard
- **Skeleton Loading:** Gray rectangles mimicking content layout — see `ux-design-specification.md` § UX Consistency Patterns → Loading States
- **Empty States:** Illustration + action CTA — see `ux-design-specification.md` § UX Consistency Patterns → Empty States
- **Mobile Layout:** Single-column, max-width 480px — see `ux-design-specification.md` § Responsive Design

## API / Data Notes

- **`products` collection schema:** `_id`, `creator_id`, `title`, `description`, `price` (paise, int), `cover_image_url`, `file_url`, `product_type`, `is_visible`, `sort_order`, `deleted_at`, `created_at`, `updated_at`
- **Indexes:** `creator_id` (query), `creator_id + is_visible + sort_order` (storefront)
- **File Storage:** S3/GCS, path `creators/{creator_id}/products/{uuid}.{ext}`, private by default
- **API Endpoints:**
  - `POST /api/v1/products` — Create product
  - `GET /api/v1/products` — List creator's products
  - `PUT /api/v1/products/:id` — Update product
  - `DELETE /api/v1/products/:id` — Soft-delete
  - `PATCH /api/v1/products/:id/visibility` — Toggle visibility
  - `PATCH /api/v1/products/reorder` — Reorder products
  - `POST /api/v1/uploads/presigned` — Get upload URL
  - `GET /api/v1/store/:username` — Public storefront

## Definition of Done

- [ ] Product CRUD API works with all validation rules (price range, title length)
- [ ] Pre-signed upload URL generation works for product files and cover images
- [ ] Visibility toggle hides products from public storefront
- [ ] Reorder API updates `sort_order` atomically
- [ ] Public storefront API returns cached response (Redis, 60s TTL)
- [ ] Frontend storefront renders mobile-optimized with skeleton loading
- [ ] Dashboard product management supports add, edit, delete, toggle, reorder
- [ ] `file_url` is NEVER exposed in the public storefront API response
