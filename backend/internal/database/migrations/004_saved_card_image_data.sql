-- 004: Persist original card image bytes in PostgreSQL (survives Render restarts without S3)
ALTER TABLE saved_card_images
  ADD COLUMN IF NOT EXISTS image_data BYTEA,
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'image/jpeg';

CREATE INDEX IF NOT EXISTS idx_card_images_has_data
  ON saved_card_images(saved_card_id)
  WHERE image_data IS NOT NULL;
