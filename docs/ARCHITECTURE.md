# CardFlow — System Architecture & Technical Design

## 1. Complete System Architecture

CardFlow is an integrated platform combining mobile-first business discovery, AI-assisted business card digitization, and verified business presence.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        React Native Mobile App (TypeScript)                           │
│  ┌─────────────────────────┬─────────────────────────┬───────────────────────────────┐ │
│  │   Normal User Space     │   Business Owner Space  │        Admin Space            │ │
│  │  - Search & Discovery   │  - Business Creation    │  - KYC Review Queue           │ │
│  │  - Card Vault & Scanner │  - Multi-Biz Switcher   │  - Moderation & Reports       │ │
│  │  - Enquiries & Favs     │  - Digital Card & QR    │  - Users / Businesses CRUD    │ │
│  │  - Contact Packs (IAP)  │  - Analytics & Inquiries│  - Audit Logs & System Flags  │ │
│  │  - Optional User KYC    │  - Subscriptions (IAP)  │  - Credit/Sub Adjustments     │ │
│  └─────────────────────────┴─────────────────────────┴───────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┬──────────────────────────┘
                            │ REST / JSON (OpenAPI 3.0)       │ Presigned Direct Uploads
                            ▼                                 ▼
┌────────────────────────────────────────────────────────┐  ┌────────────────────────────┐
│                  Go Backend Gateway                    │  │ S3-Compatible Object Store │
│  - Chi / Gin Router & Context Middleware               │  │ - /cards/original/{id}     │
│  - JWT Auth & Refresh Token Rotator                    │  │ - /cards/thumb/{id}        │
│  - Rate Limiter (IP + Phone + User Token)              │  │ - /biz/logos/{id}          │
│  - Role-Based Access Control (RBAC: User, Owner, Admin)│  │ - /biz/photos/{id}         │
│  - Request Validation & Sanitization                   │  │ - /kyc/docs/{id} (Encrypted)│
└─────┬──────────────┬──────────────┬──────────────┬─────┘  └────────────────────────────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌────────────────────────────────────────┐
│ PostgreSQL   ││    Redis     ││  Vertex AI   ││           External Integrations        │
│  + PostGIS   ││ - OTP Store  ││ (Gemini 3.x  ││ - SMS Gateways (MSG91/Kaleyra)         │
│ - Spatial GiST││ - Rate-limits││  Flash-Lite) ││ - KYC Aggregator (Sandbox/Setu/IDfy)   │
│ - pg_trgm    ││ - Token Block││ - Prompt     ││ - Google Play Billing RTDN Webhooks    │
│ - FTS (GIN)  ││ - Hot Cache  ││   Caching    ││ - Apple App Store Server Notifications │
│ - JSONB Docs ││ - Extraction ││ - Structured ││ - Firebase Cloud Messaging (FCM)       │
│ - Read/Write ││   Job Queue  ││   Outputs    ││ - Apple Push Notification svc (APNs)   │
└──────────────┘└──────────────┘└──────────────┘└────────────────────────────────────────┘
```

---

## 2. React Native Architecture

* **Framework:** React Native (0.75+ New Architecture enabled) with TypeScript in strict mode.
* **State Management:**
  * **Server State & Caching:** TanStack React Query v5 (offline caching, optimistic updates, query invalidation).
  * **Client State:** Zustand (lightweight stores for auth session, active business selector, UI themes).
* **Navigation:** React Navigation v6 (Native Stack):
  * `AuthStack`: Phone Input → OTP Verification → Profile Setup.
  * `AppTabs`:
    * Tab 1: `HomeStack` (Home, Community Pincode Hubs, Category Listings).
    * Tab 2: `SearchStack` (Map View, Radius Filter, Business Detail Profile).
    * Tab 3: `ScanModal` (Camera, Crop/Perspective, Review, Extract Options).
    * Tab 4: `VaultStack` (Card Vault, Card Detail, Tag Filter, Export vCard/CSV).
    * Tab 5: `ProfileStack` (User Settings, KYC Status, Credit Balance & Ledger).
  * `BusinessStack` (Conditional for Owners): Business Switcher, Wizard, Edit Listing, Analytics, Enquiry Inbox, Subscription Paywall, Digital Card Studio.
  * `AdminStack` (Protected: strictly rendered when `user.role === 'admin'`): Dashboard, Verification Queues, User/Biz Management, Category CRUD, Report Resolution, Audit Log.
* **Camera & Media:** `react-native-vision-camera` + Skia/OpenCV binding for card edge detection, glare detection, and on-device downscaling (max 1280px).
* **Location & Maps:** `react-native-maps` + `@react-native-community/geolocation` with Google Maps renderer.
* **In-App Purchases:** `react-native-iap` (StoreKit 2 on iOS, Google Play Billing Library v6+ on Android).
* **Deep Linking:** `react-native-bootsplash` + React Navigation linking configuration handling `https://cardflow.app/b/:slug` and `cardflow://`.

