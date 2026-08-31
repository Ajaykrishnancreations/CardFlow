# CardFlow — Security & Compliance Architecture

## 1. Authentication & Session Security

### 1.1 OTP Protection & Fraud Controls
* **Cryptographic Generation:** 6-digit numeric OTP generated using `crypto/rand` (Go) to prevent PRNG predictability.
* **Storage & Hashing:** Stored in Redis as a salted `SHA-256` hash with a strict 5-minute (300 seconds) TTL. Raw OTPs are never logged or stored in plain text.
* **Brute-Force Defense:** Maximum 3 verification attempts per OTP. On the 3rd failed attempt, the Redis key is instantly purged.
* **Rate Limits:**
  * Cooldown: 30-second resend cooldown per phone number.
  * Hourly Cap: Maximum 5 OTP requests per phone number per hour.
  * IP Cap: Maximum 20 OTP requests per IP address per hour.
* **Silent Device Trust:** Returning trusted devices with a valid device token can bypass OTP for 30 days (revocable anytime via settings).

### 1.2 JWT Security & Refresh-Token Rotation
* **Asymmetric Signing:** JWT access tokens signed with `Ed25519` (or `RS256`). Public keys used for verification; private keys kept strictly in server memory.
* **Short-Lived Access Tokens:** Expire in exactly 15 minutes (`exp: 900`).
* **Refresh Token Rotation & Family Tracking:**
  * Opaque 256-bit cryptographically secure token stored in Redis/DB with `family_id` and `device_id`.
  * Every refresh cycle issues a new access token and a new refresh token, invalidating the old refresh token.
  * **Theft Detection:** If an already-invalidated refresh token is presented, all refresh tokens in that `family_id` are revoked immediately, forcing re-authentication across that device.
* **Revocation List:** Token revocation (`logout-all`) places the user's `jti` in a Redis blacklist with a TTL matching the token's remaining lifespan.

---

## 2. Authorization & In-App Admin Gating

* **Role-Based Access Control (RBAC):** Every authenticated request context injects `user_id`, `role` (`user` | `admin`), and `plan`.
* **In-App Mobile Admin Protection:**
  1. *Mobile UI Level:* React Navigation conditionally hides and unmounts the `AdminStack` unless `user.role === 'admin'`.
  2. *Backend Gateway Level:* Every `/api/v1/admin/*` endpoint passes through `RequireAdminRole` middleware, querying the database to confirm the user account is active, unsuspended, and explicitly marked as an admin.
* **Resource Ownership Gating:**
  * Business mutations (`PATCH /businesses/{id}`) verify `businesses.owner_user_id == current_user.id`.
  * Card vault mutations (`PATCH /cards/{id}`) verify `saved_cards.user_id == current_user.id`.

---

## 3. Storage & Presigned Upload Security

* **Zero Direct Server Transit:** Images never stream through the Go API server memory or disk, eliminating DoS vectors from large file uploads.
* **Presigned URL Constraints:**
  * Strict 5-minute expiry (`expires_in = 300`).
  * Enforced `Content-Type` matching (`image/webp`, `image/jpeg`, `image/png`).
  * Enforced `Content-Length-Range`:
    * Business card images: max 1 MB (1,048,576 bytes).
    * Business photos/logos: max 500 KB (512,000 bytes).
    * KYC documents: max 5 MB (5,242,880 bytes).
* **Server-Side File Validation & Sanitization:**
  * Background worker verifies image magic bytes (header validation) before registering in the database.
  * Image processor strips all EXIF GPS metadata from business cards to prevent accidental location leaks.
* **Bucket Isolation:**
  * `cardflow-private-media`: Private ACL, server-side encryption (`AES-256`), accessible only via short-lived presigned GET URLs generated on the fly.
  * `cardflow-public-media`: Public read via CDN edge with restrictive CORS.

---

## 4. Identity & KYC Data Security (DPDP & UIDAI Compliance)

