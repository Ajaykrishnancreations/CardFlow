-- Minimal bootstrap when full schema (PostGIS) is unavailable.
-- Covers auth users + saved card vault only — enough for local card persistence.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('pending_profile', 'active', 'suspended', 'deleted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE subscription_plan AS ENUM ('free', 'plus', 'premium'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE contact_type AS ENUM ('business', 'personal'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE extract_status AS ENUM ('image_only', 'extracted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE card_side AS ENUM ('front', 'back', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE parse_status AS ENUM ('raw_only', 'structured'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tag_kind AS ENUM ('relationship', 'community', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;

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
    extract_status extract_status NOT NULL DEFAULT 'extracted',
    gstin CHAR(15),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    source VARCHAR(30) DEFAULT 'SCANNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_cards_user ON saved_cards(user_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS saved_card_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    side card_side NOT NULL DEFAULT 'front',
    object_key VARCHAR(255) NOT NULL DEFAULT '',
    width INT,
    height INT,
    bytes INT,
    image_data BYTEA,
    content_type VARCHAR(50) DEFAULT 'image/jpeg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_card_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    raw_phone VARCHAR(50) NOT NULL,
    phone_e164 VARCHAR(20),
    phone_type VARCHAR(30) DEFAULT 'work',
    is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_card_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_card_addresses (
    saved_card_id UUID PRIMARY KEY REFERENCES saved_cards(id) ON DELETE CASCADE,
    raw_address TEXT,
    parse_status parse_status NOT NULL DEFAULT 'raw_only',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    kind tag_kind NOT NULL DEFAULT 'custom',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tag UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS saved_card_tags (
    saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (saved_card_id, tag_id)
);
