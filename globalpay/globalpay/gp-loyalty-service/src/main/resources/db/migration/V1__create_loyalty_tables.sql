-- V1__create_loyalty_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE loyalty_accounts (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID    NOT NULL UNIQUE,
    points     INT     NOT NULL DEFAULT 0 CHECK (points >= 0),
    tier       VARCHAR(10) NOT NULL DEFAULT 'BRONZE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_history (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID    NOT NULL,
    transaction_id UUID,
    label          VARCHAR(200) NOT NULL,
    points         INT     NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE redemption_catalog (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL,
    icon         VARCHAR(10),
    points_cost  INT     NOT NULL,
    reward_type  VARCHAR(30) NOT NULL,
    reward_value DECIMAL(18,2),
    min_tier     VARCHAR(10),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE redemptions (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID    NOT NULL,
    catalog_item_id UUID    NOT NULL REFERENCES redemption_catalog(id),
    points_spent    INT     NOT NULL,
    reward_name     VARCHAR(100) NOT NULL,
    cashback_amount DECIMAL(18,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed catalog
INSERT INTO redemption_catalog (name, icon, points_cost, reward_type, reward_value, min_tier) VALUES
    ('ETB 10 Cashback',   '💵', 200,  'CASHBACK',         10.00, NULL),
    ('1 GB Data Bundle',  '📱', 500,  'DATA_BUNDLE',      NULL,  NULL),
    ('ETB 50 Cashback',   '💰', 1000, 'CASHBACK',         50.00, NULL),
    ('Free Bill Payment', '📄', 800,  'FREE_BILL',        NULL,  NULL),
    ('0% Loan Discount',  '🏦', 2000, 'LOAN_DISCOUNT',    NULL,  'GOLD'),
    ('Priority Support',  '⭐', 3000, 'PRIORITY_SUPPORT', NULL,  'PLATINUM');

CREATE INDEX idx_loyalty_user     ON loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_hist     ON loyalty_history(user_id);
CREATE INDEX idx_loyalty_created  ON loyalty_history(created_at DESC);
CREATE INDEX idx_redemptions_user ON redemptions(user_id);
