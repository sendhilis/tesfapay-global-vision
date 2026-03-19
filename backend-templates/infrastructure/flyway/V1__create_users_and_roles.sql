-- GlobalPay Flyway Migration V1 — Core Users & Roles
-- Service: auth-service
-- Database: globalpay_auth
-- Maps to: DATABASE_SCHEMA.md §2 (Core Tables)

-- Role enum
CREATE TYPE app_role AS ENUM ('USER', 'AGENT', 'ADMIN');

-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    pin_hash        VARCHAR(255) NOT NULL,
    wallet_id       VARCHAR(30) NOT NULL UNIQUE,
    kyc_level       SMALLINT NOT NULL DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    avatar_url      TEXT,
    biometric_token VARCHAR(255),
    daily_limit     DECIMAL(18,2) NOT NULL DEFAULT 25000.00,
    monthly_limit   DECIMAL(18,2) NOT NULL DEFAULT 100000.00,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    failed_pin_attempts SMALLINT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles (separate table for security)
CREATE TABLE user_roles (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role     app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Security-definer function for role checking
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- User sessions (JWT refresh tokens)
CREATE TABLE user_sessions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token  VARCHAR(512) NOT NULL UNIQUE,
    device_info    VARCHAR(255),
    ip_address     INET,
    expires_at     TIMESTAMPTZ NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP verifications
CREATE TABLE otp_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone       VARCHAR(20) NOT NULL,
    code        VARCHAR(10) NOT NULL,
    purpose     VARCHAR(30) NOT NULL,
    attempts    SMALLINT NOT NULL DEFAULT 0,
    max_attempts SMALLINT NOT NULL DEFAULT 3,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contact_name    VARCHAR(200) NOT NULL,
    contact_phone   VARCHAR(20) NOT NULL,
    is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, contact_phone)
);

-- KYC applications
CREATE TABLE kyc_applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type       VARCHAR(20) NOT NULL,
    document_front_url  TEXT NOT NULL,
    document_back_url   TEXT,
    selfie_url          TEXT NOT NULL,
    liveness_token      VARCHAR(255),
    ai_verification_score INT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewer_admin_id   UUID REFERENCES users(id),
    review_note         TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    CONSTRAINT chk_ai_score CHECK (ai_verification_score BETWEEN 0 AND 100)
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wallet_id ON users(wallet_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(refresh_token);
CREATE INDEX idx_otp_user ON otp_verifications(user_id);
CREATE INDEX idx_otp_phone_purpose ON otp_verifications(phone, purpose);
CREATE INDEX idx_kyc_user ON kyc_applications(user_id);
CREATE INDEX idx_kyc_status ON kyc_applications(status);
