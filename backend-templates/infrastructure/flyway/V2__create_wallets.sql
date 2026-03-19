-- GlobalPay Flyway Migration V2 — Wallets
-- Service: wallet-service
-- Database: globalpay_wallet
-- Maps to: DATABASE_SCHEMA.md §3 (Wallet & Financial Tables)

CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,
    main_balance    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    savings_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    loan_balance    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    currency        VARCHAR(3) NOT NULL DEFAULT 'ETB',
    is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    locked_reason   VARCHAR(255),
    last_activity   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_main_balance CHECK (main_balance >= 0),
    CONSTRAINT chk_savings_balance CHECK (savings_balance >= 0)
);

CREATE TABLE emoney_trust_account (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_issued          DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    trust_account_balance DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'MATCHED',
    last_reconciled_at    TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emoney_distribution (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category   VARCHAR(30) NOT NULL,
    amount     DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
