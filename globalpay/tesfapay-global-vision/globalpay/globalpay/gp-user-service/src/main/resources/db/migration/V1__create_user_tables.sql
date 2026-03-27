-- V1__create_user_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE user_profiles (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL UNIQUE,
    phone             VARCHAR(20)  NOT NULL UNIQUE,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    wallet_id         VARCHAR(30)  NOT NULL UNIQUE,
    kyc_level         SMALLINT     NOT NULL DEFAULT 1,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    loyalty_tier      VARCHAR(10)  NOT NULL DEFAULT 'BRONZE',
    loyalty_points    INT          NOT NULL DEFAULT 0,
    avatar_url        TEXT,
    notifications_enabled BOOLEAN  NOT NULL DEFAULT TRUE,
    daily_limit       DECIMAL(18,2) NOT NULL DEFAULT 25000.00,
    monthly_limit     DECIMAL(18,2) NOT NULL DEFAULT 100000.00,
    total_transactions INT          NOT NULL DEFAULT 0,
    monthly_volume    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE kyc_applications (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    document_type         VARCHAR(20)  NOT NULL,  -- FAYDA_ID|PASSPORT|DRIVING_LICENSE|KEBELE_ID
    document_front_url    TEXT         NOT NULL,
    document_back_url     TEXT,
    selfie_url            TEXT         NOT NULL,
    liveness_token        VARCHAR(255),
    ai_verification_score INT,
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reviewer_admin_id     UUID,
    review_note           TEXT,
    submitted_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at           TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_phone    ON user_profiles(phone);
CREATE INDEX idx_user_profiles_wallet   ON user_profiles(wallet_id);
CREATE INDEX idx_user_profiles_status   ON user_profiles(status);
CREATE INDEX idx_kyc_user               ON kyc_applications(user_id);
CREATE INDEX idx_kyc_status             ON kyc_applications(status);
