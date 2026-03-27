-- V1__create_loan_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE loans (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL,
    reference           VARCHAR(30)  NOT NULL UNIQUE,
    principal_amount    DECIMAL(18,2) NOT NULL,
    interest_rate       DECIMAL(5,4)  NOT NULL,
    total_repayment     DECIMAL(18,2) NOT NULL,
    monthly_payment     DECIMAL(18,2) NOT NULL,
    term_months         SMALLINT     NOT NULL,
    paid_installments   SMALLINT     NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(18,2) NOT NULL,
    purpose             VARCHAR(200),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    next_due_date       DATE         NOT NULL,
    disbursed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE loan_repayments (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         UUID         NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount          DECIMAL(18,2) NOT NULL,
    installment_num SMALLINT     NOT NULL,
    balance_after   DECIMAL(18,2) NOT NULL,
    due_date        DATE         NOT NULL,
    paid_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_scores (
    id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID  NOT NULL UNIQUE,
    score       INT   NOT NULL CHECK (score BETWEEN 0 AND 100),
    label       VARCHAR(20) NOT NULL,
    max_loan    DECIMAL(18,2) NOT NULL,
    factors     JSONB NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_user       ON loans(user_id);
CREATE INDEX idx_loans_status     ON loans(status);
CREATE INDEX idx_loans_ref        ON loans(reference);
CREATE INDEX idx_loan_rep_loan    ON loan_repayments(loan_id);
CREATE INDEX idx_credit_user      ON credit_scores(user_id);
