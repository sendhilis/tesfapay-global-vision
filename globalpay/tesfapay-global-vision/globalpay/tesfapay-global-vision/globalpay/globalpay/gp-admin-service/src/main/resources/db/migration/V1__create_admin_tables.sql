-- V1__create_admin_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE audit_log (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID,
    actor_role  VARCHAR(20),
    action      VARCHAR(50)  NOT NULL,
    target_type VARCHAR(30),
    target_id   UUID,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE system_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL,
    description VARCHAR(500),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE fraud_alerts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    transaction_id  UUID,
    severity        VARCHAR(10) NOT NULL,  -- CRITICAL|MEDIUM|LOW
    alert_type      VARCHAR(30) NOT NULL,  -- VELOCITY|AMOUNT|GEO|PATTERN
    message         TEXT        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    reviewed_by     UUID,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed system config
INSERT INTO system_config (key, value, description) VALUES
    ('kyc_level_1_daily_limit',   '25000.00',  'Level 1 daily limit'),
    ('kyc_level_2_daily_limit',   '50000.00',  'Level 2 daily limit'),
    ('p2p_fee_flat',              '2.50',      'P2P flat fee ETB'),
    ('agent_commission_rate',     '0.003',     'Agent commission 0.3%'),
    ('loyalty_points_per_etb',    '0.1',       'Points per ETB'),
    ('loyalty_point_value_etb',   '0.05',      'ETB per point'),
    ('max_failed_pin_attempts',   '5',         'Lock after N attempts'),
    ('pin_lockout_duration_min',  '30',        'Lockout duration mins'),
    ('otp_validity_seconds',      '300',       'OTP expiry seconds');

CREATE INDEX idx_audit_actor   ON audit_log(actor_id);
CREATE INDEX idx_audit_action  ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_fraud_status  ON fraud_alerts(status);
CREATE INDEX idx_fraud_sev     ON fraud_alerts(severity);
