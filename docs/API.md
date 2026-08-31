# CardFlow — REST API Specification

**Base URL:** `https://api.cardflow.app/api/v1`  
**Protocol:** HTTPS / JSON / UTF-8  
**Authentication:** `Authorization: Bearer <access_token>`

---

## 1. Authentication & Session

### 1.1 Send Login OTP
* **Method:** `POST`
* **URL:** `/auth/otp/send`
* **Auth Required:** No
* **Role:** Public
* **Rate Limit:** Max 5 per phone/hour, 30s resend cooldown, max 20 per IP/hour
* **Request Body:**
  ```json
  {
    "phone": "+919876543210",
    "device_id": "a6c84f32-7212-4d51-9e28-7695a4bb8091",
    "platform": "android"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "expires_in_seconds": 300,
      "resend_cooldown_seconds": 30,
      "is_trusted_device": false
    }
  }
  ```
* **Errors:** `400 Bad Request` (Invalid E.164 phone), `429 Too Many Requests` (Rate limit exceeded).
* **DB Interaction:** Reads `devices` table; writes OTP hash & attempt counters to Redis (`otp:+919876543210`).

---

### 1.2 Verify Login OTP
* **Method:** `POST`
* **URL:** `/auth/otp/verify`
* **Auth Required:** No
* **Role:** Public
* **Rate Limit:** Max 3 attempts per OTP session
* **Request Body:**
  ```json
  {
    "phone": "+919876543210",
    "otp_code": "582914",
    "device_id": "a6c84f32-7212-4d51-9e28-7695a4bb8091",
    "platform": "android",
    "push_token": "fcm_token_string_here"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "access_token": "eyJhbGciOiJFZERTQ...",
      "refresh_token": "cf_refr_9a8f4c21b...",
      "is_new_user": false,
      "user": {
        "id": "7b8f9e1a-4d2c-4b11-9a3e-2f8e9a1b2c3d",
        "phone": "+919876543210",
        "name": "Ravi Kumar",
        "role": "user",
        "plan": "free",
        "free_scans_remaining": 30,
        "credit_balance": 10
      }
    }
  }
  ```
* **Errors:** `400 Bad Request` (Invalid OTP), `410 Gone` (OTP expired), `429 Too Many Requests` (Max verify attempts reached).
* **DB Interaction:** Upserts `users` and `devices` tables; updates `credit_ledger` with 10 signup bonus credits if new user; persists refresh token in Redis.

---

### 1.3 Refresh Access Token
* **Method:** `POST`
* **URL:** `/auth/refresh`
* **Auth Required:** No
* **Role:** Public
* **Request Body:**
  ```json
  {
    "refresh_token": "cf_refr_9a8f4c21b...",
    "device_id": "a6c84f32-7212-4d51-9e28-7695a4bb8091"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "access_token": "eyJhbGciOiJFZERTQ...",
      "refresh_token": "cf_refr_new_token_..."
    }
  }
  ```
* **Errors:** `401 Unauthorized` (Invalid/Revoked refresh token).
* **DB Interaction:** Performs refresh token rotation in Redis; validates device binding.

---

### 1.4 Logout All Devices
* **Method:** `POST`
* **URL:** `/auth/logout-all`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "message": "All sessions terminated"
  }
  ```
* **DB Interaction:** Deletes all refresh tokens and sessions for `user_id` in Redis and revokes device trust in `devices` table.

---

## 2. User Profile & Personal KYC

### 2.1 Get Current User Profile
* **Method:** `GET`
* **URL:** `/users/me`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "7b8f9e1a-4d2c-4b11-9a3e-2f8e9a1b2c3d",
      "phone": "+919876543210",
      "name": "Ravi Kumar",
      "email": "ravi@example.com",
      "city": "Coimbatore",
      "state": "Tamil Nadu",
      "country": "IN",
      "role": "user",
      "plan": "free",
      "is_id_verified": true,
      "free_scans_remaining": 28,
      "credit_balance": 10,
      "owned_businesses_count": 1
    }
  }
  ```
* **DB Interaction:** Selects from `users`, `user_kyc`, and counts from `businesses`.

---

