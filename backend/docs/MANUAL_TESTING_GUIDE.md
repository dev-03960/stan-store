# Stan Store — Manual Testing Guide

## Prerequisites

### 1. Start the Backend
```bash
cd backend
cp .env.example .env   # ensure .env is configured
go run cmd/api/main.go
```
Server runs at `http://localhost:8080`. Verify with:
```bash
curl http://localhost:8080/api/v1/health
# → {"data":{"status":"ok"},...}
```

### 2. Get Auth Tokens

**Creator Token** — Use the Google OAuth flow:
1. Open `http://localhost:8080/api/v1/auth/google` in your browser
2. Complete Google login
3. After redirect, open DevTools → **Application** → **Cookies** → copy `stan_token`
4. Set it as a variable:
```bash
export CREATOR_TOKEN="paste_token_here"
```

**Admin Token** — You need a user with `role: "admin"` in MongoDB:
```bash
# In MongoDB shell (mongosh):
use stanstore
db.users.updateOne(
  { email: "your-admin-email@gmail.com" },
  { $set: { role: "admin" } }
)
```
Then login via Google OAuth with that email and copy the token:
```bash
export ADMIN_TOKEN="paste_admin_token_here"
```

### 3. Import Postman Collection (Optional)
Import `backend/docs/stan-store-api.postman_collection.json` into Postman.
Set `creatorToken` and `adminToken` collection variables.

---

## Testing Flows

### Flow 1: Onboarding (New User)

```bash
# 1. Login via Google (browser) → get CREATOR_TOKEN

# 2. Check /auth/me → should show user without username
curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .

# 3. Check username availability
curl -s "http://localhost:8080/api/v1/auth/username/check?username=mystore" | jq .
# → {"data":{"available":true,"username":"mystore"}}

# 4. Claim the username
curl -s -X POST http://localhost:8080/api/v1/auth/username \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"mystore"}' | jq .
# → 200, user object with username set

# 5. Verify /auth/me now shows username
curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .data.username
# → "mystore"
```

---

### Flow 2: Profile Setup

```bash
# 1. Get current profile
curl -s http://localhost:8080/api/v1/creator/profile \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .

# 2. Update profile
curl -s -X PUT http://localhost:8080/api/v1/creator/profile \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "My Awesome Store",
    "bio": "Premium digital products for creators",
    "theme_color": "#6c5ce7"
  }' | jq .

# 3. Verify changes persisted
curl -s http://localhost:8080/api/v1/creator/profile \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .data.display_name
# → "My Awesome Store"
```

---

### Flow 3: Product Management (CRUD)

```bash
# 1. Create a product (price in paise: ₹499 = 49900)
curl -s -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workout Plan PDF",
    "description": "30-day fat loss program",
    "price": 49900,
    "cover_image_url": "https://example.com/cover.jpg",
    "file_url": "s3://bucket/workout.pdf",
    "product_type": "download"
  }' | jq .
# Save the product ID:
export PRODUCT_ID="paste_product_id_here"

# 2. List all products
curl -s http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .

# 3. Update a product
curl -s -X PUT http://localhost:8080/api/v1/products/$PRODUCT_ID \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Workout Plan v2", "price": 69900}' | jq .

# 4. Toggle visibility (hide from storefront)
curl -s -X PATCH http://localhost:8080/api/v1/products/$PRODUCT_ID/visibility \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_visible": false}' | jq .

# 5. Toggle back to visible
curl -s -X PATCH http://localhost:8080/api/v1/products/$PRODUCT_ID/visibility \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_visible": true}' | jq .

# 6. Delete product (soft delete)
curl -s -X DELETE http://localhost:8080/api/v1/products/$PRODUCT_ID \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .

# 7. Verify it's gone from list
curl -s http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq '.data | length'
```

---

### Flow 4: Public Storefront

