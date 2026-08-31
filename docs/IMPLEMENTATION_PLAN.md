# CardFlow — Implementation Plan & Phased Roadmap

This implementation plan outlines the engineering execution across 14 sequential phases.

---

## Phase 1: Project Foundation & Environment Setup
* **Features:** Development environment initialization, code structure, linting, CI pipelines.
* **Backend Work:**
  * Initialize Go module (`go mod init cardflow`).
  * Set up layered package structure (`cmd/api`, `internal/*`, `pkg/*`).
  * Implement Chi router, configuration loader with `.env` parsing, structured logger (`slog` / `zerolog`), and global error handling.
  * Implement Docker Compose configuration (PostgreSQL 16 + PostGIS, Redis 7, MinIO).
* **Mobile Work:**
  * Initialize React Native (TypeScript) project with New Architecture enabled.
  * Configure navigation framework (React Navigation v6: Native Stack + Bottom Tabs).
  * Configure TanStack React Query v5, Zustand stores, and Axios / Fetch client with auth interceptors.
  * Establish design system foundations (colors, typography, button/input primitives, safe area insets).
* **Database Work:** Verify local PostgreSQL + PostGIS container initialization and extension installation scripts.
* **External Services:** Local Docker Compose environment (MinIO S3, Redis, Postgres).
* **Dependencies:** None.
* **Testing Requirements:** Go server health check test (`GET /healthz`), mobile app compilation on iOS Simulator and Android Emulator.
* **Definition of Done:** Clean monorepo structure with working Go backend running locally on Docker and React Native app compiling and rendering starter screen on both platforms.

---

## Phase 2: Database Schema & Migration Engine
* **Features:** Database tables, spatial and FTS indexes, migration tooling.
* **Backend Work:**
  * Integrate migration runner (`golang-migrate/migrate` or `goose`).
  * Implement database connection pooling with `pgxpool` and Redis client wrapper.
* **Mobile Work:** Set up local SQLite offline caching layer (WatermelonDB / OP-SQLite) for Card Vault offline cache.
* **Database Work:**
  * Create all migration scripts (001 to 015) covering tables defined in `DATABASE.md`.
  * Create PostGIS spatial index `idx_businesses_location` on `businesses.location`.
  * Create GIN full-text search triggers on `businesses.search_tsv` and `pg_trgm` indexes.
  * Seed category taxonomy (Appendix B - Top 20 categories).
* **External Services:** PostgreSQL 16 with PostGIS.
* **Dependencies:** Phase 1.
* **Testing Requirements:** Up/down migration tests; verify spatial query execution (`ST_DWithin`) and full-text search execution in Postgres.
* **Definition of Done:** All migrations run cleanly on fresh database; sample category seed data populated and searchable.

---

## Phase 3: Authentication & User Profile Setup
* **Features:** Phone + OTP authentication, JWT token issuance & rotation, profile completion.
* **Backend Work:**
  * Implement `/auth/otp/send` and `/auth/otp/verify` with Redis rate limiting and attempt caps.
  * Implement SMS provider abstraction (Mock SMS for dev, MSG91/Kaleyra for staging/prod).
  * Implement JWT token generation (`Ed25519`), refresh token rotation, and auth middleware.
  * Implement user profile endpoints (`GET /users/me`, `PATCH /users/me`).
* **Mobile Work:**
  * Build Phone Input Screen with country picker and validation.
  * Build 6-digit OTP verification screen with 30s countdown timer and resend logic.
  * Build Profile Setup Screen (Name, optional Email, City/State selection).
  * Persist tokens securely using `react-native-keychain` / `expo-secure-store`.
* **Database Work:** Verify `users`, `devices`, and `credit_ledger` records created upon first-time OTP verification (granting 10 signup bonus credits).
* **External Services:** SMS Gateway (sandbox/mock provider).
* **Dependencies:** Phase 2.
* **Testing Requirements:** Unit tests for OTP rate limiting; end-to-end auth flow tests; token rotation tests with simulated token theft.
* **Definition of Done:** User can enter phone, verify via OTP, complete profile, and access authenticated routes with valid JWT tokens.

---

## Phase 4: Normal User Discovery & Search
* **Features:** Home Screen, category navigation, text search, radial geo-search, pincode community hubs.
* **Backend Work:**
  * Implement `GET /categories` and `GET /community/:pincode`.
  * Implement `GET /search` engine utilizing PostGIS `ST_DWithin`, full-text `search_tsv`, and `pg_trgm` scoring.
  * Implement composite ranking algorithm (0.45*text + 0.25*dist + 0.15*completeness + 0.10*kyc + 0.05*activity).
  * Enforce verified listing filter (`status = 'live' AND listing = 'listed'`).
