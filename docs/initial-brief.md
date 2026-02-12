This is the complete, feature-by-feature breakdown of Stan Store, translated into a **Product Requirements Document (PRD)** for your development stack (Golang + React + MongoDB).

You can feed this entire document into **Google Antigravity** to generate the specific code modules for each section.

# ---

**Master Feature Documentation: Stan Store Clone**

**Target Market:** Indian Creators (UPI/Razorpay Focus)

**Tech Stack:** React (Frontend), Golang (Backend), MongoDB (Database)

## **1. Storefront Features (The "Link-in-Bio" View)**

*This is the public-facing page that creators share on Instagram/LinkedIn.*

### **A. Mobile-First Layout**

* **Vertical "Card" Stack:** Products must appear as a vertical list of cards, not a grid.  
* **Bio Header:** Circular profile picture, Name, Bio text (max 150 chars), and Social Media icons (Instagram, YouTube, LinkedIn, Twitter).  
* **Sticky Footer:** A "Store / Products" tab bar if you have multiple pages (optional for MVP).

### **B. Product Card Types (Polymorphic)**

* **External Link Card:** Simple button redirecting to a URL (e.g., "Read my Blog").  
* **Digital Download Card:**  
  * *UI:* Thumbnail image + Title + Price + "Buy" button.  
  * *Action:* Opens a bottom-sheet (mobile) or modal (desktop) for checkout.  
* **Calendar/Booking Card:**  
  * *UI:* "Book a 1:1 Call" + Duration (e.g., 30 min) + Price.  
  * *Action:* Opens a calendar picker (integration with Google Calendar).

* **Course Card:**  
  * *UI:* Course Cover + Title + "Join Course" button.  
* **Lead Magnet (Freebie):**  
  * *UI:* "Get Free Checklist" button.  
  * *Action:* Opens an email collection form. Upon submit, auto-emails the file.

## ---

**2. Creator Dashboard (The Admin Panel)**

*This is where the user (the creator) manages their store.*

### **A. "My Store" Editor (Drag & Drop)**

* **Live Preview:** Split screen. Left side = Edit settings; Right side = Mobile preview of the store.  
* **Product Management:**  
  * Create Product wizard (select type: Download, Course, Webinar).

  * Toggle Visibility (Hide/Show products without deleting).  
  * Edit Content (Upload thumbnail, change price, edit description).  
* **Drag & Drop Reordering:** React library dnd-kit or react-beautiful-dnd to reorder product cards.

### **B. Income & Analytics**

* **Revenue Chart:** Line graph showing daily/weekly sales (using Recharts in React).  
* **Traffic Stats:** Total Views, Click-Through Rate (CTR).

* **Recent Transactions Table:** List of latest buyers (Name, Email, Amount, Product).  
* **Export:** CSV export of customer data.

### **C. Audience/Customers (CRM)**

* **Customer List:** Database of everyone who bought or downloaded a freebie.  
* **Filtering:** Filter by "Paid Customers" vs "Leads" (freebies).  
* **Manual Import:** Ability to upload a CSV of existing emails.

## ---

**3. Product-Specific Logic (Backend Specs)**

### **A. Digital Downloads (E-books, Presets)**

* **Storage:** Files uploaded to AWS S3 or Google Cloud Storage.  
* **Delivery Logic:**  
  * **Secure Links:** Do not send the raw S3 link.  
  * **Signed URLs:** Golang backend generates a "Presigned URL" valid for 24 hours.  
  * **Email:** Send an automated email with this link immediately after payment.

### **B. Online Courses (LMS Lite)**

* **Course Structure:**  
  * *Course* -> has many *Modules* -> has many *Lessons*.  
* **Lesson Types:** Video (hosted on Vimeo/YouTube unlisted), Text, PDF attachment.

* **Access Control:** Middleware in Golang to check if user_has_purchased(course_id) before serving content.

### **C. Booking/Consultations**