```bash
# View a creator's public store (replace with actual username)
export CREATOR_USERNAME="mystore"

curl -s http://localhost:8080/api/v1/store/$CREATOR_USERNAME | jq .
# → 200: profile + visible products

# Non-existent store → 404
curl -s http://localhost:8080/api/v1/store/nonexistentuser | jq .
# → 404 ERR_NOT_FOUND
```

---

### Flow 5: Order & Payment Flow

```bash
# 1. Create an order (PUBLIC, no auth needed)
curl -s -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "'$PRODUCT_ID'",
    "customer_name": "John Doe",
    "customer_email": "john@example.com"
  }' | jq .
export ORDER_ID="paste_order_id_here"
# Response includes Razorpay order details for payment

# 2. Simulate payment (via Razorpay test mode in browser)
# Or manually mark as paid in MongoDB for testing:
#   db.orders.updateOne({_id: ObjectId("ORDER_ID")}, {$set: {status: "paid"}})

# 3. Download purchased product
curl -s http://localhost:8080/api/v1/orders/$ORDER_ID/download | jq .
# → {"data":{"download_url":"https://..."}}
```

---

### Flow 6: Creator Dashboard (Sales & Wallet)

```bash
# 1. View sales history
curl -s http://localhost:8080/api/v1/sales \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .

# 2. View wallet balance & transactions
curl -s http://localhost:8080/api/v1/wallet \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .
```

---

### Flow 7: Payment Settings

```bash
# 1. Get current settings
curl -s http://localhost:8080/api/v1/payments/settings \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .

# 2. Enable payments
curl -s -X PUT http://localhost:8080/api/v1/payments/settings \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq .
```

---

### Flow 8: File Uploads (Presigned URL)

```bash
# 1. Get presigned upload URL
curl -s -X POST http://localhost:8080/api/v1/uploads/presigned \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "my-ebook.pdf",
    "content_type": "application/pdf",
    "purpose": "product"
  }' | jq .
# → Returns upload_url and file_url

# 2. Upload file to the presigned URL (use the upload_url from response)
# curl -X PUT "<upload_url>" -H "Content-Type: application/pdf" --data-binary @my-ebook.pdf
```

---

### Flow 9: Admin — Platform Metrics

```bash
curl -s http://localhost:8080/api/v1/admin/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
# → {"data":{"total_users":5,"total_revenue":99800,"total_orders":3,"active_creators":2}}

# Non-admin attempt → 403
curl -s http://localhost:8080/api/v1/admin/metrics \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .
# → 403 ERR_FORBIDDEN
```

---

### Flow 10: Admin — Creator Moderation (Ban/Unban)

This is the complete ban/unban lifecycle. Get the creator's MongoDB `_id` first:
```bash
# Find creator ID in MongoDB:
# db.users.findOne({username: "mystore"})._id
export TARGET_CREATOR_ID="paste_creator_object_id_here"
```

```bash
# ─── Step 1: Verify store is accessible ───
curl -s http://localhost:8080/api/v1/store/$CREATOR_USERNAME | jq .status
# → 200

# ─── Step 2: Ban the creator (ADMIN) ───
curl -s -X POST http://localhost:8080/api/v1/admin/creators/$TARGET_CREATOR_ID/ban \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Policy violation - spam content"}' | jq .
# → 200 "Creator banned successfully"

# ─── Step 3: Verify store is blocked (PUBLIC) ───
curl -s http://localhost:8080/api/v1/store/$CREATOR_USERNAME | jq .
# → 403 {"error":{"code":"ERR_STORE_BANNED","message":"This store has been suspended"}}

# ─── Step 4: Verify dashboard is blocked (AS CREATOR) ───
curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .
# → 403 {"error":{"code":"ERR_ACCOUNT_BANNED","message":"Your account has been suspended"}}

curl -s http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .
# → 403 ERR_ACCOUNT_BANNED

# ─── Step 5: Non-admin cannot ban ───
curl -s -X POST http://localhost:8080/api/v1/admin/creators/$TARGET_CREATOR_ID/ban \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "test"}' | jq .
# → 403 ERR_FORBIDDEN

# ─── Step 6: Unban the creator (ADMIN) ───
curl -s -X POST http://localhost:8080/api/v1/admin/creators/$TARGET_CREATOR_ID/unban \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
# → 200 "Creator unbanned successfully"

# ─── Step 7: Verify everything is restored ───
curl -s http://localhost:8080/api/v1/store/$CREATOR_USERNAME | jq .status
# → 200

curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .data.username
# → "mystore"
```

