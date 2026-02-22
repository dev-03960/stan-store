# Product Requirements Document (PRD): Creator Storefront Platform 

## 1. Executive Summary
**Objective:** To build an all-in-one, high-converting "link-in-bio" storefront that empowers creators to sell digital products, courses, coaching, and memberships seamlessly. 
**Current State:** The platform currently supports basic user authentication, simple digital product listings, Razorpay payment gateway integration (UPI/Cards), and a rudimentary order ledger. 
**Goal:** Transition from a basic digital download clone to a comprehensive monetization and marketing engine for creators.

---

## 2. Feature Specifications

### 2.1. Expanded Product Catalog
To match industry leaders, the platform must support diverse monetization methods beyond static digital downloads.
* **Coaching & Appointments:** * *Requirement:* Integration with a calendar UI to allow end-users to book available time slots.
    * *Specs:* Include timezone auto-conversion, integration with Google Meet/Zoom for automated link generation, and booking confirmation emails.
* **Course Hosting:**
    * *Requirement:* A structured learning management module.
    * *Specs:* Support for modules and lessons, video hosting/embedding, text blocks, and downloadable lesson attachments. Progress tracking for end-users.
* **Recurring Subscriptions & Memberships:**
    * *Requirement:* Enable creators to charge monthly/annual fees for access to premium content or external communities (e.g., Discord/Telegram links).
    * *Specs:* Requires integration with Razorpay Subscriptions/Mandates for recurring billing.
* **Lead Magnets (Freebies):**
    * *Requirement:* Allow creators to offer $0 products in exchange for an email address to build their mailing list.

### 2.2. Conversion & Revenue Optimization
Features designed to increase the creator's Average Order Value (AOV) and conversion rates.
* **Discount & Coupon Engine:**
    * *Requirement:* Allow creators to generate promo codes.
    * *Specs:* Support for percentage-based (%) and fixed-amount (₹) discounts. Include limitations like "expiration date" or "usage limits."
* **Order Bumps & Upsells:**
    * *Requirement:* Enable "one-click" add-on products at checkout.
    * *Specs:* UI should present a highly visible checkbox on the Razorpay pre-checkout screen to add a complementary product (e.g., "Add the audio version for ₹499").

### 2.3. Marketing & Automation Hub
Tools to help creators automate their marketing funnel.
* **Email Workflows:**
    * *Requirement:* Automated email sequences triggered by user actions.
    * *Specs:* System must support post-purchase confirmation emails (with secure download links), abandoned cart recovery, and basic drip campaigns for upsells.
* **Instagram Auto-DM Integration:**
    * *Requirement:* Automate direct messages based on keyword triggers in Instagram comments.
    * *Specs:* Will require integration with the Instagram Graph API. Creators set a keyword (e.g., "GUIDE"), and the system automatically DMs the user the product link.
* **Creator Affiliate Program:**
    * *Requirement:* Allow creators to generate unique affiliate links for their followers.
    * *Specs:* System must track clicks, attribute sales accurately to the affiliate, and maintain an affiliate payout ledger.

### 2.4. Storefront Customization & AI Tools
* **Theming Engine:** Provide creators with 3-5 high-converting, mobile-optimized UI layouts (e.g., Minimal, Bold, Gradient).
* **AI-Powered Copywriting:** Integrate an AI module (e.g., OpenAI API) on the product creation page. Creators input a single sentence, and the AI generates a title, engaging description, and bullet points.
* **Social Proof Module:** A UI section on product pages to manually add or import customer testimonials and 5-star ratings.

### 2.5. Analytics & Creator Dashboard
* **Advanced Metrics:** Expand the current "Earnings" tab into a full funnel view.
    * *Metrics to track:* Unique Store Visitors, Product Page Views, Conversion Rate (%), Total Revenue, and Lead Magnet Signups.

---

## 3. Technical Requirements & Architecture Guidelines

To ensure the platform scales effectively and remains performant, the engineering team should adhere to the following architecture:

* **Frontend Ecosystem:** The creator dashboard and public-facing storefronts should be built using **React** for snappy, dynamic routing and real-time UI updates (e.g., live storefront previews).
* **Backend Services:** Core business logic, order processing, and API routes should be handled by a robust backend utilizing **Node.js** or **Go** to ensure high concurrency during creator traffic spikes. 
* **Database & ORM:** Relational data (users, products, orders, transactions) must be structured in **PostgreSQL**. Database migrations and schema management should be handled via **Prisma** to maintain strict type safety across the application.
* **Storage (Critical Fix):** The current placeholder for digital downloads must be replaced. Implement secure, signed URLs using a cloud storage provider (like AWS S3 or Google Cloud Storage) to ensure files are only accessible after successful payment verification.

---

## 4. Phase 1 Priorities (Immediate Execution)

Before building new features, the agent/team must finalize the core loop:
1.  **Secure File Delivery:** Fix the broken "Download" button by implementing cloud storage and pre-signed URLs that expire after a set time.
2.  **Creator Payout Engine:** Build the logic for the "Withdraw Funds" button. This requires setting up a Razorpay Route or a similar payout API to transfer funds from the platform's master account to the individual creator's bank account, minus platform fees.