-- 011: Link a saved card to an existing registered business when its GSTIN
-- matches, so scanning/saving the same business twice (by different users,
-- or the owner and a contact) shares one business record and one set of
-- card images instead of duplicating them.
ALTER TABLE saved_cards
  ADD COLUMN IF NOT EXISTS linked_business_id UUID REFERENCES businesses(id);

CREATE INDEX IF NOT EXISTS idx_saved_cards_linked_business_id ON saved_cards(linked_business_id) WHERE linked_business_id IS NOT NULL;

COMMENT ON COLUMN saved_cards.linked_business_id IS 'Set when this card''s GSTIN matched an existing business — shares that business''s data/images instead of storing a duplicate.';
