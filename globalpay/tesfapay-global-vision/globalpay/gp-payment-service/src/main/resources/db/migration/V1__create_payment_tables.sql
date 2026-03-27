-- V1__create_payment_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Billers ──────────────────────────────────────────────────────
CREATE TABLE billers (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(200) NOT NULL,
    category                VARCHAR(30)  NOT NULL,  -- TELECOM|UTILITY|WATER|TV|EDUCATION
    icon                    VARCHAR(10),
    description             VARCHAR(500),
    is_popular              BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_account_number BOOLEAN      NOT NULL DEFAULT TRUE,
    fields                  JSONB,
    api_endpoint            VARCHAR(500),
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Telecom Operators ───────────────────────────────────────────
CREATE TABLE telecom_operators (
    id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(100) NOT NULL,
    icon      VARCHAR(10),
    is_active BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ─── Airtime Bundles ─────────────────────────────────────────────
CREATE TABLE airtime_bundles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID         NOT NULL REFERENCES telecom_operators(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    price       DECIMAL(18,2) NOT NULL,
    validity    VARCHAR(30)  NOT NULL,
    type        VARCHAR(10)  NOT NULL,  -- DATA | AIRTIME
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ─── Merchants ───────────────────────────────────────────────────
CREATE TABLE merchants (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    icon        VARCHAR(10),
    address     TEXT,
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    qr_payload  VARCHAR(255),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Payment Transactions ────────────────────────────────────────
CREATE TABLE payment_transactions (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference        VARCHAR(30)  NOT NULL UNIQUE,
    type             VARCHAR(20)  NOT NULL,  -- BILL|AIRTIME|MERCHANT
    user_id          UUID         NOT NULL,
    wallet_id        VARCHAR(30),
    biller_id        UUID         REFERENCES billers(id),
    operator_id      UUID         REFERENCES telecom_operators(id),
    bundle_id        UUID         REFERENCES airtime_bundles(id),
    merchant_id      UUID         REFERENCES merchants(id),
    account_number   VARCHAR(100),
    recipient_phone  VARCHAR(20),
    amount           DECIMAL(18,2) NOT NULL,
    fee              DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    loyalty_points_earned INT NOT NULL DEFAULT 0,
    balance_after    DECIMAL(18,2),
    idempotency_key  VARCHAR(64)  UNIQUE,
    metadata         JSONB,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- ─── Seed Data ───────────────────────────────────────────────────
INSERT INTO billers (name, category, icon, description, is_popular, requires_account_number) VALUES
    ('Ethio Telecom',              'TELECOM',   '📱', 'Mobile Airtime & Data',        TRUE,  TRUE),
    ('Ethiopian Electric Utility', 'UTILITY',   '⚡', 'Electricity bill payment',     TRUE,  TRUE),
    ('Addis Ababa Water',          'WATER',     '💧', 'Water & sewerage',             FALSE, TRUE),
    ('EthioSat TV',                'TV',        '📺', 'Satellite TV subscription',    FALSE, TRUE),
    ('EOTC School Fees',           'EDUCATION', '🎓', 'School & university fees',     FALSE, TRUE),
    ('Internet (ETC)',             'TELECOM',   '🌐', 'Fixed broadband internet',     FALSE, TRUE),
    ('Addis Gas',                  'UTILITY',   '🔥', 'LPG gas payment',              FALSE, TRUE),
    ('Nib Insurance',              'UTILITY',   '🛡️', 'Insurance premium payment',   FALSE, TRUE);

INSERT INTO telecom_operators (id, name, icon) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ethio Telecom', '📱'),
    ('22222222-2222-2222-2222-222222222222', 'Safaricom ET',  '🟢');

INSERT INTO airtime_bundles (operator_id, name, price, validity, type, sort_order) VALUES
    ('11111111-1111-1111-1111-111111111111', '50 MB Data',    5.00,  '1 day',     'DATA',    1),
    ('11111111-1111-1111-1111-111111111111', '1 GB Data',     25.00, '7 days',    'DATA',    2),
    ('11111111-1111-1111-1111-111111111111', '5 GB Data',     85.00, '30 days',   'DATA',    3),
    ('11111111-1111-1111-1111-111111111111', 'ETB 10 Airtime',10.00, 'No expiry', 'AIRTIME', 4),
    ('11111111-1111-1111-1111-111111111111', 'ETB 50 Airtime',50.00, 'No expiry', 'AIRTIME', 5),
    ('11111111-1111-1111-1111-111111111111', 'ETB 100 Airtime',100.00,'No expiry','AIRTIME', 6),
    ('22222222-2222-2222-2222-222222222222', '200 MB Data',   10.00, '3 days',    'DATA',    1),
    ('22222222-2222-2222-2222-222222222222', '2 GB Data',     45.00, '30 days',   'DATA',    2),
    ('22222222-2222-2222-2222-222222222222', 'ETB 20 Airtime',20.00, 'No expiry', 'AIRTIME', 3);

-- ─── Indexes ──────────────────────────────────────────────────────
CREATE INDEX idx_billers_category    ON billers(category);
CREATE INDEX idx_bundles_operator    ON airtime_bundles(operator_id);
CREATE INDEX idx_merchants_mid       ON merchants(merchant_id);
CREATE INDEX idx_merchants_category  ON merchants(category);
CREATE INDEX idx_pay_txn_user        ON payment_transactions(user_id);
CREATE INDEX idx_pay_txn_ref         ON payment_transactions(reference);
CREATE INDEX idx_pay_txn_created     ON payment_transactions(created_at DESC);