### 2.2 Update Profile
* **Method:** `PATCH`
* **URL:** `/users/me`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "name": "Ravi Kumar",
    "email": "ravi.kumar@example.com",
    "city": "Coimbatore",
    "state": "Tamil Nadu"
  }
  ```
* **Response Body (200 OK):** Updated user object.
* **DB Interaction:** Updates `users` table.

---

### 2.3 Start Personal KYC (DigiLocker / Offline XML)
* **Method:** `POST`
* **URL:** `/kyc/personal/start`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Rate Limit:** Max 3 attempts per day
* **Request Body:**
  ```json
  {
    "method": "digilocker",
    "redirect_url": "cardflow://kyc/callback"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "session_id": "kyc_sess_91283a0f",
      "gateway_url": "https://sandbox.kyc-aggregator.com/digilocker/v2/auth?session=..."
    }
  }
  ```
* **DB Interaction:** Upserts `user_kyc` record with `aadhaar_status: 'pending'`.

---

### 2.4 Verify Personal PAN
* **Method:** `POST`
* **URL:** `/kyc/personal/pan`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "pan_number": "ABCDE1234F"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "pan_status": "verified",
      "masked_pan": "ABCDE****F",
      "registry_name": "RAVI KUMAR",
      "name_match_score": 98.5
    }
  }
  ```
* **DB Interaction:** Saves AES-256 encrypted PAN and match score into `user_kyc`.

---

## 3. Discovery, Search & Categories

### 3.1 Search Businesses
* **Method:** `GET`
* **URL:** `/search`
* **Auth Required:** Optional
* **Query Parameters:**
  * `q` (string, optional): Text query (name, service, keyword)
  * `category_id` (UUID, optional): Filter by category
  * `lat` (float, optional): User latitude
  * `lng` (float, optional): User longitude
  * `radius_meters` (int, default: 10000, max: 50000)
  * `pincode` (string, optional): Filter by pincode
  * `gst_only` (bool, default: false)
  * `open_now` (bool, default: false)
  * `cursor` (string, optional)
  * `limit` (int, default: 20, max: 50)
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "a1b2c3d4-0000-0000-0000-000000000001",
          "name": "Kovai Precision Tools",
          "slug": "kovai-precision-tools-coimbatore",
          "logo_url": "https://cdn.cardflow.app/business/logo/kovai.webp",
          "primary_category": "Manufacturing",
          "pincode": "641004",
          "city": "Coimbatore",
          "distance_meters": 1250,
          "verification": "gst",
          "is_sponsored": false,
          "quick_actions": {
            "has_phone": true,
            "has_whatsapp": true,
            "has_directions": true
          }
        }
      ],
      "next_cursor": "eyJpZCI6ImExYjJjM2Q0Li4ifQ=="
    }
  }
  ```
* **DB Interaction:** Executes PostGIS `ST_DWithin` spatial query + `search_tsv` full-text search + `pg_trgm` fuzzy match. Enforces `status = 'live' AND listing = 'listed'`.

---

### 3.2 Get Pincode Community Hub
* **Method:** `GET`
* **URL:** `/community/:pincode`
* **Auth Required:** Optional
* **Query Parameters:** `category_id` (optional), `page` (int)
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "pincode": "641004",
      "city": "Coimbatore",
      "total_verified_businesses": 48,
      "categories": [
        {
          "category_id": "cat_mfg_001",
          "category_name": "Manufacturing",
          "count": 18
        }
      ],
      "businesses": [...]
    }
  }
  ```
* **DB Interaction:** Reads composite index `idx_businesses_community`; cached in Redis for 10 minutes.

---

### 3.3 Get Taxonomy Categories
* **Method:** `GET`
* **URL:** `/categories`
* **Auth Required:** No
* **Response Body (200 OK):** Hierarchical 2-level category tree with icons and slugs.
* **DB Interaction:** Reads `categories` table with Redis caching.

---

## 4. Business Owner & Listing Management

