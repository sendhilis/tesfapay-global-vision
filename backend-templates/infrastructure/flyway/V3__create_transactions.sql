-- GlobalPay Flyway Migration V3 — Transactions
-- Service: transfer-service
-- Database: globalpay_transfer
-- Maps to: DATABASE_SCHEMA.md §4 (Transaction Tables)

CREATE TABLE transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference         VARCHAR(30) NOT NULL UNIQUE,
    type              VARCHAR(30) NOT NULL,
    sender_user_id    UUID,
    recipient_user_id UUID,
    sender_wallet_id  VARCHAR(30),
    recipient_wallet_id VARCHAR(30),
    amount            DECIMAL(18,2) NOT NULL,
    fee               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount      DECIMAL(18,2) NOT NULL,
    currency          VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    counterparty_name VARCHAR(200),
    note              VARCHAR(500),
    loyalty_points_earned INT NOT NULL DEFAULT 0,
    balance_after     DECIMAL(18,2),
    flagged           BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_reason    VARCHAR(500),
    agent_id          UUID,
    merchant_id       UUID,
    biller_id         UUID,
    reversal_of       UUID,
    idempotency_key   VARCHAR(64) UNIQUE,
    metadata          JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE TABLE money_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(30) NOT NULL UNIQUE,
    requester_id    UUID NOT NULL,
    target_user_id  UUID NOT NULL,
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_id  UUID,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX idx_txn_sender ON transactions(sender_user_id);
CREATE INDEX idx_txn_recipient ON transactions(recipient_user_id);
CREATE INDEX idx_txn_reference ON transactions(reference);
CREATE INDEX idx_txn_type ON transactions(type);
CREATE INDEX idx_txn_status ON transactions(status);
CREATE INDEX idx_txn_created_at ON transactions(created_at DESC);
CREATE INDEX idx_txn_sender_created ON transactions(sender_user_id, created_at DESC);
CREATE INDEX idx_txn_flagged ON transactions(flagged) WHERE flagged = TRUE;
CREATE INDEX idx_txn_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_money_req_requester ON money_requests(requester_id);
CREATE INDEX idx_money_req_target ON money_requests(target_user_id);
CREATE INDEX idx_money_req_status ON money_requests(status);
