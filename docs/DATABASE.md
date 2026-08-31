# CardFlow — Database Architecture & Schema Specification

Engine: **PostgreSQL 16+** with extensions: `postgis`, `pg_trgm`, `uuid-ossp`, `btree_gist`.

---

## 1. Database Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

---

## 2. Table Index & Categorization

| Category | Table Name | Purpose |
|---|---|---|
| **Auth & Users** | `users` | User accounts, profile details, account tier plan |
| | `user_kyc` | Owner personal KYC (Aadhaar DigiLocker reference & PAN) |
| | `devices` | Trusted devices, FCM/APNs push notification tokens |
| **Businesses** | `businesses` | Core business listings, locations, status & KYC level |
| | `categories` | 2-level category taxonomy (parent & subcategories) |
| | `business_categories` | Many-to-many business category mappings |
| | `business_services` | Service chips & offerings per business |
| | `business_phones` | Multiple phone numbers per business with WhatsApp flags |
| | `business_media` | Logos and gallery photos for business listings |
| | `business_verifications` | Audit log of business KYC checks (GSTIN/PAN/TAN/docs) |
| | `digital_cards` | Digital business card templates, styling & QR slugs |
| **Card Vault** | `saved_cards` | Digitized and saved business cards |
| | `saved_card_images` | Permanent storage of raw front/back card images |
| | `saved_card_phones` | Multiple extracted phones per card with WhatsApp metadata |
| | `saved_card_emails` | Multiple extracted emails per card |
| | `saved_card_addresses`| Raw address and structured address data per card |
| | `tags` | System, community (BNI/Rotary), and custom user tags |
| | `saved_card_tags` | Relationship between saved cards and tags |
| | `scan_records` | AI scan audit log, token usage, confidence scores |
| **Interaction** | `favorites` | User saved favorites (businesses and cards) |
| | `enquiries` | Lead enquiries sent from users to business owners |
| **Monetization** | `subscriptions` | Account-level active IAP subscriptions (Play/Apple) |
| | `credit_ledger` | Contact credit balance changes, debits, and refunds |
| | `purchases` | Consumable IAP contact pack purchase receipts |
| **Admin & Logs** | `reports` | User moderation reports for listings/enquiries |
| | `audit_logs` | Immutable audit trail of all staff administrative actions |
| | `analytics_events` | Partitioned clickstream & engagement analytics events |

---

## 3. Schema Definitions

### 3.1 Auth & Users

#### `users`
Core user identity. One phone number = one account.
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('pending_profile', 'active', 'suspended', 'deleted');
CREATE TYPE subscription_plan AS ENUM ('free', 'plus', 'premium');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,          -- E.164 format (+91XXXXXXXXXX)
    name VARCHAR(100),
    email VARCHAR(255),
    photo_url VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(10) DEFAULT 'IN',
    role user_role NOT NULL DEFAULT 'user',
    plan subscription_plan NOT NULL DEFAULT 'free',  -- Gates business count (1, 2, 5)
    free_scans_remaining SMALLINT NOT NULL DEFAULT 30,
    free_scans_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    status user_status NOT NULL DEFAULT 'pending_profile',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ                       -- Soft delete (30-day purge grace)
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role) WHERE role = 'admin';
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
```

#### `user_kyc`
Owner personal identity verification. Personal KYC is done once per account and shared across all businesses created by this user.
```sql
CREATE TYPE kyc_status AS ENUM ('none', 'pending', 'verified', 'failed');

