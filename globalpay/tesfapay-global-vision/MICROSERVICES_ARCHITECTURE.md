# GlobalPay — Microservices Architecture Guide

> **Audience:** Java / Spring Boot architects and DevOps engineers  
> **Version:** 1.0.0  
> **Last Updated:** 2026-03-19  
> **Related Docs:** `API_CONTRACT.md`, `DATABASE_SCHEMA.md`, `DEVELOPER_GUIDE.md`, `POSTMAN_COLLECTION.json`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Microservice Inventory](#2-microservice-inventory)
3. [Service Boundaries & Responsibilities](#3-service-boundaries--responsibilities)
4. [Inter-Service Communication](#4-inter-service-communication)
5. [API Gateway Configuration](#5-api-gateway-configuration)
6. [Service Discovery & Registration](#6-service-discovery--registration)
7. [Database Strategy (Database-per-Service)](#7-database-strategy)
8. [Event-Driven Architecture](#8-event-driven-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Topology](#10-deployment-topology)
11. [Observability & Monitoring](#11-observability--monitoring)
12. [Resilience Patterns](#12-resilience-patterns)
13. [Front-End to Service Mapping](#13-front-end-to-service-mapping)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Wallet   │  │  Agent   │  │  Admin   │  │  PWA / Capacitor │   │
│  │  (React)  │  │  (React) │  │  (React) │  │  (Mobile Native) │   │
│  └─────┬─────┘  └─────┬────┘  └─────┬────┘  └────────┬─────────┘  │
│        └───────────────┼─────────────┼────────────────┘            │
└────────────────────────┼─────────────┼─────────────────────────────┘
                         │   HTTPS/WSS │
                    ┌────▼─────────────▼────┐
                    │    API GATEWAY         │
                    │  (Spring Cloud Gateway)│
                    │  Port: 8080           │
                    └────┬──────────────────┘
                         │
          ┌──────────────┼──────────────────────────────────┐
          │              │    SERVICE MESH                   │
          │  ┌───────────▼───────────┐                      │
          │  │   Eureka / Consul     │                      │
          │  │   Service Registry    │                      │
          │  └───────────────────────┘                      │
          │                                                 │
  ┌───────┼──────┬──────────┬──────────┬──────────┐        │
  │       │      │          │          │          │        │
  ▼       ▼      ▼          ▼          ▼          ▼        │
┌────┐ ┌─────┐ ┌─────┐ ┌────────┐ ┌───────┐ ┌───────┐   │
│Auth│ │User │ │Wall-│ │Transfer│ │Payment│ │Agent  │   │
│Svc │ │& KYC│ │ et  │ │  Svc   │ │  Svc  │ │  Svc  │   │
└──┬─┘ └──┬──┘ └──┬──┘ └───┬────┘ └───┬───┘ └───┬───┘   │
   │      │       │        │          │         │        │
   │   ┌──┴──┐ ┌──┴──┐ ┌──┴──┐   ┌──┴──┐  ┌──┴──┐    │
   │   │Save │ │Loan │ │Loyal│   │Notif│  │Admin│    │
   │   │ Svc │ │ Svc │ │ Svc │   │ Svc │  │ Svc │    │
   │   └─────┘ └─────┘ └─────┘   └─────┘  └─────┘    │
   │                                                    │
   │  ┌─────────────────────────────────────────────┐  │
   └──►        Apache Kafka / RabbitMQ              │  │
      │        (Event Bus)                          │  │
      └─────────────────────────────────────────────┘  │
          │                                             │
      ┌───▼─────────────────────────────────────┐      │
      │   PostgreSQL 15+ (per-service schemas)  │      │
      │   Redis (caching / sessions)            │      │
      │   MinIO / S3 (file storage)             │      │
      └─────────────────────────────────────────┘      │
      └────────────────────────────────────────────────┘
```

---

## 2. Microservice Inventory

| # | Service Name | Port | Spring Boot Artifact | Primary DB Schema | Owner Team |
|---|---|---|---|---|---|
| 1 | **gp-auth-service** | 8081 | `gp-auth` | `auth_db` | Platform |
| 2 | **gp-user-service** | 8082 | `gp-user` | `user_db` | Platform |
| 3 | **gp-wallet-service** | 8083 | `gp-wallet` | `wallet_db` | Core Banking |
| 4 | **gp-transfer-service** | 8084 | `gp-transfer` | `transfer_db` | Core Banking |
| 5 | **gp-payment-service** | 8085 | `gp-payment` | `payment_db` | Payments |
| 6 | **gp-savings-service** | 8086 | `gp-savings` | `savings_db` | Products |
| 7 | **gp-loan-service** | 8087 | `gp-loan` | `loan_db` | Products |
| 8 | **gp-loyalty-service** | 8088 | `gp-loyalty` | `loyalty_db` | Products |
| 9 | **gp-agent-service** | 8089 | `gp-agent` | `agent_db` | Distribution |
| 10 | **gp-admin-service** | 8090 | `gp-admin` | `admin_db` | Operations |
| 11 | **gp-notification-service** | 8091 | `gp-notification` | `notification_db` | Platform |
| 12 | **gp-gateway** | 8080 | `gp-gateway` | — | Platform |
| 13 | **gp-discovery** | 8761 | `gp-discovery` | — | Platform |
| 14 | **gp-config** | 8888 | `gp-config` | — | Platform |

---

## 3. Service Boundaries & Responsibilities

### 3.1 gp-auth-service (Authentication & Authorization)

**Bounded Context:** Identity verification, token management, OTP lifecycle

```
Responsibilities:
├── User registration (phone + MPIN)
├── OTP generation & verification (SMS via Twilio/Africa's Talking)
├── JWT access & refresh token issuance
├── Token validation endpoint (called by Gateway)
├── MPIN change & reset flow
└── Session management & device fingerprinting
```

**Database Tables:** `users` (auth fields only), `otp_codes`, `refresh_tokens`, `device_sessions`

**API Endpoints (from API_CONTRACT.md):**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Begin registration |
| POST | `/auth/verify-otp` | Verify phone OTP |
| POST | `/auth/login` | MPIN login |
| POST | `/auth/refresh` | Refresh JWT tokens |
| POST | `/auth/logout` | Invalidate tokens |
| PUT | `/auth/change-pin` | Change MPIN |

**Front-end References:**
- `src/pages/LoginPage.tsx` — MPIN login form
- `src/pages/Onboarding.tsx` — Registration + OTP flow

**Spring Boot Implementation:**
```java
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private AuthService authService;
    @Autowired private OtpService otpService;
    @Autowired private JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(
            @Valid @RequestBody RegistrationRequest request) {
        return ResponseEntity.status(201)
            .body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

---

### 3.2 gp-user-service (User Profile & KYC)

**Bounded Context:** User identity data, KYC document lifecycle, profile management

```
Responsibilities:
├── User profile CRUD
├── KYC document upload & storage (MinIO/S3)
├── KYC level management (Level 0 → 1 → 2 → 3)
├── KYC approval workflow (Maker-Checker)
├── Admin user search & management
└── User status management (active/suspended/blocked)
```

**Database Tables:** `users` (profile fields), `kyc_documents`, `kyc_verifications`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Current user profile |
| PUT | `/users/me` | Update profile |
| POST | `/kyc/upgrade` | Submit KYC documents |
| GET | `/kyc/status` | Check KYC level |
| GET | `/admin/users` | List all users (admin) |
| PUT | `/admin/users/{id}/status` | Change user status |
| GET | `/admin/kyc/pending` | Pending KYC reviews |
| PUT | `/admin/kyc/{id}/approve` | Approve KYC |

**Front-end References:**
- `src/pages/wallet/UserProfile.tsx` — Profile display & edit
- `src/pages/wallet/KYCUpgrade.tsx` — Document upload flow
- `src/pages/admin/AdminUsers.tsx` — User management console
- `src/pages/admin/AdminKYC.tsx` — KYC approval queue

---

### 3.3 gp-wallet-service (Wallet & Balance)

**Bounded Context:** Account management, balance operations, e-money issuance, trust account oversight

```
Responsibilities:
├── Wallet creation & activation
├── Balance inquiry (real-time)
├── Credit / Debit operations (internal API only)
├── E-money issuance & redemption
├── Trust account reconciliation
├── Float management for agents
├── Transaction ledger (double-entry)
└── Daily settlement & EOD processing
```

**Database Tables:** `wallets`, `wallet_transactions` (ledger), `trust_accounts`, `e_money_issuances`, `float_accounts`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/wallets/me` | My wallet balance |
| GET | `/wallets/me/mini-statement` | Last 5 transactions |
| POST | `/wallets/credit` | Credit wallet (internal) |
| POST | `/wallets/debit` | Debit wallet (internal) |
| GET | `/admin/e-money/summary` | E-money dashboard |
| POST | `/admin/e-money/issue` | Issue e-money |
| GET | `/admin/trust-account` | Trust account balance |

**Front-end References:**
- `src/pages/wallet/WalletHome.tsx` — Balance card, mini-statement, quick actions
- `src/pages/wallet/CashInOut.tsx` — Cash in/out initiation
- `src/pages/admin/AdminEMoney.tsx` — E-money management console

**Critical Design:** This service owns the **double-entry ledger**. Every financial operation must produce balanced debit + credit entries.

```java
@Service
@Transactional
public class LedgerService {

    public void recordTransfer(UUID fromWallet, UUID toWallet, BigDecimal amount) {
        // Debit sender
        ledgerRepo.save(new LedgerEntry(fromWallet, EntryType.DEBIT, amount));
        // Credit receiver
        ledgerRepo.save(new LedgerEntry(toWallet, EntryType.CREDIT, amount));
        // Update balances atomically
        walletRepo.decrementBalance(fromWallet, amount);
        walletRepo.incrementBalance(toWallet, amount);
    }
}
```

---

### 3.4 gp-transfer-service (P2P Transfers)

**Bounded Context:** Person-to-person money movement, transfer validation, request money flow

```
Responsibilities:
├── Send money (phone lookup → transfer)
├── Request money (create request → notify → approve/reject)
├── Transfer validation (KYC limits, daily caps, fraud checks)
├── Favorite recipients management
└── Transfer fee calculation
```

**Database Tables:** `transactions` (type=P2P), `money_requests`, `favorite_recipients`, `transfer_limits`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/transfers/send` | Send money P2P |
| POST | `/transfers/request` | Request money |
| GET | `/transfers/requests/pending` | Pending requests |
| PUT | `/transfers/requests/{id}` | Approve/reject |
| GET | `/transfers/favorites` | Favorite recipients |
| GET | `/transfers/fee-preview` | Calculate fee |

**Front-end References:**
- `src/pages/wallet/SendMoney.tsx` — Send money form (phone/amount/note)
- `src/pages/wallet/RequestMoney.tsx` — Request money flow

**Inter-service Calls:**
```
Transfer Service → User Service     : Validate recipient phone exists
Transfer Service → Wallet Service   : Debit sender, Credit receiver
Transfer Service → Notification Svc : Send SMS/push to both parties
Transfer Service → Kafka            : Publish TransferCompleted event
```

---

### 3.5 gp-payment-service (Bills, Airtime, Merchant)

**Bounded Context:** Third-party payment processing — billers, telcos, merchants

```
Responsibilities:
├── Bill payment (utility companies, TV, internet)
├── Airtime & data top-up (Ethio Telecom, Safaricom)
├── Merchant QR code payment
├── Biller catalog management
├── Payment status tracking
└── Reconciliation with external providers
```

**Database Tables:** `transactions` (type=BILL/AIRTIME/MERCHANT), `billers`, `merchant_profiles`, `qr_codes`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/bills/categories` | Biller categories |
| GET | `/bills/providers/{cat}` | Providers list |
| POST | `/bills/pay` | Pay a bill |
| POST | `/airtime/topup` | Buy airtime |
| GET | `/airtime/packages` | Data packages |
| POST | `/merchant/pay` | QR merchant payment |
| GET | `/merchant/lookup/{qr}` | Decode QR → merchant info |

**Front-end References:**
- `src/pages/wallet/PayBills.tsx` — Bill payment with category selection
- `src/pages/wallet/AirtimeTopup.tsx` — Airtime/data purchase
- `src/pages/wallet/MerchantPay.tsx` — QR scan → pay merchant

**External Integrations:**
```
Payment Service → Ethio Telecom API  : Airtime/data vending
Payment Service → EELPA API          : Electricity bill posting
Payment Service → Bank Switch        : Interbank settlements
```

---

### 3.6 gp-savings-service (Savings Goals)

**Bounded Context:** Goal-based savings, auto-deductions, interest accrual

```
Responsibilities:
├── Create/manage savings goals
├── Manual deposits & withdrawals
├── Auto-deduction scheduling (weekly/monthly)
├── Interest calculation & posting
├── Goal completion notifications
└── Savings analytics & projections
```

**Database Tables:** `savings_goals`, `savings_transactions`, `auto_deduction_schedules`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/savings/goals` | List my goals |
| POST | `/savings/goals` | Create goal |
| POST | `/savings/goals/{id}/deposit` | Add money |
| POST | `/savings/goals/{id}/withdraw` | Withdraw |
| DELETE | `/savings/goals/{id}` | Close goal |

**Front-end References:**
- `src/pages/wallet/SavingsGoals.tsx` — Goal cards, progress bars, deposit/withdraw modals

---

### 3.7 gp-loan-service (Micro-Loans)

**Bounded Context:** Credit scoring, loan origination, disbursement, repayment

```
Responsibilities:
├── AI credit scoring (transaction history analysis)
├── Loan eligibility check
├── Loan application & approval
├── Disbursement to wallet
├── Repayment scheduling & tracking
├── Late payment penalties
└── Loan portfolio reporting (admin)
```

**Database Tables:** `loans`, `loan_repayments`, `credit_scores`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/loans/eligibility` | Check eligibility + AI score |
| POST | `/loans/apply` | Apply for loan |
| GET | `/loans/active` | My active loans |
| POST | `/loans/{id}/repay` | Make repayment |
| GET | `/loans/{id}/schedule` | Repayment schedule |

**Front-end References:**
- `src/pages/wallet/MicroLoan.tsx` — Eligibility check, apply, repayment UI

---

### 3.8 gp-loyalty-service (Loyalty & Rewards)

**Bounded Context:** Points accrual, tier management, rewards catalog, redemption

```
Responsibilities:
├── Points calculation per transaction type
├── Tier progression (Bronze → Silver → Gold → Platinum)
├── Rewards catalog management
├── Points redemption (airtime, discounts, merchandise)
├── Streak tracking & bonus multipliers
└── Referral bonus processing
```

**Database Tables:** `loyalty_points`, `loyalty_tiers`, `rewards_catalog`, `point_redemptions`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/loyalty/points` | My points & tier |
| GET | `/loyalty/rewards` | Rewards catalog |
| POST | `/loyalty/redeem` | Redeem points |
| GET | `/loyalty/history` | Points history |

**Front-end References:**
- `src/pages/wallet/LoyaltyRewards.tsx` — Points display, tier progress, rewards catalog

---

### 3.9 gp-agent-service (Agent Portal)

**Bounded Context:** Agent operations, cash management, commission, customer onboarding

```
Responsibilities:
├── Agent registration & KYC
├── Cash-in processing (customer deposits)
├── Cash-out processing (customer withdrawals)
├── Float management & requests
├── Commission calculation & payout
├── Customer onboarding (assisted registration)
├── Agent performance tracking
└── Agent hierarchy (super-agent → sub-agent)
```

**Database Tables:** `agents`, `agent_transactions`, `agent_commissions`, `agent_float`, `agent_customers`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/agents/cash-in` | Process cash-in |
| POST | `/agents/cash-out` | Process cash-out |
| GET | `/agents/me/dashboard` | Agent stats |
| GET | `/agents/me/float` | Float balance |
| POST | `/agents/me/float/request` | Request float top-up |
| GET | `/agents/me/commissions` | Commission history |
| GET | `/agents/me/customers` | My customers |
| POST | `/agents/onboard-customer` | Assisted registration |

**Front-end References:**
- `src/pages/agent/AgentHome.tsx` — Dashboard with daily stats
- `src/pages/agent/AgentCashIn.tsx` — Cash-in form (phone → amount → confirm)
- `src/pages/agent/AgentCashOut.tsx` — Cash-out with OTP verification
- `src/pages/agent/AgentFloat.tsx` — Float balance & request top-up
- `src/pages/agent/AgentCommission.tsx` — Commission summary
- `src/pages/agent/AgentCustomers.tsx` — Customer list
- `src/pages/agent/AgentOnboarding.tsx` — Assisted customer registration
- `src/pages/agent/AgentProfile.tsx` — Agent profile
- `src/pages/admin/AdminAgents.tsx` — Admin agent management

---

### 3.10 gp-admin-service (Admin Console & Analytics)

**Bounded Context:** System monitoring, reporting, analytics, configuration

```
Responsibilities:
├── System-wide dashboard (KPIs, charts)
├── Transaction monitoring & search
├── User/agent management (delegates to user/agent services)
├── Report generation (PDF/CSV)
├── Analytics aggregation
├── System configuration
├── Audit log viewing
└── Maker-Checker approval workflows
```

**Database Tables:** `audit_logs`, `system_configs`, `reports`, `maker_checker_requests`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | System KPIs |
| GET | `/admin/transactions` | All transactions (paginated) |
| GET | `/admin/analytics/trends` | Transaction trends |
| GET | `/admin/analytics/demographics` | User demographics |
| POST | `/admin/reports/generate` | Generate report |
| GET | `/admin/reports/{id}/download` | Download report |

**Front-end References:**
- `src/pages/admin/AdminDashboard.tsx` — KPI cards, charts
- `src/pages/admin/AdminTransactions.tsx` — Transaction search & monitoring
- `src/pages/admin/AdminAnalytics.tsx` — Analytics charts
- `src/pages/admin/AdminReports.tsx` — Report generation

---

### 3.11 gp-notification-service (Notifications)

**Bounded Context:** Multi-channel messaging — SMS, push, in-app, email

```
Responsibilities:
├── SMS delivery (OTP, transaction alerts)
├── Push notifications (FCM/APNS)
├── In-app notification feed
├── Email notifications (statements, marketing)
├── Template management
├── Delivery status tracking
└── Notification preferences
```

**Database Tables:** `notifications`, `notification_templates`, `notification_preferences`, `delivery_logs`

**Front-end References:**
- `src/components/TesfaAI.tsx` — AI assistant (consumes notification events)
- All transaction pages — trigger notifications on completion

---

## 4. Inter-Service Communication

### 4.1 Synchronous (REST / gRPC)

Used for **real-time operations** where the caller needs an immediate response.

```
┌─────────────┐   REST/gRPC    ┌──────────────┐
│  Transfer   │ ──────────────► │    Wallet    │
│  Service    │  POST /credit  │   Service    │
│             │ ◄────────────── │              │
│             │   200 OK       │              │
└─────────────┘                └──────────────┘
```

**Call Matrix (Synchronous):**

| Caller | Callee | Operation | Protocol |
|--------|--------|-----------|----------|
| Gateway | Auth Service | Token validation | gRPC (low latency) |
| Transfer Svc | User Svc | Validate recipient | REST |
| Transfer Svc | Wallet Svc | Debit + Credit | REST (saga) |
| Payment Svc | Wallet Svc | Debit wallet | REST |
| Agent Svc | Wallet Svc | Cash-in credit | REST |
| Agent Svc | User Svc | Customer lookup | REST |
| Loan Svc | Wallet Svc | Loan disbursement | REST |
| Savings Svc | Wallet Svc | Auto-deduction | REST |
| Admin Svc | All services | Aggregated queries | REST |

**Spring Cloud OpenFeign Example:**
```java
// In gp-transfer-service
@FeignClient(name = "gp-wallet-service")
public interface WalletClient {

    @PostMapping("/wallets/credit")
    ResponseEntity<Void> creditWallet(@RequestBody CreditRequest request);

    @PostMapping("/wallets/debit")
    ResponseEntity<Void> debitWallet(@RequestBody DebitRequest request);
}

@FeignClient(name = "gp-user-service")
public interface UserClient {

    @GetMapping("/users/phone/{phone}")
    ResponseEntity<UserDTO> findByPhone(@PathVariable String phone);
}
```

### 4.2 Asynchronous (Event-Driven via Kafka)

Used for **eventual consistency**, analytics, and cross-cutting concerns.

```
┌─────────────┐                 ┌─────────────────┐
│  Transfer   │  TransferEvent  │                  │
│  Service    │ ───────────────► │   Apache Kafka   │
└─────────────┘                 │                  │
                                └──┬──────┬──────┬─┘
                                   │      │      │
                          ┌────────▼┐  ┌──▼───┐ ┌▼──────────┐
                          │Notifica-│  │Loyal-│ │Analytics  │
                          │tion Svc │  │ty Svc│ │(Admin Svc)│
                          └─────────┘  └──────┘ └───────────┘
```

**Kafka Topics:**

| Topic | Producer | Consumers | Payload |
|-------|----------|-----------|---------|
| `user.registered` | Auth Svc | User Svc, Notification Svc, Loyalty Svc | `{userId, phone, timestamp}` |
| `user.kyc.approved` | User Svc | Wallet Svc (upgrade limits), Notification Svc | `{userId, kycLevel}` |
| `transfer.completed` | Transfer Svc | Notification Svc, Loyalty Svc, Admin Svc | `{txnId, from, to, amount}` |
| `payment.completed` | Payment Svc | Notification Svc, Loyalty Svc, Admin Svc | `{txnId, type, amount, biller}` |
| `loan.disbursed` | Loan Svc | Wallet Svc, Notification Svc | `{loanId, userId, amount}` |
| `loan.repaid` | Loan Svc | Wallet Svc, Notification Svc | `{loanId, amount, remaining}` |
| `agent.cashin` | Agent Svc | Wallet Svc, Notification Svc, Admin Svc | `{agentId, customerId, amount}` |
| `agent.cashout` | Agent Svc | Wallet Svc, Notification Svc, Admin Svc | `{agentId, customerId, amount}` |
| `savings.deposited` | Savings Svc | Wallet Svc, Notification Svc | `{goalId, amount}` |
| `audit.event` | All services | Admin Svc | `{service, action, userId, data}` |

**Spring Kafka Producer:**
```java
@Service
public class TransferEventPublisher {

    @Autowired private KafkaTemplate<String, TransferEvent> kafka;

    public void publishTransferCompleted(TransferEvent event) {
        kafka.send("transfer.completed", event.getTxnId(), event);
    }
}
```

**Spring Kafka Consumer:**
```java
@Service
public class LoyaltyEventListener {

    @KafkaListener(topics = "transfer.completed", groupId = "loyalty-service")
    public void onTransferCompleted(TransferEvent event) {
        // Award points for completed transfer
        loyaltyService.awardPoints(event.getSenderId(), PointRule.P2P_TRANSFER);
    }
}
```

---

## 5. API Gateway Configuration

### 5.1 Spring Cloud Gateway Setup

```yaml
# gp-gateway/src/main/resources/application.yml
server:
  port: 8080

spring:
  application:
    name: gp-gateway
  cloud:
    gateway:
      default-filters:
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 50
            redis-rate-limiter.burstCapacity: 100
        - name: CircuitBreaker
          args:
            name: default
            fallbackUri: forward:/fallback

      routes:
        # ── Auth Service ──
        - id: auth-service
          uri: lb://gp-auth-service
          predicates:
            - Path=/v1/auth/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20

        # ── User & KYC Service ──
        - id: user-service
          uri: lb://gp-user-service
          predicates:
            - Path=/v1/users/**, /v1/kyc/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Wallet Service ──
        - id: wallet-service
          uri: lb://gp-wallet-service
          predicates:
            - Path=/v1/wallets/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Transfer Service ──
        - id: transfer-service
          uri: lb://gp-transfer-service
          predicates:
            - Path=/v1/transfers/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Payment Service ──
        - id: payment-service
          uri: lb://gp-payment-service
          predicates:
            - Path=/v1/bills/**, /v1/airtime/**, /v1/merchant/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Savings Service ──
        - id: savings-service
          uri: lb://gp-savings-service
          predicates:
            - Path=/v1/savings/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Loan Service ──
        - id: loan-service
          uri: lb://gp-loan-service
          predicates:
            - Path=/v1/loans/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Loyalty Service ──
        - id: loyalty-service
          uri: lb://gp-loyalty-service
          predicates:
            - Path=/v1/loyalty/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter

        # ── Agent Service ──
        - id: agent-service
          uri: lb://gp-agent-service
          predicates:
            - Path=/v1/agents/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter
            - AgentRoleFilter

        # ── Admin Service ──
        - id: admin-service
          uri: lb://gp-admin-service
          predicates:
            - Path=/v1/admin/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter
            - AdminRoleFilter

        # ── Transaction History (routed to Wallet) ──
        - id: transaction-history
          uri: lb://gp-wallet-service
          predicates:
            - Path=/v1/transactions/**
          filters:
            - StripPrefix=1
            - JwtAuthFilter
```

### 5.2 Custom Gateway Filters

```java
@Component
public class JwtAuthFilter implements GatewayFilterFactory<JwtAuthFilter.Config> {

    @Autowired private JwtValidator jwtValidator;

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String token = extractToken(exchange.getRequest());
            if (token == null || !jwtValidator.validate(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            // Add user claims as headers for downstream services
            Claims claims = jwtValidator.parse(token);
            ServerHttpRequest mutated = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
                .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        };
    }
}
```

### 5.3 CORS Configuration

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("https://tesfapay-global-vision.lovable.app");
        config.addAllowedOrigin("https://globalpay.et");
        config.addAllowedOrigin("capacitor://localhost");  // Capacitor mobile
        config.addAllowedOrigin("http://localhost:5173");  // Vite dev
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
```

---

## 6. Service Discovery & Registration

### 6.1 Eureka Server (gp-discovery)

```yaml
# gp-discovery/src/main/resources/application.yml
server:
  port: 8761

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: false
    eviction-interval-timer-in-ms: 5000
```

### 6.2 Service Registration (each microservice)

```yaml
# Common config for all services
eureka:
  client:
    serviceUrl:
      defaultZone: http://gp-discovery:8761/eureka/
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30
    metadata-map:
      version: ${APP_VERSION:1.0.0}
```

---

## 7. Database Strategy

### 7.1 Database-per-Service Pattern

Each microservice owns its database schema. **No direct cross-database queries.**

```
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL 15+ Cluster                  │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ auth_db  │ │ user_db  │ │wallet_db │ │transfer_ │  │
│  │          │ │          │ │          │ │   db     │  │
│  │ • users  │ │ • users  │ │ • wallets│ │ • txns   │  │
│  │   (auth) │ │   (prof) │ │ • ledger │ │ • reqs   │  │
│  │ • otps   │ │ • kyc    │ │ • trust  │ │ • favs   │  │
│  │ • tokens │ │ • docs   │ │ • float  │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │payment_db│ │savings_db│ │ loan_db  │ │loyalty_db│  │
│  │          │ │          │ │          │ │          │  │
│  │ • txns   │ │ • goals  │ │ • loans  │ │ • points │  │
│  │ • billers│ │ • sched  │ │ • repay  │ │ • tiers  │  │
│  │ • merch  │ │ • auto   │ │ • scores │ │ • rewards│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ agent_db │ │ admin_db │ │notif_db  │               │
│  │          │ │          │ │          │               │
│  │ • agents │ │ • audit  │ │ • notifs │               │
│  │ • comm   │ │ • config │ │ • tmpls  │               │
│  │ • cust   │ │ • reports│ │ • prefs  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Data Consistency: Saga Pattern

For distributed transactions (e.g., P2P transfer), use the **Orchestration Saga** pattern:

```
Transfer Saga (Orchestrator in gp-transfer-service):

Step 1: Validate sender   → User Service    ✓ or FAIL
Step 2: Validate receiver  → User Service    ✓ or FAIL
Step 3: Check balance      → Wallet Service  ✓ or FAIL
Step 4: Debit sender       → Wallet Service  ✓ or COMPENSATE
Step 5: Credit receiver    → Wallet Service  ✓ or COMPENSATE (undo step 4)
Step 6: Record transaction → Transfer DB     ✓ or COMPENSATE (undo 4+5)
Step 7: Publish event      → Kafka           ✓ (fire & forget)

Compensation on failure:
  Step 5 fails → Wallet Service: refund sender (reverse step 4)
  Step 6 fails → Wallet Service: reverse both credit + debit
```

```java
@Service
public class TransferSagaOrchestrator {

    @Autowired private WalletClient walletClient;
    @Autowired private UserClient userClient;

    @Transactional
    public TransferResult executeTransfer(TransferRequest request) {
        // Step 1-2: Validate parties
        UserDTO sender = userClient.findById(request.getSenderId()).getBody();
        UserDTO receiver = userClient.findByPhone(request.getReceiverPhone()).getBody();

        // Step 3-4: Debit sender
        try {
            walletClient.debitWallet(new DebitRequest(sender.getWalletId(), request.getAmount()));
        } catch (InsufficientFundsException e) {
            return TransferResult.failed("Insufficient balance");
        }

        // Step 5: Credit receiver
        try {
            walletClient.creditWallet(new CreditRequest(receiver.getWalletId(), request.getAmount()));
        } catch (Exception e) {
            // COMPENSATE: Refund sender
            walletClient.creditWallet(new CreditRequest(sender.getWalletId(), request.getAmount()));
            return TransferResult.failed("Transfer failed, refunded");
        }

        // Step 6-7: Record & publish
        Transaction txn = recordTransaction(request, sender, receiver);
        eventPublisher.publishTransferCompleted(txn);

        return TransferResult.success(txn);
    }
}
```

### 7.3 Flyway Migrations (per service)

```
gp-wallet-service/
└── src/main/resources/
    └── db/migration/
        ├── V1__create_wallets_table.sql
        ├── V2__create_ledger_table.sql
        ├── V3__create_trust_accounts.sql
        ├── V4__add_wallet_indexes.sql
        └── V5__seed_system_wallets.sql
```

---

## 8. Event-Driven Architecture

### 8.1 Event Schema (Avro/JSON)

```json
{
  "namespace": "et.globalpay.events",
  "type": "record",
  "name": "TransferCompletedEvent",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "timestamp", "type": "long"},
    {"name": "transactionId", "type": "string"},
    {"name": "senderId", "type": "string"},
    {"name": "receiverId", "type": "string"},
    {"name": "amount", "type": "long", "doc": "Amount in cents"},
    {"name": "currency", "type": "string", "default": "ETB"},
    {"name": "type", "type": {"type": "enum", "name": "TransferType", "symbols": ["P2P", "CASH_IN", "CASH_OUT"]}},
    {"name": "metadata", "type": {"type": "map", "values": "string"}}
  ]
}
```

### 8.2 Event Flow Diagram

```
User taps "Send"          Transfer Service              Kafka
in SendMoney.tsx  ───►  POST /v1/transfers/send  ───►  transfer.completed
                              │                              │
                              ▼                              ├──► Notification Svc → SMS to sender + receiver
                         Wallet Service                      ├──► Loyalty Svc → Award 5 points
                         (debit + credit)                    ├──► Admin Svc → Update analytics
                                                             └──► Audit log consumer
```

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
┌──────────┐     POST /auth/login      ┌───────────┐
│  React   │ ───────────────────────►  │   Auth    │
│  Client  │                           │  Service  │
│          │  ◄─── JWT (access+refresh)│           │
└────┬─────┘                           └───────────┘
     │
     │  Authorization: Bearer <jwt>
     ▼
┌──────────┐    X-User-Id header    ┌───────────────┐
│  API     │ ─────────────────────► │  Downstream   │
│ Gateway  │   (after validation)   │   Service     │
└──────────┘                        └───────────────┘
```

### 9.2 JWT Token Structure

```json
{
  "sub": "user-uuid",
  "iss": "gp-auth-service",
  "iat": 1710835200,
  "exp": 1710838800,
  "role": "USER",
  "kycLevel": 2,
  "walletId": "TPY-2024-ABEBE001",
  "permissions": ["TRANSFER", "PAY_BILLS", "VIEW_BALANCE"]
}
```

### 9.3 Role-Based Access Matrix

| Role | Wallet APIs | Agent APIs | Admin APIs |
|------|------------|------------|------------|
| `USER` | ✅ Full access | ❌ | ❌ |
| `AGENT` | ✅ Own wallet | ✅ Full access | ❌ |
| `ADMIN` | ✅ Read-only | ✅ Read-only | ✅ Full access |
| `SUPER_ADMIN` | ✅ Full | ✅ Full | ✅ Full + config |

### 9.4 Encryption Standards

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| MPIN | BCrypt (12 rounds) | TLS 1.3 |
| PII (names, phone) | AES-256-GCM | TLS 1.3 |
| KYC documents | AES-256 + S3 SSE | TLS 1.3 |
| JWT tokens | — | TLS 1.3 |
| Database | PostgreSQL TDE | SSL connection |

---

## 10. Deployment Topology

### 10.1 Kubernetes Cluster Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster (EKS / GKE)               │
│                                                                 │
│  ┌─── Namespace: gp-platform ──────────────────────────────┐   │
│  │  gp-gateway (3 replicas)     ← Ingress Controller       │   │
│  │  gp-discovery (2 replicas)   ← Eureka HA                │   │
│  │  gp-config (2 replicas)      ← Config Server            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── Namespace: gp-core ──────────────────────────────────┐   │
│  │  gp-auth-service (3 replicas)                            │   │
│  │  gp-user-service (2 replicas)                            │   │
│  │  gp-wallet-service (3 replicas)     ← Critical path     │   │
│  │  gp-transfer-service (3 replicas)   ← Critical path     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── Namespace: gp-products ──────────────────────────────┐   │
│  │  gp-payment-service (2 replicas)                         │   │
│  │  gp-savings-service (2 replicas)                         │   │
│  │  gp-loan-service (2 replicas)                            │   │
│  │  gp-loyalty-service (2 replicas)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── Namespace: gp-distribution ──────────────────────────┐   │
│  │  gp-agent-service (2 replicas)                           │   │
│  │  gp-notification-service (2 replicas)                    │   │
│  │  gp-admin-service (2 replicas)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── Namespace: gp-data ─────────────────────────────────┐    │
│  │  PostgreSQL 15 (StatefulSet, 3-node HA)                 │    │
│  │  Redis Cluster (3 masters + 3 replicas)                 │    │
│  │  Apache Kafka (3 brokers + ZooKeeper)                   │    │
│  │  MinIO (object storage for KYC docs)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─── Namespace: gp-observability ─────────────────────────┐   │
│  │  Prometheus + Grafana (metrics)                          │   │
│  │  ELK Stack (Elasticsearch + Logstash + Kibana)           │   │
│  │  Jaeger (distributed tracing)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Replica & Resource Allocation

| Service | Replicas (Prod) | CPU Request | Memory | HPA Target |
|---------|----------------|-------------|--------|------------|
| gp-gateway | 3 | 500m | 512Mi | 70% CPU |
| gp-auth-service | 3 | 500m | 512Mi | 70% CPU |
| gp-wallet-service | 3 | 1000m | 1Gi | 60% CPU |
| gp-transfer-service | 3 | 1000m | 1Gi | 60% CPU |
| gp-payment-service | 2 | 500m | 512Mi | 70% CPU |
| gp-agent-service | 2 | 500m | 512Mi | 70% CPU |
| gp-notification-service | 2 | 250m | 256Mi | 80% CPU |
| Other services | 2 | 250m | 512Mi | 70% CPU |

### 10.3 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ── Infrastructure ──
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_PASSWORD: devpass
      POSTGRES_USER: globalpay
    volumes:
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init.sql
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ["9092:9092"]
    environment:
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    ports: ["2181:2181"]
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  # ── Platform Services ──
  gp-discovery:
    build: ./gp-discovery
    ports: ["8761:8761"]

  gp-config:
    build: ./gp-config
    ports: ["8888:8888"]
    depends_on: [gp-discovery]

  gp-gateway:
    build: ./gp-gateway
    ports: ["8080:8080"]
    depends_on: [gp-discovery, gp-config]

  # ── Business Services ──
  gp-auth-service:
    build: ./gp-auth-service
    ports: ["8081:8081"]
    depends_on: [postgres, redis, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/auth_db

  gp-user-service:
    build: ./gp-user-service
    ports: ["8082:8082"]
    depends_on: [postgres, minio, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/user_db

  gp-wallet-service:
    build: ./gp-wallet-service
    ports: ["8083:8083"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/wallet_db

  gp-transfer-service:
    build: ./gp-transfer-service
    ports: ["8084:8084"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/transfer_db

  gp-payment-service:
    build: ./gp-payment-service
    ports: ["8085:8085"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/payment_db

  gp-savings-service:
    build: ./gp-savings-service
    ports: ["8086:8086"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/savings_db

  gp-loan-service:
    build: ./gp-loan-service
    ports: ["8087:8087"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/loan_db

  gp-loyalty-service:
    build: ./gp-loyalty-service
    ports: ["8088:8088"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/loyalty_db

  gp-agent-service:
    build: ./gp-agent-service
    ports: ["8089:8089"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/agent_db

  gp-admin-service:
    build: ./gp-admin-service
    ports: ["8090:8090"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/admin_db

  gp-notification-service:
    build: ./gp-notification-service
    ports: ["8091:8091"]
    depends_on: [postgres, kafka, gp-discovery]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/notification_db

  # ── React Front-end ──
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports: ["3000:80"]
    depends_on: [gp-gateway]

volumes:
  pgdata:
```

### 10.4 init-databases.sql

```sql
-- Create all per-service databases
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE wallet_db;
CREATE DATABASE transfer_db;
CREATE DATABASE payment_db;
CREATE DATABASE savings_db;
CREATE DATABASE loan_db;
CREATE DATABASE loyalty_db;
CREATE DATABASE agent_db;
CREATE DATABASE admin_db;
CREATE DATABASE notification_db;
```

---

## 11. Observability & Monitoring

### 11.1 Distributed Tracing (Micrometer + Jaeger)

Every request gets a `traceId` propagated across services:

```
Frontend → Gateway → Transfer Svc → Wallet Svc → Kafka → Notification Svc
           │                                                      │
           └──────── traceId: abc-123-def-456 ────────────────────┘
```

```yaml
# Each service's application.yml
management:
  tracing:
    sampling:
      probability: 1.0  # 100% in dev, 10% in prod
  zipkin:
    tracing:
      endpoint: http://jaeger:9411/api/v2/spans
```

### 11.2 Metrics (Prometheus + Grafana)

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: ${spring.application.name}
```

**Key Dashboards:**
| Dashboard | Metrics |
|-----------|---------|
| Transaction Throughput | `gp_transfers_total`, `gp_payments_total` |
| Wallet Operations | `gp_wallet_debit_total`, `gp_wallet_credit_total` |
| Error Rates | `http_server_requests_seconds_count{status=5xx}` |
| Kafka Lag | `kafka_consumer_lag` |
| JVM Health | `jvm_memory_used`, `jvm_gc_pause` |

### 11.3 Centralized Logging (ELK)

```yaml
# logback-spring.xml pattern for all services
<pattern>
  {"timestamp":"%d","level":"%level","service":"${APP_NAME}",
   "traceId":"%X{traceId}","spanId":"%X{spanId}",
   "class":"%logger{36}","message":"%msg"}
</pattern>
```

### 11.4 Health Checks

```java
@Component
public class WalletHealthIndicator implements HealthIndicator {

    @Autowired private DataSource dataSource;
    @Autowired private KafkaTemplate<?,?> kafka;

    @Override
    public Health health() {
        try {
            dataSource.getConnection().isValid(2);
            kafka.send("health-check", "ping").get(2, TimeUnit.SECONDS);
            return Health.up()
                .withDetail("db", "connected")
                .withDetail("kafka", "connected")
                .build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

---

## 12. Resilience Patterns

### 12.1 Circuit Breaker (Resilience4j)

```java
@Service
public class TransferService {

    @CircuitBreaker(name = "walletService", fallbackMethod = "transferFallback")
    @Retry(name = "walletService", maxAttempts = 3)
    @TimeLimiter(name = "walletService")
    public CompletableFuture<TransferResult> sendMoney(TransferRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            walletClient.debitWallet(request.getDebitRequest());
            walletClient.creditWallet(request.getCreditRequest());
            return TransferResult.success();
        });
    }

    public CompletableFuture<TransferResult> transferFallback(
            TransferRequest request, Throwable t) {
        // Queue for retry, notify user
        retryQueue.enqueue(request);
        return CompletableFuture.completedFuture(
            TransferResult.pending("Transfer queued, will retry shortly"));
    }
}
```

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      walletService:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 5
  retry:
    instances:
      walletService:
        maxAttempts: 3
        waitDuration: 1s
        exponentialBackoffMultiplier: 2
  timelimiter:
    instances:
      walletService:
        timeoutDuration: 5s
```

### 12.2 Rate Limiting

```yaml
# Gateway rate limiting per user
spring:
  cloud:
    gateway:
      filter:
        request-rate-limiter:
          redis-rate-limiter:
            # General API
            replenishRate: 50      # requests/second
            burstCapacity: 100
          # Sensitive endpoints (login, transfers)
          login-limiter:
            replenishRate: 5
            burstCapacity: 10
          transfer-limiter:
            replenishRate: 10
            burstCapacity: 20
```

### 12.3 Idempotency

```java
@PostMapping("/transfers/send")
public ResponseEntity<TransferResult> send(
        @RequestHeader("X-Idempotency-Key") String idempotencyKey,
        @Valid @RequestBody TransferRequest request) {

    // Check if already processed
    Optional<TransferResult> existing = idempotencyStore.get(idempotencyKey);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get());
    }

    TransferResult result = transferService.execute(request);
    idempotencyStore.save(idempotencyKey, result, Duration.ofHours(24));
    return ResponseEntity.status(201).body(result);
}
```

---

## 13. Front-End to Service Mapping

Complete mapping of every React page to the microservice(s) it depends on:

| React Component | Primary Service | Secondary Services | API Calls |
|---|---|---|---|
| `LoginPage.tsx` | Auth | — | `POST /auth/login` |
| `Onboarding.tsx` | Auth | User | `POST /auth/register`, `POST /auth/verify-otp` |
| `WalletHome.tsx` | Wallet | Transfer, Loyalty | `GET /wallets/me`, `GET /wallets/me/mini-statement` |
| `SendMoney.tsx` | Transfer | User, Wallet | `POST /transfers/send`, `GET /transfers/fee-preview` |
| `RequestMoney.tsx` | Transfer | User | `POST /transfers/request` |
| `PayBills.tsx` | Payment | Wallet | `GET /bills/categories`, `POST /bills/pay` |
| `AirtimeTopup.tsx` | Payment | Wallet | `POST /airtime/topup` |
| `MerchantPay.tsx` | Payment | Wallet | `POST /merchant/pay` |
| `SavingsGoals.tsx` | Savings | Wallet | `GET /savings/goals`, `POST /savings/goals/{id}/deposit` |
| `MicroLoan.tsx` | Loan | Wallet | `GET /loans/eligibility`, `POST /loans/apply` |
| `LoyaltyRewards.tsx` | Loyalty | — | `GET /loyalty/points`, `POST /loyalty/redeem` |
| `TransactionHistory.tsx` | Wallet | — | `GET /transactions` |
| `CashInOut.tsx` | Agent / Wallet | — | `POST /agents/cash-in`, `POST /agents/cash-out` |
| `KYCUpgrade.tsx` | User | — | `POST /kyc/upgrade` |
| `UserProfile.tsx` | User | Wallet | `GET /users/me`, `PUT /users/me` |
| `AgentHome.tsx` | Agent | Wallet | `GET /agents/me/dashboard` |
| `AgentCashIn.tsx` | Agent | Wallet, User | `POST /agents/cash-in` |
| `AgentCashOut.tsx` | Agent | Wallet, User | `POST /agents/cash-out` |
| `AgentFloat.tsx` | Agent | Wallet | `GET /agents/me/float` |
| `AgentCommission.tsx` | Agent | — | `GET /agents/me/commissions` |
| `AgentCustomers.tsx` | Agent | User | `GET /agents/me/customers` |
| `AgentOnboarding.tsx` | Agent | Auth, User | `POST /agents/onboard-customer` |
| `AgentProfile.tsx` | Agent | User | `GET /agents/me/profile` |
| `AdminDashboard.tsx` | Admin | All | `GET /admin/dashboard` |
| `AdminUsers.tsx` | Admin | User | `GET /admin/users` |
| `AdminKYC.tsx` | Admin | User | `GET /admin/kyc/pending` |
| `AdminTransactions.tsx` | Admin | Wallet | `GET /admin/transactions` |
| `AdminAgents.tsx` | Admin | Agent | `GET /admin/agents` |
| `AdminEMoney.tsx` | Admin | Wallet | `GET /admin/e-money/summary` |
| `AdminAnalytics.tsx` | Admin | All | `GET /admin/analytics/trends` |
| `AdminReports.tsx` | Admin | All | `POST /admin/reports/generate` |

---

*Document generated for the GlobalPay architecture team. Cross-reference with `API_CONTRACT.md`, `DATABASE_SCHEMA.md`, and `POSTMAN_COLLECTION.json` for implementation details.*
