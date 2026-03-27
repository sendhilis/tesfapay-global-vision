-- V1__create_transfer_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Outbound Transfer Records ───────────────────────────────────
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
    fee                 DECIMAL(18,2) NOT NULL DEFAULT 2.50,
    total_deducted      DECIMAL(18,2) NOT NULL,
    note                VARCHAR(500),
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    wallet_txn_id       UUID,
    loyalty_points_earned INT        NOT NULL DEFAULT 0,
    balance_after       DECIMAL(18,2),
    idempotency_key     VARCHAR(64)  UNIQUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

-- ─── Money Requests ──────────────────────────────────────────────
CREATE TABLE money_requests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(30) NOT NULL UNIQUE,
    requester_id    UUID        NOT NULL,
    requester_phone VARCHAR(20) NOT NULL,
    requester_name  VARCHAR(200),
    target_phone    VARCHAR(20) NOT NULL,
    target_user_id  UUID,
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transfer_id     UUID        REFERENCES transfers(id),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- ─── Contacts / Favourites ───────────────────────────────────────
CREATE TABLE contacts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID        NOT NULL,
    contact_user_id UUID,
    contact_name    VARCHAR(200) NOT NULL,
    contact_phone   VARCHAR(20) NOT NULL,
    is_favorite     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_globalpay_user BOOLEAN    NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, contact_phone)
);

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX idx_transfers_sender    ON transfers(sender_user_id);
CREATE INDEX idx_transfers_ref       ON transfers(reference);
CREATE INDEX idx_transfers_idempotency ON transfers(idempotency_key);
CREATE INDEX idx_transfers_created   ON transfers(created_at DESC);

CREATE INDEX idx_mreq_requester      ON money_requests(requester_id);
CREATE INDEX idx_mreq_target         ON money_requests(target_user_id);
CREATE INDEX idx_mreq_status         ON money_requests(status);
CREATE INDEX idx_mreq_expires        ON money_requests(expires_at);

CREATE INDEX idx_contacts_owner      ON contacts(owner_user_id);
