# GlobalPay — Database Schema

> **For:** Spring Boot backend development team
> **Database:** PostgreSQL 15+
> **ORM:** Spring Data JPA / Hibernate
> **Currency:** All monetary columns use `DECIMAL(18,2)` — Ethiopian Birr (ETB)
> **IDs:** UUID v4 (`gen_random_uuid()`)
> **Timestamps:** `TIMESTAMPTZ` (UTC)

---

## Table of Contents

1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Core Tables](#2-core-tables)
3. [Wallet & Financial Tables](#3-wallet--financial-tables)
4. [Transaction Tables](#4-transaction-tables)
5. [KYC Tables](#5-kyc-tables)
6. [Agent & Merchant Tables](#6-agent--merchant-tables)
7. [Savings & Loans Tables](#7-savings--loans-tables)
8. [Loyalty & Rewards Tables](#8-loyalty--rewards-tables)
9. [Bill Payment & Airtime Tables](#9-bill-payment--airtime-tables)
10. [Notifications & Audit Tables](#10-notifications--audit-tables)
11. [Indexes](#11-indexes)
12. [JPA Entity Samples](#12-jpa-entity-samples)
13. [Migration Strategy](#13-migration-strategy)

---

## 1. Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌──────────────────┐
│   users     │──1:N──│  user_roles  │       │  kyc_applications│
│             │──1:1──│  wallets     │       │                  │
│             │──1:N──│              │       │                  │
└──────┬──────┘       └──────────────┘       └──────────────────┘
       │
       ├──1:N── transactions
       ├──1:N── savings_goals
       ├──1:N── loans
       ├──1:N── loyalty_accounts (1:1)
       ├──1:N── money_requests
       ├──1:N── notifications
       ├──1:N── contacts
       └──1:N── user_sessions

┌─────────────┐       ┌──────────────┐       ┌──────────────────┐
│   agents    │──1:N──│ agent_float  │       │  billers         │
│             │       │ _history     │       │                  │
└─────────────┘       └──────────────┘       └──────────────────┘

┌─────────────┐       ┌──────────────┐
│ merchants   │       │  redemption  │
│             │       │  _catalog    │
└─────────────┘       └──────────────┘
```

---

## 2. Core Tables

### `users`
Primary user account table.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    pin_hash        VARCHAR(255) NOT NULL,          -- BCrypt hashed 6-digit MPIN
    wallet_id       VARCHAR(30) NOT NULL UNIQUE,    -- e.g. "TPY-2024-ABEBE001"
    kyc_level       SMALLINT NOT NULL DEFAULT 1,    -- 1 or 2
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                    -- ACTIVE | SUSPENDED | BLOCKED | PENDING_KYC
    avatar_url      TEXT,
    biometric_token VARCHAR(255),                   -- device-signed biometric key
    daily_limit     DECIMAL(18,2) NOT NULL DEFAULT 25000.00,
    monthly_limit   DECIMAL(18,2) NOT NULL DEFAULT 100000.00,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    failed_pin_attempts SMALLINT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spring Boot: @Entity, maps to UserRepository
-- Front-end: UserProfile.tsx, LoginPage.tsx, Onboarding.tsx
```

### `user_roles`
Role-based access control — **separate from users to prevent privilege escalation**.

```sql
CREATE TYPE app_role AS ENUM ('USER', 'AGENT', 'ADMIN');

CREATE TABLE user_roles (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role     app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Security-definer function to check roles (avoids RLS recursion)
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
```

### `user_sessions`
JWT refresh token management.

```sql
CREATE TABLE user_sessions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token  VARCHAR(512) NOT NULL UNIQUE,
    device_info    VARCHAR(255),
    ip_address     INET,
    expires_at     TIMESTAMPTZ NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `contacts`
User's saved contacts / favorites.

```sql
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

-- Front-end: SendMoney.tsx, RequestMoney.tsx
```

---

## 3. Wallet & Financial Tables

### `wallets`
One wallet per user — holds main balance.

```sql
CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    main_balance    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    savings_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,   -- aggregate of all goals
    loan_balance    DECIMAL(18,2) NOT NULL DEFAULT 0.00,   -- outstanding loan total
    currency        VARCHAR(3) NOT NULL DEFAULT 'ETB',
    is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    locked_reason   VARCHAR(255),
    last_activity   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_main_balance CHECK (main_balance >= 0),
    CONSTRAINT chk_savings_balance CHECK (savings_balance >= 0)
);

-- Front-end: WalletHome.tsx (balance card)
```

### `emoney_trust_account`
System-level e-money trust account for regulatory compliance.

```sql
CREATE TABLE emoney_trust_account (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_issued          DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    trust_account_balance DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'MATCHED',
                          -- MATCHED | MISMATCH | PENDING
    last_reconciled_at    TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: AdminEMoney.tsx
```

### `emoney_distribution`
Breakdown of e-money across system components.

```sql
CREATE TABLE emoney_distribution (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category   VARCHAR(30) NOT NULL,  -- USER_WALLETS | AGENT_FLOAT | MERCHANT_HOLDINGS | SYSTEM_RESERVE
    amount     DECIMAL(22,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Transaction Tables

### `transactions`
Central ledger — **every financial movement** is recorded here.

```sql
CREATE TABLE transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference         VARCHAR(30) NOT NULL UNIQUE,     -- TXN2024110001, CI-928371, etc.
    type              VARCHAR(30) NOT NULL,
                      -- P2P_SEND | P2P_RECEIVE | BILL_PAYMENT | AIRTIME | MERCHANT |
                      -- CASH_IN | CASH_OUT | SAVINGS_DEPOSIT | SAVINGS_WITHDRAWAL |
                      -- LOAN_DISBURSEMENT | LOAN_REPAYMENT | REWARD_REDEMPTION |
                      -- FLOAT_TOPUP | COMMISSION | REVERSAL
    sender_user_id    UUID REFERENCES users(id),
    recipient_user_id UUID REFERENCES users(id),
    sender_wallet_id  VARCHAR(30),
    recipient_wallet_id VARCHAR(30),
    amount            DECIMAL(18,2) NOT NULL,
    fee               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount      DECIMAL(18,2) NOT NULL,          -- amount + fee
    currency          VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                      -- PENDING | PENDING_AGENT | COMPLETED | FAILED | REVERSED | EXPIRED
    counterparty_name VARCHAR(200),                    -- display name for the other party
    note              VARCHAR(500),
    loyalty_points_earned INT NOT NULL DEFAULT 0,
    balance_after     DECIMAL(18,2),                   -- sender's balance after txn
    flagged           BOOLEAN NOT NULL DEFAULT FALSE,   -- fraud flag
    flagged_reason    VARCHAR(500),
    agent_id          UUID REFERENCES agents(id),       -- if agent-assisted
    merchant_id       UUID REFERENCES merchants(id),    -- if merchant payment
    biller_id         UUID REFERENCES billers(id),      -- if bill payment
    reversal_of       UUID REFERENCES transactions(id), -- if this is a reversal
    idempotency_key   VARCHAR(64) UNIQUE,               -- prevent duplicate submissions
    metadata          JSONB,                            -- extensible data (biller account, bundle info, etc.)
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ,

    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- Front-end: TransactionHistory.tsx, AdminTransactions.tsx
-- This is the SINGLE SOURCE OF TRUTH for all financial activity
```

### `money_requests`
P2P money request tracking.

```sql
CREATE TABLE money_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(30) NOT NULL UNIQUE,
    requester_id    UUID NOT NULL REFERENCES users(id),
    target_user_id  UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    -- PENDING | ACCEPTED | DECLINED | EXPIRED
    transaction_id  UUID REFERENCES transactions(id),   -- linked txn if accepted
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- Front-end: RequestMoney.tsx
```

### `otp_verifications`
OTP codes for phone verification, cash operations, and sensitive actions.

```sql
CREATE TABLE otp_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone       VARCHAR(20) NOT NULL,
    code        VARCHAR(10) NOT NULL,               -- hashed OTP
    purpose     VARCHAR(30) NOT NULL,               -- REGISTRATION | CASH_IN | CASH_OUT | PIN_RESET
    attempts    SMALLINT NOT NULL DEFAULT 0,
    max_attempts SMALLINT NOT NULL DEFAULT 3,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. KYC Tables

### `kyc_applications`
KYC Level 2 upgrade applications.

```sql
CREATE TABLE kyc_applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type       VARCHAR(20) NOT NULL,
                        -- FAYDA_ID | PASSPORT | DRIVING_LICENSE | KEBELE_ID
    document_front_url  TEXT NOT NULL,
    document_back_url   TEXT,
    selfie_url          TEXT NOT NULL,
    liveness_token      VARCHAR(255),
    ai_verification_score INT,                      -- 0-100
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                        -- PENDING | PROCESSING | APPROVED | REJECTED
    reviewer_admin_id   UUID REFERENCES users(id),
    review_note         TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,

    CONSTRAINT chk_ai_score CHECK (ai_verification_score BETWEEN 0 AND 100)
);

-- Front-end: KYCUpgrade.tsx, AdminKYC.tsx
```

---

## 6. Agent & Merchant Tables

### `agents`
Registered agents and super agents.

```sql
CREATE TABLE agents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id),
    code              VARCHAR(20) NOT NULL UNIQUE,    -- AGT-001
    type              VARCHAR(20) NOT NULL,           -- AGENT | SUPER_AGENT
    business_name     VARCHAR(200),
    region            VARCHAR(100),
    address           TEXT,
    latitude          DECIMAL(10,7),
    longitude         DECIMAL(10,7),
    float_balance     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    float_limit       DECIMAL(18,2) NOT NULL DEFAULT 50000.00,
    commission_rate   DECIMAL(5,4) NOT NULL DEFAULT 0.0030,  -- 0.3%
    min_commission    DECIMAL(18,2) NOT NULL DEFAULT 2.00,
    rating            DECIMAL(3,2) DEFAULT 0.00,
    total_transactions INT NOT NULL DEFAULT 0,
    monthly_volume    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    monthly_commission DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                      -- ACTIVE | SUSPENDED | INACTIVE
    super_agent_id    UUID REFERENCES agents(id),      -- parent super agent
    is_open           BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_float_balance CHECK (float_balance >= 0),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 0 AND 5)
);

-- Front-end: AgentHome.tsx, AgentProfile.tsx, AdminAgents.tsx
```

### `agent_float_history`
Float balance change log.

```sql
CREATE TABLE agent_float_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,    -- TOPUP | DEBIT | CREDIT | ADJUSTMENT
    amount      DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    source      VARCHAR(100),            -- "Super Agent", "Cash-in CI-928371"
    reason      VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: AgentFloat.tsx
```

### `agent_float_requests`
Float top-up requests to super agents.

```sql
CREATE TABLE agent_float_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    super_agent_id  UUID NOT NULL REFERENCES agents(id),
    amount          DECIMAL(18,2) NOT NULL,
    note            VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    -- PENDING | APPROVED | REJECTED
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `agent_commissions`
Per-transaction commission records.

```sql
CREATE TABLE agent_commissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    type            VARCHAR(20) NOT NULL,     -- CASH_IN | CASH_OUT
    transaction_amount DECIMAL(18,2) NOT NULL,
    commission_amount DECIMAL(18,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: AgentCommission.tsx
```

### `merchants`
Registered merchants for QR/direct payments.

```sql
CREATE TABLE merchants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    merchant_id VARCHAR(20) NOT NULL UNIQUE,        -- MERCH-001
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50) NOT NULL,               -- RESTAURANT | GROCERY | SHOPPING | HEALTH | HOSPITALITY | TRANSPORT
    icon        VARCHAR(10),
    address     TEXT,
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    qr_payload  VARCHAR(255),                       -- globalpay://pay?merchant=MERCH-001
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: MerchantPay.tsx
```

---

## 7. Savings & Loans Tables

### `savings_goals`
User-defined savings goals.

```sql
CREATE TABLE savings_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    icon            VARCHAR(10),
    target_amount   DECIMAL(18,2) NOT NULL,
    saved_amount    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    deadline        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                    -- ACTIVE | COMPLETED | CANCELLED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_target_positive CHECK (target_amount > 0),
    CONSTRAINT chk_saved_nonneg CHECK (saved_amount >= 0)
);

-- Front-end: SavingsGoals.tsx
```

### `loans`
Micro-loan records.

```sql
CREATE TABLE loans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference           VARCHAR(30) NOT NULL UNIQUE,
    principal_amount    DECIMAL(18,2) NOT NULL,
    interest_rate       DECIMAL(5,4) NOT NULL,         -- e.g. 0.0500 = 5%
    total_repayment     DECIMAL(18,2) NOT NULL,
    monthly_payment     DECIMAL(18,2) NOT NULL,
    term_months         SMALLINT NOT NULL,
    paid_installments   SMALLINT NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(18,2) NOT NULL,
    purpose             VARCHAR(200),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                        -- ACTIVE | OVERDUE | COMPLETED | DEFAULTED
    disbursement_txn_id UUID REFERENCES transactions(id),
    next_due_date       DATE NOT NULL,
    disbursed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_term_positive CHECK (term_months > 0)
);

-- Front-end: MicroLoan.tsx
```

### `loan_repayments`
Individual repayment records per loan.

```sql
CREATE TABLE loan_repayments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    amount          DECIMAL(18,2) NOT NULL,
    installment_num SMALLINT NOT NULL,
    balance_after   DECIMAL(18,2) NOT NULL,
    due_date        DATE NOT NULL,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `credit_scores`
AI-computed credit scores for loan eligibility.

```sql
CREATE TABLE credit_scores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score       INT NOT NULL,                       -- 0-100
    label       VARCHAR(20) NOT NULL,               -- EXCELLENT | GOOD | FAIR | POOR
    max_loan    DECIMAL(18,2) NOT NULL,
    factors     JSONB NOT NULL,
    -- e.g. [{"label":"Transaction History","score":85,"weight":"HIGH"}, ...]
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_score_range CHECK (score BETWEEN 0 AND 100)
);

-- Front-end: MicroLoan.tsx (eligibility card)
```

---

## 8. Loyalty & Rewards Tables

### `loyalty_accounts`
One per user — tracks points and tier.

```sql
CREATE TABLE loyalty_accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points      INT NOT NULL DEFAULT 0,
    tier        VARCHAR(10) NOT NULL DEFAULT 'BRONZE',
                -- BRONZE | SILVER | GOLD | PLATINUM
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_points_nonneg CHECK (points >= 0)
);

-- Front-end: LoyaltyRewards.tsx, WalletHome.tsx (Global Points)
```

### `loyalty_history`
Points earned/spent log.

```sql
CREATE TABLE loyalty_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id  UUID REFERENCES transactions(id),
    label           VARCHAR(200) NOT NULL,
    points          INT NOT NULL,                   -- positive = earned, negative = spent
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `redemption_catalog`
Available rewards for point redemption.

```sql
CREATE TABLE redemption_catalog (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(10),
    points_cost INT NOT NULL,
    reward_type VARCHAR(30) NOT NULL,               -- CASHBACK | DATA_BUNDLE | FREE_BILL | LOAN_DISCOUNT | PRIORITY_SUPPORT
    reward_value DECIMAL(18,2),                     -- ETB value for cashback
    min_tier    VARCHAR(10),                         -- minimum tier required (NULL = any)
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: LoyaltyRewards.tsx (redeem tab)
```

### `redemptions`
User redemption history.

```sql
CREATE TABLE redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    catalog_item_id UUID NOT NULL REFERENCES redemption_catalog(id),
    points_spent    INT NOT NULL,
    reward_name     VARCHAR(100) NOT NULL,
    cashback_amount DECIMAL(18,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 9. Bill Payment & Airtime Tables

### `billers`
Registered billers / utility companies.

```sql
CREATE TABLE billers (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                   VARCHAR(200) NOT NULL,
    category               VARCHAR(30) NOT NULL,    -- TELECOM | UTILITY | WATER | TV | EDUCATION
    icon                   VARCHAR(10),
    description            VARCHAR(500),
    is_popular             BOOLEAN NOT NULL DEFAULT FALSE,
    requires_account_number BOOLEAN NOT NULL DEFAULT TRUE,
    fields                 JSONB,                   -- custom form fields definition
    api_endpoint           VARCHAR(500),             -- backend integration URL
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: PayBills.tsx
```

### `telecom_operators`
Mobile operators and their bundles.

```sql
CREATE TABLE telecom_operators (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(100) NOT NULL,
    icon    VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Front-end: AirtimeTopup.tsx
```

### `airtime_bundles`
Available airtime/data bundles per operator.

```sql
CREATE TABLE airtime_bundles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES telecom_operators(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    price       DECIMAL(18,2) NOT NULL,
    validity    VARCHAR(30) NOT NULL,               -- "1 day", "30 days", "No expiry"
    type        VARCHAR(10) NOT NULL,               -- DATA | AIRTIME
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Front-end: AirtimeTopup.tsx (bundle selection)
```

---

## 10. Notifications & Audit Tables

### `notifications`
User notification inbox.

```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
                -- TRANSACTION | SECURITY | PROMOTION | KYC | LOAN | SYSTEM
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    metadata    JSONB,                              -- related IDs, deep-link info
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `audit_log`
System-wide audit trail for compliance.

```sql
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users(id),
    actor_role  app_role,
    action      VARCHAR(50) NOT NULL,
                -- USER_CREATE | KYC_APPROVE | TXN_REVERSE | AGENT_SUSPEND | FLOAT_ADJUST | LOGIN | LOGIN_FAIL
    target_type VARCHAR(30),                        -- USER | TRANSACTION | AGENT | LOAN | KYC
    target_id   UUID,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: AdminReports.tsx (audit reports)
```

### `fraud_alerts`
AI-flagged suspicious activity.

```sql
CREATE TABLE fraud_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    transaction_id  UUID REFERENCES transactions(id),
    severity        VARCHAR(10) NOT NULL,            -- CRITICAL | MEDIUM | LOW
    alert_type      VARCHAR(30) NOT NULL,            -- VELOCITY | AMOUNT | GEO | PATTERN
    message         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                    -- OPEN | INVESTIGATING | RESOLVED | FALSE_POSITIVE
    reviewed_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Front-end: AdminDashboard.tsx (fraud alerts section)
```

### `system_config`
System-wide configuration parameters.

```sql
CREATE TABLE system_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    description VARCHAR(500),
    updated_by  UUID REFERENCES users(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Examples:
-- key: "kyc_level_1_daily_limit", value: "25000.00"
-- key: "kyc_level_2_daily_limit", value: "50000.00"
-- key: "p2p_fee_percentage", value: "0.01"
-- key: "loyalty_points_per_etb", value: "0.1"
```

---

## 11. Indexes

### Performance-Critical Indexes

```sql
-- Users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wallet_id ON users(wallet_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_kyc_level ON users(kyc_level);

-- User Roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Wallets
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transactions (high-volume — optimize heavily)
CREATE INDEX idx_txn_sender ON transactions(sender_user_id);
CREATE INDEX idx_txn_recipient ON transactions(recipient_user_id);
CREATE INDEX idx_txn_reference ON transactions(reference);
CREATE INDEX idx_txn_type ON transactions(type);
CREATE INDEX idx_txn_status ON transactions(status);
CREATE INDEX idx_txn_created_at ON transactions(created_at DESC);
CREATE INDEX idx_txn_sender_created ON transactions(sender_user_id, created_at DESC);
CREATE INDEX idx_txn_flagged ON transactions(flagged) WHERE flagged = TRUE;
CREATE INDEX idx_txn_agent ON transactions(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_txn_merchant ON transactions(merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX idx_txn_idempotency ON transactions(idempotency_key);

-- Money Requests
CREATE INDEX idx_money_req_requester ON money_requests(requester_id);
CREATE INDEX idx_money_req_target ON money_requests(target_user_id);
CREATE INDEX idx_money_req_status ON money_requests(status);

-- KYC
CREATE INDEX idx_kyc_user ON kyc_applications(user_id);
CREATE INDEX idx_kyc_status ON kyc_applications(status);

-- Agents
CREATE INDEX idx_agents_code ON agents(code);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_location ON agents(latitude, longitude);
CREATE INDEX idx_agents_super ON agents(super_agent_id);

-- Agent Commissions
CREATE INDEX idx_agent_comm_agent ON agent_commissions(agent_id);
CREATE INDEX idx_agent_comm_created ON agent_commissions(created_at DESC);

-- Merchants
CREATE INDEX idx_merchants_category ON merchants(category);
CREATE INDEX idx_merchants_merchant_id ON merchants(merchant_id);

-- Savings Goals
CREATE INDEX idx_savings_user ON savings_goals(user_id);
CREATE INDEX idx_savings_status ON savings_goals(status);

-- Loans
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(next_due_date);
CREATE INDEX idx_loans_reference ON loans(reference);

-- Loyalty
CREATE INDEX idx_loyalty_user ON loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_history_user ON loyalty_history(user_id);
CREATE INDEX idx_loyalty_history_created ON loyalty_history(created_at DESC);

-- Notifications
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- Audit Log
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- Fraud Alerts
CREATE INDEX idx_fraud_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_created ON fraud_alerts(created_at DESC);

-- OTP
CREATE INDEX idx_otp_user ON otp_verifications(user_id);
CREATE INDEX idx_otp_phone_purpose ON otp_verifications(phone, purpose);

-- Sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(refresh_token);
```

---

## 12. JPA Entity Samples

### User Entity

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    @Column(name = "wallet_id", nullable = false, unique = true, length = 30)
    private String walletId;

    @Column(name = "kyc_level", nullable = false)
    private Short kycLevel = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Wallet wallet;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private Set<UserRole> roles;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private LoyaltyAccount loyaltyAccount;

    @Column(name = "daily_limit", precision = 18, scale = 2)
    private BigDecimal dailyLimit = new BigDecimal("25000.00");

    @Column(name = "monthly_limit", precision = 18, scale = 2)
    private BigDecimal monthlyLimit = new BigDecimal("100000.00");

    @Column(name = "failed_pin_attempts")
    private Short failedPinAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    // getters, setters...
}
```

### Transaction Entity

```java
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id")
    private User recipient;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(precision = 18, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "counterparty_name", length = 200)
    private String counterpartyName;

    @Column(length = 500)
    private String note;

    @Column(name = "loyalty_points_earned")
    private Integer loyaltyPointsEarned = 0;

    @Column(name = "balance_after", precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(nullable = false)
    private Boolean flagged = false;

    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    // getters, setters...
}
```

### Wallet Entity

```java
@Entity
@Table(name = "wallets")
public class Wallet {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "main_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal mainBalance = BigDecimal.ZERO;

    @Column(name = "savings_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal savingsBalance = BigDecimal.ZERO;

    @Column(name = "loan_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal loanBalance = BigDecimal.ZERO;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    // getters, setters...
}
```

---

## 13. Migration Strategy

### Recommended: Flyway

Use [Flyway](https://flywaydb.org/) for versioned database migrations:

```
src/main/resources/db/migration/
├── V1__create_users_and_roles.sql
├── V2__create_wallets.sql
├── V3__create_transactions.sql
├── V4__create_kyc_tables.sql
├── V5__create_agents_merchants.sql
├── V6__create_savings_loans.sql
├── V7__create_loyalty_tables.sql
├── V8__create_billers_airtime.sql
├── V9__create_notifications_audit.sql
├── V10__create_indexes.sql
├── V11__seed_billers.sql
├── V12__seed_operators_bundles.sql
├── V13__seed_redemption_catalog.sql
├── V14__seed_system_config.sql
```

### Spring Boot Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/globalpay
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate        # Flyway manages schema
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc.batch_size: 50
  flyway:
    enabled: true
    locations: classpath:db/migration
```

### Seed Data

```sql
-- V11__seed_billers.sql
INSERT INTO billers (id, name, category, icon, description, is_popular, requires_account_number) VALUES
    (gen_random_uuid(), 'Ethio Telecom', 'TELECOM', '📱', 'Mobile Airtime & Data', true, true),
    (gen_random_uuid(), 'Ethiopian Electric Utility', 'UTILITY', '⚡', 'Electricity bill', true, true),
    (gen_random_uuid(), 'Addis Ababa Water', 'WATER', '💧', 'Water & sewerage', false, true),
    (gen_random_uuid(), 'EthioSat TV', 'TV', '📺', 'Satellite subscription', false, true),
    (gen_random_uuid(), 'EOTC School Fees', 'EDUCATION', '🎓', 'School & university fees', false, true),
    (gen_random_uuid(), 'Internet (ETC)', 'TELECOM', '🌐', 'Fixed broadband', false, true),
    (gen_random_uuid(), 'Addis Gas', 'UTILITY', '🔥', 'LPG gas payment', false, true),
    (gen_random_uuid(), 'Nib Insurance', 'UTILITY', '🛡️', 'Insurance premium', false, true);

-- V12__seed_operators_bundles.sql
INSERT INTO telecom_operators (id, name, icon) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ethio Telecom', '📱'),
    ('22222222-2222-2222-2222-222222222222', 'Safaricom ET', '🟢');

INSERT INTO airtime_bundles (id, operator_id, name, price, validity, type, sort_order) VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '50 MB Data', 5.00, '1 day', 'DATA', 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '1 GB Data', 25.00, '7 days', 'DATA', 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '5 GB Data', 85.00, '30 days', 'DATA', 3),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ETB 10 Airtime', 10.00, 'No expiry', 'AIRTIME', 4),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ETB 50 Airtime', 50.00, 'No expiry', 'AIRTIME', 5),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ETB 100 Airtime', 100.00, 'No expiry', 'AIRTIME', 6),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '200 MB Data', 10.00, '3 days', 'DATA', 1),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '2 GB Data', 45.00, '30 days', 'DATA', 2),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'ETB 20 Airtime', 20.00, 'No expiry', 'AIRTIME', 3);

-- V13__seed_redemption_catalog.sql
INSERT INTO redemption_catalog (id, name, icon, points_cost, reward_type, reward_value, min_tier) VALUES
    (gen_random_uuid(), 'ETB 10 Cashback', '💵', 200, 'CASHBACK', 10.00, NULL),
    (gen_random_uuid(), '1 GB Data Bundle', '📱', 500, 'DATA_BUNDLE', NULL, NULL),
    (gen_random_uuid(), 'ETB 50 Cashback', '💰', 1000, 'CASHBACK', 50.00, NULL),
    (gen_random_uuid(), 'Free Bill Payment', '📄', 800, 'FREE_BILL', NULL, NULL),
    (gen_random_uuid(), '0% Loan Discount', '🏦', 2000, 'LOAN_DISCOUNT', NULL, 'GOLD'),
    (gen_random_uuid(), 'Priority Support', '⭐', 3000, 'PRIORITY_SUPPORT', NULL, 'PLATINUM');

-- V14__seed_system_config.sql
INSERT INTO system_config (key, value, description) VALUES
    ('kyc_level_1_daily_limit', '25000.00', 'Daily transaction limit for KYC Level 1'),
    ('kyc_level_2_daily_limit', '50000.00', 'Daily transaction limit for KYC Level 2'),
    ('kyc_level_1_monthly_limit', '100000.00', 'Monthly limit for KYC Level 1'),
    ('kyc_level_2_monthly_limit', '200000.00', 'Monthly limit for KYC Level 2'),
    ('p2p_fee_flat', '2.50', 'Flat fee for P2P transfers'),
    ('agent_commission_rate', '0.003', 'Agent commission rate (0.3%)'),
    ('agent_min_commission', '2.00', 'Minimum agent commission per transaction'),
    ('loyalty_points_per_etb', '0.1', 'Points earned per ETB transacted'),
    ('loyalty_point_value_etb', '0.05', 'ETB value of one loyalty point'),
    ('max_failed_pin_attempts', '5', 'Lock account after N failed PIN attempts'),
    ('pin_lockout_duration_minutes', '30', 'Account lockout duration'),
    ('otp_validity_seconds', '300', 'OTP validity window (5 minutes)'),
    ('cash_in_fee', '5.00', 'Cash-in service fee'),
    ('cash_out_fee', '5.00', 'Cash-out service fee');
```

---

## Table Summary

| # | Table | Purpose | Relationships |
|---|---|---|---|
| 1 | `users` | User accounts | → wallets, user_roles, contacts, transactions, savings, loans, loyalty |
| 2 | `user_roles` | RBAC roles | → users |
| 3 | `user_sessions` | JWT refresh tokens | → users |
| 4 | `contacts` | Saved contacts | → users (owner + contact) |
| 5 | `wallets` | Balance management | → users (1:1) |
| 6 | `transactions` | Central ledger | → users (sender/recipient), agents, merchants, billers |
| 7 | `money_requests` | P2P money requests | → users (requester/target), transactions |
| 8 | `otp_verifications` | OTP codes | → users |
| 9 | `kyc_applications` | KYC upgrades | → users (applicant + reviewer) |
| 10 | `agents` | Agent/Super-agent | → users, agents (self-ref for super) |
| 11 | `agent_float_history` | Float change log | → agents |
| 12 | `agent_float_requests` | Float top-up requests | → agents (agent + super) |
| 13 | `agent_commissions` | Commission records | → agents, transactions |
| 14 | `merchants` | Merchant directory | → users |
| 15 | `savings_goals` | User savings goals | → users |
| 16 | `loans` | Micro-loans | → users, transactions |
| 17 | `loan_repayments` | Repayment records | → loans, transactions |
| 18 | `credit_scores` | AI credit scoring | → users |
| 19 | `loyalty_accounts` | Points & tier | → users (1:1) |
| 20 | `loyalty_history` | Points log | → users, transactions |
| 21 | `redemption_catalog` | Available rewards | standalone |
| 22 | `redemptions` | Redemption history | → users, redemption_catalog |
| 23 | `billers` | Bill payment providers | standalone |
| 24 | `telecom_operators` | Telecom operators | standalone |
| 25 | `airtime_bundles` | Airtime/data bundles | → telecom_operators |
| 26 | `notifications` | User notifications | → users |
| 27 | `audit_log` | System audit trail | → users (actor) |
| 28 | `fraud_alerts` | AI fraud detection | → users, transactions |
| 29 | `emoney_trust_account` | E-money regulatory | standalone |
| 30 | `emoney_distribution` | Float distribution | standalone |
| 31 | `system_config` | System settings | → users (updater) |

**Total: 31 tables**

---

*Document generated for GlobalPay Spring Boot backend development. All tables derived from front-end data models, API contract, and regulatory requirements.*