---

## 3. Go Backend Architecture

* **Language & Runtime:** Go 1.23+ compiled to binary for minimal memory footprint and high concurrency.
* **HTTP Framework:** `chi` router (lightweight, zero-allocation, standard `http.Handler` compatible).
* **Layered Clean Architecture:**
  ```
  cmd/api/main.go            -> Service entrypoint, dependency injection, graceful shutdown
  internal/
    domain/                  -> Pure domain models, entities, repository interfaces
    auth/                    -> OTP generation/verification, JWT issuance, token rotation
    discovery/               -> Search engine, PostGIS spatial queries, FTS, ranking algorithm
    business/                -> Multi-business CRUD, verification state machine, media handler
    card/                    -> Card vault, image metadata, vCard/CSV export generators
    extractor/               -> Vertex AI Gemini adapter, prompt caching, batch pipeline
    enquiry/                 -> Enquiry inbox, spam protection, lead notifications
    billing/                 -> Play/Apple webhook handlers, receipt validation, credit ledger
    kyc/                     -> Aggregator adapter (Aadhaar DigiLocker, PAN, GSTIN API)
    admin/                   -> Admin operations, audit logging, system metrics
    storage/                 -> S3 presigned URL generator & object lifecycle
    notification/            -> FCM/APNs push engine
    middleware/              -> Auth JWT, RBAC, RateLimiting, Logging, Recover, CORS
  pkg/
    response/                -> Standardized JSON envelope & API error responses
    validator/               -> Request payload validation helpers
  ```
* **Concurrency Model:** Go goroutines and buffered worker pools for background tasks (Gemini async batch extractions, push notification broadcasts, audit event persistence).

---

## 4. PostgreSQL Architecture

* **Engine:** PostgreSQL 16+ with extensions: `postgis`, `pg_trgm`, `uuid-ossp`, `btree_gist`.
* **Spatial & Discovery Engine:**
  * Coordinates stored as `geography(Point, 4326)` on `businesses.location`.
  * Spatial index: `CREATE INDEX idx_businesses_location ON businesses USING GIST (location) WHERE status = 'live' AND listing = 'listed';`
  * Radial lookups: `ST_DWithin(location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)`.
* **Search Optimization:**
  * Full-Text Search: `search_tsv tsvector` generated via trigger over `name`, `trade_name`, `description`, and aggregated services. GIN indexed.
  * Typo Tolerance: Trigram index `CREATE INDEX idx_businesses_name_trgm ON businesses USING GIN (name gin_trgm_ops);`.
  * Community Pincode Index: Composite B-tree `CREATE INDEX idx_businesses_community ON businesses (pincode, primary_category_id, listing, status);`.
* **Transactions & Concurrency:** `SERIALIZABLE` or `READ COMMITTED` with `SELECT ... FOR UPDATE` on credit ledger debit/refund operations and subscription renewals.
* **Soft Deletes:** `deleted_at TIMESTAMPTZ` on `users`, `businesses`, and `saved_cards`.

---

## 5. Redis Architecture

* **Engine:** Redis 7+ standalone / cluster.
* **Key Namespaces & Data Structures:**
  * `otp:{phone}` (String, TTL: 300s): SHA-256 hash of OTP + attempt count.
  * `otp_cooldown:{phone}` (String, TTL: 30s): Rate limit resend lock.
  * `otp_hourly:{phone}` (Integer, TTL: 3600s): Max 5 OTPs per hour counter.
  * `ratelimit:ip:{ip_address}` (Sliding Window Sorted Set): Global rate limiter.
  * `ratelimit:user:{user_id}` (Sliding Window Sorted Set): API user rate limiter.
  * `session:refresh:{user_id}:{token_id}` (Hash, TTL: 30 days): Refresh token metadata & device fingerprint.
  * `token:blacklist:{jti}` (String, TTL: remaining access token expiry): Revoked access tokens.
  * `cache:pincode:{pin}:{cat_id}` (JSON String, TTL: 600s): Cached community page listings.
  * `queue:extraction` (List / Stream): Background queue for asynchronous card batch extractions.

