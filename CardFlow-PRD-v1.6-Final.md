# CardFlow — Business Card & Business Discovery Platform — PRD (FINAL)

| | |
|---|---|
| **Version** | 1.6 — **FINAL** (contact-pack pricing set: ₹49/499 · ₹199/1,999 · ₹249/2,499) |
| **Product / Domain** | **CardFlow** · `cardflow.app` — public profiles & universal links at `https://cardflow.app/b/{slug}` |
| **Date** | 29 Aug 2026 |
| **Platforms** | Android + iOS (React Native + TypeScript) |
| **Backend** | Go · PostgreSQL + PostGIS · Redis (OTP/rate-limit/cache) · S3-compatible object storage |
| **AI Extraction** | Gemini (Flash-class) on Vertex AI — server-side only |
| **Auth** | Phone number + OTP |
| **Payments** | Google Play Billing + Apple In-App Purchase (server-verified) |
| **Identity / KYC** | Aadhaar (DigiLocker / offline e-KYC), PAN, GSTIN, TAN via KYC-aggregator APIs (§16) |
| **Admin** | React/Next.js web portal (+ public web profile pages, see §9) |
| **Account model** | **Single-user accounts** — one phone = one account; no teams, no staff roles; a Business Owner is the same single account with **one or more verified businesses** attached |

---

## 0. Review summary — what this revision adds/changes vs your v1.0 draft

| # | Area | Change |
|---|---|---|
| R1 | **Single-user model** | Codified everywhere: no team members, no delegated access, no multi-login. MVP allows **1 business per account** (config flag can raise later). Admin portal accounts are internal staff, separate from app users. |
| R2 | **Card stored for future reference** | Original card images (front/back) are **always saved** with the contact, viewable full-screen forever until the user deletes them. Added a **"Save now, extract later"** mode (0 credits) so a card can be stored as an image first and AI-extracted whenever needed. |
| R3 | **Completed the draft** | Your draft ended at §6 "Home Screen". This version completes Home, Discovery/Search, Business Profiles, Digital Card/QR, Scanning, Enquiries, Monetization, Admin, Data Model, APIs, NFRs, Compliance, Metrics, Rollout, Risks, Release Plan, Roadmap. |
| R4 | **Cold-start strategy** | A two-sided directory dies without supply. Added the **scan→invite→claim growth loop** (§23) and a privacy-safe claim flow (no auto-publishing of scanned data — DPDP risk, §21). |
| R5 | **Public web profiles** | QR codes and shared links must open for people **without the app** → added lightweight public business pages (Next.js) with app deep links (§9). |
| R6 | **Monetization clarified** | Two lanes: **Business subscriptions (primary revenue)** + **scan credits for AI extraction (user side, carried from earlier scope: standard scan 1 cr, structured-address premium 3 cr)** (§13). |
| R7 | **Search ranking defined** | Relevance + distance + completeness + verified boost; **sponsored slots capped and labeled** to protect trust (§7). |
| R8 | **Carried over from earlier scanner PRD** | Gemini structured-output extraction contract, multi-phone/multi-email model, WhatsApp chips (icon detection + user confirm, never guessed), private star ratings & tags on saved cards, duplicate detection, model-retirement adapter note. |
| R9 | **Deliberate deferrals** | Public reviews/ratings of businesses → v1.1 (moderation load). In-app chat → v1.1. Google Contacts cloud sync → v1.1 (MVP ships "Export to phone contacts / vCard"). Personal digital cards for normal users → v1.1. |
| R10 | **Auth hardening** | OTP fraud controls, rate limits, session model, and phone-number-change flow specified (§4). |

---

## 0-A. v1.2 changelog

| # | Change |
|---|---|
| C1 | **Multiple businesses per single owner**: business-switcher UI, per-business verification / digital card / analytics / enquiry inbox; personal KYC done once and shared across all of the owner's businesses. *(Business count & subscription model updated by v1.3 → D1–D2.)* |
| C2 | **Business identity anchored on GSTIN** — globally unique per listing, auto-fetches legal/trade name & embedded PAN — with fallback ladder: company/firm **PAN** → **TAN** → manual document review (§16.2). |
| C3 | **Verification tick marks** for people and businesses: ✔ **ID Verified** (Aadhaar via DigiLocker/offline e-KYC + PAN) for users; 🏢 **GST / PAN / TAN Verified** badge for businesses (§16.1). |
| C4 | **Search gating:** only verified businesses appear in the free community search, organised by **city & pincode** community pages; unverified listings remain link/QR-only (§7, §8). |
| C5 | KYC-aggregator architecture, indicative costs (≈ ₹10–25 absorbed per verified owner+business), Aadhaar data-handling rules and legal guardrails (§16.4, §21.7, §24). |

---

## 0-B. v1.3 changelog