* **No Storage of Full Aadhaar Numbers:** In strict compliance with UIDAI regulations and the DPDP Act 2023, CardFlow **never collects, displays, or stores 12-digit Aadhaar numbers**.
* **Aadhaar Handling:** Only the masked last 4 digits (`aadhaar_last4`), the KYC aggregator transaction reference (`aadhaar_provider_ref`), and the digital consent timestamp are stored.
* **PAN Encryption:** PAN numbers are encrypted at rest in PostgreSQL using `AES-256-GCM` with keys managed outside the database layer. Displayed in UI as masked strings (`ABCDE****F`).
* **Explicit DPDP Consent:** Every KYC verification requires explicit user consent acknowledging the purpose and the aggregator provider.
* **Alternative Verification Path:** In accordance with legal standards (Puttaswamy ruling), Aadhaar is not the sole route; business owners can verify via GSTIN, Company PAN, or manual document upload.

---

## 5. Payment & In-App Purchase Security

* **Server-Side Receipt Validation:** The client mobile app is never trusted to grant subscriptions or credits. Receipts from Google Play Billing and Apple StoreKit are cryptographically verified server-to-server.
* **Replay Protection & Idempotency:**
  * Google `purchaseToken` and Apple `originalTransactionId` are stored in PostgreSQL with unique constraints.
  * Re-submitting an existing purchase token returns the original status without re-crediting the balance.
* **Serializable Ledger Transactions:** All credit balance modifications run in PostgreSQL `SERIALIZABLE` or `SELECT FOR UPDATE` transactions, ensuring accurate balance math under concurrent requests.
* **Server-to-Server Webhook Authentication:**
  * Google Play RTDN validated via Google Cloud Pub/Sub service account tokens.
  * Apple App Store Server Notifications verified via Apple's public root certificate and JWS signature verification.

---

## 6. Infrastructure & Transport Security

* **HTTPS & TLS:** TLS 1.3 enforced everywhere with HTTP Strict Transport Security (HSTS).
* **CORS Policy:** Strict CORS configuration on the Go API server, allowing only official mobile app custom schemes and the public domain `https://cardflow.app`.
* **SQL Injection Prevention:** 100% parameterized queries using Go standard `database/sql` / `pgx` drivers. String concatenation in SQL statements is strictly prohibited.
* **XSS & Content Security:**
  * All user-generated text (business descriptions, enquiries, notes) is HTML-escaped before persistence.
  * Public web profile pages enforce a strict Content Security Policy (CSP).
* **Rate Limiting Middleware:**
  * Redis-backed sliding window rate limiter protects all public and authenticated endpoints against scraping and DDoS.

---

## 7. Audit Logging & DPDP Data Privacy

* **Immutable Admin Audit Trail:** Every administrative action (KYC approval/rejection, listing status change, manual credit adjustment) is recorded in the `audit_logs` table with admin ID, timestamp, IP address, and complete before/after JSON diffs.
* **Right to Data Export:** Users can invoke `GET /api/v1/users/me/export` to receive a complete JSON dump of their profile, owned businesses, and card vault.
* **Right to Erasure (Soft Delete & 30-Day Purge):**
  * `DELETE /api/v1/users/me` marks `deleted_at = NOW()` and revokes all active sessions.
  * After a 30-day grace period, an automated purge job permanently deletes user records, anonymizes analytics, and deletes all associated S3 objects.
* **No Auto-Publishing of Scanned Cards:** Scanned business card data remains private to the user's vault. Scanned cards are never published to the public directory without explicit owner consent via the claim-and-verify workflow.

---

## 8. Secrets Management Rules

1. **Zero Hardcoded Secrets:** All secrets injected via environment variables or cloud secret managers (AWS Secrets Manager / GCP Secret Manager).
2. **Mobile App Perimeter:** The React Native mobile app bundle **must never contain**:
   * Database credentials
   * JWT private keys
   * Redis passwords
   * S3 secret access keys
   * Google Vertex AI / Gemini API keys
   * SMS Gateway master credentials
   * KYC Aggregator private API keys
   * Google Play / Apple StoreKit private keys