---

## 6. Object Storage Architecture

* **Engine:** S3-compatible storage (AWS S3, Cloudflare R2, or MinIO).
* **Direct Presigned Flow:** The mobile app never streams media directly through the Go API server. It requests a presigned `PUT` URL, uploads directly to storage with enforced MIME type and byte size limits, and notifies the backend upon completion.
* **Bucket Layout:**
  * `cardflow-private-media/`
    * `cards/{user_id}/original/{uuid}.webp` (Card images — private, AES-256 encrypted at rest, presigned GET only).
    * `cards/{user_id}/thumb/{uuid}.webp` (Card thumbnails).
    * `kyc/{user_id}/{doc_uuid}.pdf` (Manual KYC documents — strictly server-accessible only).
  * `cardflow-public-media/` (CDN accelerated)
    * `business/{biz_id}/logo/{uuid}.webp`
    * `business/{biz_id}/photos/{uuid}.webp`
    * `digital-cards/{biz_id}/render.png`
* **Lifecycle & Privacy:**
  * User deletion triggers an asynchronous S3 lifecycle event that purges all associated card images and thumbnails after the 30-day grace period.

---

## 7. Gemini / Vertex AI Architecture

* **Model:** Gemini 3.x Flash-Lite (replacing the retiring 2.5 family) deployed via server-side Vertex AI SDK.
* **Cost & Latency Optimization Pipeline:**
  1. **Image Pre-processing:** Client crops, de-skews, and compresses image to WebP ≤ 1280px width, stripped of EXIF metadata.
  2. **Prompt Caching:** System prompt and strict JSON schema definition cached on Vertex AI to reduce input token billing by up to 75%.
  3. **Structured Outputs:** Enforced `responseSchema` returning strict JSON fields (names, phones with WhatsApp icon detection flag, emails, raw address, designation, confidence metrics).
  4. **Tiered Extraction Contract:**
     * *Standard Scan (1 credit / monthly allowance):* Returns raw address string.
     * *Premium Scan (+2 credits):* Triggers structured address parsing schema.
  5. **Batch Processing Endpoint:** Bulk event extractions and "extract-later" queues run through Vertex AI batch jobs (50% cost reduction).

---

## 8. OTP Architecture

```
User App                  Go Backend                     Redis                     SMS Gateway
   │                          │                            │                            │
   │── POST /auth/otp/send ──►│                            │                            │
   │   (phone, device_id)     │── Check rate limits ──────►│                            │
   │                          │   (hourly & cooldown)      │                            │
   │                          │── Generate 6-digit OTP ───►│ Save hash, attempts=0,     │
   │                          │                            │ TTL=300s                   │
   │                          │── Send SMS Template ───────────────────────────────────►│
   │                          │                            │                            │
   │◄── 200 OK (expires_in) ──│                            │                            │
   │                          │                            │                            │
   │── POST /auth/otp/verify ►│                            │                            │
   │   (phone, otp_code)      │── Fetch & Verify Hash ────►│ Check attempts < 3         │
   │                          │                            │ Delete on success          │
   │                          │── Generate Access/Refresh  │                            │
   │◄── 200 OK (Tokens) ──────│   tokens                   │                            │
```

---

## 9. JWT Architecture

* **Access Token:**
  * Algorithm: `Ed25519` (EdDSA) or `RS256`.
  * Lifetime: 15 minutes.
  * Claims: `sub` (User UUID), `phone`, `role` (`user` | `admin`), `plan` (`free` | `plus` | `premium`), `jti` (Token UUID), `exp`, `iat`, `iss` (`cardflow.app`).
* **Refresh Token:**
  * Lifetime: 30 days.
  * Storage: Opaque cryptographically secure random string (256-bit) stored hashed in Redis and DB with `device_id`, `user_id`, and `family_id`.
  * **Rotation:** Every refresh request invalidates the old refresh token and issues a new pair. If a revoked refresh token is re-submitted, the entire token family is invalidated immediately (theft detection).

---

## 10. Google Maps Architecture