* **Mobile Work:**
  * Build Home Screen with location selector, category carousel, and "Popular near you" carousel.
  * Build Search Screen with real-time text input, category filters, radius slider (2km, 5km, 10km, 25km), and GST-only toggle.
  * Build Pincode Community Hub screen ("Verified businesses in 6410xx").
  * Build Business Public Profile View with quick action buttons (Call, WhatsApp, Directions, Share).
* **Database Work:** Query performance profiling on `idx_businesses_community` and `idx_businesses_location` ensuring < 300ms p95 latency.
* **External Services:** Google Maps Places/Geocoding API (for address search & reverse geocoding).
* **Dependencies:** Phase 3.
* **Testing Requirements:** Benchmark search queries with 10,000 seeded mock businesses; test spatial distance calculations and boundary conditions.
* **Definition of Done:** User can search and discover verified businesses by keyword, category, pincode, and GPS radius on mobile.

---

## Phase 5: Business Card Scanner & Card Vault
* **Features:** Card camera capture, edge detection, image-only save mode (0 credits), Card Vault listing, private tags & star ratings, contact export.
* **Backend Work:**
  * Implement `/media/presign` for direct S3 card image uploads.
  * Implement Card Vault CRUD endpoints (`POST /cards`, `GET /cards`, `PATCH /cards/:id`, `DELETE /cards/:id`).
  * Implement tag management (`/tags`) and private rating updates.
  * Implement export generators for `.vcf` (vCard) and `.csv`.
* **Mobile Work:**
  * Integrate camera with custom card-bounding overlay and front/back capture pairing.
  * Implement on-device image crop, de-skew, and WebP compression (≤ 1280px).
  * Build "Save Image Only" flow (0 credits).
  * Build Card Vault gallery with search, tag filter, and 1-5 star private rating selector.
  * Build full-screen zoomable card image viewer.
  * Implement native share / export to phone contacts.
* **Database Work:** Verify persistence in `saved_cards`, `saved_card_images`, and `saved_card_tags`.
* **External Services:** S3-compatible object storage (MinIO locally, AWS S3/Cloudflare R2 in prod).
* **Dependencies:** Phase 4.
* **Testing Requirements:** Test S3 presigned upload flow, card image retention, vCard format compliance with iOS/Android address books.
* **Definition of Done:** User can photograph physical cards, save front/back images forever with tags/notes/ratings, and export to contacts without spending credits.

---

## Phase 6: AI Extraction Engine (Gemini / Vertex AI)
* **Features:** Multimodal business card data extraction, structured output parsing, confidence scores, review screen.
* **Backend Work:**
  * Integrate Google Vertex AI Go SDK targeting Gemini 3.x Flash-Lite.
  * Implement cached system prompt and strict JSON schema contract (Appendix A).
  * Implement extraction controller: standard scan (raw address) vs. premium scan (structured address).
  * Implement allowance check (30 free/month) and credit deduction logic with auto-refund on failure.
  * Implement background extraction worker for queued / batch processing.
* **Mobile Work:**
  * Build Extraction Review Screen highlighting low-confidence fields.
  * Implement WhatsApp icon chip verification with one-tap `wa.me` confirmation.
  * Implement "Extract Later" button on saved image-only cards.
* **Database Work:** Verify records in `scan_records`, `saved_card_phones`, `saved_card_emails`, and `credit_ledger`.
* **External Services:** Google Vertex AI (Gemini 3.x Flash-Lite).
* **Dependencies:** Phase 5.
* **Testing Requirements:** Golden dataset eval across 50 sample business cards (single-sided, double-sided, multi-phone, regional scripts); verify allowance accounting.
* **Definition of Done:** User triggers scan, AI extracts structured contact details in < 4s, user reviews/edits, and extracted details save to the Vault.

---

## Phase 7: Business Owner Space & KYC Verification
* **Features:** 5-Step Create Business wizard, GSTIN auto-verification, Owner Aadhaar/PAN KYC, multi-business switcher, business profile editing.
* **Backend Work:**
  * Implement Business CRUD endpoints (`POST /businesses`, `PATCH /businesses/:id`).
  * Integrate KYC Aggregator adapter (Aadhaar DigiLocker session, PAN verification, GSTIN lookup API).
  * Implement fuzzy name matching engine (entered brand vs. registry trade/legal name).
  * Implement business verification state machine (`pending` → `live_unlisted` → `live_listed`).
* **Mobile Work:**
  * Build 5-step Business Creation Wizard:
    1. Basics (Name, Category, Description)
    2. Contact (Phones, WhatsApp tags, Email, Web)
    3. Location (Address, Pincode, Map Pin Dragger, Service Radius)
    4. Media & Services (Logo, Photos, Service Chips, Operating Hours)
    5. Identity Verification (GSTIN / PAN / TAN + Aadhaar DigiLocker)
  * Build Business Switcher component atop "My Business" tab.
  * Build Listing Edit screens with dirty state tracking.
