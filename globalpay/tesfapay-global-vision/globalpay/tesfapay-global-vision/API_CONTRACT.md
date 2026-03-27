# GlobalPay — REST API Contract

> **For:** Spring Boot backend development team
> **Version:** 1.0.0
> **Base URL:** `https://api.globalpay.et/v1`
> **Auth:** Bearer JWT token in `Authorization` header (except `/auth/*` endpoints)
> **Currency:** All monetary values in Ethiopian Birr (ETB), represented as `BigDecimal` / integer cents
> **Date Format:** ISO-8601 (`2026-03-19T10:22:00Z`)

---

## Table of Contents

1. [Authentication & Registration](#1-authentication--registration)
2. [User Profile & KYC](#2-user-profile--kyc)
3. [Wallet & Balance](#3-wallet--balance)
4. [P2P Transfers (Send / Request Money)](#4-p2p-transfers)
5. [Bill Payments](#5-bill-payments)
6. [Airtime & Data Top-up](#6-airtime--data-top-up)
7. [Merchant Payments](#7-merchant-payments)
8. [Cash In / Cash Out](#8-cash-in--cash-out)
9. [Savings Goals](#9-savings-goals)
10. [Micro-Loans](#10-micro-loans)
11. [Loyalty & Rewards](#11-loyalty--rewards)
12. [Transaction History](#12-transaction-history)
13. [Notifications](#13-notifications)
14. [Agent Portal APIs](#14-agent-portal-apis)
15. [Admin Console APIs](#15-admin-console-apis)
16. [Common Models](#16-common-models)
17. [Error Handling](#17-error-handling)

---

## 1. Authentication & Registration

### `POST /auth/register`
Begin user registration (from `Onboarding.tsx`)

```json
// Request
{
  "phone": "+251911234567",
  "firstName": "Abebe",
  "lastName": "Girma",
  "pin": "123456"          // 6-digit MPIN, encrypted client-side
}

// Response 201
{
  "userId": "uuid",
  "walletId": "TPY-2024-ABEBE001",
  "status": "PENDING_KYC",
  "otpSent": true
}
```

### `POST /auth/verify-otp`
Verify phone number OTP

```json
// Request
{ "phone": "+251911234567", "otp": "482910" }

// Response 200
{ "verified": true, "accessToken": "jwt...", "refreshToken": "jwt..." }
```

### `POST /auth/login`
MPIN login (from `LoginPage.tsx`)

```json
// Request
{ "phone": "+251911234567", "pin": "123456" }

// Response 200
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": { "id": "uuid", "name": "Abebe Girma", "walletId": "TPY-2024-ABEBE001", "kycLevel": 1 }
}
```

### `POST /auth/login/biometric`
Biometric authentication

```json
// Request
{ "userId": "uuid", "biometricToken": "device-signed-token" }

// Response 200 — same as /auth/login
```

### `POST /auth/refresh`
Refresh JWT

```json
// Request
{ "refreshToken": "jwt..." }

// Response 200
{ "accessToken": "jwt...", "refreshToken": "jwt..." }
```

### `POST /auth/logout`
Invalidate tokens

```
// Response 204 No Content
```

---

## 2. User Profile & KYC

### `GET /users/me`
Current user profile (from `UserProfile.tsx`)

```json
// Response 200
{
  "id": "uuid",
  "firstName": "Abebe",
  "lastName": "Girma",
  "phone": "+251911234567",
  "walletId": "TPY-2024-ABEBE001",
  "kycLevel": 1,               // 1 or 2
  "loyaltyTier": "SILVER",     // BRONZE | SILVER | GOLD | PLATINUM
  "loyaltyPoints": 1240,
  "totalTransactions": 48,
  "monthlyVolume": 4200.00,
  "avatarUrl": null,
  "createdAt": "2024-01-15T08:00:00Z"
}
```

### `PUT /users/me`
Update profile

```json
// Request
{ "firstName": "Abebe", "lastName": "Girma", "notificationsEnabled": true }

// Response 200 — updated user object
```

### `POST /users/me/kyc/upgrade`
Submit KYC Level 2 application (from `KYCUpgrade.tsx`)

```json
// Request (multipart/form-data)
{
  "documentType": "FAYDA_ID",   // FAYDA_ID | PASSPORT | DRIVING_LICENSE | KEBELE_ID
  "documentFront": "<file>",    // JPEG/PNG, max 5MB
  "documentBack": "<file>",     // JPEG/PNG, max 5MB
  "selfieImage": "<file>",      // JPEG/PNG, max 5MB
  "livenessToken": "liveness-verification-token"
}

// Response 202
{
  "applicationId": "uuid",
  "status": "PROCESSING",       // PROCESSING | APPROVED | REJECTED
  "estimatedTime": "2 minutes"
}
```

### `GET /users/me/kyc/status`
Check KYC upgrade status

```json
// Response 200
{
  "kycLevel": 2,
  "status": "APPROVED",
  "dailyLimit": 50000.00,
  "monthlyLimit": 200000.00,
  "approvedAt": "2026-03-19T10:30:00Z"
}
```

---

## 3. Wallet & Balance

### `GET /wallet/balance`
Get wallet balances (from `WalletHome.tsx`)

```json
// Response 200
{
  "mainBalance": 12450.00,
  "savingsBalance": 5200.00,
  "loanBalance": 0.00,            // outstanding loan
  "loyaltyPoints": 1240,
  "loyaltyPointsValue": 62.00,    // ETB equivalent (points × 0.05)
  "currency": "ETB",
  "lastUpdated": "2026-03-19T10:22:00Z"
}
```

### `GET /wallet/summary`
Dashboard summary stats

```json
// Response 200
{
  "todayIn": 2500.00,
  "todayOut": 600.00,
  "weeklyIn": 12000.00,
  "weeklyOut": 4500.00,
  "pendingRequests": 2
}
```

---

## 4. P2P Transfers

### `GET /contacts`
Get user's contacts/favorites (from `SendMoney.tsx`, `RequestMoney.tsx`)

```json
// Response 200
{
  "contacts": [
    {
      "id": "uuid",
      "name": "Tigist Alemu",
      "phone": "+251911234567",
      "avatarInitials": "TA",
      "isFavorite": true,
      "isGlobalPayUser": true
    }
  ]
}
```

### `POST /contacts/lookup`
Look up user by phone number

```json
// Request
{ "phone": "+251911234567" }

// Response 200
{ "found": true, "name": "Tigist Alemu", "avatarInitials": "TA", "walletId": "TPY-..." }

// Response 200 (not found)
{ "found": false }
```

### `POST /transfers/send`
Send money P2P (from `SendMoney.tsx`)

```json
// Request
{
  "recipientPhone": "+251911234567",
  "amount": 250.00,
  "note": "For lunch",
  "pin": "123456"                // MPIN confirmation
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "TXN2024110001",
  "amount": 250.00,
  "fee": 2.50,
  "totalDeducted": 252.50,
  "recipientName": "Tigist Alemu",
  "status": "COMPLETED",
  "loyaltyPointsEarned": 15,
  "newBalance": 12197.50,
  "createdAt": "2026-03-19T10:22:00Z"
}
```

### `POST /transfers/request`
Request money from another user (from `RequestMoney.tsx`)

```json
// Request
{
  "fromPhone": "+251911234567",
  "amount": 500.00,
  "note": "Split dinner bill"
}

// Response 201
{
  "requestId": "uuid",
  "reference": "REQ-928371",
  "status": "PENDING",          // PENDING | ACCEPTED | DECLINED | EXPIRED
  "expiresAt": "2026-03-22T10:22:00Z"
}
```

### `GET /transfers/requests`
List pending money requests

```json
// Query: ?direction=incoming|outgoing&status=PENDING
// Response 200
{
  "requests": [
    {
      "requestId": "uuid",
      "reference": "REQ-928371",
      "fromUser": "Tigist Alemu",
      "toUser": "Abebe Girma",
      "amount": 500.00,
      "note": "Split dinner bill",
      "status": "PENDING",
      "createdAt": "2026-03-19T10:22:00Z"
    }
  ]
}
```

### `PUT /transfers/requests/{requestId}`
Accept or decline a money request

```json
// Request
{ "action": "ACCEPT", "pin": "123456" }  // ACCEPT | DECLINE

// Response 200
{ "requestId": "uuid", "status": "ACCEPTED", "transactionId": "uuid" }
```

---

## 5. Bill Payments

### `GET /billers`
List available billers (from `PayBills.tsx`)

```json
// Query: ?category=telecom|utility|water|tv|education
// Response 200
{
  "billers": [
    {
      "id": "biller-001",
      "name": "Ethio Telecom",
      "category": "TELECOM",
      "icon": "📱",
      "description": "Mobile Airtime & Data",
      "isPopular": true,
      "requiresAccountNumber": true,
      "fields": [
        { "name": "accountNumber", "label": "Account / Phone Number", "type": "text", "required": true }
      ]
    }
  ]
}
```

### `POST /billers/{billerId}/validate`
Validate biller account number

```json
// Request
{ "accountNumber": "0911234567" }

// Response 200
{ "valid": true, "accountHolder": "Abebe Girma", "outstandingAmount": 350.00 }
```

### `POST /billers/{billerId}/pay`
Pay a bill (from `PayBills.tsx`)

```json
// Request
{
  "accountNumber": "0911234567",
  "amount": 350.00,
  "pin": "123456"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "BIL-928371",
  "billerName": "Ethio Telecom",
  "amount": 350.00,
  "fee": 0.00,
  "status": "COMPLETED",
  "loyaltyPointsEarned": 10,
  "newBalance": 12100.00,
  "createdAt": "2026-03-19T10:22:00Z"
}
```

---

## 6. Airtime & Data Top-up

### `GET /airtime/operators`
List telecom operators (from `AirtimeTopup.tsx`)

```json
// Response 200
{
  "operators": [
    {
      "id": "ethio-telecom",
      "name": "Ethio Telecom",
      "icon": "📱",
      "bundles": [
        { "id": "bundle-001", "name": "50 MB Data", "price": 5.00, "validity": "1 day", "type": "DATA" },
        { "id": "bundle-002", "name": "1 GB Data", "price": 25.00, "validity": "7 days", "type": "DATA" },
        { "id": "bundle-003", "name": "ETB 10 Airtime", "price": 10.00, "validity": "No expiry", "type": "AIRTIME" },
        { "id": "bundle-004", "name": "ETB 50 Airtime", "price": 50.00, "validity": "No expiry", "type": "AIRTIME" },
        { "id": "bundle-005", "name": "ETB 100 Airtime", "price": 100.00, "validity": "No expiry", "type": "AIRTIME" }
      ]
    },
    {
      "id": "safaricom-et",
      "name": "Safaricom ET",
      "icon": "🟢",
      "bundles": [
        { "id": "bundle-010", "name": "200 MB Data", "price": 10.00, "validity": "3 days", "type": "DATA" },
        { "id": "bundle-011", "name": "2 GB Data", "price": 45.00, "validity": "30 days", "type": "DATA" },
        { "id": "bundle-012", "name": "ETB 20 Airtime", "price": 20.00, "validity": "No expiry", "type": "AIRTIME" }
      ]
    }
  ]
}
```

### `POST /airtime/topup`
Purchase airtime/data bundle (from `AirtimeTopup.tsx`)

```json
// Request
{
  "operatorId": "ethio-telecom",
  "bundleId": "bundle-003",
  "recipientPhone": "+251911234567",   // null for self
  "isSelfTopup": true,
  "pin": "123456"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "AIR-928371",
  "operatorName": "Ethio Telecom",
  "bundleName": "ETB 10 Airtime",
  "amount": 10.00,
  "validity": "No expiry",
  "status": "COMPLETED",
  "loyaltyPointsEarned": 10,
  "newBalance": 12440.00,
  "createdAt": "2026-03-19T10:22:00Z"
}
```

---

## 7. Merchant Payments

### `GET /merchants`
Search merchants (from `MerchantPay.tsx`)

```json
// Query: ?search=cafe&category=RESTAURANT
// Response 200
{
  "merchants": [
    {
      "id": "MERCH-001",
      "name": "Sheger Café",
      "category": "RESTAURANT",
      "icon": "☕",
      "location": "Bole Road, Addis Ababa"
    }
  ]
}
```

### `POST /merchants/{merchantId}/pay`
Pay a merchant (from `MerchantPay.tsx`)

```json
// Request
{
  "amount": 250.00,
  "pin": "123456"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "MRX-928371",
  "merchantName": "Sheger Café",
  "merchantCategory": "RESTAURANT",
  "amount": 250.00,
  "fee": 0.00,
  "loyaltyPointsEarned": 25,
  "status": "COMPLETED",
  "newBalance": 12200.00,
  "createdAt": "2026-03-19T10:22:00Z"
}
```

### `POST /merchants/scan`
Decode QR code to resolve merchant

```json
// Request
{ "qrPayload": "globalpay://pay?merchant=MERCH-001" }

// Response 200
{ "merchantId": "MERCH-001", "name": "Sheger Café", "category": "RESTAURANT" }
```

---

## 8. Cash In / Cash Out

### `GET /agents/nearby`
Find nearby agents (from `CashInOut.tsx`)

```json
// Query: ?lat=9.0192&lng=38.7525&radius=5
// Response 200
{
  "agents": [
    {
      "id": "uuid",
      "name": "Dawit Haile Agent",
      "code": "AGT-001",
      "distance": "0.3 km",
      "address": "Bole Road, Addis Ababa",
      "rating": 4.8,
      "isOpen": true
    }
  ]
}
```

### `POST /cash/in`
Initiate cash-in at agent (from `CashInOut.tsx`)

```json
// Request
{
  "agentCode": "AGT-001",
  "amount": 2000.00,
  "pin": "123456"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "CI-928371",
  "otp": "482910",            // OTP to give to agent for confirmation
  "agentName": "Dawit Haile Agent",
  "amount": 2000.00,
  "fee": 5.00,
  "netAmount": 1995.00,
  "status": "PENDING_AGENT",  // PENDING_AGENT → COMPLETED
  "expiresAt": "2026-03-19T10:37:00Z"
}
```

### `POST /cash/out`
Initiate cash-out at agent

```json
// Request
{
  "agentCode": "AGT-001",
  "amount": 5000.00,
  "pin": "123456"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "CO-928371",
  "otp": "593021",
  "agentName": "Dawit Haile Agent",
  "amount": 5000.00,
  "fee": 5.00,
  "netAmount": 4995.00,
  "status": "PENDING_AGENT",
  "expiresAt": "2026-03-19T10:37:00Z"
}
```

---

## 9. Savings Goals

### `GET /savings/goals`
List user's savings goals (from `SavingsGoals.tsx`)

```json
// Response 200
{
  "totalSaved": 25700.00,
  "monthlyGrowth": 2000.00,
  "goals": [
    {
      "id": "uuid",
      "name": "School Fees",
      "targetAmount": 15000.00,
      "savedAmount": 8500.00,
      "deadline": "2025-08-01",
      "icon": "🎓",
      "percentComplete": 57,
      "createdAt": "2024-06-01T00:00:00Z"
    }
  ]
}
```

### `POST /savings/goals`
Create a new savings goal

```json
// Request
{ "name": "Vacation Fund", "targetAmount": 30000.00, "deadline": "2026-12-31" }

// Response 201
{ "id": "uuid", "name": "Vacation Fund", "targetAmount": 30000.00, "savedAmount": 0.00, "deadline": "2026-12-31" }
```

### `POST /savings/goals/{goalId}/deposit`
Deposit into a savings goal

```json
// Request
{ "amount": 500.00, "pin": "123456" }

// Response 200
{
  "transactionId": "uuid",
  "reference": "SVG-928371",
  "newSavedAmount": 9000.00,
  "percentComplete": 60,
  "newMainBalance": 11950.00
}
```

### `POST /savings/goals/{goalId}/withdraw`
Withdraw from a savings goal

```json
// Request
{ "amount": 1000.00, "pin": "123456" }

// Response 200
{
  "transactionId": "uuid",
  "reference": "SVW-928371",
  "newSavedAmount": 8000.00,
  "newMainBalance": 13450.00
}
```

---

## 10. Micro-Loans

### `GET /loans/eligibility`
Check loan eligibility & AI credit score (from `MicroLoan.tsx`)

```json
// Response 200
{
  "eligible": true,
  "aiCreditScore": 78,           // 0-100
  "scoreLabel": "Excellent",     // Excellent | Good | Fair | Poor
  "maxLoanAmount": 8000.00,
  "factors": [
    { "label": "Transaction History", "score": 85, "weight": "HIGH" },
    { "label": "Account Age", "score": 72, "weight": "MEDIUM" },
    { "label": "Savings Behavior", "score": 90, "weight": "MEDIUM" },
    { "label": "Repayment History", "score": 65, "weight": "HIGH" }
  ],
  "activeLoans": 0
}
```

### `GET /loans/plans`
Get available repayment plans

```json
// Query: ?amount=3000
// Response 200
{
  "plans": [
    { "months": 1, "interestRate": 0.02, "totalRepayment": 3060.00, "monthlyPayment": 3060.00 },
    { "months": 3, "interestRate": 0.05, "totalRepayment": 3150.00, "monthlyPayment": 1050.00 },
    { "months": 6, "interestRate": 0.10, "totalRepayment": 3300.00, "monthlyPayment": 550.00 }
  ]
}
```

### `POST /loans/apply`
Apply for a micro-loan

```json
// Request
{
  "amount": 3000.00,
  "termMonths": 3,
  "purpose": "Business inventory",
  "pin": "123456"
}

// Response 201
{
  "loanId": "uuid",
  "reference": "LNS-928371",
  "amount": 3000.00,
  "totalRepayment": 3150.00,
  "monthlyPayment": 1050.00,
  "termMonths": 3,
  "interestRate": 0.05,
  "nextDueDate": "2026-04-19",
  "status": "DISBURSED",
  "newMainBalance": 15450.00,
  "createdAt": "2026-03-19T10:22:00Z"
}
```

### `GET /loans/active`
Get active loan details

```json
// Response 200
{
  "loans": [
    {
      "loanId": "uuid",
      "reference": "LNS-928371",
      "principalAmount": 3000.00,
      "outstandingBalance": 2100.00,
      "monthlyPayment": 1050.00,
      "nextDueDate": "2026-04-19",
      "paidInstallments": 1,
      "totalInstallments": 3,
      "status": "ACTIVE"       // ACTIVE | OVERDUE | COMPLETED | DEFAULTED
    }
  ]
}
```

### `POST /loans/{loanId}/repay`
Make a loan repayment

```json
// Request
{ "amount": 1050.00, "pin": "123456" }

// Response 200
{
  "transactionId": "uuid",
  "newOutstandingBalance": 1050.00,
  "paidInstallments": 2,
  "status": "ACTIVE"
}
```

---

## 11. Loyalty & Rewards

### `GET /loyalty`
Get loyalty overview (from `LoyaltyRewards.tsx`)

```json
// Response 200
{
  "points": 1240,
  "pointsValue": 62.00,
  "tier": "SILVER",             // BRONZE | SILVER | GOLD | PLATINUM
  "tierThresholds": {
    "BRONZE": { "min": 0, "max": 999 },
    "SILVER": { "min": 1000, "max": 4999 },
    "GOLD": { "min": 5000, "max": 19999 },
    "PLATINUM": { "min": 20000, "max": null }
  },
  "progressToNextTier": 48,     // percentage
  "pointsToNextTier": 3760
}
```

### `GET /loyalty/history`
Points transaction history

```json
// Query: ?page=0&size=20
// Response 200
{
  "entries": [
    { "id": "uuid", "label": "P2P Transfer — Tigist", "points": 25, "date": "2026-03-19T10:22:00Z" },
    { "id": "uuid", "label": "Cashback Redemption", "points": -200, "date": "2026-02-15T14:00:00Z" }
  ],
  "page": 0,
  "totalPages": 3,
  "totalEntries": 45
}
```

### `GET /loyalty/redemptions`
Available reward redemptions

```json
// Response 200
{
  "redemptions": [
    { "id": "redeem-001", "name": "ETB 10 Cashback", "pointsCost": 200, "icon": "💵", "available": true },
    { "id": "redeem-002", "name": "1 GB Data Bundle", "pointsCost": 500, "icon": "📱", "available": true },
    { "id": "redeem-003", "name": "ETB 50 Cashback", "pointsCost": 1000, "icon": "💰", "available": true },
    { "id": "redeem-004", "name": "Free Bill Payment", "pointsCost": 800, "icon": "📄", "available": true },
    { "id": "redeem-005", "name": "0% Loan Discount", "pointsCost": 2000, "icon": "🏦", "available": false },
    { "id": "redeem-006", "name": "Priority Support", "pointsCost": 3000, "icon": "⭐", "available": false }
  ]
}
```

### `POST /loyalty/redeem`
Redeem a reward

```json
// Request
{ "redemptionId": "redeem-001" }

// Response 200
{
  "success": true,
  "rewardName": "ETB 10 Cashback",
  "pointsDeducted": 200,
  "remainingPoints": 1040,
  "cashbackAmount": 10.00       // if applicable
}
```

---

## 12. Transaction History

### `GET /transactions`
Paginated transaction history (from `TransactionHistory.tsx`)

```json
// Query: ?type=ALL|SENT|RECEIVED|BILL|SAVINGS&search=tigist&page=0&size=20&from=2026-01-01&to=2026-03-19
// Response 200
{
  "transactions": [
    {
      "id": "uuid",
      "reference": "TXN2024110001",
      "type": "SENT",           // SENT | RECEIVED | BILL | SAVINGS | LOAN | AIRTIME | MERCHANT | CASH_IN | CASH_OUT | REWARD
      "counterparty": "Tigist Alemu",
      "amount": -250.00,        // negative = debit, positive = credit
      "fee": 2.50,
      "status": "COMPLETED",    // COMPLETED | PENDING | FAILED | REVERSED
      "date": "2026-03-19T10:22:00Z"
    }
  ],
  "page": 0,
  "totalPages": 5,
  "totalTransactions": 48,
  "netAmount": -1900.00,
  "periodIn": 4500.00,
  "periodOut": 6400.00
}
```

### `GET /transactions/{transactionId}`
Single transaction detail

```json
// Response 200
{
  "id": "uuid",
  "reference": "TXN2024110001",
  "type": "SENT",
  "counterparty": "Tigist Alemu",
  "counterpartyPhone": "+251911234567",
  "amount": -250.00,
  "fee": 2.50,
  "totalAmount": 252.50,
  "note": "For lunch",
  "status": "COMPLETED",
  "loyaltyPointsEarned": 15,
  "balanceAfter": 12197.50,
  "date": "2026-03-19T10:22:00Z"
}
```

### `GET /transactions/export`
Export transactions as PDF/CSV

```
// Query: ?format=PDF|CSV&from=2026-01-01&to=2026-03-19
// Response 200 — binary file download
// Content-Type: application/pdf  OR  text/csv
```

---

## 13. Notifications

### `GET /notifications`
User notifications

```json
// Query: ?unreadOnly=true&page=0&size=20
// Response 200
{
  "notifications": [
    {
      "id": "uuid",
      "type": "TRANSACTION",     // TRANSACTION | SECURITY | PROMOTION | KYC | LOAN | SYSTEM
      "title": "Money Received",
      "message": "Selam Bekele sent you ETB 500",
      "read": false,
      "createdAt": "2026-03-19T10:22:00Z"
    }
  ],
  "unreadCount": 3
}
```

### `PUT /notifications/{id}/read`
Mark notification as read

```
// Response 204 No Content
```

---

## 14. Agent Portal APIs

> **Auth:** Agent JWT token with `ROLE_AGENT` claim
> **Front-end:** `AgentHome.tsx`, `AgentCashIn.tsx`, `AgentCashOut.tsx`, `AgentCustomers.tsx`, etc.

### `GET /agent/dashboard`
Agent dashboard stats (from `AgentHome.tsx`)

```json
// Response 200
{
  "agentCode": "AGT-001",
  "agentName": "Dawit Haile",
  "floatBalance": 42500.00,
  "floatLimit": 50000.00,
  "floatPercentage": 85,
  "todayStats": {
    "transactionCount": 12,
    "commission": 284.00,
    "cashInVolume": 35000.00,
    "cashOutVolume": 18000.00
  },
  "monthlyCommission": 6200.00,
  "recentTransactions": [
    {
      "type": "CASH_IN",
      "customerName": "Tigist Alemu",
      "customerPhone": "+251911222333",
      "amount": 2000.00,
      "commission": 6.00,
      "time": "09:14 AM",
      "reference": "CI-928371"
    }
  ]
}
```

### `POST /agent/customers/lookup`
Look up customer by phone or wallet ID (from `AgentCashIn.tsx`)

```json
// Request
{ "query": "+251911222333" }    // phone or wallet ID

// Response 200
{
  "found": true,
  "name": "Tigist Alemu",
  "phone": "+251911222333",
  "walletId": "TPY-2024-TIGIST003",
  "kycLevel": 1
}
```

### `POST /agent/cashin`
Process cash-in for customer (from `AgentCashIn.tsx`)

```json
// Request
{
  "customerPhone": "+251911222333",
  "amount": 2000.00,
  "otp": "482910",               // OTP from customer
  "agentPin": "654321"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "CI-928371",
  "customerName": "Tigist Alemu",
  "amount": 2000.00,
  "commission": 6.00,            // 0.3% min ETB 2
  "newFloatBalance": 40500.00,
  "status": "COMPLETED",
  "time": "2026-03-19T09:14:00Z"
}
```

### `POST /agent/cashout`
Process cash-out for customer (from `AgentCashOut.tsx`)

```json
// Request
{
  "customerPhone": "+251922444555",
  "amount": 5000.00,
  "otp": "593021",
  "agentPin": "654321"
}

// Response 201
{
  "transactionId": "uuid",
  "reference": "CO-928340",
  "customerName": "Yonas Bekele",
  "amount": 5000.00,
  "commission": 20.00,
  "newFloatBalance": 47500.00,
  "status": "COMPLETED",
  "time": "2026-03-19T08:55:00Z"
}
```

### `GET /agent/commission`
Commission report (from `AgentCommission.tsx`)

```json
// Query: ?period=TODAY|WEEK|MONTH|CUSTOM&from=2026-03-01&to=2026-03-19
// Response 200
{
  "totalCommission": 6200.00,
  "transactionCount": 342,
  "averagePerTransaction": 18.13,
  "breakdown": [
    { "type": "CASH_IN", "count": 210, "volume": 420000.00, "commission": 3780.00 },
    { "type": "CASH_OUT", "count": 132, "volume": 264000.00, "commission": 2420.00 }
  ],
  "dailyTrend": [
    { "date": "2026-03-18", "commission": 284.00, "count": 12 },
    { "date": "2026-03-17", "commission": 310.00, "count": 14 }
  ]
}
```

### `GET /agent/float`
Float management details (from `AgentFloat.tsx`)

```json
// Response 200
{
  "balance": 42500.00,
  "limit": 50000.00,
  "percentage": 85,
  "superAgentName": "Addis Super Agent",
  "lastTopup": { "amount": 10000.00, "date": "2026-03-15T08:00:00Z" },
  "history": [
    { "type": "TOPUP", "amount": 10000.00, "source": "Super Agent", "date": "2026-03-15T08:00:00Z" },
    { "type": "DEBIT", "amount": -2000.00, "reason": "Cash-in CI-928371", "date": "2026-03-19T09:14:00Z" }
  ]
}
```

### `POST /agent/float/request`
Request float top-up from super agent

```json
// Request
{ "amount": 10000.00, "note": "Running low — need for evening operations" }

// Response 201
{ "requestId": "uuid", "status": "PENDING", "superAgentName": "Addis Super Agent" }
```

### `GET /agent/customers`
List customers served by this agent (from `AgentCustomers.tsx`)

```json
// Query: ?search=tigist&page=0&size=20
// Response 200
{
  "customers": [
    {
      "id": "uuid",
      "name": "Tigist Alemu",
      "phone": "+251911222333",
      "kycLevel": 1,
      "lastTransaction": "2026-03-19T09:14:00Z",
      "totalTransactions": 8,
      "registeredByAgent": true
    }
  ]
}
```

### `POST /agent/customers/register`
Register new customer (agent-assisted onboarding)

```json
// Request
{
  "firstName": "New",
  "lastName": "Customer",
  "phone": "+251955123456",
  "documentType": "FAYDA_ID",
  "documentNumber": "FID-12345678"
}

// Response 201
{
  "userId": "uuid",
  "walletId": "TPY-2026-NEWCUS001",
  "kycLevel": 1,
  "status": "ACTIVE"
}
```

---

## 15. Admin Console APIs

> **Auth:** Admin JWT token with `ROLE_ADMIN` claim
> **Front-end:** `AdminDashboard.tsx`, `AdminUsers.tsx`, `AdminTransactions.tsx`, etc.

### `GET /admin/dashboard`
System-wide dashboard KPIs (from `AdminDashboard.tsx`)

```json
// Response 200
{
  "totalUsers": 67750,
  "userGrowthPercent": 8.4,
  "newUsersThisWeek": 1240,
  "todayTransactionVolume": 18600000.00,
  "todayTransactionCount": 92340,
  "txnGrowthPercent": 12.1,
  "activeAgents": 3842,
  "agentRegions": 11,
  "fraudAlerts": { "total": 24, "critical": 7, "medium": 17 },
  "fraudTrendPercent": -18.5,
  "monthlyTrend": [
    { "month": "Sep", "volume": 42000, "value": 8200000.00 },
    { "month": "Oct", "volume": 58000, "value": 11400000.00 }
  ],
  "kycDistribution": [
    { "level": "LEVEL_1", "count": 45230 },
    { "level": "LEVEL_2", "count": 18420 },
    { "level": "PENDING", "count": 3210 },
    { "level": "REJECTED", "count": 890 }
  ],
  "agentPerformance": [
    { "name": "Addis Central", "transactionCount": 4200, "volume": 840000.00 }
  ],
  "alerts": [
    {
      "type": "FRAUD",
      "message": "Suspicious velocity detected — Account TPY-09423",
      "time": "2026-03-19T10:20:00Z",
      "severity": "CRITICAL"
    }
  ]
}
```

### `GET /admin/users`
Paginated user management (from `AdminUsers.tsx`)

```json
// Query: ?search=abebe&kycLevel=1|2&status=ACTIVE|SUSPENDED&page=0&size=20&sort=createdAt,desc
// Response 200
{
  "users": [
    {
      "id": "uuid",
      "name": "Abebe Girma",
      "phone": "+251911234567",
      "walletId": "TPY-2024-ABEBE001",
      "kycLevel": 1,
      "status": "ACTIVE",
      "balance": 12450.00,
      "transactionCount": 48,
      "loyaltyTier": "SILVER",
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ],
  "page": 0,
  "totalPages": 3389,
  "totalUsers": 67750
}
```

### `PUT /admin/users/{userId}/status`
Suspend / activate user

```json
// Request
{ "status": "SUSPENDED", "reason": "Suspected fraudulent activity" }

// Response 200
{ "id": "uuid", "status": "SUSPENDED" }
```

### `GET /admin/kyc/pending`
KYC applications pending review (from `AdminKYC.tsx`)

```json
// Query: ?page=0&size=20
// Response 200
{
  "applications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Tigist Alemu",
      "documentType": "FAYDA_ID",
      "documentFrontUrl": "https://storage.../front.jpg",
      "documentBackUrl": "https://storage.../back.jpg",
      "selfieUrl": "https://storage.../selfie.jpg",
      "aiVerificationScore": 92,
      "submittedAt": "2026-03-19T09:00:00Z",
      "status": "PENDING"       // PENDING | APPROVED | REJECTED
    }
  ],
  "totalPending": 156
}
```

### `PUT /admin/kyc/{applicationId}/review`
Approve or reject KYC application

```json
// Request
{ "decision": "APPROVED", "note": "Documents verified" }  // APPROVED | REJECTED

// Response 200
{ "id": "uuid", "status": "APPROVED", "newKycLevel": 2 }
```

### `GET /admin/transactions`
System-wide transaction monitoring (from `AdminTransactions.tsx`)

```json
// Query: ?type=ALL&status=ALL&minAmount=0&maxAmount=100000&page=0&size=50&from=2026-03-01&to=2026-03-19
// Response 200
{
  "transactions": [
    {
      "id": "uuid",
      "reference": "TXN2024110001",
      "type": "P2P_SEND",
      "senderName": "Abebe Girma",
      "senderWalletId": "TPY-2024-ABEBE001",
      "recipientName": "Tigist Alemu",
      "recipientWalletId": "TPY-2024-TIGIST003",
      "amount": 250.00,
      "fee": 2.50,
      "status": "COMPLETED",
      "flagged": false,
      "date": "2026-03-19T10:22:00Z"
    }
  ],
  "page": 0,
  "totalPages": 1847,
  "totalTransactions": 92340,
  "totalVolume": 18600000.00
}
```

### `POST /admin/transactions/{transactionId}/reverse`
Reverse a transaction

```json
// Request
{ "reason": "Customer dispute — double charge", "adminPin": "admin-pin" }

// Response 200
{ "reversalId": "uuid", "originalReference": "TXN2024110001", "status": "REVERSED" }
```

### `GET /admin/agents`
Agent/Merchant management (from `AdminAgents.tsx`)

```json
// Query: ?type=AGENT|MERCHANT|SUPER_AGENT&status=ACTIVE&region=ADDIS_ABABA&page=0&size=20
// Response 200
{
  "agents": [
    {
      "id": "uuid",
      "code": "AGT-001",
      "name": "Dawit Haile",
      "type": "AGENT",           // AGENT | MERCHANT | SUPER_AGENT
      "region": "Addis Ababa",
      "floatBalance": 42500.00,
      "floatLimit": 50000.00,
      "status": "ACTIVE",
      "monthlyVolume": 320000.00,
      "monthlyCommission": 6200.00,
      "rating": 4.8,
      "registeredAt": "2024-03-01T00:00:00Z"
    }
  ],
  "totalAgents": 3842
}
```

### `PUT /admin/agents/{agentId}/float-limit`
Adjust agent float limit

```json
// Request
{ "newLimit": 75000.00, "reason": "High-performing agent — volume increase" }

// Response 200
{ "agentCode": "AGT-001", "newFloatLimit": 75000.00 }
```

### `GET /admin/emoney`
E-money trust account management (from `AdminEMoney.tsx`)

```json
// Response 200
{
  "totalEMoneyIssued": 2400000000.00,
  "trustAccountBalance": 2400000000.00,
  "reconciliationStatus": "MATCHED",
  "lastReconciliation": "2026-03-19T08:00:00Z",
  "floatDistribution": [
    { "type": "USER_WALLETS", "amount": 1800000000.00 },
    { "type": "AGENT_FLOAT", "amount": 450000000.00 },
    { "type": "MERCHANT_HOLDINGS", "amount": 120000000.00 },
    { "type": "SYSTEM_RESERVE", "amount": 30000000.00 }
  ]
}
```

### `GET /admin/reports`
Generate reports (from `AdminReports.tsx`)

```json
// Query: ?type=DAILY_SUMMARY|AGENT_PERFORMANCE|KYC_AUDIT|RECONCILIATION&date=2026-03-19&format=JSON|PDF|CSV
// Response 200 — JSON report data or binary file download
```

### `GET /admin/analytics`
Analytics data (from `AdminAnalytics.tsx`)

```json
// Query: ?period=7d|30d|90d|1y
// Response 200
{
  "userGrowth": [
    { "date": "2026-03-13", "totalUsers": 66510, "newUsers": 180 }
  ],
  "transactionTrend": [
    { "date": "2026-03-19", "count": 92340, "volume": 18600000.00 }
  ],
  "revenueByType": [
    { "type": "P2P_FEES", "revenue": 230000.00 },
    { "type": "BILL_PAY_FEES", "revenue": 85000.00 },
    { "type": "CASH_FEES", "revenue": 120000.00 },
    { "type": "LOAN_INTEREST", "revenue": 340000.00 }
  ],
  "topRegions": [
    { "region": "Addis Ababa", "users": 28000, "volume": 8200000.00 }
  ]
}
```

---

## 16. Common Models

### Transaction Types Enum
```java
public enum TransactionType {
    P2P_SEND, P2P_RECEIVE, BILL_PAYMENT, AIRTIME, MERCHANT,
    CASH_IN, CASH_OUT, SAVINGS_DEPOSIT, SAVINGS_WITHDRAWAL,
    LOAN_DISBURSEMENT, LOAN_REPAYMENT, REWARD_REDEMPTION,
    FLOAT_TOPUP, COMMISSION, REVERSAL
}
```

### Transaction Status Enum
```java
public enum TransactionStatus {
    PENDING, PENDING_AGENT, COMPLETED, FAILED, REVERSED, EXPIRED
}
```

### KYC Level Enum
```java
public enum KycLevel { LEVEL_1, LEVEL_2 }
```

### KYC Document Type Enum
```java
public enum DocumentType { FAYDA_ID, PASSPORT, DRIVING_LICENSE, KEBELE_ID }
```

### Loyalty Tier Enum
```java
public enum LoyaltyTier { BRONZE, SILVER, GOLD, PLATINUM }
```

### User Status Enum
```java
public enum UserStatus { ACTIVE, SUSPENDED, BLOCKED, PENDING_KYC }
```

### Agent Type Enum
```java
public enum AgentType { AGENT, MERCHANT, SUPER_AGENT }
```

### User Roles Enum
```java
public enum AppRole { USER, AGENT, ADMIN }
```

### Standard Pagination Response
```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalPages": 10,
  "totalElements": 200
}
```

---

## 17. Error Handling

### Standard Error Response
```json
{
  "timestamp": "2026-03-19T10:22:00Z",
  "status": 400,
  "error": "Bad Request",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient wallet balance for this transaction",
  "path": "/v1/transfers/send"
}
```

### Error Codes

| Code | HTTP | Description |
|---|---|---|
| `INVALID_PIN` | 401 | Wrong MPIN entered |
| `ACCOUNT_LOCKED` | 403 | Account locked after 5 failed PIN attempts |
| `INSUFFICIENT_BALANCE` | 400 | Not enough funds in wallet |
| `DAILY_LIMIT_EXCEEDED` | 400 | KYC-tier daily limit exceeded |
| `MONTHLY_LIMIT_EXCEEDED` | 400 | Monthly limit exceeded |
| `RECIPIENT_NOT_FOUND` | 404 | Recipient phone not registered |
| `INVALID_OTP` | 400 | Wrong or expired OTP |
| `OTP_EXPIRED` | 400 | OTP validity window passed |
| `KYC_REQUIRED` | 403 | Feature requires higher KYC level |
| `LOAN_NOT_ELIGIBLE` | 400 | User doesn't meet loan criteria |
| `LOAN_LIMIT_EXCEEDED` | 400 | Requested amount exceeds max loan |
| `ACTIVE_LOAN_EXISTS` | 400 | Cannot take new loan with outstanding loan |
| `AGENT_FLOAT_LOW` | 400 | Agent float insufficient for cash-out |
| `BILLER_UNAVAILABLE` | 503 | Biller system temporarily down |
| `DUPLICATE_TRANSACTION` | 409 | Idempotency key already processed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### HTTP Status Codes Used

| Status | Usage |
|---|---|
| `200` | Successful GET, PUT |
| `201` | Successful POST (resource created) |
| `202` | Accepted for async processing (KYC) |
| `204` | No content (logout, mark read) |
| `400` | Validation / business rule error |
| `401` | Authentication failure |
| `403` | Authorization failure |
| `404` | Resource not found |
| `409` | Conflict (duplicate) |
| `429` | Rate limited |
| `500` | Internal server error |
| `503` | Upstream service unavailable |

---

## Appendix: Spring Boot Project Structure Suggestion

```
com.globalpay/
├── GlobalPayApplication.java
├── config/
│   ├── SecurityConfig.java          // Spring Security + JWT
│   ├── CorsConfig.java
│   └── SwaggerConfig.java          // OpenAPI 3.0 docs
├── controller/
│   ├── AuthController.java          // /auth/*
│   ├── WalletController.java        // /wallet/*
│   ├── TransferController.java      // /transfers/*
│   ├── BillerController.java        // /billers/*
│   ├── AirtimeController.java       // /airtime/*
│   ├── MerchantController.java      // /merchants/*
│   ├── CashController.java          // /cash/*
│   ├── SavingsController.java       // /savings/*
│   ├── LoanController.java          // /loans/*
│   ├── LoyaltyController.java       // /loyalty/*
│   ├── TransactionController.java   // /transactions/*
│   ├── NotificationController.java  // /notifications/*
│   ├── AgentController.java         // /agent/*
│   └── AdminController.java         // /admin/*
├── service/
│   ├── AuthService.java
│   ├── WalletService.java
│   ├── TransferService.java
│   ├── BillerService.java
│   ├── AirtimeService.java
│   ├── MerchantService.java
│   ├── CashService.java
│   ├── SavingsService.java
│   ├── LoanService.java
│   ├── LoyaltyService.java
│   ├── KycService.java
│   ├── AgentService.java
│   ├── NotificationService.java
│   ├── FraudDetectionService.java
│   └── ReportService.java
├── repository/
│   ├── UserRepository.java
│   ├── WalletRepository.java
│   ├── TransactionRepository.java
│   └── ...
├── model/
│   ├── entity/                       // JPA entities
│   │   ├── User.java
│   │   ├── Wallet.java
│   │   ├── Transaction.java
│   │   ├── Agent.java
│   │   ├── SavingsGoal.java
│   │   ├── Loan.java
│   │   ├── KycApplication.java
│   │   └── LoyaltyAccount.java
│   ├── dto/                          // Request/Response DTOs
│   │   ├── request/
│   │   └── response/
│   └── enums/
│       ├── TransactionType.java
│       ├── TransactionStatus.java
│       ├── KycLevel.java
│       ├── LoyaltyTier.java
│       └── AppRole.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthFilter.java
│   └── UserDetailsServiceImpl.java
└── exception/
    ├── GlobalExceptionHandler.java   // @ControllerAdvice
    ├── InsufficientBalanceException.java
    ├── InvalidPinException.java
    └── ...
```

---

*Document generated for GlobalPay Spring Boot backend development. All endpoints derived from front-end data models and user flows.*
