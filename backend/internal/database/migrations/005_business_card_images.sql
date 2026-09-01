CREATE TABLE IF NOT EXISTS business_card_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  side VARCHAR(10) NOT NULL DEFAULT 'front',
  image_data BYTEA,
  content_type VARCHAR(80) DEFAULT 'image/jpeg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, side)
);
