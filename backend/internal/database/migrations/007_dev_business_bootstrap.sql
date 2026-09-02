-- Business owner tables for local dev (no PostGIS). Safe to re-run.

DO $$ BEGIN CREATE TYPE business_status AS ENUM ('draft', 'pending_verification', 'live', 'under_review', 'suspended', 'removed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE listing_visibility AS ENUM ('unlisted', 'listed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_type AS ENUM ('pending', 'gst', 'pan', 'tan', 'manual', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

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

INSERT INTO categories (id, name, slug, sort_order)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Manufacturing', 'manufacturing', 1),
    ('c0000000-0000-0000-0000-000000000002', 'IT & Software', 'it-software', 2),
    ('c0000000-0000-0000-0000-000000000003', 'Textiles & Garments', 'textiles-garments', 3),
    ('c0000000-0000-0000-0000-000000000004', 'Hardware & Tools', 'hardware-tools', 4)
ON CONFLICT (slug) DO NOTHING;

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
    latitude DOUBLE PRECISION NOT NULL DEFAULT 11.0168,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 76.9558,
    service_area_km SMALLINT DEFAULT 0,
    year_established SMALLINT,
    gstin CHAR(15),
    status business_status NOT NULL DEFAULT 'draft',
    verification verification_type NOT NULL DEFAULT 'pending',
    listing listing_visibility NOT NULL DEFAULT 'unlisted',
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    completeness SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);

CREATE TABLE IF NOT EXISTS business_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    label VARCHAR(50) DEFAULT 'Main',
    is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    template VARCHAR(50) NOT NULL DEFAULT 'clean',
    brand_color VARCHAR(10) NOT NULL DEFAULT '#32145F',
    qr_slug VARCHAR(100) NOT NULL UNIQUE,
    rendered_image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_card_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL DEFAULT 'front',
    image_data BYTEA,
    content_type VARCHAR(80) DEFAULT 'image/jpeg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, side)
);