---

### Flow 11: Error Cases & Edge Cases

```bash
# Unauthenticated request → 401
curl -s http://localhost:8080/api/v1/auth/me | jq .
# → 401 ERR_UNAUTHORIZED

# Invalid token → 401
curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token" | jq .
# → 401 ERR_UNAUTHORIZED

# Route not found → 404
curl -s http://localhost:8080/api/v1/nonexistent | jq .
# → 404 ERR_NOT_FOUND

# Ban with missing reason → 400
curl -s -X POST http://localhost:8080/api/v1/admin/creators/$TARGET_CREATOR_ID/ban \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
# → 400 ERR_BAD_REQUEST

# Ban non-existent user → 404
curl -s -X POST http://localhost:8080/api/v1/admin/creators/000000000000000000000000/ban \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"test"}' | jq .
# → 404 ERR_NOT_FOUND

# Product with price too low → 400
curl -s -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","price":50}' | jq .
# → 400
```

---

### Flow 12: Affiliates & Referrals

```bash
# 1. Register as an affiliate (Public)
curl -s -X POST http://localhost:8080/api/v1/affiliates/register \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "'$TARGET_CREATOR_ID'",
    "email": "affiliate@example.com",
    "name": "Jane Promoter"
  }' | jq .
# returns referral_code

export REF_CODE="paste_referral_code_here"

# 2. Track an affiliate click
curl -s -X POST http://localhost:8080/api/v1/affiliates/track \
  -H "Content-Type: application/json" \
  -d '{"code": "'$REF_CODE'"}' | jq .

# 3. View affiliate stats (Public - using code)
curl -s "http://localhost:8080/api/v1/affiliates/my-stats?code=$REF_CODE" | jq .
```

---

### Flow 13: Funnel Analytics Tracking

```bash
# 1. Track a pageview (Public ingestion)
curl -s -X POST http://localhost:8080/api/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "creator_id": "'$TARGET_CREATOR_ID'"
  }' 
# Should return 204 No Content

# 2. Track a checkout start
curl -s -X POST http://localhost:8080/api/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "checkout_start",
    "creator_id": "'$TARGET_CREATOR_ID'",
    "product_id": "'$PRODUCT_ID'"
  }'

# 3. View Analytics Dashboard (Creator)
curl -s "http://localhost:8080/api/v1/creator/analytics?period=7d" \
  -H "Authorization: Bearer $CREATOR_TOKEN" | jq .
```

---

### Flow 14: Marketing & Automations

```bash
# 1. Create an Email Campaign
curl -s -X POST http://localhost:8080/api/v1/creator/campaigns \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "subject": "50% Off Everything!",
    "content_html": "<h1>Huge Sale</h1><p>Click here to buy.</p>"
  }' | jq .
```

---

### Flow 15: Buyer Accounts (Magic Links)

```bash
# 1. Request Login Link
curl -s -X POST http://localhost:8080/api/v1/auth/buyer/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "buyer@example.com", "redirect_url": "http://localhost:5173/dashboard"}'

# 2. View Buyer Purchases (After authenticating via the email link)
# Assume BUYER_TOKEN is acquired via browser
curl -s http://localhost:8080/api/v1/buyer/purchases \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq .
```

---

### Flow 16: Courses & Memberships

