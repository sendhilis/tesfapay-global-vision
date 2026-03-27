-- =============================================================================
-- GLOBALPAY / TESFAPAY — MASTER DATABASE SCHEMA
-- =============================================================================
-- Database:   PostgreSQL 15+
-- Currency:   All DECIMAL(18,2) columns in Ethiopian Birr (ETB)
-- IDs:        UUID v4 via gen_random_uuid()
-- Timestamps: TIMESTAMPTZ (UTC)
-- Strategy:   Database-per-service microservice pattern
-- =============================================================================
-- Run init-databases.sql first to create all 11 databases, then run
-- each section below in its corresponding database.
-- =============================================================================


-- =============================================================================
-- 1. auth_db  ──  gp-auth-service (port 8081)
-- =============================================================================
-- \connect auth_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE app_role AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- Core user authentication table
CREATE TABLE users (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phone               VARCHAR(20)  NOT NULL UNIQUE,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    pin_hash            VARCHAR(255) NOT NULL,          -- BCrypt 12 rounds
    wallet_id           VARCHAR(30)  NOT NULL UNIQUE,   -- e.g. TPY-2026-ABEBE001
    kyc_level           SMALLINT     NOT NULL DEFAULT 1,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING_KYC',
                        -- ACTIVE | PENDING_KYC | SUSPENDED | BLOCKED
    daily_limit         DECIMAL(18,2) NOT NULL DEFAULT 25000.00,
    monthly_limit       DECIMAL(18,2) NOT NULL DEFAULT 100000.00,
    failed_pin_attempts SMALLINT     NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    biometric_token     VARCHAR(255),
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Role-based access control
CREATE TABLE user_roles (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- JWT refresh token store
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(512) NOT NULL UNIQUE,   -- SHA-256 of raw token
    device_info VARCHAR(255),
    ip_address  INET,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- One-time passwords for phone verification and cash ops
CREATE TABLE otp_codes (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         REFERENCES users(id) ON DELETE CASCADE,
    phone        VARCHAR(20)  NOT NULL,
    code_hash    VARCHAR(255) NOT NULL,         -- BCrypt of 6-digit code
    purpose      VARCHAR(30)  NOT NULL,
                 -- REGISTRATION | LOGIN | CASH_IN | CASH_OUT | PIN_RESET
    attempts     SMALLINT     NOT NULL DEFAULT 0,
    max_attempts SMALLINT     NOT NULL DEFAULT 3,
    verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone         ON users(phone);
CREATE INDEX idx_users_wallet_id     ON users(wallet_id);
CREATE INDEX idx_users_status        ON users(status);
CREATE INDEX idx_user_roles_user     ON user_roles(user_id);
CREATE INDEX idx_refresh_user        ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_revoked     ON refresh_tokens(revoked);
CREATE INDEX idx_otp_phone_purpose   ON otp_codes(phone, purpose);
CREATE INDEX idx_otp_expires         ON otp_codes(expires_at);


-- =============================================================================
-- 2. user_db  ──  gp-user-service (port 8082)
-- =============================================================================
-- \connect user_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extended user profile (synced from auth_db via events)
CREATE TABLE user_profiles (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL UNIQUE,   -- FK to auth_db.users
    phone                 VARCHAR(20)  NOT NULL UNIQUE,
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    wallet_id             VARCHAR(30)  NOT NULL UNIQUE,
    kyc_level             SMALLINT     NOT NULL DEFAULT 1,
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    loyalty_tier          VARCHAR(10)  NOT NULL DEFAULT 'BRONZE',
    loyalty_points        INT          NOT NULL DEFAULT 0,
    avatar_url            TEXT,
    notifications_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
    daily_limit           DECIMAL(18,2) NOT NULL DEFAULT 25000.00,
    monthly_limit         DECIMAL(18,2) NOT NULL DEFAULT 100000.00,
    total_transactions    INT          NOT NULL DEFAULT 0,
    monthly_volume        DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- KYC document submissions and review workflow
CREATE TABLE kyc_applications (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    document_type         VARCHAR(20)  NOT NULL,
                          -- FAYDA_ID | PASSPORT | DRIVING_LICENSE | KEBELE_ID
    document_front_url    TEXT         NOT NULL,   -- MinIO/S3 URL
    document_back_url     TEXT,
    selfie_url            TEXT         NOT NULL,
    liveness_token        VARCHAR(255),
    ai_verification_score INT,                     -- 0–100, auto-scored
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                          -- PENDING | PROCESSING | APPROVED | REJECTED
    reviewer_admin_id     UUID,
    review_note           TEXT,
    submitted_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at           TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_phone  ON user_profiles(phone);
CREATE INDEX idx_user_profiles_wallet ON user_profiles(wallet_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_kyc_user             ON kyc_applications(user_id);
CREATE INDEX idx_kyc_status           ON kyc_applications(status);


-- =============================================================================
-- 3. wallet_db  ──  gp-wallet-service (port 8083)
-- =============================================================================
-- \connect wallet_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE txn_type AS ENUM (
    'P2P_SEND', 'P2P_RECEIVE', 'BILL_PAYMENT', 'AIRTIME', 'MERCHANT',
    'CASH_IN', 'CASH_OUT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL',
    'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'REWARD_REDEMPTION',
    'FLOAT_TOPUP', 'COMMISSION', 'REVERSAL'
);

CREATE TYPE txn_status AS ENUM (
    'PENDING', 'PENDING_AGENT', 'COMPLETED', 'FAILED', 'REVERSED', 'EXPIRED'
);

CREATE TYPE entry_type AS ENUM ('DEBIT', 'CREDIT');

-- One wallet per user — holds all balances
CREATE TABLE wallets (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL UNIQUE,
    wallet_id        VARCHAR(30)  NOT NULL UNIQUE,
    main_balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    savings_balance  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    loan_balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    currency         VARCHAR(3)   NOT NULL DEFAULT 'ETB',
    is_locked        BOOLEAN      NOT NULL DEFAULT FALSE,
    locked_reason    VARCHAR(255),
    last_activity    TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_main_balance    CHECK (main_balance >= 0),
    CONSTRAINT chk_savings_balance CHECK (savings_balance >= 0)
);

-- Central financial ledger — EVERY money movement lives here
CREATE TABLE transactions (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference            VARCHAR(30)  NOT NULL UNIQUE,   -- TXN20260101XXXXX
    type                 txn_type     NOT NULL,
    sender_user_id       UUID,
    recipient_user_id    UUID,
    sender_wallet_id     VARCHAR(30),
    recipient_wallet_id  VARCHAR(30),
    amount               DECIMAL(18,2) NOT NULL,
    fee                  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount         DECIMAL(18,2) NOT NULL,          -- amount + fee
    currency             VARCHAR(3)   NOT NULL DEFAULT 'ETB',
    status               txn_status   NOT NULL DEFAULT 'PENDING',
    counterparty_name    VARCHAR(200),
    note                 VARCHAR(500),
    loyalty_points_earned INT         NOT NULL DEFAULT 0,
    balance_after        DECIMAL(18,2),                   -- sender balance post-txn
    flagged              BOOLEAN      NOT NULL DEFAULT FALSE,
    flagged_reason       VARCHAR(500),
    agent_id             UUID,
    merchant_id          UUID,
    biller_id            UUID,
    reversal_of          UUID         REFERENCES transactions(id),
    idempotency_key      VARCHAR(64)  UNIQUE,             -- prevents duplicate processing
    metadata             JSONB,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at         TIMESTAMPTZ,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- Double-entry bookkeeping — every txn produces 2 ledger rows
CREATE TABLE ledger_entries (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID         NOT NULL REFERENCES transactions(id),
    wallet_id      VARCHAR(30)  NOT NULL,
    user_id        UUID         NOT NULL,
    entry_type     entry_type   NOT NULL,
    amount         DECIMAL(18,2) NOT NULL,
    balance_before DECIMAL(18,2) NOT NULL,
    balance_after  DECIMAL(18,2) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- P2P money requests (separate from transfers)
CREATE TABLE money_requests (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(30)  NOT NULL UNIQUE,
    requester_id    UUID         NOT NULL,
    target_user_id  UUID         NOT NULL,
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                    -- PENDING | ACCEPTED | DECLINED | EXPIRED
    transaction_id  UUID         REFERENCES transactions(id),
    expires_at      TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- Regulatory e-money trust account (single-row)
CREATE TABLE emoney_trust_account (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    total_issued          DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    trust_account_balance DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    reconciliation_status VARCHAR(20)  NOT NULL DEFAULT 'MATCHED',
    last_reconciled_at    TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
INSERT INTO emoney_trust_account (total_issued, trust_account_balance) VALUES (0, 0);

-- User saved contacts / favourites
CREATE TABLE contacts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID         NOT NULL,
    contact_user_id UUID,
    contact_name    VARCHAR(200) NOT NULL,
    contact_phone   VARCHAR(20)  NOT NULL,
    is_favorite     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, contact_phone)
);

-- Indexes (optimised for high-volume transaction queries)
CREATE INDEX idx_wallets_user_id    ON wallets(user_id);
CREATE INDEX idx_wallets_wallet_id  ON wallets(wallet_id);
CREATE INDEX idx_txn_sender         ON transactions(sender_user_id);
CREATE INDEX idx_txn_recipient      ON transactions(recipient_user_id);
CREATE INDEX idx_txn_reference      ON transactions(reference);
CREATE INDEX idx_txn_type           ON transactions(type);
CREATE INDEX idx_txn_status         ON transactions(status);
CREATE INDEX idx_txn_created        ON transactions(created_at DESC);
CREATE INDEX idx_txn_sender_created ON transactions(sender_user_id, created_at DESC);
CREATE INDEX idx_txn_flagged        ON transactions(flagged) WHERE flagged = TRUE;
CREATE INDEX idx_txn_idempotency    ON transactions(idempotency_key);
CREATE INDEX idx_ledger_txn         ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_wallet      ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_user        ON ledger_entries(user_id);
CREATE INDEX idx_money_req_req      ON money_requests(requester_id);
CREATE INDEX idx_money_req_target   ON money_requests(target_user_id);
CREATE INDEX idx_money_req_status   ON money_requests(status);
CREATE INDEX idx_contacts_owner     ON contacts(owner_user_id);


-- =============================================================================
-- 4. transfer_db  ──  gp-transfer-service (port 8084)
-- =============================================================================
-- \connect transfer_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- P2P transfer records (Saga orchestration state)
CREATE TABLE transfers (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference           VARCHAR(30)  NOT NULL UNIQUE,
    sender_user_id      UUID         NOT NULL,
    sender_wallet_id    VARCHAR(30)  NOT NULL,
    recipient_user_id   UUID,
    recipient_wallet_id VARCHAR(30),
    recipient_phone     VARCHAR(20)  NOT NULL,
    recipient_name      VARCHAR(200),
    amount              DECIMAL(18,2) NOT NULL,
    fee                 DECIMAL(18,2) NOT NULL DEFAULT 2.50,   -- flat ETB fee
    total_deducted      DECIMAL(18,2) NOT NULL,
    note                VARCHAR(500),
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                        -- PENDING | COMPLETED | FAILED
    wallet_txn_id       UUID,
    loyalty_points_earned INT        NOT NULL DEFAULT 0,
    balance_after       DECIMAL(18,2),
    idempotency_key     VARCHAR(64)  UNIQUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

-- Money requests initiated by a user
CREATE TABLE money_requests (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(30)  NOT NULL UNIQUE,
    requester_id    UUID         NOT NULL,
    requester_phone VARCHAR(20)  NOT NULL,
    requester_name  VARCHAR(200),
    target_phone    VARCHAR(20)  NOT NULL,
    target_user_id  UUID,
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    transfer_id     UUID         REFERENCES transfers(id),
    expires_at      TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- Contacts with GlobalPay membership flag
CREATE TABLE contacts (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id     UUID         NOT NULL,
    contact_user_id   UUID,
    contact_name      VARCHAR(200) NOT NULL,
    contact_phone     VARCHAR(20)  NOT NULL,
    is_favorite       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_globalpay_user BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, contact_phone)
);

CREATE INDEX idx_transfers_sender      ON transfers(sender_user_id);
CREATE INDEX idx_transfers_ref         ON transfers(reference);
CREATE INDEX idx_transfers_idempotency ON transfers(idempotency_key);
CREATE INDEX idx_transfers_created     ON transfers(created_at DESC);
CREATE INDEX idx_mreq_requester        ON money_requests(requester_id);
CREATE INDEX idx_mreq_target           ON money_requests(target_user_id);
CREATE INDEX idx_mreq_status           ON money_requests(status);
CREATE INDEX idx_mreq_expires          ON money_requests(expires_at);
CREATE INDEX idx_contacts_owner        ON contacts(owner_user_id);


-- =============================================================================
-- 5. payment_db  ──  gp-payment-service (port 8085)
-- =============================================================================
-- \connect payment_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bill payment providers
CREATE TABLE billers (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(200) NOT NULL,
    category                VARCHAR(30)  NOT NULL,
                            -- TELECOM | UTILITY | WATER | TV | EDUCATION
    icon                    VARCHAR(10),
    description             VARCHAR(500),
    is_popular              BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_account_number BOOLEAN      NOT NULL DEFAULT TRUE,
    fields                  JSONB,          -- dynamic form field definitions
    api_endpoint            VARCHAR(500),   -- biller integration URL
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Mobile network operators
CREATE TABLE telecom_operators (
    id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(100) NOT NULL,
    icon      VARCHAR(10),
    is_active BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Airtime and data bundles per operator
CREATE TABLE airtime_bundles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID         NOT NULL REFERENCES telecom_operators(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    price       DECIMAL(18,2) NOT NULL,
    validity    VARCHAR(30)  NOT NULL,   -- "1 day", "30 days", "No expiry"
    type        VARCHAR(10)  NOT NULL,   -- DATA | AIRTIME
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- QR-registered merchants
CREATE TABLE merchants (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(20)  NOT NULL UNIQUE,   -- MERCH-001
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
                -- RESTAURANT | GROCERY | SHOPPING | HEALTH | HOSPITALITY | TRANSPORT
    icon        VARCHAR(10),
    address     TEXT,
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    qr_payload  VARCHAR(255),   -- globalpay://pay?merchant=MERCH-001
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- All bill/airtime/merchant payment transactions
CREATE TABLE payment_transactions (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference        VARCHAR(30)  NOT NULL UNIQUE,
    type             VARCHAR(20)  NOT NULL,   -- BILL | AIRTIME | MERCHANT
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
    loyalty_points_earned INT     NOT NULL DEFAULT 0,
    balance_after    DECIMAL(18,2),
    idempotency_key  VARCHAR(64)  UNIQUE,
    metadata         JSONB,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- ── Seed Data ──────────────────────────────────────────────────────
INSERT INTO billers (name, category, icon, description, is_popular, requires_account_number) VALUES
    ('Ethio Telecom',              'TELECOM',   '📱', 'Mobile Airtime & Data',       TRUE,  TRUE),
    ('Ethiopian Electric Utility', 'UTILITY',   '⚡', 'Electricity bill payment',    TRUE,  TRUE),
    ('Addis Ababa Water',          'WATER',     '💧', 'Water & sewerage',            FALSE, TRUE),
    ('EthioSat TV',                'TV',        '📺', 'Satellite TV subscription',   FALSE, TRUE),
    ('EOTC School Fees',           'EDUCATION', '🎓', 'School & university fees',    FALSE, TRUE),
    ('Internet (ETC)',             'TELECOM',   '🌐', 'Fixed broadband internet',    FALSE, TRUE),
    ('Addis Gas',                  'UTILITY',   '🔥', 'LPG gas payment',             FALSE, TRUE),
    ('Nib Insurance',              'UTILITY',   '🛡️', 'Insurance premium payment',  FALSE, TRUE);

INSERT INTO telecom_operators (id, name, icon) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ethio Telecom', '📱'),
    ('22222222-2222-2222-2222-222222222222', 'Safaricom ET',  '🟢');

INSERT INTO airtime_bundles (operator_id, name, price, validity, type, sort_order) VALUES
    ('11111111-1111-1111-1111-111111111111', '50 MB Data',     5.00,  '1 day',     'DATA',    1),
    ('11111111-1111-1111-1111-111111111111', '1 GB Data',      25.00, '7 days',    'DATA',    2),
    ('11111111-1111-1111-1111-111111111111', '5 GB Data',      85.00, '30 days',   'DATA',    3),
    ('11111111-1111-1111-1111-111111111111', 'ETB 10 Airtime', 10.00, 'No expiry', 'AIRTIME', 4),
    ('11111111-1111-1111-1111-111111111111', 'ETB 50 Airtime', 50.00, 'No expiry', 'AIRTIME', 5),
    ('11111111-1111-1111-1111-111111111111', 'ETB 100 Airtime',100.00,'No expiry', 'AIRTIME', 6),
    ('22222222-2222-2222-2222-222222222222', '200 MB Data',    10.00, '3 days',    'DATA',    1),
    ('22222222-2222-2222-2222-222222222222', '2 GB Data',      45.00, '30 days',   'DATA',    2),
    ('22222222-2222-2222-2222-222222222222', 'ETB 20 Airtime', 20.00, 'No expiry', 'AIRTIME', 3);

CREATE INDEX idx_billers_category   ON billers(category);
CREATE INDEX idx_bundles_operator   ON airtime_bundles(operator_id);
CREATE INDEX idx_merchants_mid      ON merchants(merchant_id);
CREATE INDEX idx_merchants_category ON merchants(category);
CREATE INDEX idx_pay_txn_user       ON payment_transactions(user_id);
CREATE INDEX idx_pay_txn_ref        ON payment_transactions(reference);
CREATE INDEX idx_pay_txn_created    ON payment_transactions(created_at DESC);


-- =============================================================================
-- 6. savings_db  ──  gp-savings-service (port 8086)
-- =============================================================================
-- \connect savings_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Goal-based savings pots
CREATE TABLE savings_goals (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL,
    name          VARCHAR(100) NOT NULL,
    icon          VARCHAR(10),
    target_amount DECIMAL(18,2) NOT NULL,
    saved_amount  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    deadline      DATE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
                  -- ACTIVE | COMPLETED | CANCELLED
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_target CHECK (target_amount > 0),
    CONSTRAINT chk_saved  CHECK (saved_amount >= 0)
);

CREATE INDEX idx_savings_user   ON savings_goals(user_id);
CREATE INDEX idx_savings_status ON savings_goals(status);


-- =============================================================================
-- 7. loan_db  ──  gp-loan-service (port 8087)
-- =============================================================================
-- \connect loan_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Micro-loan records
CREATE TABLE loans (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL,
    reference           VARCHAR(30)  NOT NULL UNIQUE,
    principal_amount    DECIMAL(18,2) NOT NULL,
    interest_rate       DECIMAL(5,4)  NOT NULL,     -- e.g. 0.0500 = 5%
    total_repayment     DECIMAL(18,2) NOT NULL,
    monthly_payment     DECIMAL(18,2) NOT NULL,
    term_months         SMALLINT     NOT NULL,
    paid_installments   SMALLINT     NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(18,2) NOT NULL,
    purpose             VARCHAR(200),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
                        -- ACTIVE | OVERDUE | COMPLETED | DEFAULTED
    next_due_date       DATE         NOT NULL,
    disbursed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Individual repayment records per loan
CREATE TABLE loan_repayments (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         UUID         NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount          DECIMAL(18,2) NOT NULL,
    installment_num SMALLINT     NOT NULL,
    balance_after   DECIMAL(18,2) NOT NULL,
    due_date        DATE         NOT NULL,
    paid_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- AI credit scores for eligibility checks
CREATE TABLE credit_scores (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL UNIQUE,
    score       INT          NOT NULL CHECK (score BETWEEN 0 AND 100),
    label       VARCHAR(20)  NOT NULL,   -- Excellent | Good | Fair | Poor
    max_loan    DECIMAL(18,2) NOT NULL,
    factors     JSONB        NOT NULL,   -- [{label, score, weight}, ...]
    computed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_user    ON loans(user_id);
CREATE INDEX idx_loans_status  ON loans(status);
CREATE INDEX idx_loans_ref     ON loans(reference);
CREATE INDEX idx_loans_due     ON loans(next_due_date);
CREATE INDEX idx_loan_rep_loan ON loan_repayments(loan_id);
CREATE INDEX idx_credit_user   ON credit_scores(user_id);


-- =============================================================================
-- 8. loyalty_db  ──  gp-loyalty-service (port 8088)
-- =============================================================================
-- \connect loyalty_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Points balance and tier per user
CREATE TABLE loyalty_accounts (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL UNIQUE,
    points     INT          NOT NULL DEFAULT 0 CHECK (points >= 0),
    tier       VARCHAR(10)  NOT NULL DEFAULT 'BRONZE',
               -- BRONZE | SILVER | GOLD | PLATINUM
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Points earn/spend ledger
CREATE TABLE loyalty_history (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL,
    transaction_id UUID,
    label          VARCHAR(200) NOT NULL,
    points         INT          NOT NULL,   -- positive = earned, negative = spent
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Available rewards for redemption
CREATE TABLE redemption_catalog (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL,
    icon         VARCHAR(10),
    points_cost  INT          NOT NULL,
    reward_type  VARCHAR(30)  NOT NULL,
                 -- CASHBACK | DATA_BUNDLE | FREE_BILL | LOAN_DISCOUNT | PRIORITY_SUPPORT
    reward_value DECIMAL(18,2),   -- ETB value for CASHBACK
    min_tier     VARCHAR(10),     -- NULL = any tier; GOLD = Gold+ only
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- User redemption records
CREATE TABLE redemptions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    catalog_item_id UUID         NOT NULL REFERENCES redemption_catalog(id),
    points_spent    INT          NOT NULL,
    reward_name     VARCHAR(100) NOT NULL,
    cashback_amount DECIMAL(18,2),
    status          VARCHAR(20)  NOT NULL DEFAULT 'COMPLETED',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Seed Catalog ──────────────────────────────────────────────────
INSERT INTO redemption_catalog (name, icon, points_cost, reward_type, reward_value, min_tier) VALUES
    ('ETB 10 Cashback',   '💵', 200,  'CASHBACK',         10.00, NULL),
    ('1 GB Data Bundle',  '📱', 500,  'DATA_BUNDLE',      NULL,  NULL),
    ('ETB 50 Cashback',   '💰', 1000, 'CASHBACK',         50.00, NULL),
    ('Free Bill Payment', '📄', 800,  'FREE_BILL',        NULL,  NULL),
    ('0% Loan Discount',  '🏦', 2000, 'LOAN_DISCOUNT',    NULL,  'GOLD'),
    ('Priority Support',  '⭐', 3000, 'PRIORITY_SUPPORT', NULL,  'PLATINUM');

CREATE INDEX idx_loyalty_user    ON loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_hist    ON loyalty_history(user_id);
CREATE INDEX idx_loyalty_created ON loyalty_history(created_at DESC);
CREATE INDEX idx_redemp_user     ON redemptions(user_id);


-- =============================================================================
-- 9. agent_db  ──  gp-agent-service (port 8089)
-- =============================================================================
-- \connect agent_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE agent_type       AS ENUM ('AGENT', 'SUPER_AGENT', 'MERCHANT');
CREATE TYPE agent_status     AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE float_entry_type AS ENUM ('TOPUP', 'DEBIT', 'CREDIT', 'ADJUSTMENT');

-- Registered agents and super-agents
CREATE TABLE agents (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID         NOT NULL UNIQUE,
    code               VARCHAR(20)  NOT NULL UNIQUE,   -- AGT-001
    type               agent_type   NOT NULL DEFAULT 'AGENT',
    business_name      VARCHAR(200),
    region             VARCHAR(100),
    address            TEXT,
    latitude           DECIMAL(10,7),
    longitude          DECIMAL(10,7),
    float_balance      DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    float_limit        DECIMAL(18,2) NOT NULL DEFAULT 50000.00,
    commission_rate    DECIMAL(5,4)  NOT NULL DEFAULT 0.0030,  -- 0.3%
    min_commission     DECIMAL(18,2) NOT NULL DEFAULT 2.00,    -- ETB 2 minimum
    rating             DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    total_transactions INT          NOT NULL DEFAULT 0,
    monthly_volume     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    monthly_commission DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status             agent_status NOT NULL DEFAULT 'ACTIVE',
    super_agent_id     UUID         REFERENCES agents(id),    -- hierarchy
    is_open            BOOLEAN      NOT NULL DEFAULT TRUE,
    registered_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_float_balance CHECK (float_balance >= 0),
    CONSTRAINT chk_rating        CHECK (rating BETWEEN 0 AND 5)
);

-- Float balance change history
CREATE TABLE agent_float_history (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id      UUID         NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    type          float_entry_type NOT NULL,
    amount        DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    source        VARCHAR(100),
    reason        VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Float top-up requests to super-agents
CREATE TABLE agent_float_requests (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id       UUID         NOT NULL REFERENCES agents(id),
    super_agent_id UUID         NOT NULL REFERENCES agents(id),
    amount         DECIMAL(18,2) NOT NULL,
    note           VARCHAR(500),
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    responded_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Per-transaction commission records
CREATE TABLE agent_commissions (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id           UUID         NOT NULL REFERENCES agents(id),
    transaction_ref    VARCHAR(30)  NOT NULL,
    type               VARCHAR(20)  NOT NULL,   -- CASH_IN | CASH_OUT
    transaction_amount DECIMAL(18,2) NOT NULL,
    commission_amount  DECIMAL(18,2) NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Cash-in and cash-out operation records
CREATE TABLE agent_transactions (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference        VARCHAR(30)  NOT NULL UNIQUE,
    agent_id         UUID         NOT NULL REFERENCES agents(id),
    type             VARCHAR(20)  NOT NULL,   -- CASH_IN | CASH_OUT
    customer_user_id UUID         NOT NULL,
    customer_phone   VARCHAR(20)  NOT NULL,
    customer_name    VARCHAR(200),
    amount           DECIMAL(18,2) NOT NULL,
    fee              DECIMAL(18,2) NOT NULL DEFAULT 5.00,
    net_amount       DECIMAL(18,2) NOT NULL,
    otp_code_hash    VARCHAR(255),             -- BCrypt of customer OTP
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING_AGENT',
                     -- PENDING_AGENT | COMPLETED | FAILED | EXPIRED
    wallet_txn_id    UUID,
    commission_id    UUID         REFERENCES agent_commissions(id),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- Customers served by each agent
CREATE TABLE agent_customers (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id            UUID         NOT NULL REFERENCES agents(id),
    customer_user_id    UUID         NOT NULL,
    customer_phone      VARCHAR(20)  NOT NULL,
    customer_name       VARCHAR(200),
    kyc_level           SMALLINT     NOT NULL DEFAULT 1,
    last_transaction_at TIMESTAMPTZ,
    total_transactions  INT          NOT NULL DEFAULT 0,
    registered_by_agent BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (agent_id, customer_user_id)
);

CREATE INDEX idx_agents_code          ON agents(code);
CREATE INDEX idx_agents_user_id       ON agents(user_id);
CREATE INDEX idx_agents_status        ON agents(status);
CREATE INDEX idx_agents_location      ON agents(latitude, longitude);
CREATE INDEX idx_agents_super         ON agents(super_agent_id);
CREATE INDEX idx_float_hist_agent     ON agent_float_history(agent_id);
CREATE INDEX idx_float_hist_created   ON agent_float_history(created_at DESC);
CREATE INDEX idx_float_req_agent      ON agent_float_requests(agent_id);
CREATE INDEX idx_commissions_agent    ON agent_commissions(agent_id);
CREATE INDEX idx_commissions_created  ON agent_commissions(created_at DESC);
CREATE INDEX idx_agent_txn_agent      ON agent_transactions(agent_id);
CREATE INDEX idx_agent_txn_customer   ON agent_transactions(customer_user_id);
CREATE INDEX idx_agent_txn_ref        ON agent_transactions(reference);
CREATE INDEX idx_agent_cust_agent     ON agent_customers(agent_id);


-- =============================================================================
-- 10. notification_db  ──  gp-notification-service (port 8091)
-- =============================================================================
-- \connect notification_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- In-app notification inbox
CREATE TABLE notifications (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    type       VARCHAR(20)  NOT NULL,
               -- TRANSACTION | SECURITY | PROMOTION | KYC | LOAN | SYSTEM
    title      VARCHAR(200) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    metadata   JSONB,        -- related IDs, deep-link info
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user    ON notifications(user_id);
CREATE INDEX idx_notif_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created ON notifications(created_at DESC);


-- =============================================================================
-- 11. admin_db  ──  gp-admin-service (port 8090)
-- =============================================================================
-- \connect admin_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Immutable system-wide audit trail
CREATE TABLE audit_log (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID,
    actor_role  VARCHAR(20),
    action      VARCHAR(50)  NOT NULL,
                -- USER_CREATE | KYC_APPROVE | TXN_REVERSE | LOGIN | etc.
    target_type VARCHAR(30),   -- USER | TRANSACTION | AGENT | LOAN | KYC
    target_id   UUID,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Runtime system configuration parameters
CREATE TABLE system_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL,
    description VARCHAR(500),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- AI-flagged fraud and suspicious activity
CREATE TABLE fraud_alerts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    transaction_id  UUID,
    severity        VARCHAR(10)  NOT NULL,   -- CRITICAL | MEDIUM | LOW
    alert_type      VARCHAR(30)  NOT NULL,   -- VELOCITY | AMOUNT | GEO | PATTERN
    message         TEXT         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
                    -- OPEN | INVESTIGATING | RESOLVED | FALSE_POSITIVE
    reviewed_by     UUID,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Seed System Config ────────────────────────────────────────────
INSERT INTO system_config (key, value, description) VALUES
    ('kyc_level_1_daily_limit',   '25000.00', 'Level 1 daily transaction limit ETB'),
    ('kyc_level_2_daily_limit',   '50000.00', 'Level 2 daily transaction limit ETB'),
    ('kyc_level_1_monthly_limit', '100000.00','Level 1 monthly limit ETB'),
    ('kyc_level_2_monthly_limit', '200000.00','Level 2 monthly limit ETB'),
    ('p2p_fee_flat',              '2.50',     'Flat P2P transfer fee ETB'),
    ('agent_commission_rate',     '0.003',    'Agent commission rate 0.3%'),
    ('agent_min_commission',      '2.00',     'Agent minimum commission ETB'),
    ('loyalty_points_per_etb',    '0.1',      'Loyalty points earned per ETB'),
    ('loyalty_point_value_etb',   '0.05',     'ETB value of one loyalty point'),
    ('max_failed_pin_attempts',   '5',        'Max PIN attempts before lockout'),
    ('pin_lockout_duration_min',  '30',       'Account lockout duration in minutes'),
    ('otp_validity_seconds',      '300',      'OTP expiry window in seconds'),
    ('cash_in_fee',               '5.00',     'Cash-in service fee ETB'),
    ('cash_out_fee',              '5.00',     'Cash-out service fee ETB');

CREATE INDEX idx_audit_actor   ON audit_log(actor_id);
CREATE INDEX idx_audit_action  ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_fraud_status  ON fraud_alerts(status);
CREATE INDEX idx_fraud_sev     ON fraud_alerts(severity);
CREATE INDEX idx_fraud_created ON fraud_alerts(created_at DESC);


-- =============================================================================
-- TABLE SUMMARY
-- =============================================================================
-- DB              | Tables
-- ──────────────────────────────────────────────────────────────────────────────
-- auth_db         | users, user_roles, refresh_tokens, otp_codes              (4)
-- user_db         | user_profiles, kyc_applications                           (2)
-- wallet_db       | wallets, transactions, ledger_entries, money_requests,    (6)
--                 | emoney_trust_account, contacts
-- transfer_db     | transfers, money_requests, contacts                       (3)
-- payment_db      | billers, telecom_operators, airtime_bundles, merchants,   (5)
--                 | payment_transactions
-- savings_db      | savings_goals                                             (1)
-- loan_db         | loans, loan_repayments, credit_scores                     (3)
-- loyalty_db      | loyalty_accounts, loyalty_history, redemption_catalog,   (4)
--                 | redemptions
-- agent_db        | agents, agent_float_history, agent_float_requests,        (6)
--                 | agent_commissions, agent_transactions, agent_customers
-- notification_db | notifications                                             (1)
-- admin_db        | audit_log, system_config, fraud_alerts                   (3)
-- ──────────────────────────────────────────────────────────────────────────────
-- TOTAL: 11 databases, 38 tables, 14 seed data inserts
-- =============================================================================
