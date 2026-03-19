-- GlobalPay Flyway Migration V4 — Agents, Merchants, Savings, Loans, Loyalty
-- Maps to: DATABASE_SCHEMA.md §6, §7, §8

-- ========== Agents ==========
CREATE TABLE agents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE,
    code              VARCHAR(20) NOT NULL UNIQUE,
    type              VARCHAR(20) NOT NULL,
    business_name     VARCHAR(200),
    region            VARCHAR(100),
    address           TEXT,
    latitude          DECIMAL(10,7),
    longitude         DECIMAL(10,7),
    float_balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    float_limit       DECIMAL(18,2) NOT NULL DEFAULT 50000.00,
    commission_rate   DECIMAL(5,4) NOT NULL DEFAULT 0.0030,
    min_commission    DECIMAL(18,2) NOT NULL DEFAULT 2.00,
    rating            DECIMAL(3,2) DEFAULT 0.00,
    total_transactions INT NOT NULL DEFAULT 0,
    monthly_volume    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    monthly_commission DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    super_agent_id    UUID REFERENCES agents(id),
    is_open           BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_float_balance CHECK (float_balance >= 0),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 0 AND 5)
);

CREATE TABLE agent_float_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
    amount      DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    source      VARCHAR(100),
    reason      VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_commissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    transaction_id  UUID NOT NULL,
    type            VARCHAR(20) NOT NULL,
    transaction_amount DECIMAL(18,2) NOT NULL,
    commission_amount DECIMAL(18,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== Merchants ==========
CREATE TABLE merchants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    merchant_id VARCHAR(20) NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50) NOT NULL,
    icon        VARCHAR(10),
    address     TEXT,
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    qr_payload  VARCHAR(255),
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== Savings ==========
CREATE TABLE savings_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,
    icon            VARCHAR(10),
    target_amount   DECIMAL(18,2) NOT NULL,
    saved_amount    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    deadline        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_target_positive CHECK (target_amount > 0),
    CONSTRAINT chk_saved_nonneg CHECK (saved_amount >= 0)
);

-- ========== Loans ==========
CREATE TABLE loans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    reference           VARCHAR(30) NOT NULL UNIQUE,
    principal_amount    DECIMAL(18,2) NOT NULL,
    interest_rate       DECIMAL(5,4) NOT NULL,
    total_repayment     DECIMAL(18,2) NOT NULL,
    monthly_payment     DECIMAL(18,2) NOT NULL,
    term_months         SMALLINT NOT NULL,
    paid_installments   SMALLINT NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(18,2) NOT NULL,
    purpose             VARCHAR(200),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    disbursement_txn_id UUID,
    next_due_date       DATE NOT NULL,
    disbursed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_term_positive CHECK (term_months > 0)
);

CREATE TABLE credit_scores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    score       INT NOT NULL,
    label       VARCHAR(20) NOT NULL,
    max_loan    DECIMAL(18,2) NOT NULL,
    factors     JSONB NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_score_range CHECK (score BETWEEN 0 AND 100)
);

-- ========== Loyalty ==========
CREATE TABLE loyalty_accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE,
    points      INT NOT NULL DEFAULT 0,
    tier        VARCHAR(10) NOT NULL DEFAULT 'BRONZE',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_points_nonneg CHECK (points >= 0)
);

CREATE TABLE loyalty_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    transaction_id  UUID,
    label           VARCHAR(200) NOT NULL,
    points          INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE redemption_catalog (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(10),
    points_cost INT NOT NULL,
    reward_type VARCHAR(30) NOT NULL,
    reward_value DECIMAL(18,2),
    min_tier    VARCHAR(10),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== Bill Payments ==========
CREATE TABLE billers (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                   VARCHAR(200) NOT NULL,
    category               VARCHAR(30) NOT NULL,
    icon                   VARCHAR(10),
    description            VARCHAR(500),
    is_popular             BOOLEAN NOT NULL DEFAULT FALSE,
    requires_account_number BOOLEAN NOT NULL DEFAULT TRUE,
    fields                 JSONB,
    api_endpoint           VARCHAR(500),
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE telecom_operators (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(100) NOT NULL,
    icon    VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE airtime_bundles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES telecom_operators(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    price       DECIMAL(18,2) NOT NULL,
    validity    VARCHAR(30) NOT NULL,
    type        VARCHAR(10) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========== Notifications & Audit ==========
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR(20) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID,
    actor_role  VARCHAR(10),
    action      VARCHAR(50) NOT NULL,
    target_type VARCHAR(30),
    target_id   UUID,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fraud_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    transaction_id  UUID,
    severity        VARCHAR(10) NOT NULL,
    alert_type      VARCHAR(30) NOT NULL,
    message         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    reviewed_by     UUID,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    description VARCHAR(500),
    updated_by  UUID,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== Indexes ==========
CREATE INDEX idx_agents_code ON agents(code);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_location ON agents(latitude, longitude);
CREATE INDEX idx_agent_comm_agent ON agent_commissions(agent_id);
CREATE INDEX idx_merchants_category ON merchants(category);
CREATE INDEX idx_savings_user ON savings_goals(user_id);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loyalty_user ON loyalty_accounts(user_id);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_fraud_status ON fraud_alerts(status);
