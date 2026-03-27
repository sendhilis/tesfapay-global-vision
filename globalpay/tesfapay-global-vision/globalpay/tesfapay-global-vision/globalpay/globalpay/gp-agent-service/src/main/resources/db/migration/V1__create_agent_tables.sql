-- V1__create_agent_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE agent_type   AS ENUM ('AGENT', 'SUPER_AGENT', 'MERCHANT');
CREATE TYPE agent_status AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE float_entry_type AS ENUM ('TOPUP', 'DEBIT', 'CREDIT', 'ADJUSTMENT');

-- ─── Agents ──────────────────────────────────────────────────────
CREATE TABLE agents (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID         NOT NULL UNIQUE,
    code               VARCHAR(20)  NOT NULL UNIQUE,
    type               agent_type   NOT NULL DEFAULT 'AGENT',
    business_name      VARCHAR(200),
    region             VARCHAR(100),
    address            TEXT,
    latitude           DECIMAL(10,7),
    longitude          DECIMAL(10,7),
    float_balance      DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    float_limit        DECIMAL(18,2) NOT NULL DEFAULT 50000.00,
    commission_rate    DECIMAL(5,4)  NOT NULL DEFAULT 0.0030,
    min_commission     DECIMAL(18,2) NOT NULL DEFAULT 2.00,
    rating             DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    total_transactions INT          NOT NULL DEFAULT 0,
    monthly_volume     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    monthly_commission DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status             agent_status NOT NULL DEFAULT 'ACTIVE',
    super_agent_id     UUID         REFERENCES agents(id),
    is_open            BOOLEAN      NOT NULL DEFAULT TRUE,
    registered_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_float_balance CHECK (float_balance >= 0),
    CONSTRAINT chk_rating        CHECK (rating BETWEEN 0 AND 5)
);

-- ─── Agent Float History ─────────────────────────────────────────
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

-- ─── Agent Float Requests ────────────────────────────────────────
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

-- ─── Agent Commissions ───────────────────────────────────────────
CREATE TABLE agent_commissions (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id           UUID         NOT NULL REFERENCES agents(id),
    transaction_ref    VARCHAR(30)  NOT NULL,
    type               VARCHAR(20)  NOT NULL,   -- CASH_IN | CASH_OUT
    transaction_amount DECIMAL(18,2) NOT NULL,
    commission_amount  DECIMAL(18,2) NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Cash Transactions ───────────────────────────────────────────
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
    otp_code_hash    VARCHAR(255),
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING_AGENT',
    wallet_txn_id    UUID,
    commission_id    UUID         REFERENCES agent_commissions(id),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- ─── Agent Customers ─────────────────────────────────────────────
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

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX idx_agents_code         ON agents(code);
CREATE INDEX idx_agents_user_id      ON agents(user_id);
CREATE INDEX idx_agents_status       ON agents(status);
CREATE INDEX idx_agents_location     ON agents(latitude, longitude);
CREATE INDEX idx_agents_super        ON agents(super_agent_id);
CREATE INDEX idx_float_hist_agent    ON agent_float_history(agent_id);
CREATE INDEX idx_float_hist_created  ON agent_float_history(created_at DESC);
CREATE INDEX idx_float_req_agent     ON agent_float_requests(agent_id);
CREATE INDEX idx_commissions_agent   ON agent_commissions(agent_id);
CREATE INDEX idx_commissions_created ON agent_commissions(created_at DESC);
CREATE INDEX idx_agent_txn_agent     ON agent_transactions(agent_id);
CREATE INDEX idx_agent_txn_customer  ON agent_transactions(customer_user_id);
CREATE INDEX idx_agent_txn_ref       ON agent_transactions(reference);
CREATE INDEX idx_agent_cust_agent    ON agent_customers(agent_id);