### 4.1 Create Business Listing
* **Method:** `POST`
* **URL:** `/businesses`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "name": "Kovai Precision Tools",
    "description": "Manufacturers of CNC machined industrial valves and fittings.",
    "primary_category_id": "cat_mfg_001",
    "secondary_category_ids": ["cat_tools_002"],
    "address_line1": "42, Industrial Estate",
    "locality": "Peelamedu",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pincode": "641004",
    "latitude": 11.0268,
    "longitude": 76.9958,
    "service_area_km": 0,
    "website": "https://kovaiprecision.com",
    "email": "contact@kovaiprecision.com",
    "phones": [
      { "phone": "+919443012345", "label": "Sales", "is_whatsapp": true }
    ],
    "services": ["CNC Milling", "Industrial Valves", "Custom Lathe Works"],
    "year_established": 2012,
    "hours": {
      "monday": { "open": "09:00", "close": "18:00", "closed": false }
    }
  }
  ```
* **Response Body (201 Created):** Created business object with status `draft`.
* **DB Interaction:** Checks user plan business creation cap (`users.plan`); inserts into `businesses`, `business_categories`, `business_phones`, `business_services`, and auto-creates `digital_cards`.

---

### 4.2 Verify Business KYC (Step 5)
* **Method:** `POST`
* **URL:** `/businesses/:id/verify`
* **Auth Required:** Yes
* **Role:** `user` | `admin` (Owner of business)
* **Request Body:**
  ```json
  {
    "method": "gstin",
    "identifier": "33AAAAA0000A1Z5"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "verification_status": "verified",
      "legal_name": "KOVAI PRECISION TOOLS PRIVATE LIMITED",
      "trade_name": "Kovai Precision Tools",
      "gstin_status": "Active",
      "listing_visibility": "listed"
    }
  }
  ```
* **DB Interaction:** Verifies uniqueness of GSTIN; calls KYC Aggregator; calculates name match; sets `verification = 'gst'` and `listing = 'listed'`; logs to `business_verifications`.

---

### 4.3 Get Owner's Business Analytics
* **Method:** `GET`
* **URL:** `/businesses/:id/analytics`
* **Auth Required:** Yes
* **Role:** Business Owner
* **Query Parameters:** `range` (`7d`, `30d`, `90d`)
* **Response Body (200 OK):** Profile views, call clicks, WhatsApp clicks, direction clicks, and enquiry counts.
* **DB Interaction:** Aggregates from `analytics_events`.

---

## 5. Media & Presigned Uploads

### 5.1 Generate S3 Presigned Upload URL
* **Method:** `POST`
* **URL:** `/media/presign`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "kind": "card_image",
    "file_extension": "webp",
    "byte_size": 420000,
    "side": "front"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "upload_url": "https://cardflow-private-media.s3.asia-south1.amazonaws.com/cards/usr_1/front_uuid.webp?X-Amz-Signature=...",
      "object_key": "cards/usr_1/front_uuid.webp",
      "expires_in_seconds": 300
    }
  }
  ```
* **DB Interaction:** Validates user quota and file size limits (max 1MB for cards, max 500KB for biz photos).

---

## 6. Card Vault & AI Extraction

### 6.1 Save Card (Image-Only / Pre-Extraction)
* **Method:** `POST`
* **URL:** `/cards`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "front_image_key": "cards/usr_1/front_uuid.webp",
    "back_image_key": "cards/usr_1/back_uuid.webp",
    "notes": "Met at CODISSIA industrial expo",
    "tags": ["Vendor", "BNI Dynamic"]
  }
  ```
* **Response Body (201 Created):** Created card with `extract_status: 'image_only'`.
* **DB Interaction:** Inserts into `saved_cards`, `saved_card_images`, and `saved_card_tags`. Consumes 0 credits.

---

### 6.2 Trigger AI Extraction on Card
* **Method:** `POST`
* **URL:** `/cards/:id/extract`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "mode": "standard"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "person_name": "Suresh Natarajan",
      "designation": "Managing Director",
      "company": "Kovai Precision Tools",
      "phones": [
        {
          "raw": "+91 94430 12345",
          "e164": "+919443012345",
          "is_whatsapp": true,
          "whatsapp_source": "icon_detected",
          "confidence": 0.98
        }
      ],
      "emails": [
        { "email": "suresh@kovaiprecision.com", "confidence": 0.99 }
      ],
      "website": "https://kovaiprecision.com",
      "raw_address": "42, Industrial Estate, Peelamedu, Coimbatore - 641004",
      "confidence_summary": 0.97,
      "credits_spent": 1,
      "free_scans_remaining": 27
    }
  }
  ```
* **DB Interaction:** Checks allowance or debits `credit_ledger`; invokes Gemini 3.x Flash-Lite on Vertex AI; persists extraction to `saved_card_phones`, `saved_card_emails`, `scan_records`.

---

### 6.3 Export Saved Cards
* **Method:** `GET`
* **URL:** `/cards/export`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Query Parameters:** `format` (`vcf` | `csv`), `tag_id` (optional)
* **Response Body (200 OK):** Downloadable binary stream with `Content-Disposition: attachment; filename="cardflow_contacts.vcf"`.

---

## 7. Enquiries & Direct Leads

### 7.1 Send Business Enquiry
* **Method:** `POST`
* **URL:** `/businesses/:id/enquiries`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Rate Limit:** 5/day (normal users), 10/day (ID-verified users), 1 per biz/24h
* **Request Body:**
  ```json
  {
    "message": "Interested in bulk pricing for 2-inch stainless valves.",
    "share_phone": true
  }
  ```
