-- V1__create_savings_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE savings_goals (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL,
    name           VARCHAR(100) NOT NULL,
    icon           VARCHAR(10),
    target_amount  DECIMAL(18,2) NOT NULL,
    saved_amount   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    deadline       DATE,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_target  CHECK (target_amount > 0),
    CONSTRAINT chk_saved   CHECK (saved_amount >= 0)
);

CREATE INDEX idx_savings_user   ON savings_goals(user_id);
CREATE INDEX idx_savings_status ON savings_goals(status);