| # | Change |
|---|---|
| D1 | **Business count is now the subscription's headline gate:** Free = **1** business/GSTIN · Business Plus ₹199 = **2** · Business Premium ₹499 = **5** (§13). |
| D2 | Subscriptions moved from per-business to **per owner account** — one plan covers all the account's businesses; `plan` now lives on the user, not the business (§13, §17). |
| D3 | Cap mechanics: the "Add business" tap beyond the plan cap opens the upgrade paywall (the product's cleanest upsell trigger); on downgrade/expiry, excess businesses drop to `live_unlisted` after a 15-day grace — owner picks which stay listed, nothing is deleted (§13). |
| D4 | Premium's featured placement scoped to **1 owner-chosen business** to protect sponsored-slot inventory — confirm in §27. |

---

## 0-C. v1.4 changelog

| # | Change |
|---|---|
| E1 | **Innovation track added to the v2.0 roadmap** — the 10 features from the Aug-2026 product review: AI voice context snap · smart card enrichment · "Physical Storefront Verified" badge · NFC/BLE air-exchange · intent-based smart QRs · offline semantic vault search · pincode B2B bulletin board · instant micro-quote/RFP engine · zero-trust card watermarking · unified event/exhibition mode (§26). |
| E2 | Cheap forward-compatibility landed at MVP: composite pincode-community index and reserved nullable columns on `saved_cards` (`audio_note_url`, `event_tag`, `local_vector_id`) so v2.0 needs no migration pain (§17). |
| E3 | Udyam/MSME was already a v1.1 item — the review's recommendation aligns; wording tightened to "API-verifiable identity route" (§26). |
| E4 | The review's recommended answers to open questions (Q1 link-only · Q3 optional user KYC · Q4 absorb cost · Q8 "30 free scans/month" · Q13 enquiry cap) are **noted but not adopted** pending your confirmation — Q8 in particular would replace the credit-ledger model you originally specified. |

---

## 0-E. v1.6 changelog (this revision)

| # | Change |
|---|---|
| G1 | **Contact-pack pricing locked (owner decision):** ₹49 → 499 contacts · ₹199 → 1,999 · ₹249 → 2,499 — a flat ≈ ₹0.10/contact at every tier. Ledger unit renamed **contact credit** (1 standard scan = 1; address parsing still +2) (§13 Lane B). |
| G2 | **Unit-economics table added** to Lane B: at ≈ ₹0.10 gross, net after the 15% store fee is ≈ ₹0.083/contact vs AI COGS ₹0.05–0.08 on Gemini 3.x Flash-Lite (the 2.5 family retires 16 Oct 2026 — *before* the launch window) → Lane B runs near-cost by design; **Lane A subscriptions carry the revenue model.** |
| G3 | Cost controls promoted from "guardrails" to **requirements**: prompt caching, ≤ 1280 px images, ~350-token output cap, Vertex batch endpoint for queued/event-mode extractions, model-price re-evaluation at launch with a revisit trigger (COGS > ₹0.06/contact) (§13, §20). |
| G4 | Flagged (not changed): the tier ladder has **no volume discount** — five ₹49 packs (₹245 → 2,495) beat the ₹249 pack (2,499); confirm flat-rate is intentional or reshape top tiers. |

---

## 0-D. v1.5 changelog — FINAL

| # | Change |
|---|---|
| F1 | **All 13 open questions closed** — §27 is now a decision log; the PRD is approved for development. |
| F2 | **Brand locked: CardFlow / cardflow.app** — title, public-profile links, QR & NFC payloads and watermark text updated to `https://cardflow.app/b/{slug}`. |
| F3 | **Scan monetization switched to the hybrid ledger** (Q8): 30 free standard scans/month + consumable credit packs; **structured address parsing remains credit-priced** (§13 Lane B, §10). |
| F4 | **₹99/mo add-on slot beyond 5 businesses** (Q5): support-provisioned, billed as an IAP add-on subscription SKU for store compliance (§13). |
| F5 | **Launch City #1: Coimbatore, Tamil Nadu** across the top-20 B2B/trade categories, seeded through BNI/Rotary/JCI chapters and local trade bodies (§23, Appendix B). |

---

## 1. Product overview

A business discovery + digital business-card management platform solving two problems:

**Problem 1 — Business cards get lost.** People receive physical cards from owners, suppliers, customers, service providers, professionals. Cards live in wallets and drawers and disappear. The app gives: **Scan → Extract → Save → Search → Contact** — and the **original card image is preserved for future reference** even if the user never extracts or later edits the data.

**Problem 2 — Finding businesses is fragmented.** Users fall back to Google/Maps for IT companies, plumbers, electricians, hardware suppliers, clothing businesses, construction, manufacturers, consultants, local services. The app provides a structured directory searchable by **business name, category, service, location, distance, keywords** — with clean profiles and one-tap contact.

**The bridge (why one app, not two):** every scanned card is a potential directory listing. Scanning creates private utility for the user *and* a supply-side invitation loop for the platform (§23).

---

## 2. Product vision

> "Build a simple platform where users can discover businesses, save business cards digitally, and allow businesses to create a searchable digital business presence."

**User experience:** Search → Discover → Scan → Save → Contact
**Business experience:** Create Business → Create Digital Card → Share → Get Discovered → Receive Enquiries

Design principles: (1) simple first — every core job ≤ 3 taps from Home; (2) trust — verified badges, labeled sponsorship, no dark patterns; (3) nothing lost — card images and data belong to the user, exportable anytime; (4) single-user simplicity — no roles, no workspaces, no permission matrices.

---

## 3. User types (3 flows only)

### 3.1 Normal User
Register/login · search businesses (name/category/service/location/distance/keyword) · view business details · scan physical cards · **save card image with or without extraction** · search/edit/delete saved cards · tag & privately rate saved cards · favorite businesses/cards · contact businesses (call/WhatsApp/email/directions) · share business profiles. *Does not manage a public business profile.*

### 3.2 Business Owner
Everything a Normal User can do, **plus** (same single account — a toggle, not a second login):
create businesses (count set by plan: **Free 1 · Plus 2 · Premium 5**; each individually KYC-verified with its own GSTIN) · switch between businesses (switcher atop "My Business") · edit business info, logo, category, services, address, contact details, hours, photos · create digital business card · generate QR · share digital card/profile link · view business analytics · receive & manage enquiries · manage subscription (**one per account**, §13).

### 3.3 Admin (internal staff, web portal)
Manage users · businesses · saved-card reports · categories & subcategories · content reports/moderation · business verification · subscriptions & payment records · platform analytics · settings/feature flags. Admin accounts: Super Admin + Support role; full audit log. (Admin is out-of-app; the "single user" rule applies to app accounts.)

**Single-user account rules (explicit):**
- One phone number = one account. Deleting the account frees the number after 30 days.
- A business has exactly one owner account; an owner may hold **as many businesses as their plan allows (Free 1 · Plus 2 · Premium 5, §13)**, each with its own business KYC. Ownership transfer only via support/admin (verified).
- Personal KYC (Aadhaar + PAN, §16) is completed **once per account** and covers all businesses the account creates.
- No staff seats, no shared inboxes, no multi-device concurrent business editing guarantees (last write wins + edit timestamp shown).

---

## 4. Authentication — Phone + OTP

Flow (unchanged from draft): Open app → enter phone → send OTP → verify → new user? → Profile Setup → Home; returning user → Home. No passwords.

**Hardening added:**
- 6-digit OTP, 5-minute expiry, max 3 verify attempts per OTP, resend cooldown 30 s, max 5 OTPs/number/hour and IP-based caps (Redis counters). Silent device binding for returning devices ("trusted device" skips OTP for 30 days, revocable).
- Sessions: short-lived access token (15 min) + rotating refresh token (30 days); "log out of all devices" in settings.
- SMS provider abstraction (MSG91/Kaleyra/Twilio behind one interface) + fallback provider; delivery telemetry; OTP cost is a real line item — monitor per-signup cost and add invisible CAPTCHA on abuse patterns.
- **Phone-number change:** verify OTP on old number (if reachable) + new number; else support-assisted with business-document check for business owners.
- Landline-only businesses: owner logs in with a mobile number; the business's public phone can differ from the login number (verified separately, §16).

---

## 5. Profile setup (first login)

Collect: Name (required) · Email (optional) · Profile photo (optional) · City · State · Country (default from SIM/locale, editable). Phone comes from auth. Later, any user can tap **"Create Business"** to become a Business Owner (§8). City powers default search location until GPS permission is granted.

---

## 6. Home screen (completed)

Keep it simple; one screen, no feeds to moderate at MVP.

```text
┌────────────────────────────────────────────┐
│ 📍 [City ▾]                    🔔  👤      │
│ ┌────────────────────────────────────────┐ │
│ │ 🔍 Search businesses, services…        │ │
│ └────────────────────────────────────────┘ │
│  [📷 Scan Card]  [🗂 My Cards]  [⭐ Favorites]│
│                                            │
│  Categories                                │
│  [IT] [Plumber] [Electrician] [Hardware]   │
│  [Clothing] [Construction] [Mfg] [More…]   │
│                                            │
│  Popular near you                    see all│
│  ▭▭▭ business cards carousel ▭▭▭           │
│                                            │
│  Recently saved cards                see all│
│  ▭▭ thumbnails of last scans ▭▭            │
│                                            │
│  (Business Owner only)                     │
│  ┌ My Business ─ views 128 · enquiries 6 ┐ │
└────────────────────────────────────────────┘
 Bottom nav: Home · Search · [Scan ⊕ center] · Cards · Profile
```

- Location chip: chosen city or "Near me" (GPS); everything on Home respects it.
- "Popular near you" ranking = §7 ranking without sponsored slots at MVP (keeps Home clean).
- Business owners see a compact **My Business** stats card with a red badge for unread enquiries.
- Empty states are designed (new city with few listings → show "Invite a business" and category browse instead of a blank carousel).

---

## 7. Business discovery & search

**Listing eligibility (hard gate):** only businesses that have completed verification (owner personal KYC + business KYC, §16) appear in search, category browse and community pages. Unverified listings remain reachable via their direct link/QR only, marked "Unverified".

**Community structure:** the free directory is organised as **City → Pincode → Category** community pages ("Verified businesses in 6410xx"), alongside normal search. Pincode comes from the verified/registered business address.

**Query inputs:** free text (name/service/keyword) · category/subcategory · location (chosen city, **pincode**, map area, or GPS "near me") · radius (2/5/10/25 km) · filters (open now, has WhatsApp, GST-verified only).

**Engine (MVP — Postgres only, no extra infra):**
- Geo: PostGIS `geography(Point,4326)` + GiST index; `ST_DWithin` for radius; distance returned per result.
- Text: `tsvector` over business name + services + keywords + category names, plus `pg_trgm` for fuzzy/typo matching ("plumbr" → plumber).
- Category browse: index pages per city **and per pincode** (community pages).
- Scale path: swap to OpenSearch/Meilisearch behind the same search API when >~200k listings or query latency degrades (interface isolated in Go service).

**Ranking (transparent, trust-first):**
```
score = 0.45·text_relevance + 0.25·distance_decay + 0.15·profile_completeness
      + 0.10·verification_strength (GST > PAN > TAN) + 0.05·recent_activity
```
- **Sponsored results:** max 2 per page, always labeled "Sponsored", never above an exact-name match. Organic ranking is never sold. Sponsored slots are available only to verified businesses.
- Ties: earlier verified date first.

**Result card:** logo · name · category · distance · **verification badge (GST/PAN/TAN)** · rating placeholder (v1.1) · quick actions (Call · WhatsApp · Directions). Tap → business profile.

**Empty results:** suggest wider radius, sibling categories, and "Know this business? Invite them" (growth loop, §23).

---

## 8. Business profile & listing management (Business Owner)

**Create Business wizard (≤ 5 steps):**
1. Basics — business name, category (1 primary + up to 2 secondary), short description (≤ 300 chars).
2. Contact — public phone(s) (each can be marked call/WhatsApp), email, website; **public phone verified by OTP** if different from login number (§16.5).
3. Location — address fields incl. **pincode** + map-pin drag (writes lat/lng); service-area toggle for "we visit you" trades (plumbers/electricians) with radius.
4. Extras — logo, up to N photos (by plan, §13), services (chips, ≤ 15), business hours, year established.
5. **Verification** — business identity: **GSTIN (preferred)** → API-verified in ~60 s (legal/trade name, status, principal address fetched; name auto-matched) · no GSTIN? → **company/firm PAN** → else **TAN** · plus owner personal KYC (Aadhaar + PAN, §16) if not already done. The listing enters search only after this step passes; everything else (digital card, QR, link sharing) works immediately.

**Listing lifecycle:** `draft → pending_verification → live_unlisted (link/QR only) → live_listed (in search) → [flagged → under_review] → suspended/removed`. Content is post-moderated (async admin review within 48 h + user reporting), but **inclusion in search is verification-gated** — auto-publish applies only to link-level visibility.
**Profile completeness meter** (drives ranking factor + owner motivation).
**Edit anytime;** sensitive edits (name, phone, address, GSTIN) re-enter review; public page shows "Updated <date>".
**Multiple businesses per account, gated by plan** (Free 1 · Plus 2 · Premium 5, §13): a business switcher sits atop "My Business"; each business carries its own verification (own GSTIN/PAN/TAN), digital card, analytics and enquiry inbox; the **subscription and personal KYC live at the account level** and cover them all. Tapping "Add business" beyond the plan cap opens the upgrade paywall.

**Business profile page (public):** header (logo, name, category, verified badge) → action row (Call · WhatsApp · Enquiry · Directions · Share) → About → Services → Photos → Hours & address map → Digital card/QR → Report button.

---

## 9. Digital business card & QR

- Auto-generated from the business profile; **3 templates** at MVP (clean/bold/classic), brand color picker.
- Contents: logo, name, owner name, designation, phones (with WhatsApp mark), email, website, address, services line, QR.
- **QR encodes an https link** `https://cardflow.app/b/{slug}` → opens the **public web profile** (Next.js, SSR, fast, indexable) with "Open in app / Get the app" smart banner; App Links/Universal Links deep-link into the app when installed.
- Share as: link · card image (PNG) · PDF · **vCard (.vcf)** download; offline full-screen QR for counter display; printable A6 PDF ("Scan to save our card").
- Public web pages double as SEO surface for the directory (business schema.org markup) — organic acquisition channel.
- *Deferred:* personal digital cards for Normal Users → v1.1.

---

## 10. Card scanning & the Card Vault (Normal User + Business Owner)

**Capture:** camera with card-frame guide (single + batch), gallery import, front/back pairing, on-device crop/de-skew/glare check, downscale ≤ 1280 px before upload.

**Two save modes (per the "store for future reference" requirement):**
1. **Save image only — 0 credits.** Card goes into the Vault as photos with optional title/tags; "Extract" button available any time later.
2. **Scan (AI extract) — 30 free/month, then credits (§13).** Server-side Gemini (Vertex AI) structured-output call returns person, company, designation, **multiple phones** (label, mobile/landline, official/personal, WhatsApp-icon-adjacent flag), **multiple emails**, website, raw address, socials, per-field confidence, detected languages. Review screen highlights low-confidence fields; user confirms in seconds.

**Extraction contract highlights (carried from earlier PRD):**
- WhatsApp: printed icon detection binds a WhatsApp chip to the right number; actual presence/Business-account status is **never guessed** — one-tap user confirm via `wa.me` deep-link sets it (source recorded). No WhatsApp automation of any kind.
- Address: standard scan stores the **raw address string** (nothing lost); **structured address parsing is premium** (§13) — at scan time or retroactively per card.
- Model-adapter layer + versioned prompts/schemas + golden test set (incl. regional-script cards); note: Gemini 2.5 family retires 16 Oct 2026 → target 3.x Flash-Lite, config-switchable.
- Failure never consumes the monthly allowance and auto-refunds any credits, with retry tips.

**Card Vault features:** original images always attached and zoomable · search (name/company/number/text) · **tags** (Prospect, Lead, Customer, Vendor, Friend, Personal, community tags like BNI/JCI/Rotary/Lions + custom) · **private star rating 1–5** (user's own note of contact value — not public) · notes & "where we met" · edit/delete · duplicate detection on save (exact phone/email match warning + merge) · **export**: single vCard, bulk CSV/vCard, save-to-phone-contacts intent. *(Google Contacts cloud sync → v1.1.)*

**Card ↔ Directory bridge:** after a scan, matcher (phone/name/domain) checks the directory —
- Match found → "This business is on CardFlow. Link card to listing?" (linked card shows live profile + follow updates).
- No match → "Invite <Business> to claim a free listing" → prefilled WhatsApp/SMS with a claim link (§23). **Scanned data is never auto-published** (§21).

---

## 11. Enquiries & contact actions

- **Direct actions** (no account needed by the business… the business is on-platform by definition): Call (tel:), WhatsApp (wa.me to the number marked WhatsApp), Email, Directions (geo intent). Every tap is an analytics event credited to the listing.
- **Enquiry form:** name auto-filled, message (≤ 500 chars), consent checkbox "share my phone number". Creates an enquiry record + push + (optional) SMS to owner.
- **Owner Enquiry Inbox:** statuses `new → viewed → responded → closed`; respond via Call/WhatsApp buttons (logged); quick canned replies. No in-app chat at MVP (v1.1 decision).
- **Spam controls:** max 5 enquiries/user/day (**10 for ✔ ID-Verified users, whose enquiries carry the tick so owners can trust them**), 1 per user per business per 24 h, profanity filter, owner can block a user, report abusive enquiry.
- SLA nudge: owner reminded after 24 h of `new`; response-time metric feeds future ranking (v1.1).

## 12. Favorites & sharing

Favorite businesses and saved cards (separate tabs under ⭐). Share business = public link + preview card; share saved card = image/vCard (user's own data, their responsibility — a gentle privacy note on first share).

---

## 13. Monetization

**Lane A — Business subscriptions (primary revenue, account-level).** One subscription per owner account: the plan sets **how many businesses/GSTINs the account can run** and the feature level each of them gets. Sold as auto-renewing IAP subscriptions (Play Billing + StoreKit 2), server-side receipt validation, RTDN + App Store Server Notifications, grace periods, restore purchases. Admin can grant comp/promo periods.

| Tier | Price (hypothesis, validate) | **Businesses / GSTINs** | Includes (per business) |
|---|---|---|---|
| **Free** | ₹0 | **1** | Verified listing in the city + pincode community search, 1 category, 3 photos, digital card + QR, enquiries capped 10/mo, basic stats (views total) |
| **Business Plus** | ₹199/mo · ₹1,999/yr | **2** | Unlimited enquiries, 10 photos, 2 secondary categories, services up to 15, full analytics, WhatsApp button, verification fast-track eligibility |
| **Business Premium** | ₹499/mo · ₹4,999/yr | **5** | Everything in Plus + **Featured/Sponsored placement for 1 business of the owner's choice** (capped slots per category+city, always labeled), 25 photos, catalogue (v1.1), priority support |

**Cap mechanics:** the plan buys *slots, not shortcuts* — every business still needs its own GSTIN (or PAN/TAN fallback) and passes verification individually. Hitting the cap turns "Add business" into the upgrade paywall ("Add your 2nd business — go Plus"), which is the product's cleanest, highest-intent upsell moment; instrument it (§22).
**Downgrade / expiry:** businesses beyond the new cap keep all data, their digital card and direct link/QR, but drop to `live_unlisted` (out of search) after a **15-day grace**; the owner chooses which business(es) stay listed. Nothing is ever deleted by a plan change. **Beyond 5 businesses (decision Q5):** support-assisted add-on at **₹99/mo per additional business slot** — provisioned by support, billed as an IAP add-on subscription SKU to stay store-compliant; self-serve purchase of extra slots arrives in v1.x.

**Lane B — Scanning: hybrid ledger (decision Q8, pricing locked v1.6).** Every account gets **30 free standard AI scans per month** (resets monthly, no rollover); beyond that, scans draw on **contact packs**. The ledger unit is a **contact credit**: 1 standard scan = 1 contact credit; **structured address parsing always costs credits** (+2 at scan time, 2 retroactively) — so "499 contacts" assumes standard scans; address parsing spends from the same balance. Save-image-only and QR/vCard decode are free and unlimited. One ledger underneath tracks allowance + credits.

| Action | Within monthly allowance | Beyond allowance |
|---|---|---|
| Save card image only ("future reference") | Free, unlimited | Free, unlimited |
| Standard AI scan (front, or front+back of same card) | **0 (uses 1 of 30)** | 1 contact credit |
| Structured address parsing at scan time | **+2 credits** | 1 + 2 = 3 credits |
| Retro address parse on a saved card | 2 credits | 2 credits |
| QR/vCard decode on a card | Free | Free |
| Failed extraction | Allowance not consumed | Credits auto-refunded |

**Contact packs (consumable IAP):** **₹49 → 499** · **₹199 → 1,999** · **₹249 → 2,499** contacts — a flat ≈ ₹0.10/contact at every tier ("~1,000 contacts for ₹100" is the marketing line). Signup bonus: **10 contact credits** (lets every new user try address parsing). Ledger screen shows allowance remaining, credit balance and every debit/refund; image-hash dedupe prevents double charging.

**Unit economics at this price (be clear-eyed):**

| Per contact | Value |
|---|---|
| Gross (₹49/499) | ₹0.098 |
| Net after 15% Play/App Store fee | ≈ ₹0.083 |
| AI COGS — Gemini 2.5 Flash-Lite (today) | ≈ ₹0.03 — but the 2.5 family **retires 16 Oct 2026, before launch** |
| AI COGS — Gemini 3.x Flash-Lite (launch reality), with controls below | ₹0.05–0.08 |
| Contribution per paid contact | **≈ ₹0.00–0.03 (near-cost by design)** |

**Strategic reading:** Lane B is priced as a near-cost acquisition engine that makes CardFlow the cheapest serious scanner in the market; **Lane A subscriptions carry the revenue model.** To keep Lane B from going negative, these cost controls are **requirements, not options**: Gemini prompt caching for the fixed system prompt · images ≤ 1280 px · output schema capped ≈ 350 tokens · **Vertex batch endpoint (~50% cheaper) for all queued extractions** (event mode, offline queue, image-only→extract-later) · model-price re-evaluation at launch. **Revisit trigger:** if measured COGS > ₹0.06/contact at launch, reshape pack sizes or route more volume through batch before scaling paid acquisition.

**Verification costs:** KYC API costs (≈ ₹10–25 per fully verified owner + business, §16.4) are **absorbed by the platform at launch** — cheap CAC for trusted supply. Subscriptions and credits are both **account-level**: one plan and one credit balance cover all the owner's businesses.

**Store-policy notes:** all digital goods via IAP (15–30% fee baked into pricing); no external payment links in-app; subscription management deep-links to store screens.

---

## 14. Notifications

Push (FCM + APNs): new enquiry · enquiry reply nudge · verification result · subscription renewal/expiry/grace · claim-invite accepted · monthly business stats digest. SMS: OTP only (cost). In-app notification center mirrors pushes. All marketing-style pushes are opt-out-able (settings) and frequency-capped.

---

## 15. Admin portal (React/Next.js, internal)

Modules: **Dashboard** (supply/demand KPIs) · **Users** (search, view, suspend, delete/anonymize, OTP issues) · **Businesses** (review queue, edit, verify, suspend, ownership transfer, duplicate merge) · **Verification / KYC** (Aadhaar·PAN·GSTIN·TAN queues: API-result review, name-mismatch resolution, manual document fallback, re-verification jobs, §16) · **Categories** (2-level CRUD, ordering, icons, merge/deprecate with re-mapping) · **Reports/Moderation** (listings, photos, enquiries; actions with reason codes) · **Subscriptions & Payments** (read from store notifications, comp grants; refunds happen in store consoles — link out) · **Credits** (grants/adjustments with reason) · **Analytics** · **Settings & feature flags** (pre-moderation toggle, sponsored-slot caps, credit prices) · **Audit log** (every admin action, immutable). Roles: Super Admin, Support. SSO or email+TOTP for staff.

---

## 16. Identity, verification & trust (KYC layer)

Verification is the platform's trust backbone **and the gate to discovery**: only verified businesses appear in the free community search (city + pincode). Unverified listings stay link/QR-only.

### 16.1 Verification ladder & tick marks

| Level | Who | What is verified | How | Badge |
|---|---|---|---|---|
| **L0 Phone** | every account | login number | OTP (§4) | — (baseline) |
| **L1 Personal KYC** | business owners (**required**, once per account); normal users (optional) | the individual: Aadhaar + PAN | **Aadhaar via DigiLocker consent flow or UIDAI-signed offline e-KYC XML/QR** (name, DoB, photo, masked number) + **PAN verification** against the Income-Tax registry (active status, name match with Aadhaar, PAN–Aadhaar link status) — through a KYC aggregator | ✔ **ID Verified** on the user |
| **L2 Business KYC** | every business (**required to be listed in search**) | legal existence & identity of the business | fallback ladder §16.2 | 🏢 **GST Verified** / **PAN Verified** / **TAN Verified** (method shown; GST is the strongest signal) |

### 16.2 Business identity — fallback ladder (as specified)

1. **GSTIN (preferred; the unique key).** 15-char format + checksum validated locally, then API-verified → legal name, trade name, principal place of business, taxpayer type, and **status = Active** required; registered state must match the listing's state. GSTIN embeds the PAN (chars 3–12), so the company PAN is captured automatically. **One GSTIN = one listing** (global unique constraint) — this is the directory's dedupe backbone. Return-filing recency is stored as an internal risk hint (not shown publicly at MVP).
2. **Company/Firm PAN** (GST-unregistered small businesses): PAN verified for name + active status; the 4th character indicates entity type (C = company, F = firm, P = individual/proprietor). Uniqueness rule: PAN + pincode (one PAN may legitimately run outlets; conflicts route to admin review).
3. **TAN** (last resort, e.g. deductor-only entities): registry-verified; globally unique.
4. **Manual fallback:** API failure/edge cases → document upload (GST certificate / Udyam / shop-establishment licence) → admin review ≤ 48 h.

**Name matching:** fuzzy score between registry legal/trade name and the entered listing name; ≥ threshold auto-passes, below it goes to human review with a suggested fix ("Use registered trade name 'XYZ Enterprises'?"). Registered trade name is displayed alongside the brand name when they differ.

### 16.3 Flow, states & re-verification

- L1 once per account (reused across all the owner's businesses); L2 per business inside the Create-Business wizard (Step 5). Target ≤ 60 s for the GSTIN happy path.
- States: `pending → verified | failed (retry ×3) → manual_review`. While pending/failed, the listing is `live_unlisted` — digital card, QR and direct link fully functional — and flips to `live_listed` on pass. This keeps supply friction from killing the funnel while honoring the verified-only search rule.
- **Re-verification:** nightly job re-checks GSTIN status on a monthly cycle; `Cancelled/Suspended` GSTIN → owner notified, 15-day grace → delisted from search until resolved. PAN/TAN re-checked yearly.
- Normal users can complete L1 voluntarily: ✔ badge shown on their enquiries + higher enquiry limits (§11) — a soft trust loop that never blocks demand-side growth.

### 16.4 KYC provider & cost

- One **KYC aggregator behind an internal interface** (Sandbox / Setu / IDfy / Perfios / Surepass class — all expose DigiLocker-Aadhaar, PAN and GSTIN endpoints), selected on price, uptime SLA and **direct government-registry integrations** (UIDAI/Protean/GSTN routes). Beware providers offering "Aadhaar verification" without a sanctioned route — that's OCR, not verification.
- Indicative unit costs (volume-negotiated): GSTIN ₹2–5 · PAN ₹2–5 · Aadhaar DigiLocker/offline flow ₹3–10 → **≈ ₹10–25 per fully verified owner + business**, absorbed by the platform at launch (§13); add retry caps (3/day) so failures can't run up the bill.
- Every check stores: provider, request ref, result payload (encrypted), name-match score, consent timestamp — the audit trail admins see in the KYC queue.

### 16.5 Other trust & safety (carried from v1.1)

- **Public-phone tick** (independent of KYC): business phone confirmed by OTP when it differs from the login number.
- Duplicate-listing detection now anchors on **GSTIN/PAN/TAN first**, then phone, then name+geohash heuristics → block or "claim/transfer" path via support.
- Content policy: no illegal services, misleading categories, stock-photo storefront abuse; report → review → strike ladder (warn → suspend → remove); prohibited-category list is admin config.
- Enquiry/user abuse controls per §11; device + number bans.

---

## 17. Data model (core)

```text
users(id, phone e164 UNIQUE, name, email?, photo_url?, city, state, country,
      plan ENUM(free,plus,premium) DEFAULT free,     -- gates business count 1/2/5 (§13)
      status, created_at, last_login_at, deleted_at)

user_kyc(user_id PK→users, aadhaar_status ENUM(none,verified,failed), aadhaar_last4,
      aadhaar_provider_ref, pan_enc, pan_status, registry_name, name_match_score,
      provider, consent_at, verified_at, updated_at)   -- full Aadhaar number is NEVER stored

devices(id, user_id, platform, push_token, trusted_until, last_seen)

otp_sessions(id, phone, code_hash, expires_at, attempts, ip, created_at)      -- Redis-backed

businesses(id, owner_user_id →users (many per owner, cap via config), name, slug UNIQUE,
      description, primary_category_id, logo_url, website, email,
      address{line1,line2,locality,city,district,state,pin,country},
      location geography(Point,4326), service_area_km?,
      hours jsonb, year_established?,
      gstin CHAR(15) UNIQUE?, pan?, tan UNIQUE?, legal_name?, trade_name?,
      status ENUM(draft,live,under_review,suspended,removed),
      verification ENUM(pending,gst,pan,tan,manual,failed),
      listing ENUM(unlisted,listed),                 -- search-inclusion gate (§7, §16)
      phone_verified bool, completeness smallint,
      search_tsv tsvector,
      created_at, updated_at)

business_categories(business_id, category_id, is_primary)
categories(id, parent_id?, name, slug, icon, sort, status)        -- 2 levels
business_services(id, business_id, name)                          -- chips, tsv-indexed
business_phones(id, business_id, e164, label, is_whatsapp, otp_verified)
business_media(id, business_id, kind ENUM(logo,photo), url, sort, status)
business_verifications(id, business_id, method ENUM(gstin,pan,tan,manual_doc),
      id_value_enc, registry_payload jsonb, status, name_match_score,
      provider, reviewed_by_admin?, created_at, verified_at)     -- KYC audit trail

digital_cards(id, business_id UNIQUE, template, brand_color, qr_slug, updated_at)

saved_cards(id, user_id, person_name?, designation?, company?, website?,
      notes?, met_context?, private_rating smallint?, contact_type ENUM(business,personal),
      linked_business_id?→businesses, extract_status ENUM(image_only,extracted),
      audio_note_url?, event_tag?, local_vector_id?,              -- reserved for v2.0 track (§26)
      created_at, updated_at, deleted_at)                         -- Card Vault
saved_card_images(id, saved_card_id, side ENUM(front,back,other), object_key,
      width, height, bytes, created_at)                           -- "stored for future reference"
saved_card_phones(id, saved_card_id, raw, e164?, type, usage,
      whatsapp{present,type,source,confirmed_at}, confidence)
saved_card_emails(id, saved_card_id, address, usage, confidence)
saved_card_address(saved_card_id, raw?, structured jsonb?, parse_status, credits_spent)
tags(id, user_id?, name, kind ENUM(relationship,community,custom), color)
saved_card_tags(saved_card_id, tag_id, detail_value?)             -- e.g. BNI chapter

scan_records(id, user_id, saved_card_id?, image_hash, model_id, prompt_version,
      raw_response jsonb, confidences jsonb, scan_kind, credits_charged,
      refund_status, latency_ms, created_at)

favorites(user_id, kind ENUM(business,saved_card), ref_id, created_at)

enquiries(id, business_id, user_id, message, share_phone bool,
      status ENUM(new,viewed,responded,closed), created_at, responded_at)

subscriptions(id, user_id, store ENUM(play,appstore), product_id, status,
      current_period_end, original_txn_id, created_at, updated_at)   -- one active per account; sets users.plan
credit_ledger(id, user_id, delta, reason, ref_id?, balance_after, created_at)
purchases(id, user_id, store, sku, credits_granted, store_txn_id, status, created_at)

analytics_events(id, ts, user_id?, business_id?, event, props jsonb)          -- partitioned
reports(id, reporter_user_id, target_kind, target_id, reason, status, handled_by?, created_at)
admin_users(id, email, role, totp_secret, status)
audit_logs(id, admin_id, action, target, before jsonb, after jsonb, ts)
```

Indexes that matter: GiST on `businesses.location`; GIN on `search_tsv` and trigram on `businesses.name`; partial UNIQUE on `businesses.gstin` and `businesses.tan`; dup-check index on `(pan, address.pin)`; btree on `owner_user_id` (multi-business); **composite `(address.pin, primary_category_id, listing)` so pincode community pages load in < 50 ms**; hash index on `scan_records.image_hash`.

---

## 18. API surface (summary, Go services)

```text
Auth:        POST /auth/otp/send · POST /auth/otp/verify · POST /auth/refresh · POST /auth/logout-all
Profile:     GET/PATCH /me · DELETE /me (soft, 30-day purge) · GET /me/export
Discovery:   GET /search?q&cat&lat&lng&radius&filters&page
             GET /categories · GET /businesses/{slug}
Business:    POST /businesses · PATCH /businesses/{id} · POST /businesses/{id}/phones/verify
             POST /media/presign (S3 direct upload) · GET /businesses/{id}/analytics?range
             GET/PATCH /businesses/{id}/enquiries
Cards:       POST /cards (image-only) · POST /cards/{id}/extract (standard|premium)
             POST /cards/{id}/address/parse · GET /cards?query&tag&rating
             PATCH/DELETE /cards/{id} · POST /cards/{id}/link-business
             GET /cards/{id}/vcard · GET /cards/export.csv
Enquiries:   POST /businesses/{id}/enquiries
Favorites:   PUT/DELETE /favorites/{kind}/{id}
Billing:     POST /billing/play/rtdn (webhook) · POST /billing/appstore/notifications
             GET /me/credits · POST /purchases/verify
KYC:         POST /kyc/personal/start (DigiLocker / offline-XML session) · GET /kyc/personal/status
             POST /businesses/{id}/verify {method: gstin|pan|tan, value} · GET /businesses/{id}/verify/status
Invites:     POST /cards/{id}/invite  → claim link  · POST /claims/{token}/accept
Admin API:   separate service + authz; mirrors §15 modules
```
Conventions: JWT bearer; idempotency keys on all POSTs that charge credits or create purchases; cursor pagination; all uploads via presigned S3 URLs (images never transit the Go API).

---

## 19. Architecture

```text
[React Native app (Android/iOS)]
   │ REST/JSON (OpenAPI), presigned S3 uploads, FCM/APNs push
   ▼
[Go API gateway + services]  ── Redis (OTP, rate limits, hot cache)
   ├─ Auth/OTP svc ── SMS provider(s)
   ├─ Discovery svc ── PostgreSQL + PostGIS (tsvector + pg_trgm)
   ├─ Business svc ── moderation queue (async workers)
   ├─ Card svc ── S3 (card images) ── Extraction worker ─► Vertex AI Gemini
   │                                   (model adapter · prompt/schema registry · golden-set evals)
   ├─ Enquiry/Notification svc ── FCM/APNs
   ├─ Billing svc ── Play RTDN / App Store Server Notifications
   └─ Analytics ingester ── partitioned events table (→ warehouse later)
[Next.js] ── Admin portal  +  Public business pages (cardflow.app/b/{slug}, SSR, schema.org)
Region: single region close to launch market (e.g. asia-south1); KMS-encrypted secrets.
```
Notes: extraction is a queue-backed worker (smooths spikes after networking events, enables batch pricing); image pipeline generates thumbnails + strips EXIF GPS from card photos; feature flags via config service.

---

## 20. Non-functional requirements

| Area | Target |
|---|---|
| Search latency | ≤ 300 ms p95 server-side (city-scoped) |
| Scan → editable result | ≤ 4 s p50, ≤ 8 s p95 (single card, 4G) |
| App cold start | ≤ 2.5 s p90 on mid-range Android |
| Offline | Card Vault readable offline; capture queues offline; directory requires network (cached recents shown) |
| Availability | 99.5% monthly (API) |
| Scale (MVP) | 100k MAU, 50k listings, 1M saved cards without re-architecture |
| Media | Card image ≤ 1 MB stored (compressed), business photos ≤ 500 KB each |
| AI cost controls (required, §13) | Gemini prompt caching; images ≤ 1280 px; output capped ≈ 350 tokens; Vertex **batch endpoint** for queued/event-mode extractions; per-user daily scan ceiling; COGS-per-contact dashboard with ₹0.06 revisit trigger |
| Security | TLS; at-rest encryption (DB + S3); presigned, expiring image URLs; OTP + API rate limits; secrets in KMS; least-privilege DB roles |
| Backups | Daily DB snapshots, 30-day PITR; S3 versioning on card images |
| Accessibility | Dynamic type, screen-reader labels on review & profile screens |
| Localization | English UI at MVP; i18n scaffolding in place; extraction is multilingual by model |

---

## 21. Privacy & compliance

1. **DPDP Act 2023 (India-first):** consent notice at signup; purpose limitation; grievance officer; breach process; in-region data residency; user export (`GET /me/export`) and delete (30-day purge incl. S3 images and tokens).
2. **Scanned-card data is third-party personal data.** The user stores it for personal use (their card vault). The platform **never auto-publishes scanned data as a listing**; the invite/claim flow requires the business owner to consent and self-create (prefill token only decrypts after OTP-verified claim). This is the single most important privacy line in the product.
3. **Card images:** private per user; setting "Don't keep card images" (extract-and-discard) for sensitive users — default is keep (per requirement).
4. **Store compliance:** Play Data-Safety + App Privacy labels covering contacts-like data, images, location; IAP for all digital goods; location permission requested in-context ("near me") with graceful fallback to chosen city.
5. **WhatsApp:** deep-links only; no automation/scraping; Business Platform integration deferred to the marketing phase with proper opt-ins.
6. Public pages show only owner-provided business data; owners can hide street address (service-area businesses).
7. **KYC data handling (critical):** Aadhaar only via DigiLocker consent or UIDAI-signed offline e-KYC — the platform **never collects or stores full Aadhaar numbers** (masked last-4 + provider verification reference + consent timestamp only). PAN stored encrypted, displayed masked. GSTIN is public-registry data and may be shown on the profile as "GST Verified" with the registered trade name. Verification artefacts kept to legal minimums and purged with account deletion. Legal guardrail: keep at least one non-Aadhaar personal-KYC path (e.g., PAN + another DigiLocker document) — making Aadhaar the *only* route for a private service sits badly with the Puttaswamy ruling; every check runs behind an explicit DPDP consent screen naming purpose and provider.

---

## 22. Analytics & success metrics

**Supply:** listings created · **verification pass-rate & median time-to-verify (target ≥ 85% pass, ≤ 5 min)** · live-listed per city + pincode · claim-invite conversion · completeness median · plan mix.
**Demand:** searches/user · search→profile CTR · profile→contact-action rate (call/WA/enquiry/directions) · enquiries/business/month · owner response time.
**Scanner:** activation (signup→first save) ≥ 60% · extract share vs image-only · no-edit save rate ≥ 70% · scan p50 latency · **% of scanners exhausting the 30-scan monthly allowance (leading indicator for pack conversion)** · refund rate ≤ 5%.
**Business (revenue):** free→paid business conversion ≥ 6% by day 90 · **share of upgrades triggered at the add-business paywall (target ≥ 40% of Plus upgrades)** · credit-pack conversion ≥ 4% of active scanners · churn < 5%/mo.
**Retention:** D30 ≥ 25% (users with ≥3 saved cards or ≥3 contact actions in week 1).
Event taxonomy lives in §17 `analytics_events`; every contact action carries `business_id` for owner analytics.

---

## 23. Rollout & cold-start strategy (the make-or-break section)

A directory with empty categories dies on first search. Plan:

1. **Launch City #1: Coimbatore, Tamil Nadu (decision Q10)** — dense industrial/SMB base and highly active BNI/Rotary/JCI ecosystems. Launch scope = the **top-20 B2B/trade categories** (Appendix B is the seed taxonomy). City #2 opens only when the expansion gate (item 6) is met.
2. **Seed supply before public launch:** field onboarding + community partnerships — BNI/JCI/Rotary/Lions chapters and Coimbatore trade bodies (CODISSIA/SIEMA-class industrial associations) are dense, motivated early adopters; a chapter onboarding evening yields 30–60 verified listings. Target ≥ 500 live-listed businesses pre-launch.
3. **Scan→Invite→Claim loop (built-in growth):** every scanned card of an unlisted business offers a one-tap WhatsApp/SMS invite with a claim link; claiming pre-fills the wizard from the card (with owner consent) → listing in ~2 minutes. Track invite→claim ≥ 15%.
4. **Public web profiles + SEO** compound acquisition per listing.
5. **Scanner-first utility hedge:** even at zero directory density, the Card Vault is standalone-useful — the app never feels empty on day one.
6. Expansion gate: open a new city when (searches/day > X) and (fill-rate of top 20 categories > 70%).

## 24. Risks & mitigations

| Risk | Level | Mitigation |
|---|---|---|
| Cold start / empty search results | **High** | §23 seeding, invite loop, scanner-first utility, city gating |
| Publishing scanned data without consent (legal/brand) | **High** | Hard rule §21.2 — claim-gated prefill only |
| OTP SMS cost & fraud | Med | Rate limits, trusted devices, CAPTCHA on abuse, provider failover, cost dashboards |
| Moderation load as listings grow | Med | Post-moderation + reports + strike ladder; pre-moderation feature flag; prohibited-category config |
| Sponsored placement erodes trust | Med | Caps + labels + never above exact-name match |
| Gemini 2.5 retirement (16 Oct 2026) | Med | Model adapter, shadow-test 3.x, golden set |
| IAP rejection (credits/subscriptions flows) | Med | Standard consumable/subscription patterns; no external payment links |
| Duplicate/fake listings & ownership disputes | Med | Phone-OTP on public number, dup detection, doc verification, support transfer flow |
| **Verification friction throttles supply (worsens cold start)** | **High** | ~60 s in-wizard GSTIN auto-verify; `live_unlisted` grace (QR/card/link work instantly); field-team-assisted KYC during seeding; fallback ladder GSTIN→PAN→TAN→manual docs |
| Aadhaar/KYC legal & data exposure | Med-High | DigiLocker/offline-XML routes via licensed aggregator only; no Aadhaar numbers stored; non-Aadhaar alternative path; consent + audit trail (§21.7) |
| KYC API cost / abuse | Low-Med | ≈ ₹10–25 absorbed per business; retry cap 3/day; verify only at final wizard step |
| Fake/duplicate businesses via PAN fallback | Med | GSTIN global uniqueness; PAN+pincode dup checks; monthly GSTIN status re-checks; admin merge/claim-transfer flow |
| Scope creep (chat, reviews, feeds) | Med | Deferrals in §26 are explicit; MVP gate list below |

## 25. Release plan — MVP (~15–16 weeks, 3 engineers + 1 designer)

| Weeks | Milestone |
|---|---|
| 1–2 | Design system + flows; schemas; category taxonomy v1 (with admin CRUD); Gemini prompt/schema + golden set; **KYC aggregator selection & sandbox keys** |
| 3–5 | Auth/OTP + profile; Card Vault (image-only save, gallery, tags, rating, search); S3 pipeline |
| 5–7 | AI extraction + review screen + **hybrid ledger (30 free scans/mo + credit packs, IAP consumables)** |
| 7–9 | Business wizard **incl. verification step (GSTIN/PAN/TAN + DigiLocker Aadhaar + PAN person-KYC)** + multi-business switcher + public profile + digital card/QR + web pages |
| 9–10 | Discovery search (PostGIS + FTS, **verification-gated**, pincode community pages) + Home + favorites + contact actions & analytics events |
| 10–11 | Enquiries + notifications; **account-level subscriptions** (plan-gated business slots, IAP + store webhooks, downgrade/grace handling) |
| 11–12 | Admin portal core (users, businesses, categories, reports, **KYC review queue**) |
| 12–13 | Invite→claim loop; duplicate detection (GSTIN/PAN-anchored); polish; seeding sprints in launch city |
| 14–15 | KYC hardening (manual-review console, re-verification jobs, failure analytics) + closed beta with 2–3 community chapters |
| 16 | Phased store launch |

**MVP gate (must-have):** OTP auth · Card Vault w/ image-forever + extract-later · AI scan w/ credits & premium address · business create/edit + **owner KYC (Aadhaar + PAN) & business KYC (GSTIN → PAN → TAN) with verification-gated search** · multi-business switcher · public profile + digital card/QR + web page · search (text/category/geo/pincode) · enquiries · favorites · subscriptions + credit packs · admin core incl. KYC queue · invite/claim · export vCard/CSV.
**Explicitly out of MVP:** reviews/ratings (public), in-app chat, Google Contacts cloud sync, personal digital cards, catalogues/offers, multi-language UI.

## 26. Roadmap after MVP

**v1.1 (MVP + 3–4 months):** public ratings & reviews with moderation · in-app enquiry chat · Google Contacts two-way sync · personal digital cards · catalogue/offers for Premium · **branch sub-listings under a single GSTIN** · **Udyam/MSME certificate as an additional API-verifiable identity route** (free for micro-enterprises; bridges the no-GSTIN gap via the same KYC aggregator) · response-time ranking factor · Hindi/Tamil UI.

### v2.0 — CRM, marketing & innovation track (v1.1 + 6–9 months)

**Core (carried from the original product ladder):** follow-ups & pipeline on saved cards · referral tracking for community chapters · segments from tags · official WhatsApp Business Platform campaigns with opt-in ledger · occasion/festival campaigns · campaign analytics · Zapier/CRM exports.

**Innovation track (adopted from the Aug-2026 product review):**

*A — AI & scanner*

| # | Feature | Summary & guardrails |
|---|---|---|
| I-1 | **AI voice context snap** | 10-second "hold to record" right after a scan; the audio rides the **same multimodal Gemini call as the card image** (image + audio → one JSON) and fills `met_context`, action items, urgency and a suggested private rating — no typing at the expo booth. Data lands in `saved_cards.audio_note_url` + structured fields. |
| I-2 | **Smart card enrichment (async)** | Background worker fetches public metadata (OpenGraph / schema.org JSON-LD) from the **domain and socials printed on the card** → logo, company bio, links appear in the private card view at no extra credit. Guardrail: first-party public metadata only — no data-broker enrichment (keeps the §5.3 privacy non-goal intact); private view only; respect robots. |
| I-3 | **"Physical Storefront Verified" badge** | Owner uploads a 5-second storefront/office pan; Gemini Vision matches the signboard + surroundings against the GSTIN-registered name/address, cross-checked with capture geotag; manual-review fallback and anti-spoof checks (liveness of pan, EXIF/geo consistency). A trust tier **above** GST-verified for fraud-prone categories. |

*B — Dynamic cards & zero-friction networking*

| # | Feature | Summary & guardrails |
|---|---|---|
| I-4 | **NFC write + BLE "Air-Exchange"** | Write `https://cardflow.app/b/{slug}` to any blank NFC tag/sticker from inside the app; foreground-only BLE "nearby exchange" radar at events (5–10 m, explicit confirm per exchange). OS reality: background BLE advertising is restricted on iOS/Android — this is an event-time foreground feature by design, consent-first. |
| I-5 | **Intent-based smart QRs** | Owner generates QR variants mapped to intents: pre-filled WhatsApp product query · instant vCard save · straight-to-enquiry-form. Per-intent scan analytics feed §22. |
| I-6 | **Offline semantic Vault search** | Embeddings computed **server-side at extraction time**, synced into on-device SQLite (`sqlite-vec` class); natural-language vault search fully offline ("that valve manufacturer from Surat") — solves convention-hall dead zones. Uses `saved_cards.local_vector_id`. |

*C — Discovery, community & engagement loops*

| # | Feature | Summary & guardrails |
|---|---|---|
| I-7 | **Pincode B2B bulletin board** | Verified-owners-only structured broadcast cards inside each pincode community page ("excess inventory: 200 m copper wire", "need industrial electrician in 641004"), 30-day auto-expiry. Converts static directory pages into a daily-active local commerce exchange. Guardrail: this is the first true UGC surface — reuse the report/strike ladder, add posting caps per plan, and budget moderation headcount before launch. |
| I-8 | **Instant micro-quote / RFP engine** | One structured request, routed **anonymized** to ≤ 5 GST-verified businesses in the matching category + pincode; owners respond via quote cards. Monetization: responding costs credits or is a Plus/Premium entitlement — a clean second revenue line on high-intent demand. |
| I-9 | **Zero-trust card watermarking** | Shared card images / digital cards carry a light visible watermark — "Shared via CardFlow · for <recipient> · <date>" — deterring bulk list-scraping and telemarketing reuse; DPDP-aligned sharing hygiene. (Invisible/steganographic variant is a later iteration.) |
| I-10 | **Unified event / exhibition mode** | Upgrades the earlier expo bulk-scan item: organizer **event codes** (e.g., `EXPO2026`), geofenced auto-tagging of every scan, continuous-shutter batch capture with a background extraction queue — the camera never pauses. Pairs with I-1 voice notes and I-4 air-exchange for a complete event kit. |

**Sequencing within the track:** I-1, I-5 and I-10 are light enough to pull forward into v1.1/v1.2 if beta demand shows; I-7 and I-8 carry network-effect weight *and* moderation/routing complexity — they anchor v2.0 proper; I-3 ships once verification volume justifies the review workflow.

**Forward-compatibility done at MVP (so v2.0 is a feature drop, not a migration):** reserved nullable columns on `saved_cards` (`audio_note_url`, `event_tag`, `local_vector_id`) and the composite pincode-community index — see §17.

## 27. Open questions (decide before build)

## 27. Decision log — all questions closed (29 Aug 2026)

Every open question is resolved; **this PRD is approved for development.**

| Q | Topic | Decision |
|---|---|---|
| 1 | Unverified visibility | **Link/QR-only.** Hidden from search & pincode pages; direct link and QR keep working, so a new owner gets instant sharing utility while search stays 100% verified. |
| 2 | Featured on Premium | **1 owner-chosen business.** Protects sponsored inventory; stops one account occupying slots across five categories. |
| 3 | Normal-user KYC | **100% optional.** ✔ ID Verified badge + higher enquiry limits are the incentive; onboarding never blocks on Aadhaar/PAN. |
| 4 | Verification cost | **Platform-absorbed at launch** (≈ ₹10–25 per business) as supply-side CAC for GST-verified listings. |
| 5 | Beyond 5 businesses | **Support-assisted add-on, ₹99/mo per extra business slot** (IAP add-on SKU); no Enterprise tier at MVP. |
| 6 | Downgrade grace | **15 days** — excess listings → `live_unlisted`, owner picks the survivors, nothing deleted. |
| 7 | Branches | **1 GSTIN = 1 listing at MVP**; multi-branch sub-listings arrive in v1.1. |
| 8 | Scan monetization | **Hybrid ledger: 30 free standard scans/month + consumable credit packs; structured address parsing stays credit-priced** (§13 Lane B). |
| 9 | Google Contacts sync | **v1.1.** MVP ships native vCard/CSV export, avoiding Google's OAuth sensitive-scope review before store launch. |
| 10 | Launch market | **Coimbatore, Tamil Nadu** — top-20 B2B/trade categories (Appendix B), seeded via BNI/Rotary/JCI chapters and local trade bodies (§23). |
| 11 | Public reviews | **Deferred to v1.1.** Private star ratings stay in the Card Vault at MVP; avoids early moderation overhead. |
| 12 | Brand | **CardFlow · cardflow.app** — universal links at `https://cardflow.app/b/{slug}`. |
| 13 | Free enquiry cap | **10/month** — enough to prove demand, a clear trigger to upgrade to Business Plus. |

---

## Appendix A — Gemini extraction contract
Unchanged from the earlier scanner PRD (v0.9 §Appendix A): structured `responseSchema` with person/company/phones[] (label, type, usage, whatsapp_icon_adjacent, confidence)/emails[]/address{raw, structured?}/socials/contact_type_hint/languages/quality_issues; standard scans request raw-address-only schema, premium requests structured — same pipeline, schema variant only.

## Appendix B — Category seed (sample, admin-editable)
IT & Software · Plumbing · Electrical · Hardware & Building Materials · Clothing & Textiles · Construction & Contractors · Manufacturing · Consultants (CA/Legal/HR) · Printing & Signage · Interiors & Furniture · Auto (sales/service) · Health & Clinics · Education & Training · Food & Catering · Events & Photography · Logistics & Packers · Real Estate · Security & CCTV · Cleaning & Pest Control · Repairs & AMC. (2-level: each with 3–8 subcategories.)

---
*End of CardFlow PRD v1.6 — FINAL. All §27 decisions locked; contact-pack pricing set; next artefacts: DB migration SQL, OpenAPI spec, Gemini extraction schemas, sprint backlog.*