* **Response Body (201 Created):** Created enquiry record.
* **DB Interaction:** Inserts into `enquiries`; dispatches real-time push notification to business owner.

---

### 7.2 Get Owner Enquiry Inbox
* **Method:** `GET`
* **URL:** `/businesses/:id/enquiries`
* **Auth Required:** Yes
* **Role:** Business Owner
* **Query Parameters:** `status` (`new`, `viewed`, `responded`, `closed`), `page` (int)
* **Response Body (200 OK):** List of lead enquiries with user contact data and status.

---

### 7.3 Update Enquiry Status
* **Method:** `PATCH`
* **URL:** `/enquiries/:id`
* **Auth Required:** Yes
* **Role:** Business Owner
* **Request Body:**
  ```json
  {
    "status": "responded"
  }
  ```

---

## 8. Billing, Subscriptions & Credit Ledger

### 8.1 Verify In-App Purchase (Consumables & Subscriptions)
* **Method:** `POST`
* **URL:** `/billing/verify-purchase`
* **Auth Required:** Yes
* **Role:** `user` | `admin`
* **Request Body:**
  ```json
  {
    "store": "play",
    "sku": "cardflow_pack_499",
    "receipt_token": "google_play_purchase_token_string",
    "transaction_id": "GPA.3312-9842-1249-12491"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "sku": "cardflow_pack_499",
      "credits_added": 499,
      "new_credit_balance": 509
    }
  }
  ```
* **DB Interaction:** Performs server-to-server receipt validation with Google/Apple; inserts into `purchases`; updates `credit_ledger` and `users.plan` in a serializable transaction.

---

### 8.2 Google Play RTDN Webhook
* **Method:** `POST`
* **URL:** `/billing/play/rtdn`
* **Auth Required:** Internal / Google Cloud Pub/Sub verification
* **Response Body (200 OK):** Webhook acknowledged.
* **DB Interaction:** Updates `subscriptions` table on renewals, grace periods, or cancellations.

---

### 8.3 Apple App Store Server Notification Webhook
* **Method:** `POST`
* **URL:** `/billing/appstore/notifications`
* **Auth Required:** Apple Signed JWS verification
* **Response Body (200 OK):** Webhook acknowledged.
* **DB Interaction:** Decodes JWS payload and updates `subscriptions` table.

---

## 9. In-App Admin Endpoints (Mobile Admin Suite)

All admin endpoints require `user.role === 'admin'`.

### 9.1 Get Admin Dashboard Metrics
* **Method:** `GET`
* **URL:** `/admin/dashboard`
* **Auth Required:** Yes
* **Role:** `admin`
* **Response Body (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "total_users": 1420,
      "total_verified_businesses": 310,
      "pending_kyc_verifications": 14,
      "scans_today": 840,
      "enquiries_today": 92
    }
  }
  ```

---

### 9.2 List Pending KYC Review Queue
* **Method:** `GET`
* **URL:** `/admin/kyc/queue`
* **Auth Required:** Yes
* **Role:** `admin`
* **Response Body (200 OK):** List of verification items with name-match discrepancies and uploaded fallback documents.

---

### 9.3 Resolve KYC Verification
* **Method:** `POST`
* **URL:** `/admin/kyc/:id/resolve`
* **Auth Required:** Yes
* **Role:** `admin`
* **Request Body:**
  ```json
  {
    "action": "approve",
    "admin_notes": "Trade name match confirmed via electricity bill"
  }
  ```
* **DB Interaction:** Updates `business_verifications`, sets `businesses.verification = 'manual'`, flips `businesses.listing = 'listed'`; logs to `audit_logs`.

---

### 9.4 Manual Credit or Subscription Adjustment
* **Method:** `POST`
* **URL:** `/admin/users/:id/adjust`
* **Auth Required:** Yes
* **Role:** `admin`
* **Request Body:**
  ```json
  {
    "credit_delta": 100,
    "comp_plan": "plus",
    "comp_duration_days": 30,
    "audit_reason": "Community chapter partnership grant"
  }
  ```
* **DB Interaction:** Updates `credit_ledger` and `users.plan`; records immutable entry in `audit_logs`.

---

## 10. Public Web Profile & Deep Link Fallback

### 10.1 Public Business Profile Page (HTML)
* **Method:** `GET`
* **URL:** `/b/:slug`
* **Auth Required:** No (Public Web)
* **Response (200 OK):** Fast server-rendered HTML page with OpenGraph metadata, schema.org `LocalBusiness` JSON-LD, business overview, contact buttons, and smart app install banner.
