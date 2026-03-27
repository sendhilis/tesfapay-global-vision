-- V1__create_wallet_tables.sql
-- GlobalPay Wallet Service Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Transaction Type & Status Enums ────────────────────────────
CREATE TYPE txn_type AS ENUM (
    'P2P_SEND', 'P2P_RECEIVE', 'BILL_PAYMENT', 'AIRTIME', 'MERCHANT',
    'CASH_IN', 'CASH_OUT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL',
    'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'REWARD_REDEMPTION',
    'FLOAT_TOPUP', 'COMMISSION', 'REVERSAL'
);

CREATE TYPE txn_status AS ENUM (
    'PENDING', 'PENDING_AGENT', 'COMPLETED', 'FAILED', 'REVERSED', 'EXPIRED'
);

-- ─── Wallets ─────────────────────────────────────────────────────
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

    CONSTRAINT chk_main_balance     CHECK (main_balance >= 0),
    CONSTRAINT chk_savings_balance  CHECK (savings_balance >= 0)
);

-- ─── Transactions (Central Ledger) ───────────────────────────────
CREATE TABLE transactions (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reference            VARCHAR(30)  NOT NULL UNIQUE,
    type                 txn_type     NOT NULL,
    sender_user_id       UUID,
    recipient_user_id    UUID,
    sender_wallet_id     VARCHAR(30),
    recipient_wallet_id  VARCHAR(30),
    amount               DECIMAL(18,2) NOT NULL,
    fee                  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount         DECIMAL(18,2) NOT NULL,
    currency             VARCHAR(3)   NOT NULL DEFAULT 'ETB',
    status               txn_status   NOT NULL DEFAULT 'PENDING',
    counterparty_name    VARCHAR(200),
    note                 VARCHAR(500),
    loyalty_points_earned INT         NOT NULL DEFAULT 0,
    balance_after        DECIMAL(18,2),
    flagged              BOOLEAN      NOT NULL DEFAULT FALSE,
    flagged_reason       VARCHAR(500),
    agent_id             UUID,
    merchant_id          UUID,
    biller_id            UUID,
    reversal_of          UUID         REFERENCES transactions(id),
    idempotency_key      VARCHAR(64)  UNIQUE,
    metadata             JSONB,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at         TIMESTAMPTZ,

    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- ─── Ledger Entries (Double-Entry) ───────────────────────────────
CREATE TYPE entry_type AS ENUM ('DEBIT', 'CREDIT');

CREATE TABLE ledger_entries (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID        NOT NULL REFERENCES transactions(id),
    wallet_id      VARCHAR(30) NOT NULL,
    user_id        UUID        NOT NULL,
    entry_type     entry_type  NOT NULL,
    amount         DECIMAL(18,2) NOT NULL,
    balance_before DECIMAL(18,2) NOT NULL,
    balance_after  DECIMAL(18,2) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Money Requests ──────────────────────────────────────────────
CREATE TABLE money_requests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(30) NOT NULL UNIQUE,
    requester_id    UUID        NOT NULL,
    target_user_id  UUID        NOT NULL,
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_id  UUID        REFERENCES transactions(id),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- ─── E-Money Trust Account ───────────────────────────────────────
CREATE TABLE emoney_trust_account (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    total_issued          DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    trust_account_balance DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'MATCHED',
    last_reconciled_at    TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO emoney_trust_account (total_issued, trust_account_balance) VALUES (0, 0);

-- ─── Contacts / Favorites ────────────────────────────────────────
CREATE TABLE contacts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID        NOT NULL,
    contact_user_id UUID,
    contact_name    VARCHAR(200) NOT NULL,
    contact_phone   VARCHAR(20)  NOT NULL,
    is_favorite     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, contact_phone)
);

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX idx_wallets_user_id       ON wallets(user_id);
CREATE INDEX idx_wallets_wallet_id     ON wallets(wallet_id);

CREATE INDEX idx_txn_sender            ON transactions(sender_user_id);
CREATE INDEX idx_txn_recipient         ON transactions(recipient_user_id);
CREATE INDEX idx_txn_reference         ON transactions(reference);
CREATE INDEX idx_txn_type              ON transactions(type);
CREATE INDEX idx_txn_status            ON transactions(status);
CREATE INDEX idx_txn_created           ON transactions(created_at DESC);
CREATE INDEX idx_txn_sender_created    ON transactions(sender_user_id, created_at DESC);
CREATE INDEX idx_txn_flagged           ON transactions(flagged) WHERE flagged = TRUE;
CREATE INDEX idx_txn_idempotency       ON transactions(idempotency_key);

CREATE INDEX idx_ledger_txn            ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_wallet         ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_user           ON ledger_entries(user_id);

CREATE INDEX idx_money_req_requester   ON money_requests(requester_id);
CREATE INDEX idx_money_req_target      ON money_requests(target_user_id);
CREATE INDEX idx_money_req_status      ON money_requests(status);

CREATE INDEX idx_contacts_owner        ON contacts(owner_user_id);
