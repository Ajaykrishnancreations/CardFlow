-- Audit trail for real Razorpay payments backing subscription activation.
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL,
    amount_paise INTEGER NOT NULL,
    razorpay_order_id VARCHAR(64) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(64) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'created', -- created | paid | failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_user ON subscription_payments(user_id);