```bash
# 1. Create Course Module (Creator)
curl -s -X POST http://localhost:8080/api/v1/products/$PRODUCT_ID/course/modules \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Module 1"}' | jq .
export MODULE_ID="paste_id_here"

# 2. Create Lesson (Creator)
curl -s -X POST http://localhost:8080/api/v1/products/$PRODUCT_ID/course/modules/$MODULE_ID/lessons \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Intro", "content_type": "video", "video_url": "https://vimeo.com/..."}' | jq .

# 3. View Course Contents (Buyer or Creator)
curl -s http://localhost:8080/api/v1/products/$PRODUCT_ID/course \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq .
```

---

### Flow 17: Discount Coupons

```bash
# 1. Create Coupon
curl -s -X POST http://localhost:8080/api/v1/coupons \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER50",
    "discount_type": "percentage",
    "discount_value": 50,
    "product_ids": ["'$PRODUCT_ID'"]
  }' | jq .

# 2. Validate Coupon (Public Checkout)
curl -s -X POST http://localhost:8080/api/v1/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "SUMMER50", "product_ids": ["'$PRODUCT_ID'"]}' | jq .
```

---

### Flow 18: AI & Testimonials

```bash
# 1. Generate AI Copy
curl -s -X POST http://localhost:8080/api/v1/ai/generate-copy \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a sales pitch for my workout PDF", "tone": "energetic"}' | jq .

# 2. Add Testimonial
curl -s -X POST http://localhost:8080/api/v1/products/$PRODUCT_ID/testimonials \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"author_name": "Jane", "content": "Amazing product!", "rating": 5}' | jq .
```

---

## API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/health` | — | Health check |
| `GET` | `/api/v1/auth/google` | — | Start Google OAuth |
| `GET` | `/api/v1/auth/google/callback` | — | OAuth callback |
| `GET` | `/api/v1/auth/me` | ✅ | Get current user |
| `POST` | `/api/v1/auth/logout` | ✅ | Logout |
| `GET` | `/api/v1/auth/username/check` | — | Check username |
| `POST` | `/api/v1/auth/username` | ✅ | Claim username |
| `GET` | `/api/v1/creator/profile` | ✅ | Get profile |
| `PUT` | `/api/v1/creator/profile` | ✅ | Update profile |
| `POST` | `/api/v1/products` | ✅ | Create product |
| `GET` | `/api/v1/products` | ✅ | List products |
| `PUT` | `/api/v1/products/:id` | ✅ | Update product |
| `DELETE` | `/api/v1/products/:id` | ✅ | Delete product |
| `PATCH` | `/api/v1/products/:id/visibility` | ✅ | Toggle visibility |
| `PATCH` | `/api/v1/products/reorder` | ✅ | Reorder products |
| `POST` | `/api/v1/uploads/presigned` | ✅ | Get upload URL |
| `POST` | `/api/v1/orders` | — | Create order |
| `GET` | `/api/v1/orders/:id/download` | — | Download product |
| `GET` | `/api/v1/payments/settings` | ✅ | Get pay settings |
| `PUT` | `/api/v1/payments/settings` | ✅ | Update pay settings |
| `POST` | `/api/v1/payments/webhook` | Sig | Razorpay webhook |
| `GET` | `/api/v1/sales` | ✅ | Sales history |
| `GET` | `/api/v1/wallet` | ✅ | Wallet details |
| `GET` | `/api/v1/store/:username` | — | Public store |
| `GET` | `/api/v1/admin/metrics` | 🔒 | Platform metrics |
| `POST` | `/api/v1/admin/creators/:id/ban` | 🔒 | Ban creator |
| `POST` | `/api/v1/admin/creators/:id/unban` | 🔒 | Unban creator |
| `POST` | `/api/v1/creator/campaigns` | ✅ | Create email campaign |
| `POST` | `/api/v1/affiliates/register` | — | Register affiliate |
| `POST` | `/api/v1/analytics/events` | — | Track funnel event |
| `GET` | `/api/v1/creator/analytics` | ✅ | Get creator metrics |

**Legend:** ✅ = Auth required, 🔒 = Admin role required, Sig = Webhook signature, — = Public
