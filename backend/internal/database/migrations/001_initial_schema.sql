-- ==============================================================================
-- 001_initial_schema.sql: Core CardFlow Database Schema
-- PostgreSQL 16+ with PostGIS, pg_trgm, uuid-ossp, btree_gist
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending_profile', 'active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('free', 'plus', 'premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('none', 'pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE device_platform AS ENUM ('android', 'ios', 'web');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE business_status AS ENUM ('draft', 'pending_verification', 'live', 'under_review', 'suspended', 'removed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE listing_visibility AS ENUM ('unlisted', 'listed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_type AS ENUM ('pending', 'gst', 'pan', 'tan', 'manual', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE media_kind AS ENUM ('logo', 'photo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE contact_type AS ENUM ('business', 'personal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE extract_status AS ENUM ('image_only', 'extracted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE card_side AS ENUM ('front', 'back', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE parse_status AS ENUM ('raw_only', 'structured');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tag_kind AS ENUM ('relationship', 'community', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE favorite_kind AS ENUM ('business', 'saved_card');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE enquiry_status AS ENUM ('new', 'viewed', 'responded', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store_kind AS ENUM ('play', 'appstore');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'in_grace_period', 'past_due', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_target AS ENUM ('business', 'photo', 'enquiry', 'saved_card');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    email VARCHAR(255),
    photo_url VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(10) DEFAULT 'IN',
    role user_role NOT NULL DEFAULT 'user',
    plan subscription_plan NOT NULL DEFAULT 'free',
    free_scans_remaining SMALLINT NOT NULL DEFAULT 30,
    free_scans_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    status user_status NOT NULL DEFAULT 'pending_profile',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- 2. User KYC
CREATE TABLE IF NOT EXISTS user_kyc (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    aadhaar_status kyc_status NOT NULL DEFAULT 'none',
    aadhaar_last4 CHAR(4),
    aadhaar_provider_ref VARCHAR(255),
    pan_enc BYTEA,
    pan_masked VARCHAR(20),
    pan_status kyc_status NOT NULL DEFAULT 'none',
    registry_name VARCHAR(200),
    name_match_score NUMERIC(5,2),
    provider VARCHAR(50),
    consent_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Devices
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform device_platform NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    push_token VARCHAR(500),
    trusted_until TIMESTAMPTZ,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_device UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- 4. Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    sort_order SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 5. Businesses (1..N businesses per owner)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT,
    primary_category_id UUID NOT NULL REFERENCES categories(id),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    email VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    locality VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(10) DEFAULT 'IN',
    location GEOGRAPHY(Point, 4326) NOT NULL,
    service_area_km SMALLINT DEFAULT 0,
    hours JSONB,
    year_established SMALLINT,
    gstin CHAR(15),
    pan VARCHAR(20),
    tan VARCHAR(20),
    legal_name VARCHAR(255),
    trade_name VARCHAR(255),
    status business_status NOT NULL DEFAULT 'draft',
    verification verification_type NOT NULL DEFAULT 'pending',
    listing listing_visibility NOT NULL DEFAULT 'unlisted',
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    completeness SMALLINT NOT NULL DEFAULT 0,
    search_tsv TSVECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_businesses_gstin ON businesses(gstin) WHERE gstin IS NOT NULL AND status != 'removed';
CREATE UNIQUE INDEX IF NOT EXISTS uq_businesses_tan ON businesses(tan) WHERE tan IS NOT NULL AND status != 'removed';
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST (location) WHERE status = 'live' AND listing = 'listed';
CREATE INDEX IF NOT EXISTS idx_businesses_search_tsv ON businesses USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm ON businesses USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_community ON businesses(pincode, primary_category_id, listing, status);

-- 6. Business Secondary Categories
CREATE TABLE IF NOT EXISTS business_categories (
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (business_id, category_id)
);

-- 7. Business Services
CREATE TABLE IF NOT EXISTS business_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biz_services_biz ON business_services(business_id);

-- 8. Business Phones
CREATE TABLE IF NOT EXISTS business_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    label VARCHAR(50) DEFAULT 'Main',
    is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biz_phones_biz ON business_phones(business_id);

-- 9. Business Media
CREATE TABLE IF NOT EXISTS business_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    kind media_kind NOT NULL,
    url VARCHAR(500) NOT NULL,
    object_key VARCHAR(255) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biz_media_biz ON business_media(business_id);

-- 10. Business Verifications (KYC audit trail)
CREATE TABLE IF NOT EXISTS business_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,
    id_value_enc BYTEA NOT NULL,
    registry_payload JSONB,
    status kyc_status NOT NULL DEFAULT 'pending',
    name_match_score NUMERIC(5,2),
    provider VARCHAR(50) NOT NULL,
    reviewed_by_admin UUID REFERENCES users(id),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_biz_verif_biz ON business_verifications(business_id);

-- 11. Digital Cards
CREATE TABLE IF NOT EXISTS digital_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    template VARCHAR(50) NOT NULL DEFAULT 'clean',
    brand_color VARCHAR(10) NOT NULL DEFAULT '#1E40AF',
    qr_slug VARCHAR(100) NOT NULL UNIQUE,
    rendered_image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Saved Cards (Card Vault)
CREATE TABLE IF NOT EXISTS saved_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_name VARCHAR(150),
    designation VARCHAR(150),
    company VARCHAR(200),
    website VARCHAR(255),
    notes TEXT,
    met_context TEXT,
    private_rating SMALLINT CHECK (private_rating BETWEEN 1 AND 5),
    contact_type contact_type NOT NULL DEFAULT 'business',
    linked_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    extract_status extract_status NOT NULL DEFAULT 'image_only',
    audio_note_url VARCHAR(500),
    event_tag VARCHAR(100),
    local_vector_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_cards_user ON saved_cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_cards_company ON saved_cards(company);

-- 13. Saved Card Images (Originals stored forever)
CREATE TABLE IF NOT EXISTS saved_card_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    side card_side NOT NULL DEFAULT 'front',
    object_key VARCHAR(255) NOT NULL,
    width INT,
    height INT,
    bytes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_images_card ON saved_card_images(saved_card_id);

-- 14. Saved Card Phones
CREATE TABLE IF NOT EXISTS saved_card_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    raw_phone VARCHAR(50) NOT NULL,
    phone_e164 VARCHAR(20),
    phone_type VARCHAR(30) DEFAULT 'work',
    usage VARCHAR(30) DEFAULT 'official',
    is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_source VARCHAR(30),
    whatsapp_confirmed_at TIMESTAMPTZ,
    confidence NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_phones_card ON saved_card_phones(saved_card_id);
CREATE INDEX IF NOT EXISTS idx_card_phones_e164 ON saved_card_phones(phone_e164);

-- 15. Saved Card Emails
CREATE TABLE IF NOT EXISTS saved_card_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    usage VARCHAR(30) DEFAULT 'work',
    confidence NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_emails_card ON saved_card_emails(saved_card_id);

-- 16. Saved Card Addresses
CREATE TABLE IF NOT EXISTS saved_card_addresses (
    saved_card_id UUID PRIMARY KEY REFERENCES saved_cards(id) ON DELETE CASCADE,
    raw_address TEXT,
    structured JSONB,
    parse_status parse_status NOT NULL DEFAULT 'raw_only',
    credits_spent SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    kind tag_kind NOT NULL DEFAULT 'custom',
    color VARCHAR(10) DEFAULT '#4B5563',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tag UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS saved_card_tags (
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    detail_value VARCHAR(100),
    PRIMARY KEY (saved_card_id, tag_id)
);

-- 18. Scan Records (Dedupe hash + AI cost audit)
CREATE TABLE IF NOT EXISTS scan_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    saved_card_id UUID REFERENCES saved_cards(id) ON DELETE SET NULL,
    image_hash VARCHAR(64) NOT NULL,
    model_id VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(20) NOT NULL,
    raw_response JSONB NOT NULL,
    confidences JSONB,
    scan_kind VARCHAR(30) NOT NULL,
    credits_charged SMALLINT NOT NULL DEFAULT 0,
    refund_status VARCHAR(20) DEFAULT 'none',
    latency_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_records_hash ON scan_records(image_hash);
CREATE INDEX IF NOT EXISTS idx_scan_records_user ON scan_records(user_id);

-- 19. Favorites
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind favorite_kind NOT NULL,
    ref_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- 20. Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(500) NOT NULL,
    share_phone BOOLEAN NOT NULL DEFAULT FALSE,
    user_phone VARCHAR(20),
    status enquiry_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enquiries_biz ON enquiries(business_id, status);
CREATE INDEX IF NOT EXISTS idx_enquiries_user ON enquiries(user_id);

-- 21. Subscriptions (Account level)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store store_kind NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    original_txn_id VARCHAR(255) NOT NULL UNIQUE,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    grace_period_end TIMESTAMPTZ,
    is_auto_renewing BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- 22. Credit Ledger
CREATE TABLE IF NOT EXISTS credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    ref_id UUID,
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);

-- 23. Purchases (Consumables)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store store_kind NOT NULL,
    sku VARCHAR(100) NOT NULL,
    credits_granted INT NOT NULL,
    store_txn_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);

-- 24. Reports
CREATE TABLE IF NOT EXISTS reports (
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

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 25. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    notes TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 26. Analytics Events (Lead clickstream)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID,
    business_id UUID,
    event_name VARCHAR(100) NOT NULL,
    props JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_biz ON analytics_events(business_id, event_name, created_at);

-- Trigger for Search TSVector
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

DROP TRIGGER IF EXISTS trg_businesses_search_tsv ON businesses;
CREATE TRIGGER trg_businesses_search_tsv
    BEFORE INSERT OR UPDATE OF name, trade_name, locality, city, description
    ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_business_search_tsv();