* **Mobile App:** Embeds Google Maps SDK using custom styled maps matching CardFlow branding.
* **Map Pin Dragger (Business Creation):** Converts user pin-drop to coordinates (`latitude`, `longitude`) and calls backend reverse-geocoding.
* **Backend Geocoding & Places:** Server-side calls to Google Geocoding API cached in Redis by normalized address string to avoid redundant external API calls.
* **Directions:** Deep-links directly from business profile via native intent (`geo:lat,lng` / `https://www.google.com/maps/dir/?api=1&destination=lat,lng`).

---

## 11. Payment & Subscription Architecture

* **In-App Purchase Channels:**
  * Android: Google Play Billing Library (RTDN enabled via Google Cloud Pub/Sub).
  * iOS: Apple StoreKit 2 (App Store Server Notifications V2 webhooks).
* **Lane A — Subscriptions (Account-Level):**
  * Tiers: `Free` (1 biz) | `Business Plus` (2 biz) | `Business Premium` (5 biz).
  * Backend verifies signed receipts directly with Google Play Developer API / Apple App Store Server API.
  * Webhook workers handle real-time renewal, expiration, grace period (15 days), and downgrade state transitions.
* **Lane B — Contact Credit Packs (Consumables):**
  * SKUs: ₹49 (499 credits), ₹199 (1,999 credits), ₹249 (2,499 credits).
  * Idempotent ledger updates: every purchase record validates the unique transaction ID (`store_txn_id`) in a serializable PostgreSQL transaction before incrementing the user's `credit_ledger`.

---

## 12. Push Notification Architecture

* **Engine:** Unified notification service interfacing with Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs HTTP/2).
* **Device Registry:** `devices` table stores `user_id`, `platform`, `push_token`, `trusted_until`.
* **Triggers:**
  * New business enquiry received (instant push to owner).
  * KYC verification approved / rejected (push to owner/user).
  * Subscription renewal notice or grace period warning.
  * Contact credit exhaustion warning.

---

## 13. Admin Architecture (Inside Mobile App)

* **No Separate Web Admin:** Admin functionality is embedded directly inside the React Native mobile application.
* **Role Gating & Security:**
  * User profile payload includes `role: "admin" | "user"`.
  * React Navigation conditionally mounts the `AdminStack` only when authenticated token exhibits valid admin claims.
  * Go backend guards every `/api/v1/admin/*` route with strict `RequireAdminRole` middleware verifying claims and database active admin status.
* **Admin Modules in Mobile:**
  1. *Dashboard:* Live KPI cards (Active Users, Verified Businesses, Daily Scans).
  2. *KYC Review Console:* Side-by-side comparison of entered name vs. government registry payload; manual document viewer; 1-tap Approve / Reject with rejection reason selector.
  3. *Business Management:* Search any listing, override status (`draft`, `live_unlisted`, `live_listed`, `suspended`), transfer ownership.
  4. *Moderation & Reports:* Inbox of reported listings, abusive enquiries, or suspect images.
  5. *Ledger Adjustments:* Issue comp subscriptions or manual credit adjustments with mandatory audit notes.
  6. *Audit Log Viewer:* Real-time feed of all staff operations.

---

## 14. Deep Linking Architecture

* **Universal Links (iOS) & App Links (Android):**
  * Domain: `https://cardflow.app`
  * Apple App Site Association: `https://cardflow.app/.well-known/apple-app-site-association`
  * Android Asset Links: `https://cardflow.app/.well-known/assetlinks.json`
* **Route Mapping:**
  * `https://cardflow.app/b/{slug}` → Navigates to `BusinessProfileScreen({ slug })`.
  * `https://cardflow.app/c/{claim_token}` → Navigates to `ClaimListingWizard({ claim_token })`.
  * `https://cardflow.app/invite/{code}` → Navigates to `RegisterScreen({ ref: code })`.

---

## 15. Public Business Profile Architecture

* **Server-Rendered Lightweight Fallback:**
  * When a non-app user or search engine crawler hits `https://cardflow.app/b/{slug}`, the Go backend serves a fast, server-rendered HTML page with OpenGraph tags, schema.org `LocalBusiness` JSON-LD, business logo, contact buttons, and a "Open in CardFlow / Get the App" smart banner.
  * When opened on a mobile device with CardFlow installed, Universal Links / App Links seamlessly intercept the URL and launch the native mobile profile screen.