* **Database Work:** Verify uniqueness constraints on active `businesses.gstin`, audit logs in `business_verifications`.
* **External Services:** KYC Aggregator (Sandbox / Setu / IDfy), Google Maps SDK.
* **Dependencies:** Phase 6.
* **Testing Requirements:** End-to-end GSTIN verification tests; DigiLocker redirect flow tests; test state transition from `live_unlisted` to `live_listed`.
* **Definition of Done:** User creates business, verifies via GSTIN and Aadhaar, and listing automatically goes live in city/pincode search.

---

## Phase 8: Digital Business Card, QR & Public Profiles
* **Features:** Auto-generated digital cards, customizable templates, QR code generation, public web profile fallback, universal deep linking.
* **Backend Work:**
  * Implement digital card rendering engine / template endpoints (`GET /businesses/:id/card`).
  * Implement public web profile route (`GET /b/:slug`) serving fast HTML + JSON-LD metadata for web crawlers / non-app users.
  * Serve `.well-known/apple-app-site-association` and `.well-known/assetlinks.json`.
* **Mobile Work:**
  * Build Digital Card Studio (3 templates: Clean, Bold, Classic; brand color picker).
  * Build full-screen QR code viewer for counter display.
  * Implement Share Card sheet (share as Link, PNG image, printable A6 PDF, vCard).
  * Configure React Navigation deep linking for `cardflow.app/b/:slug`.
* **Database Work:** Update `digital_cards` schema with chosen template and color.
* **External Services:** Apple App Store / Google Play store assets for smart install banners.
* **Dependencies:** Phase 7.
* **Testing Requirements:** Test QR code scanning from native camera app; test deep linking on iOS and Android; verify OpenGraph rendering on WhatsApp/Twitter previews.
* **Definition of Done:** Business owner has a live digital card with custom QR code that deep-links into the app or opens a public web profile.

---

## Phase 9: Enquiries & Lead Management
* **Features:** Direct contact actions (Call, WhatsApp, Email, Directions), structured enquiry form, Owner Enquiry Inbox, lead spam protection.
* **Backend Work:**
  * Implement `/businesses/:id/enquiries` with daily spam limits (5/day normal, 10/day ID-verified).
  * Implement Owner Enquiry Inbox endpoints (`GET /businesses/:id/enquiries`, `PATCH /enquiries/:id`).
  * Implement clickstream analytics tracking for contact button taps (`POST /analytics/events`).
* **Mobile Work:**
  * Build Enquiry Form modal on business profile with consent checkbox.
  * Build Owner Enquiry Inbox with status tabs (`new`, `viewed`, `responded`, `closed`).
  * Build 1-tap quick reply actions (Call / WhatsApp with pre-filled greeting).
* **Database Work:** Verify records in `enquiries` and monthly partitioned `analytics_events`.
* **External Services:** Native device dialer (`tel:`), WhatsApp (`wa.me`), Maps intent.
* **Dependencies:** Phase 8.
* **Testing Requirements:** Test rate limits on enquiry submissions; test owner lead status updates; verify analytics event capture.
* **Definition of Done:** Normal user sends enquiry, owner receives lead in inbox, and owner can respond directly via WhatsApp/Call.

---

## Phase 10: Push Notifications & Telemetry
* **Features:** Real-time push notifications for enquiries, verification results, and subscription alerts.
* **Backend Work:**
  * Implement unified notification worker with FCM (Firebase Cloud Messaging) and APNs.
  * Implement device token registration (`POST /devices/token`).
  * Integrate background triggers: new enquiry received, KYC approved/rejected, subscription grace period warnings.
* **Mobile Work:**
  * Integrate `@react-native-firebase/messaging` and APNs handlers.
  * Implement in-app notification badge counters and permissions request prompts.
  * Implement notification tap navigation routing.
* **Database Work:** Manage `devices` table records and cleanup stale push tokens.
* **External Services:** Firebase Cloud Messaging (FCM), Apple Push Notification service (APNs).
* **Dependencies:** Phase 9.
* **Testing Requirements:** Send test push notifications to physical iOS and Android devices in foreground, background, and killed states.
* **Definition of Done:** Business owner receives immediate push notification when a user submits an enquiry or verification completes.

---

## Phase 11: Subscriptions & In-App Purchases (Payments)
* **Features:** Account-level subscription tiers (Plus ₹199, Premium ₹499), consumable contact packs (₹49, ₹199, ₹249), store webhooks, downgrade grace period.
* **Backend Work:**
  * Implement receipt verification endpoints (`POST /billing/verify-purchase`).
  * Implement Google Play Developer API and Apple StoreKit 2 server-side receipt validation.
  * Implement webhook handlers for Google Play RTDN and Apple App Store Server Notifications.
  * Implement subscription status worker (handling 15-day grace periods and downgrades to `live_unlisted`).