* **Availability:** Creator sets "Available Hours" (e.g., Mon-Fri, 9 AM - 5 PM).  
* **Calendar Sync:** Two-way sync with Google Calendar (prevent double booking).  
* **Meeting Link:** Auto-generate a Google Meet or Zoom link upon payment success.

## ---

**4. Payment & Checkout (Indian Context)**

### **A. The "One-Tap" Checkout Flow**

* **No Shopping Cart:** Stan Store does not use a "Add to Cart" flow. It is "Buy Now" only (direct checkout).  
* **Inputs:** Name + Email + Phone Number (Required for UPI).

### **B. Gateway Integration**

* **Razorpay:**  
  * Generate Order ID in Golang.  
  * Open Razorpay Modal on Frontend.  
  * Verify Signature on Backend.  
* **PhonePe (UPI Intent):**  
  * **Mobile:** Deep link directly to PhonePe/GPay app.  
  * **Desktop:** Show a Dynamic QR Code.

## ---

**5. Marketing & Growth Features (The "Pro" Layer)**

### **A. Email Marketing**

* **Broadcasts:** Send a one-time email to all customers.  
* **Flows (Sequences):**  
  * *Trigger:* User downloads "Free SEO Checklist".  
  * *Action 1:* Send Email 1 immediately (The file).  
  * *Action 2:* Wait 1 Day -> Send Email 2 (Upsell "SEO Course").  
* **Tech Provider:** Integrate with **AWS SES** or **Postmark** for high deliverability.

### **B. Order Bumps & Upsells**

* **Order Bump:** A checkbox on the checkout form: *"Add my Audio Guide for just ₹199?"* (Pre-purchase upsell).  
* **One-Click Upsell:** After payment is successful, show a new page: *"Wait! Get the advanced course for 50% off?"* (Post-purchase upsell).

### **C. Referrals (Affiliate System)**

* **Affiliate Link:** Users can generate a unique link (e.g., stan.store/rahul/ref/amit).

* **Tracking:** Store a referrer_id cookie. If a sale happens, credit X% commission to the referrer in the DB.

## ---

**6. Integrations (Webhooks)**

* **Zapier:** Expose a standard webhook/API key system so users can send their sales data to Slack, Notion, or Mailchimp.  
* **Pixel Tracking:** Allow users to input their **Facebook Pixel ID** and **Google Analytics ID**. The React frontend must fire standard events (Purchase, AddToCart) automatically.

## ---

**7. Database Schema (MongoDB JSON Structure)**

### **Product Collection**

JSON

{  
  "_id": "ObjectId",  
  "creator_id": "ObjectId",  
  "type": "digital_download", // or course, booking, external  
  "title": "Mastering Golang",  
  "description": "Complete backend guide",  
  "price": 999,  
  "currency": "INR",  
  "cover_image_url": "https://...",  
  "digital_file_url": "s3://...", // Private  
  "redirect_url": "", // For external links  
  "calendar_config": {  
     "duration_minutes": 30,  
     "availability": ["Mon", "Tue"]  
  },  
  "is_visible": true,  
  "order_index": 1 // For drag and drop sorting  
}

### **Customer Collection**

JSON

{  
  "_id": "ObjectId",  
  "creator_id": "ObjectId",  
  "name": "Arjun Kumar",  
  "email": "arjun@gmail.com",  
  "phone": "+919876543210",  
  "purchased_product_ids": ["prod_123", "prod_456"],  
  "total_spend": 2499,  
  "created_at": "ISODate"  
}

### **Order Collection**

JSON

{  
  "_id": "ObjectId",  
  "transaction_id": "pay_Hj8s9d7s8", // From Razorpay/PhonePe  
  "amount": 999,  
  "status": "success", // or pending, failed  
  "payment_method": "upi",  
  "customer_id": "ObjectId",  
  "product_id": "ObjectId",  
  "affiliate_id": "ObjectId" // Optional  
}
