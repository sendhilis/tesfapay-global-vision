import { useState } from "react";
import { Download, FileText, ChevronLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tesfaLogo from "@/assets/tesfa-logo.png";

const ProposalDocument = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    const content = document.getElementById("proposal-content")?.innerText || "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GlobalPay_Technical_Proposal_Global_Bank_Ethiopia.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-50 glass border-b border-border print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to App</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 bg-gradient-gold text-tesfa-dark px-4 py-2 rounded-xl text-sm font-bold">
              <Download className="w-4 h-4" /> Download .txt
            </button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div id="proposal-content" className="max-w-5xl mx-auto px-6 py-10 space-y-8 text-foreground">
        
        {/* Cover */}
        <div className="text-center space-y-4 pb-8 border-b border-border">
          <div className="flex justify-center">
            <img src={tesfaLogo} alt="GlobalPay" className="w-16 h-16 rounded-2xl" />
          </div>
          <p className="text-xs text-muted-foreground tracking-[0.3em] uppercase">Confidential</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            GlobalPay Mobile Money Platform
          </h1>
          <h2 className="text-lg text-muted-foreground font-medium">
            Functional & Technical Specifications Document
          </h2>
          <p className="text-sm text-muted-foreground">
            Submitted to: The Management of Global Bank Ethiopia S.C.
          </p>
          <p className="text-sm text-muted-foreground">
            Prepared by: Digital Banking & Mobile Financial Services Division
          </p>
          <p className="text-xs text-muted-foreground">
            Document Version: 3.0 · Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Classification: CONFIDENTIAL
          </p>
        </div>

        {/* Table of Contents */}
        <Section title="TABLE OF CONTENTS">
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Executive Summary</li>
            <li>Product Vision & Strategic Alignment</li>
            <li>Functional Specifications
              <ol className="list-decimal list-inside ml-5 space-y-0.5 mt-1">
                <li>Customer Wallet Module</li>
                <li>Agent Banking Module</li>
                <li>Merchant Payments Module</li>
                <li>Admin & Operations Console</li>
                <li>KYC & Compliance Module</li>
                <li>EMoney Management Module</li>
                <li>Savings & Micro-Loan Module</li>
                <li>Bill Payments & Airtime Module</li>
                <li>Loyalty & Rewards Module</li>
                <li>Reporting & Analytics Module</li>
                <li>Global AI Copilot Module</li>
                <li>Notification & Communication Module</li>
              </ol>
            </li>
            <li>Technical Architecture & Specifications</li>
            <li>AI Copilot — Detailed Functional Specifications</li>
            <li>Security Architecture</li>
            <li>Integration Specifications</li>
            <li>Non-Functional Requirements</li>
            <li>Deployment & Infrastructure</li>
            <li>Features & Benefits Summary</li>
            <li>Implementation Roadmap</li>
            <li>Risk Mitigation</li>
            <li>Appendices</li>
          </ol>
        </Section>

        {/* 1. Executive Summary */}
        <Section title="1. EXECUTIVE SUMMARY">
          <P>
            GlobalPay is a next-generation mobile money platform designed and purpose-built for Global Bank Ethiopia S.C. to deliver inclusive financial services to Ethiopia's 120M+ population. The platform enables real-time peer-to-peer transfers, bill payments, merchant QR payments, agent-assisted cash-in/cash-out, micro-lending, savings products, and loyalty programs — all unified under a single, NBE-compliant digital wallet infrastructure.
          </P>
          <P>
            This document provides an exhaustive, micro-granular breakdown of every functional module, technical subsystem, integration point, and AI-powered capability within the GlobalPay ecosystem. It is intended to serve as the authoritative reference for Management review, regulatory submission to the National Bank of Ethiopia (NBE), and technical due diligence by the Bank's IT Governance Committee.
          </P>
          <P>
            Key value propositions: (1) Full NBE Directive compliance for mobile money operations; (2) Agent banking network supporting 50,000+ agents nationwide; (3) AI-powered fraud detection, customer insights, and operational intelligence; (4) Sub-second transaction processing with 99.95% uptime SLA; (5) Progressive Web App (PWA) with offline-first capabilities for low-bandwidth environments.
          </P>
        </Section>

        {/* 2. Vision */}
        <Section title="2. PRODUCT VISION & STRATEGIC ALIGNMENT">
          <SubSection title="2.1 Vision Statement">
            <P>To become Ethiopia's most trusted, accessible, and intelligent mobile financial services platform — serving every Ethiopian from Addis Ababa to the most remote woreda.</P>
          </SubSection>
          <SubSection title="2.2 Strategic Alignment with Global Bank Ethiopia">
            <BulletList items={[
              "Digital-First Banking Strategy: Reduces branch dependency by 40% through agent and mobile channels",
              "Financial Inclusion Mandate: Targets 15M unbanked Ethiopians within 36 months of launch",
              "NBE National Payment System Vision 2025: Full alignment with real-time payment infrastructure goals",
              "Revenue Diversification: New fee income streams from mobile money, merchant acquiring, and micro-lending",
              "Competitive Positioning: First-mover advantage in AI-powered mobile money among Ethiopian banks",
            ]} />
          </SubSection>
          <SubSection title="2.3 Target User Segments">
            <BulletList items={[
              "Retail Customers: Urban and rural individuals requiring P2P transfers, bill payments, and savings",
              "Micro & Small Enterprises: Small merchants requiring QR-based payment acceptance",
              "Agent Network: Independent agents and agent chains providing cash-in/cash-out services",
              "Corporate Clients: Bulk disbursement, salary payments, and vendor settlements",
              "Government & NGOs: Social protection payments, subsidy disbursements",
            ]} />
          </SubSection>
        </Section>

        {/* 3. Functional Specifications */}
        <Section title="3. FUNCTIONAL SPECIFICATIONS">

          {/* 3.1 Customer Wallet */}
          <SubSection title="3.1 Customer Wallet Module">
            <SubSection title="3.1.1 Wallet Account Management">
              <BulletList items={[
                "FUNC-CW-001: Self-service wallet registration via mobile number (OTP-verified) with automated USSD fallback",
                "FUNC-CW-002: Multi-tier wallet based on KYC level — Level 1 (Basic: ETB 10,000 daily limit), Level 2 (Enhanced: ETB 50,000), Level 3 (Full: ETB 200,000)",
                "FUNC-CW-003: Real-time balance inquiry with last 5 transactions mini-statement",
                "FUNC-CW-004: Wallet-to-bank account linking with instant verification via CBS integration",
                "FUNC-CW-005: Multi-currency support (ETB primary, USD/EUR for diaspora corridors)",
                "FUNC-CW-006: Wallet freeze/unfreeze by customer (self-service) or admin (compliance)",
                "FUNC-CW-007: Beneficiary management — save, edit, delete frequent recipients with nicknames",
                "FUNC-CW-008: QR code generation for receive-money scenarios (static and dynamic QR)",
              ]} />
            </SubSection>
            <SubSection title="3.1.2 Peer-to-Peer (P2P) Transfers">
              <BulletList items={[
                "FUNC-CW-010: Instant P2P transfer to any GlobalPay wallet via mobile number",
                "FUNC-CW-011: Transfer to non-registered users with SMS notification and 72-hour claim window",
                "FUNC-CW-012: Scheduled/recurring transfers with configurable frequency (daily, weekly, monthly)",
                "FUNC-CW-013: Transfer with purpose/note attachment (max 140 characters)",
                "FUNC-CW-014: Request money from contacts with push notification to payer",
                "FUNC-CW-015: Split-bill functionality — divide amount among multiple recipients",
                "FUNC-CW-016: Transaction PIN verification for all outgoing transfers",
                "FUNC-CW-017: Real-time transaction confirmation via SMS and in-app notification",
                "FUNC-CW-018: Transaction reversal request within 15-minute window (pending admin approval)",
              ]} />
            </SubSection>
            <SubSection title="3.1.3 Cash-In / Cash-Out">
              <BulletList items={[
                "FUNC-CW-020: Cash-in at any registered agent location with agent-initiated confirmation",
                "FUNC-CW-021: Cash-out at agent with OTP-based customer verification",
                "FUNC-CW-022: ATM cash-out via cardless withdrawal (QR scan at ATM)",
                "FUNC-CW-023: Bank account pull (wallet top-up from linked bank account)",
                "FUNC-CW-024: Bank account push (wallet to bank account transfer)",
                "FUNC-CW-025: Cash-in limits enforced per KYC tier with real-time limit tracking",
                "FUNC-CW-026: Agent location finder with GPS-based nearest agent display",
              ]} />
            </SubSection>
          </SubSection>

          {/* 3.2 Agent Banking */}
          <SubSection title="3.2 Agent Banking Module">
            <SubSection title="3.2.1 Agent Hierarchy & Onboarding">
              <BulletList items={[
                "FUNC-AG-001: Four-tier agent hierarchy — Super-Agent, Sub-Agent, Direct-Agent, Merchant",
                "FUNC-AG-002: Digital agent onboarding with document upload (business license, TIN, kebele ID, trade license)",
                "FUNC-AG-003: Agent KYC verification by compliance team with automated document validation",
                "FUNC-AG-004: NBE-issued agent code assignment upon approval",
                "FUNC-AG-005: Agent territory/zone assignment with geo-fencing capabilities",
                "FUNC-AG-006: Super-Agent to Sub-Agent float distribution with automated reconciliation",
                "FUNC-AG-007: Agent dormancy detection — auto-flag agents inactive for 30+ days",
                "FUNC-AG-008: Agent contract management — digital agreement acceptance with e-signature",
              ]} />
            </SubSection>
            <SubSection title="3.2.2 Agent Transactions">
              <BulletList items={[
                "FUNC-AG-010: Agent-assisted customer cash-in with dual confirmation (agent + customer OTP)",
                "FUNC-AG-011: Agent-assisted customer cash-out with biometric/OTP verification",
                "FUNC-AG-012: Agent-to-agent float transfer (within same Super-Agent network)",
                "FUNC-AG-013: Agent float top-up from bank branch or Super-Agent",
                "FUNC-AG-014: Agent daily transaction limits — configurable by agent type and zone",
                "FUNC-AG-015: Agent commission calculation — real-time, tiered by volume brackets",
                "FUNC-AG-016: Agent transaction reversal with supervisor approval workflow",
                "FUNC-AG-017: End-of-day agent reconciliation report (auto-generated)",
              ]} />
            </SubSection>
            <SubSection title="3.2.3 Agent Float Management">
              <BulletList items={[
                "FUNC-AG-020: Real-time float balance monitoring per agent",
                "FUNC-AG-021: Low float alert — push notification when float drops below configurable threshold",
                "FUNC-AG-022: Float request workflow — agent request → Super-Agent/bank approval → disbursement",
                "FUNC-AG-023: Float redistribution — Super-Agent rebalances float across Sub-Agents",
                "FUNC-AG-024: Float interest calculation on overnight balances (if applicable per policy)",
                "FUNC-AG-025: Emergency float top-up via USSD for network-constrained areas",
              ]} />
            </SubSection>
            <SubSection title="3.2.4 Agent Commission Engine">
              <BulletList items={[
                "FUNC-AG-030: Commission model — flat fee, percentage, tiered, or hybrid per product",
                "FUNC-AG-031: Super-Agent override commission — percentage of Sub-Agent transaction volume",
                "FUNC-AG-032: Commission split configuration — Super-Agent/Sub-Agent ratios (e.g., 30/70)",
                "FUNC-AG-033: Commission settlement — daily accrual, monthly payout to agent wallet",
                "FUNC-AG-034: Commission dispute resolution workflow",
                "FUNC-AG-035: Agent performance scoring — transaction volume, uptime, customer satisfaction",
              ]} />
            </SubSection>
          </SubSection>

          {/* 3.3 Merchant Payments */}
          <SubSection title="3.3 Merchant Payments Module">
            <BulletList items={[
              "FUNC-MP-001: Merchant registration with business verification (TIN, trade license)",
              "FUNC-MP-002: Static QR code generation for in-store payment acceptance",
              "FUNC-MP-003: Dynamic QR with pre-filled amount for invoice-based payments",
              "FUNC-MP-004: NFC tap-to-pay support for enabled devices",
              "FUNC-MP-005: Merchant Discount Rate (MDR) — configurable per merchant category (MCC)",
              "FUNC-MP-006: Daily settlement to merchant wallet or linked bank account",
              "FUNC-MP-007: Merchant dashboard — real-time sales analytics, refund management",
              "FUNC-MP-008: Refund/chargeback processing with customer dispute workflow",
              "FUNC-MP-009: Multi-outlet support — single merchant, multiple branch locations",
              "FUNC-MP-010: Merchant loyalty integration — issue points at point of sale",
              "FUNC-MP-011: Receipt generation — digital receipt via SMS/email to customer",
              "FUNC-MP-012: Merchant API for e-commerce integration (RESTful, webhook callbacks)",
            ]} />
          </SubSection>

          {/* 3.4 Admin Console */}
          <SubSection title="3.4 Admin & Operations Console">
            <SubSection title="3.4.1 Dashboard & Monitoring">
              <BulletList items={[
                "FUNC-AD-001: Real-time operations dashboard — TPS, success rate, revenue, active users",
                "FUNC-AD-002: System health monitoring — API latency, database load, queue depth",
                "FUNC-AD-003: Geographic heat map — transaction density by region/woreda",
                "FUNC-AD-004: Anomaly detection alerts — unusual transaction patterns flagged in real-time",
                "FUNC-AD-005: Executive summary — daily/weekly/monthly KPI rollup with trend analysis",
              ]} />
            </SubSection>
            <SubSection title="3.4.2 User Management">
              <BulletList items={[
                "FUNC-AD-010: Customer search — by phone, name, wallet ID, or national ID",
                "FUNC-AD-011: Customer profile 360 — complete view of KYC, transactions, disputes, loyalty",
                "FUNC-AD-012: Account actions — freeze, unfreeze, close, upgrade KYC tier",
                "FUNC-AD-013: Bulk user operations — mass SMS, tier upgrades, account flags",
                "FUNC-AD-014: Admin role-based access control (RBAC) — Maker-Checker for critical operations",
                "FUNC-AD-015: Audit trail — every admin action logged with timestamp, IP, and user ID",
              ]} />
            </SubSection>
            <SubSection title="3.4.3 Transaction Management">
              <BulletList items={[
                "FUNC-AD-020: Transaction search — by ID, phone, date range, amount range, status",
                "FUNC-AD-021: Transaction reversal workflow — initiate → approve → execute → notify",
                "FUNC-AD-022: Suspicious transaction flagging — manual and AI-assisted",
                "FUNC-AD-023: Transaction fee override — for special cases with dual authorization",
                "FUNC-AD-024: Settlement management — batch settlement scheduling and monitoring",
                "FUNC-AD-025: Reconciliation — automated three-way reconciliation (wallet, CBS, switch)",
              ]} />
            </SubSection>
          </SubSection>

          {/* 3.5 KYC */}
          <SubSection title="3.5 KYC & Compliance Module">
            <BulletList items={[
              "FUNC-KY-001: Three-tier KYC framework aligned with NBE AML/CFT directives",
              "FUNC-KY-002: Tier 1 — Basic: Phone + OTP only. Daily limit ETB 10,000. Monthly ETB 50,000",
              "FUNC-KY-003: Tier 2 — Enhanced: National ID/Passport + Selfie. Daily ETB 50,000. Monthly ETB 200,000",
              "FUNC-KY-004: Tier 3 — Full: In-person verification or video KYC. Daily ETB 200,000. Monthly ETB 1,000,000",
              "FUNC-KY-005: AI-powered document verification — OCR extraction, forgery detection, liveness check",
              "FUNC-KY-006: Watchlist screening — PEP, sanctions lists, adverse media (real-time)",
              "FUNC-KY-007: Ongoing due diligence — periodic re-verification triggers based on risk score",
              "FUNC-KY-008: Suspicious Activity Report (SAR) generation — automated and manual",
              "FUNC-KY-009: Currency Transaction Report (CTR) — auto-filed for transactions exceeding NBE threshold",
              "FUNC-KY-010: KYC document storage — encrypted, tamper-evident, retention per NBE policy (10 years)",
            ]} />
          </SubSection>

          {/* 3.6 EMoney */}
          <SubSection title="3.6 EMoney Management Module">
            <BulletList items={[
              "FUNC-EM-001: EMoney issuance — creation of e-float backed 1:1 by trust account deposits",
              "FUNC-EM-002: Trust account reconciliation — real-time balancing of issued e-money vs bank deposits",
              "FUNC-EM-003: EMoney destruction — upon cash-out or bank transfer, e-money is retired",
              "FUNC-EM-004: Float distribution chain — Bank → Super-Agent → Sub-Agent → Customer",
              "FUNC-EM-005: NBE regulatory reporting — daily e-money position report",
              "FUNC-EM-006: System wallet management — fee collection, commission, and suspense wallets",
              "FUNC-EM-007: Inter-bank e-money transfer (future phase — pending NBE interoperability framework)",
              "FUNC-EM-008: EMoney audit trail — full lifecycle tracking from issuance to destruction",
            ]} />
          </SubSection>

          {/* 3.7 Savings & Micro-Loan */}
          <SubSection title="3.7 Savings & Micro-Loan Module">
            <SubSection title="3.7.1 Savings Goals">
              <BulletList items={[
                "FUNC-SV-001: Named savings goals — user-defined name, target amount, target date",
                "FUNC-SV-002: Auto-save rules — round-up transactions, percentage of incoming transfers, scheduled",
                "FUNC-SV-003: Lock/unlock savings — optional lock period with early withdrawal penalty",
                "FUNC-SV-004: Interest accrual — daily calculation, monthly crediting (rate per NBE guidelines)",
                "FUNC-SV-005: Goal progress visualization — percentage complete, projected completion date",
                "FUNC-SV-006: Group savings (Equb-style) — rotating savings with automated payout scheduling",
              ]} />
            </SubSection>
            <SubSection title="3.7.2 Micro-Loans">
              <BulletList items={[
                "FUNC-ML-001: AI-powered credit scoring — based on transaction history, savings behavior, KYC tier",
                "FUNC-ML-002: Instant micro-loan disbursement — pre-approved amounts up to ETB 50,000",
                "FUNC-ML-003: Flexible repayment — daily, weekly, or monthly installments deducted from wallet",
                "FUNC-ML-004: Late payment handling — grace period, penalty calculation, notification escalation",
                "FUNC-ML-005: Loan history and credit score display — customer-facing credit health dashboard",
                "FUNC-ML-006: Collection management — automated reminders, agent-assisted collection for overdue",
                "FUNC-ML-007: NPL (Non-Performing Loan) classification — automated per NBE asset classification directives",
              ]} />
            </SubSection>
          </SubSection>

          {/* 3.8 Bill Payments & Airtime */}
          <SubSection title="3.8 Bill Payments & Airtime Module">
            <BulletList items={[
              "FUNC-BP-001: Utility bill payment — Ethiopian Electric Utility (EEU), water, internet (Ethio Telecom)",
              "FUNC-BP-002: Airtime top-up — Ethio Telecom prepaid, Safaricom Ethiopia (if applicable)",
              "FUNC-BP-003: Data bundle purchase — pre-configured packages from telco partners",
              "FUNC-BP-004: Tax payment — integration with Ethiopian Revenue & Customs Authority (ERCA)",
              "FUNC-BP-005: School fee payment — integration with education institutions",
              "FUNC-BP-006: Insurance premium payment — partner insurance companies",
              "FUNC-BP-007: Scheduled bill payments — auto-pay on due date with insufficient balance notification",
              "FUNC-BP-008: Bill payment receipt — digital receipt with transaction reference for dispute resolution",
              "FUNC-BP-009: Biller management — admin console for adding/removing billers, setting fee structures",
            ]} />
          </SubSection>

          {/* 3.9 Loyalty */}
          <SubSection title="3.9 Loyalty & Rewards Module">
            <BulletList items={[
              "FUNC-LY-001: Points accrual engine — configurable points per transaction type and amount bracket",
              "FUNC-LY-002: Tier system — Bronze, Silver, Gold, Platinum with escalating benefits",
              "FUNC-LY-003: Points redemption — airtime, merchant vouchers, fee waivers, charity donation",
              "FUNC-LY-004: Referral rewards — points for successful referrals (referee completes first transaction)",
              "FUNC-LY-005: Gamification — daily login streaks, transaction milestones, achievement badges",
              "FUNC-LY-006: Partner rewards — co-branded offers from merchant partners",
              "FUNC-LY-007: Points expiry — configurable expiry window (default 12 months) with expiry notifications",
              "FUNC-LY-008: Loyalty analytics — admin dashboard for program cost, engagement, and ROI metrics",
            ]} />
          </SubSection>

          {/* 3.10 Reporting */}
          <SubSection title="3.10 Reporting & Analytics Module">
            <BulletList items={[
              "FUNC-RP-001: Customer reports — transaction summary, balance, KYC status, loyalty statement",
              "FUNC-RP-002: Agent reports — volume, commission, float balance, performance scoring",
              "FUNC-RP-003: Merchant reports — payment volume, MDR, settlement, refund analytics",
              "FUNC-RP-004: Financial reports — system wallet fees, commission payable, tax reports",
              "FUNC-RP-005: EMoney reports — issuance, trust reconciliation, cash-in/out, float by zone",
              "FUNC-RP-006: Regulatory reports — NBE daily position, CTR, SAR, AML compliance",
              "FUNC-RP-007: Scheduled report generation — daily, weekly, monthly with email/SFTP delivery",
              "FUNC-RP-008: Ad-hoc report builder — drag-and-drop fields, filters, date ranges",
              "FUNC-RP-009: Export formats — PDF, Excel, CSV, JSON (API)",
              "FUNC-RP-010: Report access control — role-based visibility per report category",
            ]} />
          </SubSection>

          {/* 3.11 AI Copilot */}
          <SubSection title="3.11 Global AI Copilot Module">
            <P className="italic text-muted-foreground">See Section 5 for detailed AI specifications.</P>
            <BulletList items={[
              "FUNC-AI-001: In-app conversational AI assistant — natural language query for balance, history, help",
              "FUNC-AI-002: Amharic and English bilingual support with context-aware language switching",
              "FUNC-AI-003: Smart transaction suggestions — based on user behavior patterns",
              "FUNC-AI-004: Fraud alert explanations — human-readable descriptions of flagged transactions",
              "FUNC-AI-005: Agent performance coaching — AI-generated tips for improving transaction volume",
              "FUNC-AI-006: Customer 360 AI insights — admin-facing predictive analytics per customer",
              "FUNC-AI-007: Automated SAR narrative generation — AI-drafted suspicious activity descriptions",
              "FUNC-AI-008: Predictive float management — AI forecasts float needs by zone and day-of-week",
            ]} />
          </SubSection>

          {/* 3.12 Notifications */}
          <SubSection title="3.12 Notification & Communication Module">
            <BulletList items={[
              "FUNC-NT-001: Push notifications — transaction alerts, promotional offers, system announcements",
              "FUNC-NT-002: SMS notifications — transaction confirmation, OTP, low balance, bill due reminders",
              "FUNC-NT-003: In-app notification center — chronological feed with read/unread status",
              "FUNC-NT-004: Email notifications — statement delivery, KYC status updates (for Tier 2+ users)",
              "FUNC-NT-005: USSD notifications — transaction confirmation for feature phone users",
              "FUNC-NT-006: Notification preferences — user-configurable channel and frequency settings",
              "FUNC-NT-007: Bulk messaging — admin-initiated campaigns with audience segmentation",
              "FUNC-NT-008: Template management — admin console for creating/editing notification templates",
            ]} />
          </SubSection>
        </Section>

        {/* 4. Technical Architecture */}
        <Section title="4. TECHNICAL ARCHITECTURE & SPECIFICATIONS">
          <SubSection title="4.1 Architecture Overview">
            <P>GlobalPay employs a modern, cloud-native, microservices-based architecture optimized for the Ethiopian operating environment. The system is designed for horizontal scalability, fault tolerance, and operation in low-bandwidth conditions.</P>
            <div className="glass rounded-xl p-4 my-4 font-mono text-xs leading-relaxed text-muted-foreground">
              <pre>{`
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ PWA/Web  │  │  USSD    │  │  SMS     │  │  API   │  │
│  │ (React)  │  │ Gateway  │  │ Gateway  │  │Partners│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
└───────┼──────────────┼───────────┼──────────────┼───────┘
        │              │           │              │
┌───────▼──────────────▼───────────▼──────────────▼───────┐
│                   API GATEWAY LAYER                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Kong / Custom Gateway                          │    │
│  │  Rate Limiting · Auth · Routing · Logging       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 MICROSERVICES LAYER                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Wallet  │ │  Agent   │ │  KYC &   │ │  Payment │   │
│  │ Service  │ │ Service  │ │Compliance│ │  Router  │   │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤   │
│  │ Savings  │ │Commission│ │Reporting │ │ Notif.   │   │
│  │ Service  │ │ Engine   │ │ Service  │ │ Service  │   │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤   │
│  │  Loan    │ │ Merchant │ │   AI     │ │  EMoney  │   │
│  │ Service  │ │ Service  │ │ Engine   │ │ Ledger   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    DATA LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │PostgreSQL│ │  Redis   │ │  Object  │ │  Event   │   │
│  │(Primary) │ │ (Cache)  │ │ Storage  │ │  Stream  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
              `}</pre>
            </div>
          </SubSection>

          <SubSection title="4.2 Technology Stack">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold">Layer</th>
                  <th className="text-left p-3 font-semibold">Technology</th>
                  <th className="text-left p-3 font-semibold">Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TechRow layer="Frontend" tech="React 18 + TypeScript + Vite" reason="PWA-capable, offline-first, low-bandwidth optimized" />
                <TechRow layer="UI Framework" tech="Tailwind CSS + shadcn/ui" reason="Consistent design system, rapid development" />
                <TechRow layer="Backend" tech="Supabase (PostgreSQL + Edge Functions)" reason="Real-time subscriptions, row-level security, serverless scale" />
                <TechRow layer="Authentication" tech="Supabase Auth + OTP + Biometric" reason="Multi-factor, phone-first, NBE compliant" />
                <TechRow layer="API Gateway" tech="Edge Functions + Rate Limiting" reason="DDoS protection, throttling, API key management" />
                <TechRow layer="Caching" tech="Redis (via Upstash)" reason="Session management, rate limiting, real-time counters" />
                <TechRow layer="File Storage" tech="Supabase Storage (S3-compatible)" reason="KYC documents, receipts, encrypted at rest" />
                <TechRow layer="AI/ML" tech="OpenAI GPT / Local LLM" reason="Conversational AI, fraud detection, credit scoring" />
                <TechRow layer="Monitoring" tech="Sentry + Custom Analytics" reason="Error tracking, performance monitoring, usage analytics" />
                <TechRow layer="CI/CD" tech="GitHub Actions + Lovable Cloud" reason="Automated testing, staged deployments, rollback" />
              </tbody>
            </table>
          </SubSection>

          <SubSection title="4.3 Database Schema (Core Tables)">
            <BulletList items={[
              "users — User identity, phone, email, KYC tier, status, created_at",
              "wallets — wallet_id, user_id, balance, currency, status, daily_limit, tier",
              "transactions — txn_id, from_wallet, to_wallet, amount, fee, type, status, timestamp, reference",
              "agents — agent_id, user_id, type (super/sub/direct/merchant), zone, float_balance, status",
              "agent_commissions — commission_id, agent_id, txn_id, amount, type, settled, period",
              "kyc_documents — doc_id, user_id, doc_type, file_url, verification_status, verified_by",
              "savings_goals — goal_id, user_id, name, target, current, auto_save_rule, locked_until",
              "loans — loan_id, user_id, amount, interest_rate, tenure, status, disbursed_at, repayment_schedule",
              "emoney_ledger — entry_id, type (issue/destroy), amount, trust_balance, timestamp",
              "notifications — notif_id, user_id, channel, template, payload, sent_at, read_at",
              "loyalty_points — point_id, user_id, points, source_txn, expires_at",
              "audit_log — log_id, admin_id, action, entity, entity_id, timestamp, ip_address",
              "user_roles — id, user_id, role (admin/moderator/user), unique(user_id, role)",
            ]} />
          </SubSection>

          <SubSection title="4.4 API Specifications">
            <P>All APIs follow RESTful conventions with JSON payloads. Authentication via JWT Bearer tokens with refresh token rotation.</P>
            <BulletList items={[
              "POST /api/v1/wallet/transfer — Initiate P2P transfer",
              "POST /api/v1/wallet/cashin — Agent-initiated cash-in",
              "POST /api/v1/wallet/cashout — Customer-initiated cash-out",
              "GET /api/v1/wallet/balance — Real-time balance inquiry",
              "GET /api/v1/transactions?page=&limit=&filter= — Transaction history with pagination",
              "POST /api/v1/kyc/upload — Document upload for KYC verification",
              "POST /api/v1/merchant/pay — QR-based merchant payment",
              "GET /api/v1/agent/float — Agent float balance",
              "POST /api/v1/agent/float/request — Float top-up request",
              "POST /api/v1/bills/pay — Bill payment initiation",
              "POST /api/v1/airtime/topup — Airtime purchase",
              "POST /api/v1/savings/create — Create savings goal",
              "POST /api/v1/loan/apply — Micro-loan application",
              "GET /api/v1/loyalty/balance — Points balance inquiry",
              "POST /api/v1/ai/chat — AI copilot conversation endpoint",
            ]} />
          </SubSection>
        </Section>

        {/* 5. AI Copilot */}
        <Section title="5. GLOBAL AI COPILOT — DETAILED FUNCTIONAL SPECIFICATIONS">
          <SubSection title="5.1 Overview">
            <P>Global AI is an intelligent conversational assistant embedded across all GlobalPay touchpoints — customer wallet, agent portal, merchant dashboard, and admin console. It combines large language model (LLM) capabilities with domain-specific financial services knowledge to provide contextual, actionable, and compliant assistance.</P>
          </SubSection>

          <SubSection title="5.2 Customer-Facing AI Features">
            <BulletList items={[
              "AI-CUST-001: Natural language balance inquiry — 'What is my balance?' in Amharic or English",
              "AI-CUST-002: Transaction search — 'Show me all transfers to Abebe last month'",
              "AI-CUST-003: Smart suggestions — 'You usually pay your EEU bill around this time. Would you like to pay now?'",
              "AI-CUST-004: Financial health insights — 'You've saved 23% more this month. Keep it up!'",
              "AI-CUST-005: Bill reminder — 'Your Ethio Telecom bill of ETB 500 is due in 3 days'",
              "AI-CUST-006: Fraud alert explanation — 'We blocked a transfer because it was from an unusual location'",
              "AI-CUST-007: Product discovery — 'Did you know you can earn points on every transfer?'",
              "AI-CUST-008: Guided onboarding — Step-by-step KYC upgrade assistance",
              "AI-CUST-009: Dispute resolution — AI-guided process for reporting unauthorized transactions",
              "AI-CUST-010: Multilingual support — Amharic, English, Afaan Oromoo (Phase 2), Tigrinya (Phase 2)",
            ]} />
          </SubSection>

          <SubSection title="5.3 Agent-Facing AI Features">
            <BulletList items={[
              "AI-AGNT-001: Float prediction — 'Based on trends, you'll need ETB 50,000 float top-up by Thursday'",
              "AI-AGNT-002: Performance coaching — 'Your cash-out volume is 15% below zone average. Try these tips...'",
              "AI-AGNT-003: Customer onboarding assistant — AI guides agents through customer registration steps",
              "AI-AGNT-004: Transaction troubleshooting — 'Customer's cash-out failed because their daily limit was reached'",
              "AI-AGNT-005: Commission optimizer — 'Process 5 more cash-in transactions today to reach the next commission tier'",
            ]} />
          </SubSection>

          <SubSection title="5.4 Admin-Facing AI Features">
            <BulletList items={[
              "AI-ADMN-001: Customer 360 AI summary — One-click AI-generated customer risk and behavior profile",
              "AI-ADMN-002: Anomaly narrative — AI explains why a transaction was flagged with supporting evidence",
              "AI-ADMN-003: SAR auto-draft — AI generates Suspicious Activity Report narrative from transaction data",
              "AI-ADMN-004: Predictive analytics — Churn prediction, revenue forecasting, agent attrition risk",
              "AI-ADMN-005: Natural language reporting — 'Show me agent commission totals for Addis Ababa last quarter'",
              "AI-ADMN-006: Policy impact simulation — 'What if we reduce cash-out fees by 10%?' → revenue impact model",
              "AI-ADMN-007: Regulatory compliance checker — AI validates operations against NBE directive requirements",
            ]} />
          </SubSection>

          <SubSection title="5.5 AI Technical Architecture">
            <BulletList items={[
              "Model: GPT-4o / GPT-5 via Azure OpenAI (data residency compliant) with local LLM fallback",
              "Retrieval-Augmented Generation (RAG): Vector database for product docs, FAQs, NBE directives",
              "Tool calling: AI can query balance, fetch transactions, initiate workflows via function calling",
              "Guardrails: Content filtering, PII redaction, hallucination detection, compliance boundary enforcement",
              "Context window: Conversation history management with sliding window + summarization",
              "Latency target: < 2 seconds for first token, < 5 seconds for complete response",
              "Fallback: Graceful degradation to rule-based responses if AI service unavailable",
            ]} />
          </SubSection>
        </Section>

        {/* 6. Security */}
        <Section title="6. SECURITY ARCHITECTURE">
          <BulletList items={[
            "SEC-001: End-to-end encryption — TLS 1.3 for data in transit, AES-256 for data at rest",
            "SEC-002: Transaction PIN — 6-digit PIN for all financial operations, stored as bcrypt hash",
            "SEC-003: Biometric authentication — fingerprint/face ID for supported devices",
            "SEC-004: OTP verification — time-based OTP via SMS for critical operations",
            "SEC-005: Session management — JWT with 15-minute access token, 7-day refresh token rotation",
            "SEC-006: Rate limiting — per-user, per-IP, per-endpoint with progressive backoff",
            "SEC-007: Row-Level Security (RLS) — database-enforced access control per user/role",
            "SEC-008: Role-Based Access Control (RBAC) — separate user_roles table with security definer functions",
            "SEC-009: API key management — unique keys per integration partner with scope restrictions",
            "SEC-010: Penetration testing — quarterly external pen tests with remediation SLA",
            "SEC-011: PCI-DSS alignment — card data handling (if applicable) per PCI standards",
            "SEC-012: Fraud detection — real-time rule engine + AI anomaly detection scoring",
            "SEC-013: Geo-fencing — agent transactions restricted to registered zone coordinates",
            "SEC-014: Device binding — wallet bound to registered device, new device requires re-verification",
            "SEC-015: Audit logging — immutable log of all system events with 7-year retention",
          ]} />
        </Section>

        {/* 7. Integrations */}
        <Section title="7. INTEGRATION SPECIFICATIONS">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">System</th>
                <th className="text-left p-3 font-semibold">Protocol</th>
                <th className="text-left p-3 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <TechRow layer="Core Banking (CBS)" tech="ISO 8583 / REST API" reason="Account verification, fund transfer, balance inquiry" />
              <TechRow layer="National ID (NIDIS)" tech="REST API" reason="Identity verification for KYC" />
              <TechRow layer="Ethio Telecom" tech="REST API / SMPP" reason="SMS gateway, airtime/data purchase" />
              <TechRow layer="EthSwitch" tech="ISO 8583" reason="Interbank transfers, ATM network" />
              <TechRow layer="Ethiopian Electric Utility" tech="REST API" reason="Utility bill inquiry and payment" />
              <TechRow layer="ERCA" tech="REST API" reason="Tax payment processing" />
              <TechRow layer="NBE Reporting" tech="SFTP / REST API" reason="Regulatory report submission" />
              <TechRow layer="Payment Card Networks" tech="EMV / Tokenization API" reason="Card-linked wallet operations (Phase 2)" />
              <TechRow layer="Credit Bureau" tech="REST API" reason="Credit score inquiry for micro-loans" />
              <TechRow layer="Insurance Partners" tech="REST API" reason="Premium collection, policy inquiry" />
            </tbody>
          </table>
        </Section>

        {/* 8. NFRs */}
        <Section title="8. NON-FUNCTIONAL REQUIREMENTS">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">Requirement</th>
                <th className="text-left p-3 font-semibold">Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Availability", "99.95% uptime SLA (excludes planned maintenance windows)"],
                ["Scalability", "Horizontal scaling to 10,000 TPS with auto-scaling infrastructure"],
                ["Latency", "< 500ms API response time (P95); < 2s end-to-end transaction"],
                ["Concurrent Users", "Support 500,000 concurrent active sessions"],
                ["Data Retention", "Transaction data: 10 years; Audit logs: 7 years; KYC docs: 10 years"],
                ["Backup & Recovery", "RPO: 1 minute; RTO: 15 minutes; Daily full backup + continuous WAL archiving"],
                ["Offline Support", "PWA offline mode: balance view, transaction queue, sync on reconnect"],
                ["Accessibility", "WCAG 2.1 AA compliance; screen reader support; high contrast mode"],
                ["Localization", "Amharic (primary), English, Afaan Oromoo, Tigrinya"],
                ["Browser Support", "Chrome 90+, Safari 15+, Firefox 90+, Samsung Internet 15+"],
                ["Minimum Device", "Android 8.0+ with 1GB RAM; iOS 14+; 2G/EDGE network capable"],
              ].map(([req, spec]) => (
                <tr key={req}>
                  <td className="p-3 font-medium">{req}</td>
                  <td className="p-3 text-muted-foreground">{spec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 9. Deployment */}
        <Section title="9. DEPLOYMENT & INFRASTRUCTURE">
          <BulletList items={[
            "Primary hosting: Cloud-native deployment (AWS / Azure Africa region or local data center per NBE requirements)",
            "CDN: Edge caching for static assets — Cloudflare with Ethiopian PoP",
            "Database: PostgreSQL 15 with read replicas, connection pooling (PgBouncer)",
            "Container orchestration: Kubernetes (EKS/AKS) with auto-scaling pod policies",
            "CI/CD pipeline: GitHub Actions → Build → Test → Stage → Production (blue-green deployment)",
            "Environment separation: Development → Staging → UAT → Pre-Production → Production",
            "Disaster Recovery: Active-passive setup with automated failover (< 15 min RTO)",
            "Monitoring stack: Prometheus + Grafana + Sentry + custom business metrics dashboard",
          ]} />
        </Section>

        {/* 10. Features & Benefits */}
        <Section title="10. FEATURES & BENEFITS SUMMARY">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">Feature</th>
                <th className="text-left p-3 font-semibold">Benefit to Global Bank Ethiopia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["PWA with Offline Mode", "Serves customers in low-connectivity areas; reduces app store dependency"],
                ["AI-Powered Copilot", "Reduces call center volume by 40%; improves customer self-service"],
                ["Agent Banking Network", "Extends reach to 800+ woredas without branch infrastructure cost"],
                ["Real-Time Fraud Detection", "Reduces fraud losses by 60% vs rule-only systems"],
                ["Tiered KYC Framework", "Balances financial inclusion with regulatory compliance"],
                ["Micro-Loan Engine", "New revenue stream; addresses credit gap for underserved segments"],
                ["Loyalty & Gamification", "Increases transaction frequency by 25% and reduces churn"],
                ["EMoney Trust Management", "Automated NBE compliance; reduces manual reconciliation effort"],
                ["Multi-Channel Access", "PWA + USSD + SMS ensures 100% population coverage"],
                ["Comprehensive Reporting", "Regulatory reporting automation saves 200+ man-hours monthly"],
                ["Maker-Checker Workflows", "Reduces operational risk; enforces four-eyes principle"],
                ["Modular Architecture", "Phase-based rollout; independent service scaling; future-proof"],
              ].map(([feature, benefit]) => (
                <tr key={feature}>
                  <td className="p-3 font-medium">{feature}</td>
                  <td className="p-3 text-muted-foreground">{benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 11. Roadmap */}
        <Section title="11. IMPLEMENTATION ROADMAP">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">Phase</th>
                <th className="text-left p-3 font-semibold">Duration</th>
                <th className="text-left p-3 font-semibold">Deliverables</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Phase 1 — Foundation", "Months 1–4", "Wallet, P2P transfers, Cash-In/Out, Agent onboarding, Basic KYC, Admin dashboard"],
                ["Phase 2 — Expansion", "Months 5–8", "Bill payments, Airtime, Merchant QR, Savings goals, Enhanced KYC, Reporting"],
                ["Phase 3 — Intelligence", "Months 9–12", "AI Copilot, Micro-loans, Loyalty program, Advanced analytics, USSD channel"],
                ["Phase 4 — Scale", "Months 13–18", "Interbank transfers, Card integration, Group savings (Equb), Insurance, Multi-language"],
                ["Phase 5 — Innovation", "Months 19–24", "Open API marketplace, Cross-border remittance, IoT payments, Voice banking"],
              ].map(([phase, dur, del]) => (
                <tr key={phase}>
                  <td className="p-3 font-medium whitespace-nowrap">{phase}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{dur}</td>
                  <td className="p-3 text-muted-foreground">{del}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 12. Risk */}
        <Section title="12. RISK MITIGATION">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">Risk</th>
                <th className="text-left p-3 font-semibold">Impact</th>
                <th className="text-left p-3 font-semibold">Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Network connectivity", "High", "Offline-first PWA, USSD fallback, SMS confirmation"],
                ["Regulatory changes", "Medium", "Modular compliance engine, quarterly NBE alignment reviews"],
                ["Fraud & cybersecurity", "High", "AI fraud detection, encryption, pen testing, SOC monitoring"],
                ["Agent network quality", "Medium", "AI performance scoring, automated dormancy detection, training"],
                ["Technology obsolescence", "Low", "Open standards, modular architecture, vendor-agnostic design"],
                ["Data residency", "High", "Local hosting option, encrypted replication, NBE data sovereignty compliance"],
              ].map(([risk, impact, mit]) => (
                <tr key={risk}>
                  <td className="p-3 font-medium">{risk}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${impact === "High" ? "bg-red-500/15 text-red-400" : impact === "Medium" ? "bg-yellow-500/15 text-yellow-400" : "bg-green-500/15 text-green-400"}`}>
                      {impact}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{mit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 13. Appendices */}
        <Section title="13. APPENDICES">
          <BulletList items={[
            "Appendix A: Glossary of Terms (KYC, AML, CFT, PEP, CTR, SAR, MCC, MDR, TPS, RTO, RPO)",
            "Appendix B: NBE Directive Reference Table — Mobile Money, Agent Banking, EMoney regulations",
            "Appendix C: API Endpoint Catalog (Complete Swagger/OpenAPI documentation)",
            "Appendix D: Database Entity-Relationship Diagram (ERD)",
            "Appendix E: UI/UX Wireframes & Design System Documentation",
            "Appendix F: Test Strategy Document — Unit, Integration, E2E, Performance, Security testing",
            "Appendix G: Service Level Agreement (SLA) Template",
            "Appendix H: Change Management & Governance Framework",
          ]} />
        </Section>

        {/* Signature */}
        <div className="border-t border-border pt-8 mt-12 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-sm font-bold">Prepared By:</p>
              <div className="border-b border-border pb-8" />
              <p className="text-xs text-muted-foreground">Head of Digital Banking & Mobile Financial Services</p>
              <p className="text-xs text-muted-foreground">Global Bank Ethiopia S.C.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">Approved By:</p>
              <div className="border-b border-border pb-8" />
              <p className="text-xs text-muted-foreground">Chief Technology Officer / Chief Operating Officer</p>
              <p className="text-xs text-muted-foreground">Global Bank Ethiopia S.C.</p>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            © {new Date().getFullYear()} Global Bank Ethiopia S.C. — All Rights Reserved. This document is CONFIDENTIAL and intended solely for the Management of Global Bank Ethiopia.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Helper Components ──

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">{title}</h2>
    {children}
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3 ml-1">
    <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
    {children}
  </div>
);

const P = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm leading-relaxed text-muted-foreground ${className}`}>{children}</p>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 ml-4">
    {items.map((item, i) => (
      <li key={i} className="text-sm text-muted-foreground flex gap-2">
        <span className="text-gold mt-0.5">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const TechRow = ({ layer, tech, reason }: { layer: string; tech: string; reason: string }) => (
  <tr>
    <td className="p-3 font-medium">{layer}</td>
    <td className="p-3">{tech}</td>
    <td className="p-3 text-muted-foreground">{reason}</td>
  </tr>
);

export default ProposalDocument;
