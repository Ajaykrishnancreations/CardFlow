-- Premium subscription state for gating free-tier limits (business count, card
-- count, template/theme unlocks). No payment gateway is wired yet — activation
-- happens through a preview endpoint until real IAP/payment verification lands.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan_id VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
