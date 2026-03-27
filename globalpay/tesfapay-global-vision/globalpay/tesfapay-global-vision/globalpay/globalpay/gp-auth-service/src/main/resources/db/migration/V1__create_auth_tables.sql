-- V1__create_auth_tables.sql
-- GlobalPay Auth Service Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE app_role AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- ─── Users ──────────────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone               VARCHAR(20) NOT NULL UNIQUE,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    pin_hash            VARCHAR(255) NOT NULL,
    wallet_id           VARCHAR(30)  NOT NULL UNIQUE,
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

-- ─── Roles ──────────────────────────────────────────────────────
CREATE TABLE user_roles (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- ─── Refresh Tokens ─────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(512) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address  INET,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OTP Codes ──────────────────────────────────────────────────
CREATE TABLE otp_codes (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
    phone        VARCHAR(20) NOT NULL,
    code_hash    VARCHAR(255) NOT NULL,
    purpose      VARCHAR(30)  NOT NULL,
                 -- REGISTRATION | LOGIN | CASH_IN | CASH_OUT | PIN_RESET
    attempts     SMALLINT    NOT NULL DEFAULT 0,
    max_attempts SMALLINT    NOT NULL DEFAULT 3,
    verified     BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────
CREATE INDEX idx_users_phone       ON users(phone);
CREATE INDEX idx_users_wallet_id   ON users(wallet_id);
CREATE INDEX idx_users_status      ON users(status);
CREATE INDEX idx_user_roles_user   ON user_roles(user_id);
CREATE INDEX idx_refresh_user      ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_revoked   ON refresh_tokens(revoked);
CREATE INDEX idx_otp_phone_purpose ON otp_codes(phone, purpose);
CREATE INDEX idx_otp_expires       ON otp_codes(expires_at);