---

## 16. Development Architecture

* **Local Infrastructure via Docker Compose:**
  * PostgreSQL 16 + PostGIS extension on port `5432`.
  * Redis 7 on port `6379`.
  * MinIO (S3-compatible storage) on ports `9000` / `9001` with pre-created buckets.
  * Mock SMS Gateway & KYC Simulator handlers inside Go dev build.
* **Go Backend:** Live-reload via `air`.
* **Mobile App:** Metro bundler running locally, targeting iOS Simulator and Android Emulator with API base URL pointing to host gateway.

---

## 17. Production Architecture

* **Compute:** Containerized Go binary deployed to a managed Kubernetes cluster or container service (e.g., AWS ECS / GCP Cloud Run) in `asia-south1` (Mumbai) for minimum latency.
* **Database:** Managed PostgreSQL (e.g., AWS RDS / GCP Cloud SQL) with automated daily snapshots, Point-In-Time-Recovery (PITR), and read replicas for search queries.
* **Redis:** Managed Redis (AWS ElastiCache / GCP MemoryStore) with Multi-AZ failover.
* **Storage:** S3 with CloudFront / Cloudflare CDN edge caching for public business media.
* **Secrets Management:** Cloud Secret Manager / HashiCorp Vault.

---

# Data Flows (A to N)

### Flow A: User Login
```
1. User enters phone number (+91XXXXXXXXXX) on Mobile App.
2. App sends POST /api/v1/auth/otp/send.
3. Backend validates E.164 format, checks hourly rate limits in Redis.
4. Backend generates cryptographically secure 6-digit OTP, stores SHA-256 hash in Redis (TTL: 300s).
5. Backend dispatches SMS via SMS gateway.
6. Backend returns { expires_in: 300, resend_cooldown: 30 }.
```

### Flow B: OTP Verification
```
1. User enters 6-digit OTP on Mobile App.
2. App sends POST /api/v1/auth/otp/verify with phone, code, and device fingerprint.
3. Backend checks Redis: verify attempts < 3.
4. Backend compares SHA-256(code) with stored hash.
5. If valid: Redis OTP key is deleted.
6. Backend queries PostgreSQL users table:
   - If new user: creates record with status 'pending_profile', generates registration JWT.
   - If existing user: updates last_login_at, creates session record in DB/Redis.
7. Backend returns { access_token, refresh_token, user_profile, is_new_user }.
```

### Flow C: JWT Authentication
```
1. Mobile App makes API request with header `Authorization: Bearer <access_token>`.
2. Go Auth Middleware extracts and verifies token signature via public key.
3. Middleware checks token expiration (`exp`) and issuer (`iss`).
4. Middleware checks if `jti` is present in Redis token revocation blocklist.
5. Claims (`user_id`, `role`, `plan`) are injected into Go `context.Context`.
6. Request proceeds to endpoint handler.
```

### Flow D: Business Search
```
1. User types query "industrial valves" and selects category "Manufacturing".
2. App sends GET /api/v1/search?q=industrial+valves&cat=mfg_uuid&lat=11.0168&lng=76.9558&radius=10000.
3. Backend Discovery Service constructs SQL query:
   - Filters: status = 'live' AND listing = 'listed' (verified only).
   - PostGIS ST_DWithin(location, user_pt, 10000).
   - Full-text match on search_tsv @@ plainto_tsquery('industrial & valves').
   - Trigram similarity on name % 'industrial valves'.
4. Ranking formula evaluates: 0.45*relevance + 0.25*distance + 0.15*completeness + 0.10*kyc_weight + 0.05*activity.
5. Max 2 sponsored listings injected at top with `is_sponsored: true`.
6. Results returned with pagination cursor and calculated distance.
```

### Flow E: Location Search (Pincode Community Hub)
```
1. User navigates to Community tab or selects Pincode "641004".
2. App sends GET /api/v1/community/641004?category=all.
3. Backend queries composite index (pincode, primary_category_id, listing, status).
4. Returns verified local business listings grouped by category in < 50ms.
```

### Flow F: Business Card Scanning
```
1. User opens Camera Scanner screen in Mobile App.
2. Vision Camera runs on-device boundary detection and checks for glare/blur.
3. User snaps Front (and optional Back) of card.
4. On-device engine crops, de-skews, and compresses image to WebP (<= 1280px).
5. User presented with 2 options: "Save Image Only (Free)" or "Extract Data with AI".
```