* **Mobile Work:**
  * Integrate `react-native-iap` for subscription and consumable purchases.
  * Build Upgrade Paywall screen (triggered when adding businesses beyond plan cap).
  * Build Contact Credit Store screen with balance display and purchase options.
  * Implement "Restore Purchases" button.
* **Database Work:** Verify serializable transactions on `credit_ledger`, `subscriptions`, and `purchases`.
* **External Services:** Google Play Console (Billing), Apple Developer Program (StoreKit 2).
* **Dependencies:** Phase 10.
* **Testing Requirements:** Sandbox testing with Google Play license testers and Apple StoreKit Sandbox accounts; test auto-renewal, cancellation, grace period, and refund webhooks.
* **Definition of Done:** Owner can upgrade to Business Plus/Premium to unlock multiple business slots, and users can purchase contact credit packs.

---

## Phase 12: In-App Mobile Admin Suite
* **Features:** Staff Admin Tab embedded inside the mobile app: Dashboard KPIs, KYC Review Console, Business & User Management, Category CRUD, Report Resolution, Audit Log.
* **Backend Work:**
  * Implement all `/api/v1/admin/*` endpoints guarded by `RequireAdminRole` middleware.
  * Implement KYC name mismatch resolution and manual document approval workflows.
  * Implement manual credit adjustment and comp subscription issuance with audit logging.
  * Implement immutable logging to `audit_logs` table.
* **Mobile Work:**
  * Build protected `AdminStack` navigation mounted exclusively for `user.role === 'admin'`.
  * Build Admin Dashboard with platform KPI cards.
  * Build KYC Review Screen with side-by-side registry comparison and 1-tap Approve/Reject.
  * Build Business/User search and moderation screens.
  * Build Audit Log Viewer screen.
* **Database Work:** Verify immutable records in `audit_logs`.
* **External Services:** None.
* **Dependencies:** Phase 11.
* **Testing Requirements:** Test role escalation prevention; test admin approve/reject actions and state transitions; verify audit log completeness.
* **Definition of Done:** Internal staff can log into the mobile app, access the Admin Tab, review/approve pending KYC submissions, moderate content, and audit all actions.

---

## Phase 13: Quality Assurance, Security Audits & Golden Set Evals
* **Features:** Security hardening, end-to-end regression testing, AI golden-set evals, performance profiling.
* **Backend Work:**
  * Run static analysis (`golangci-lint`, `gosec`).
  * Perform load testing with `k6` on search and community endpoints (target ≤ 300ms p95 at 500 RPS).
  * Execute DPDP compliance audit (verify 30-day purge worker, data export endpoint).
* **Mobile Work:**
  * Test on low-end and mid-range Android devices and various iPhone models.
  * Profile app cold start (target ≤ 2.5s p90).
  * Verify offline Card Vault read and offline capture queue behavior.
* **Database Work:** Index vacuuming and query execution plan reviews with `EXPLAIN ANALYZE`.
* **External Services:** End-to-end sandbox verification of all third-party services.
* **Dependencies:** Phase 12.
* **Testing Requirements:** 100% pass rate on integration test suite; 0 critical vulnerabilities in security scan; ≥ 95% extraction accuracy on AI golden test set.
* **Definition of Done:** Stable, secure, performant build ready for closed beta seeding in Coimbatore.

---

## Phase 14: Production Deployment & Phased Launch
* **Features:** Cloud infrastructure provisioning, store submissions, launch city seeding.
* **Backend Work:**
  * Deploy containerized Go backend to managed cloud cluster in `asia-south1` (Mumbai).
  * Configure production PostgreSQL + PostGIS (RDS/Cloud SQL) with daily automated backups and PITR.
  * Configure managed Redis cluster and S3 storage with CDN edge caching.
  * Set up domain DNS, SSL certificates, Apple App Site Association, and Android Asset Links on `cardflow.app`.
* **Mobile Work:**
  * Create release builds signed with production keystores and Apple distribution certificates.
  * Prepare Google Play Store and Apple App Store listings (screenshots, localized copy, privacy labels).
  * Submit builds for store review.
* **Database Work:** Execute production migrations and seed top-20 categories for Coimbatore.
* **External Services:** Switch all providers (SMS, KYC, Vertex AI, Google Maps, IAP, FCM/APNs) to production credentials.
* **Dependencies:** Phase 13.
* **Testing Requirements:** Smoke testing in production environment using production builds.
* **Definition of Done:** Mobile app approved and live on Google Play Store and Apple App Store; seed onboarding begins in Coimbatore.
