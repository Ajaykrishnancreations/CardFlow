-- Full-snapshot backup of a user's phone contacts, so they can restore them
-- onto a new device later. Each backup replaces the previous one wholesale.
CREATE TABLE IF NOT EXISTS contact_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL DEFAULT '',
    phones JSONB NOT NULL DEFAULT '[]',
    emails JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_backups_user ON contact_backups(user_id);