### Flow G: Image Upload (Presigned Flow)
```
1. Mobile App sends POST /api/v1/media/presign { kind: "card_original", ext: "webp", bytes: 450000 }.
2. Backend validates size/type and generates S3 presigned PUT URL with 5-minute expiry.
3. Mobile App directly uploads binary WebP payload to S3 URL.
4. S3 returns 200 OK to Mobile App.
5. Mobile App sends object key to backend upon card creation or extraction.
```

### Flow H: AI Extraction
```
1. User selects "Extract Data" (Standard or Structured Address).
2. App sends POST /api/v1/cards/{id}/extract { mode: "standard" | "premium" }.
3. Backend checks user monthly allowance (30 free/month) or debits contact credits (1 or 3 credits).
4. Backend worker fetches card image from S3, prepares Vertex AI Gemini request.
5. Gemini 3.x Flash-Lite executes structured extraction with cached system prompt.
6. Returns normalized JSON: person, company, designation, phones (with WhatsApp icon flag), emails, raw/structured address.
7. Backend records extraction log and returns structured data to mobile app for user review.
```

### Flow I: Saving a Card
```
1. User reviews extracted fields on Review Screen, modifies any low-confidence fields.
2. User selects optional tags ("Vendor", "BNI Chapter") and private rating (1-5 stars).
3. App sends PUT /api/v1/cards/{id} with finalized data.
4. Backend persists data into `saved_cards`, `saved_card_phones`, `saved_card_emails`, and `saved_card_tags`.
5. Matcher checks if phone/email matches an existing live business listing:
   - Match: returns linked business metadata.
   - No Match: returns claim invite token for one-tap WhatsApp invitation.
```

### Flow J: Business Creation
```
1. User completes 5-step wizard on Mobile App.
2. Step 1-4: Basic info, verified public phone, address + pin drag, photos.
3. Step 5: Enters GSTIN (or PAN/TAN).
4. Backend calls KYC Aggregator API to verify GSTIN status (Active) and trade name.
5. If owner personal KYC not completed: launches Aadhaar DigiLocker session.
6. Upon validation, business is created with status `live_unlisted` (accessible via direct link/QR).
7. Once KYC verification passes completely, status transitions to `live_listed` (search visible).
```

### Flow K: QR Code Scanning
```
1. Third-party or user scans business QR code using native camera or CardFlow app.
2. QR payload contains `https://cardflow.app/b/{slug}`.
3. If app installed: OS triggers Universal/App Link -> opens native `BusinessProfileScreen`.
4. If app not installed: browser loads lightweight server-rendered HTML profile with full details and "Get CardFlow" app download banner.
```

### Flow L: Business Enquiry
```
1. User on business profile taps "Send Enquiry".
2. Fills message (<= 500 chars) and checks "Share my phone number".
3. App sends POST /api/v1/businesses/{id}/enquiries.
4. Backend verifies user daily spam limit (5/day normal, 10/day ID-verified).
5. Creates record in `enquiries` table with status `new`.
6. Triggers instant FCM/APNs push notification to business owner device.
```

### Flow M: Subscription Purchase
```
1. Owner reaches business cap and selects "Upgrade to Business Plus (₹199/mo)".
2. `react-native-iap` triggers native Google Play / Apple IAP purchase sheet.
3. On payment success, app receives signed purchase receipt token.
4. App sends POST /api/v1/billing/verify-purchase { store, receipt_token, sku }.
5. Backend calls Google Play Developer API / Apple StoreKit API to cryptographically verify receipt.
6. Backend updates `subscriptions` table, upgrades `users.plan` to `plus`, logs audit event.
7. Returns updated entitlements to mobile app.
```

### Flow N: Admin Operation
```
1. Staff member opens Admin Tab in React Native app.
2. Navigates to KYC Queue, views pending GSTIN name mismatch.
3. Staff selects "Approve Trade Name Override" and taps Confirm.
4. App sends POST /api/v1/admin/kyc/resolve { verification_id, action: "approve", notes: "Verified trade license" }.
5. Backend verifies staff JWT has `role: "admin"`.
6. Backend updates business verification status to `gst` and listing to `listed`.
7. Backend records immutable entry in `audit_logs` table with previous and new JSON state.
```