CREATE TABLE user_kyc (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    aadhaar_status kyc_status NOT NULL DEFAULT 'none',
    aadhaar_last4 CHAR(4),                       -- NEVER store full 12-digit Aadhaar
    aadhaar_provider_ref VARCHAR(255),          -- DigiLocker / offline XML transaction ID
    pan_enc BYTEA,                              -- AES-256-GCM encrypted PAN
    pan_masked VARCHAR(20),                     -- Masked display (e.g., ABCDE****F)
    pan_status kyc_status NOT NULL DEFAULT 'none',
    registry_name VARCHAR(200),                 -- Full legal name returned by registry
    name_match_score NUMERIC(5,2),              -- Fuzzy match score between entered & registry name
    provider VARCHAR(50),                       -- Sandbox / Setu / IDfy
    consent_at TIMESTAMPTZ,                     -- DPDP consent timestamp
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `devices`
Tracks user devices for silent re-authentication, push notifications, and device revocation.
```sql
CREATE TYPE device_platform AS ENUM ('android', 'ios');

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform device_platform NOT NULL,
    device_id VARCHAR(255) NOT NULL,            -- Unique OS hardware/instance ID
    push_token VARCHAR(500),
    trusted_until TIMESTAMPTZ,                  -- Silent 30-day login bypass
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_device UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
```

---

### 3.2 Businesses & Verification

#### `categories`
Two-level hierarchical taxonomy for business classifications.
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    sort_order SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

#### `businesses`
Core business directory listings. Verification gates discovery in community/search.
```sql
CREATE TYPE business_status AS ENUM ('draft', 'pending_verification', 'live', 'under_review', 'suspended', 'removed');
CREATE TYPE listing_visibility AS ENUM ('unlisted', 'listed');
CREATE TYPE verification_type AS ENUM ('pending', 'gst', 'pan', 'tan', 'manual', 'failed');

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,          -- Used in https://cardflow.app/b/{slug}
    description TEXT,
    primary_category_id UUID NOT NULL REFERENCES categories(id),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    email VARCHAR(255),
    
    -- Address & PostGIS Geography
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    locality VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(10) DEFAULT 'IN',
    location GEOGRAPHY(Point, 4326) NOT NULL,   -- Longitude/Latitude PostGIS point
    service_area_km SMALLINT,                   -- For mobile service providers
    
    -- Operating details
    hours JSONB,                                -- Operating schedule by weekday
    year_established SMALLINT,
    
    -- Legal Identity & Verification
    gstin CHAR(15),                             -- 15-character GSTIN (Global Unique per active biz)
    pan VARCHAR(20),                            -- Company/Proprietor PAN
    tan VARCHAR(20),                            -- TAN
    legal_name VARCHAR(255),
    trade_name VARCHAR(255),
    
    status business_status NOT NULL DEFAULT 'draft',
    verification verification_type NOT NULL DEFAULT 'pending',
    listing listing_visibility NOT NULL DEFAULT 'unlisted', -- Gated by verification
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    completeness SMALLINT NOT NULL DEFAULT 0,  -- 0-100% score for ranking boost
    
    -- Full Text Search
    search_tsv TSVECTOR,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Partial unique constraint on GSTIN (only for active businesses)
CREATE UNIQUE INDEX uq_businesses_gstin ON businesses(gstin) WHERE gstin IS NOT NULL AND status != 'removed';
CREATE UNIQUE INDEX uq_businesses_tan ON businesses(tan) WHERE tan IS NOT NULL AND status != 'removed';

-- Spatial & Search Indexes
CREATE INDEX idx_businesses_location ON businesses USING GIST (location) WHERE status = 'live' AND listing = 'listed';
CREATE INDEX idx_businesses_search_tsv ON businesses USING GIN (search_tsv);
CREATE INDEX idx_businesses_name_trgm ON businesses USING GIN (name gin_trgm_ops);
CREATE INDEX idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX idx_businesses_community ON businesses(pincode, primary_category_id, listing, status);
```

#### `business_categories`
Secondary categories (up to 2 secondary per business).
```sql
CREATE TABLE business_categories (
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (business_id, category_id)
);
```

#### `business_services`
Chips representing specific services or products offered.
```sql
CREATE TABLE business_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biz_services_biz ON business_services(business_id);
```

#### `business_phones`
Public contact numbers for the business with WhatsApp labels.
```sql
CREATE TABLE business_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    label VARCHAR(50) DEFAULT 'Main',
    is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biz_phones_biz ON business_phones(business_id);
```

#### `business_media`
Logos and storefront/product photos.
```sql
CREATE TYPE media_kind AS ENUM ('logo', 'photo');

CREATE TABLE business_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    kind media_kind NOT NULL,
    url VARCHAR(500) NOT NULL,
    object_key VARCHAR(255) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biz_media_biz ON business_media(business_id);
```

#### `business_verifications`
KYC verification logs for business entities.
```sql
CREATE TABLE business_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,                -- 'gstin', 'pan', 'tan', 'manual_doc'
    id_value_enc BYTEA NOT NULL,                -- Encrypted input identifier
    registry_payload JSONB,                     -- Complete snapshot returned by registry
    status kyc_status NOT NULL DEFAULT 'pending',
    name_match_score NUMERIC(5,2),
    provider VARCHAR(50) NOT NULL,
    reviewed_by_admin UUID REFERENCES users(id),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX idx_biz_verif_biz ON business_verifications(business_id);
```

#### `digital_cards`
Digital card templates and visual properties.
```sql
CREATE TABLE digital_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    template VARCHAR(50) NOT NULL DEFAULT 'clean', -- 'clean', 'bold', 'classic'
    brand_color VARCHAR(10) NOT NULL DEFAULT '#1E40AF',
    qr_slug VARCHAR(100) NOT NULL UNIQUE,
    rendered_image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.3 Card Vault & Scanner

#### `saved_cards`
Digital card vault entries.
```sql
CREATE TYPE contact_type AS ENUM ('business', 'personal');
CREATE TYPE extract_status AS ENUM ('image_only', 'extracted');

CREATE TABLE saved_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_name VARCHAR(150),
    designation VARCHAR(150),
    company VARCHAR(200),
    website VARCHAR(255),
    notes TEXT,
    met_context TEXT,                           -- "Where we met" notes
    private_rating SMALLINT CHECK (private_rating BETWEEN 1 AND 5),
    contact_type contact_type NOT NULL DEFAULT 'business',
    linked_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    extract_status extract_status NOT NULL DEFAULT 'image_only',
    
    -- Forward compatibility for v2.0
    audio_note_url VARCHAR(500),
    event_tag VARCHAR(100),
    local_vector_id VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_saved_cards_user ON saved_cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_saved_cards_company ON saved_cards(company);
```

#### `saved_card_images`
Permanent storage of raw front/back card images.
```sql
CREATE TYPE card_side AS ENUM ('front', 'back', 'other');

CREATE TABLE saved_card_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    side card_side NOT NULL DEFAULT 'front',
    object_key VARCHAR(255) NOT NULL,           -- S3 object key
    width INT,
    height INT,
    bytes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_images_card ON saved_card_images(saved_card_id);
```

#### `saved_card_phones`
Multiple extracted phone numbers per card.
```sql
CREATE TABLE saved_card_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    raw_phone VARCHAR(50) NOT NULL,
    phone_e164 VARCHAR(20),
    phone_type VARCHAR(30) DEFAULT 'work',      -- 'mobile', 'work', 'landline'
    usage VARCHAR(30) DEFAULT 'official',       -- 'official', 'personal'
    is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_source VARCHAR(30),                -- 'icon_detected', 'user_confirmed'
    whatsapp_confirmed_at TIMESTAMPTZ,
    confidence NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_phones_card ON saved_card_phones(saved_card_id);
CREATE INDEX idx_card_phones_e164 ON saved_card_phones(phone_e164);
```

#### `saved_card_emails`
Multiple extracted email addresses per card.
```sql
CREATE TABLE saved_card_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    usage VARCHAR(30) DEFAULT 'work',
    confidence NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_emails_card ON saved_card_emails(saved_card_id);
```

#### `saved_card_addresses`
Raw address strings and premium structured address fields.
```sql
CREATE TYPE parse_status AS ENUM ('raw_only', 'structured');

CREATE TABLE saved_card_addresses (
    saved_card_id UUID PRIMARY KEY REFERENCES saved_cards(id) ON DELETE CASCADE,
    raw_address TEXT,
    structured JSONB,                           -- { line1, line2, city, state, pin, country }
    parse_status parse_status NOT NULL DEFAULT 'raw_only',
    credits_spent SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `tags` & `saved_card_tags`
Tag taxonomy and card tagging.
```sql
CREATE TYPE tag_kind AS ENUM ('relationship', 'community', 'custom');

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system tags
    name VARCHAR(50) NOT NULL,
    kind tag_kind NOT NULL DEFAULT 'custom',
    color VARCHAR(10) DEFAULT '#4B5563',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tag UNIQUE (user_id, name)
);

CREATE TABLE saved_card_tags (
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    detail_value VARCHAR(100),                  -- e.g., "BNI Dynamic Chapter"
    PRIMARY KEY (saved_card_id, tag_id)
);
```

#### `scan_records`
Extraction audit trail and deduplication hash.
```sql
CREATE TABLE scan_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    saved_card_id UUID REFERENCES saved_cards(id) ON DELETE SET NULL,
    image_hash VARCHAR(64) NOT NULL,            -- SHA-256 of processed image
    model_id VARCHAR(50) NOT NULL,              -- e.g., 'gemini-3.0-flash-lite'
    prompt_version VARCHAR(20) NOT NULL,
    raw_response JSONB NOT NULL,
    confidences JSONB,
    scan_kind VARCHAR(30) NOT NULL,             -- 'standard', 'premium_address'
    credits_charged SMALLINT NOT NULL DEFAULT 0,
    refund_status VARCHAR(20) DEFAULT 'none',   -- 'none', 'refunded'
    latency_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_records_hash ON scan_records(image_hash);
CREATE INDEX idx_scan_records_user ON scan_records(user_id);
```

---

### 3.4 Interactions, Favorites & Enquiries

#### `favorites`
User bookmarks for businesses and saved cards.
```sql
CREATE TYPE favorite_kind AS ENUM ('business', 'saved_card');

CREATE TABLE favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind favorite_kind NOT NULL,
    ref_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, kind, ref_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
```

#### `enquiries`
Structured lead messages from users to business owners.
```sql
CREATE TYPE enquiry_status AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(500) NOT NULL,
    share_phone BOOLEAN NOT NULL DEFAULT FALSE,
    user_phone VARCHAR(20),                     -- Included if share_phone is TRUE
    status enquiry_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX idx_enquiries_biz ON enquiries(business_id, status);
CREATE INDEX idx_enquiries_user ON enquiries(user_id);
```

---

### 3.5 Billing, Subscriptions & Credit Ledger

#### `subscriptions`
Account-level IAP subscriptions (Play Billing & Apple In-App Purchase).
```sql
CREATE TYPE store_kind AS ENUM ('play', 'appstore');
CREATE TYPE subscription_status AS ENUM ('active', 'in_grace_period', 'past_due', 'canceled', 'expired');

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store store_kind NOT NULL,
    product_id VARCHAR(100) NOT NULL,           -- e.g., 'cardflow_plus_monthly'
    status subscription_status NOT NULL DEFAULT 'active',
    original_txn_id VARCHAR(255) NOT NULL UNIQUE,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    grace_period_end TIMESTAMPTZ,               -- 15-day downgrade grace
    is_auto_renewing BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
```

#### `credit_ledger`
Immutable ledger tracking all contact credit adjustments.
```sql
CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INT NOT NULL,                         -- Positive (grant/purchase) or negative (spent)
    reason VARCHAR(100) NOT NULL,               -- 'signup_bonus', 'pack_purchase', 'scan_spend', 'refund'
    ref_id UUID,                                -- Reference to scan_records or purchases
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);
```

#### `purchases`
Consumable IAP transaction records.
```sql
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store store_kind NOT NULL,
    sku VARCHAR(100) NOT NULL,                  -- 'pack_499', 'pack_1999', 'pack_2499'
    credits_granted INT NOT NULL,
    store_txn_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON purchases(user_id);
```

---

### 3.6 Moderation, Reports & Audit Logs

#### `reports`
User reports on inappropriate content or spam.
```sql
CREATE TYPE report_target AS ENUM ('business', 'photo', 'enquiry', 'saved_card');
CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    target_kind report_target NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status report_status NOT NULL DEFAULT 'pending',
    handled_by_admin UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON reports(status);
```

#### `audit_logs`
Immutable log of all administrative actions performed inside the mobile app.
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,               -- 'kyc_approve', 'biz_suspend', 'credit_grant'
    target_type VARCHAR(50) NOT NULL,           -- 'business', 'user', 'verification'
    target_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    notes TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

#### `analytics_events` (Partitioned by Month)
Clickstream and business lead tracking events.
```sql
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID,
    business_id UUID,
    event_name VARCHAR(100) NOT NULL,           -- 'call_click', 'whatsapp_click', 'direction_click', 'view'
    props JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partition creation helper for initial launch
CREATE TABLE analytics_events_2026_09 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE analytics_events_2026_10 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE INDEX idx_analytics_biz ON analytics_events(business_id, event_name, created_at);
```

---

## 4. Trigger for Full-Text Search Updating

```sql
CREATE OR REPLACE FUNCTION update_business_search_tsv() RETURNS trigger AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.trade_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.locality, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.city, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_search_tsv
    BEFORE INSERT OR UPDATE OF name, trade_name, locality, city, description
    ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_business_search_tsv();
```
