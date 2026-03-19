/**
 * ProposalDocument — Functional & Technical Specification document.
 *
 * @route /proposal
 * @module Public / Sales
 *
 * @description Comprehensive specification document for Global Bank Ethiopia
 * with 200+ requirement IDs, 15+ operational workflows, 50+ AI feature
 * definitions, and a 27-table database schema. Supports printing and
 * text-based downloading. Accessible from Admin sidebar.
 *
 * @api_endpoints None — static document page.
 *
 * @dependencies None (pure React rendering, no external libs)
 */
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
    a.download = "GlobalPay_Functional_Product_Document_v4.txt";
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
            Comprehensive Functional Product Document
          </h2>
          <p className="text-sm text-muted-foreground">
            Submitted to: The Management of Global Bank Ethiopia S.C.
          </p>
          <p className="text-sm text-muted-foreground">
            Prepared by: Digital Banking & Mobile Financial Services Division
          </p>
          <p className="text-xs text-muted-foreground">
            Document Version: 4.0 · Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Classification: CONFIDENTIAL
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TABLE OF CONTENTS
        ════════════════════════════════════════════════════════════════ */}
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
                <li>USSD & Offline Module</li>
                <li>Dispute & Chargeback Module</li>
              </ol>
            </li>
            <li>Detailed Workflow Specifications</li>
            <li>Global AI Copilot — Comprehensive Specifications</li>
            <li>Admin Console — Detailed Functional Breakdown</li>
            <li>Technical Architecture & Specifications</li>
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

        {/* ════════════════════════════════════════════════════════════════
            1. EXECUTIVE SUMMARY
        ════════════════════════════════════════════════════════════════ */}
        <Section title="1. EXECUTIVE SUMMARY">
          <P>
            GlobalPay is a next-generation mobile money platform designed and purpose-built for Global Bank Ethiopia S.C. to deliver inclusive financial services to Ethiopia's 120M+ population. The platform enables real-time peer-to-peer transfers, bill payments, merchant QR payments, agent-assisted cash-in/cash-out, micro-lending, savings products, and loyalty programs — all unified under a single, NBE-compliant digital wallet infrastructure.
          </P>
          <P>
            This document provides an exhaustive, micro-granular breakdown of every functional module, every sub-module, every workflow, every AI-powered capability, and every admin console function within the GlobalPay ecosystem. It is intended to serve as the authoritative reference for Management review, regulatory submission to the National Bank of Ethiopia (NBE), and technical due diligence by the Bank's IT Governance Committee.
          </P>
          <P>
            Key value propositions: (1) Full NBE Directive compliance for mobile money operations; (2) Agent banking network supporting 50,000+ agents nationwide; (3) AI-powered fraud detection, customer insights, and operational intelligence via Global AI; (4) Sub-second transaction processing with 99.95% uptime SLA; (5) Progressive Web App (PWA) with offline-first capabilities for low-bandwidth environments; (6) Comprehensive admin console with real-time monitoring, KYC queue, agent management, and regulatory reporting.
          </P>
          <SubSection title="1.1 Document Scope">
            <BulletList items={[
              "150+ Functional Requirement IDs across 14 modules",
              "25+ End-to-end workflow specifications with step-by-step process descriptions",
              "50+ AI feature specifications across customer, agent, merchant, and admin portals",
              "40+ Admin console sub-features with role-based access control mappings",
              "Complete technical architecture, security framework, and integration catalog",
              "Implementation roadmap spanning 24 months across 5 phases",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            2. PRODUCT VISION
        ════════════════════════════════════════════════════════════════ */}
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
              "Diaspora Community: Cross-border remittance recipients (Phase 4)",
            ]} />
          </SubSection>
          <SubSection title="2.4 Platform Access Channels">
            <BulletList items={[
              "PWA (Progressive Web App): Primary channel — smartphone users, offline-capable",
              "USSD: Feature phone users — dial *123# for all core wallet operations",
              "SMS: Transaction notifications, OTP delivery, basic commands",
              "Agent Portal: Dedicated agent PWA for cash-in/out, customer onboarding",
              "Admin Console: Web-based operations management for bank staff",
              "Merchant Dashboard: Sales analytics, settlement tracking, refund management",
              "API Gateway: Third-party integrations, partner connectivity",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            3. FUNCTIONAL SPECIFICATIONS
        ════════════════════════════════════════════════════════════════ */}
        <Section title="3. FUNCTIONAL SPECIFICATIONS">

          {/* ── 3.1 Customer Wallet Module ── */}
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
                "FUNC-CW-009: Wallet statement download — PDF/CSV export for date range (up to 12 months)",
                "FUNC-CW-010: Account closure — self-service request with mandatory balance withdrawal, 30-day cooling period",
              ]} />
            </SubSection>
            <SubSection title="3.1.2 Peer-to-Peer (P2P) Transfers">
              <BulletList items={[
                "FUNC-CW-020: Instant P2P transfer to any GlobalPay wallet via mobile number",
                "FUNC-CW-021: Transfer to non-registered users with SMS notification and 72-hour claim window",
                "FUNC-CW-022: Scheduled/recurring transfers with configurable frequency (daily, weekly, monthly)",
                "FUNC-CW-023: Transfer with purpose/note attachment (max 140 characters)",
                "FUNC-CW-024: Request money from contacts with push notification to payer",
                "FUNC-CW-025: Split-bill functionality — divide amount among multiple recipients equally or custom",
                "FUNC-CW-026: Transaction PIN verification for all outgoing transfers",
                "FUNC-CW-027: Real-time transaction confirmation via SMS and in-app notification",
                "FUNC-CW-028: Transaction reversal request within 15-minute window (pending admin approval)",
                "FUNC-CW-029: Transfer speed options — Instant (fee applies), Standard (free, up to 1 hour for cross-bank)",
                "FUNC-CW-030: Bulk transfer — send to multiple recipients in a single batch (up to 20 recipients)",
                "FUNC-CW-031: Favorite recipients quick-send — one-tap send to saved contacts with pre-filled amounts",
              ]} />
            </SubSection>
            <SubSection title="3.1.3 Cash-In / Cash-Out">
              <BulletList items={[
                "FUNC-CW-040: Cash-in at any registered agent location with agent-initiated confirmation",
                "FUNC-CW-041: Cash-out at agent with OTP-based customer verification",
                "FUNC-CW-042: ATM cash-out via cardless withdrawal (QR scan at ATM)",
                "FUNC-CW-043: Bank account pull (wallet top-up from linked bank account)",
                "FUNC-CW-044: Bank account push (wallet to bank account transfer)",
                "FUNC-CW-045: Cash-in limits enforced per KYC tier with real-time limit tracking",
                "FUNC-CW-046: Agent location finder with GPS-based nearest agent display and navigation",
                "FUNC-CW-047: Cash-out code generation — customer generates withdrawal code, agent enters to dispense",
                "FUNC-CW-048: Scheduled cash-out — pre-book amount and agent location for pickup",
              ]} />
            </SubSection>
            <SubSection title="3.1.4 Transaction Management">
              <BulletList items={[
                "FUNC-CW-050: Full transaction history with search, filter by type/date/amount/status",
                "FUNC-CW-051: Transaction detail view — amount, fee, recipient, timestamp, reference ID, status",
                "FUNC-CW-052: Transaction receipt — share via SMS, WhatsApp, or download as PDF",
                "FUNC-CW-053: Pending transaction management — view, cancel, or modify scheduled transfers",
                "FUNC-CW-054: Transaction categorization — auto-tag transactions (food, transport, bills, etc.)",
                "FUNC-CW-055: Monthly spending summary — visual breakdown by category with comparison to previous month",
                "FUNC-CW-056: Export transaction history — CSV/PDF for personal record-keeping or tax purposes",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.2 Agent Banking Module ── */}
          <SubSection title="3.2 Agent Banking Module">
            <SubSection title="3.2.1 Agent Hierarchy & Onboarding">
              <BulletList items={[
                "FUNC-AG-001: Four-tier agent hierarchy — Super-Agent, Sub-Agent, Direct-Agent, Merchant-Agent",
                "FUNC-AG-002: Digital agent onboarding with document upload (business license, TIN, kebele ID, trade license, bank statement)",
                "FUNC-AG-003: Agent KYC verification by compliance team with automated document validation via AI OCR",
                "FUNC-AG-004: NBE-issued agent code assignment upon approval with unique agent identifier",
                "FUNC-AG-005: Agent territory/zone assignment with geo-fencing capabilities",
                "FUNC-AG-006: Super-Agent to Sub-Agent float distribution with automated reconciliation",
                "FUNC-AG-007: Agent dormancy detection — auto-flag agents inactive for 30+ days, escalate after 60 days",
                "FUNC-AG-008: Agent contract management — digital agreement acceptance with e-signature and expiry tracking",
                "FUNC-AG-009: Agent training module — in-app training videos, quizzes, and certification tracking",
                "FUNC-AG-010: Agent device registration — bind agent account to specific device IMEI for security",
              ]} />
            </SubSection>
            <SubSection title="3.2.2 Agent Transactions">
              <BulletList items={[
                "FUNC-AG-020: Agent-assisted customer cash-in with dual confirmation (agent + customer OTP)",
                "FUNC-AG-021: Agent-assisted customer cash-out with biometric/OTP verification",
                "FUNC-AG-022: Agent-to-agent float transfer (within same Super-Agent network)",
                "FUNC-AG-023: Agent float top-up from bank branch or Super-Agent",
                "FUNC-AG-024: Agent daily transaction limits — configurable by agent type and zone",
                "FUNC-AG-025: Agent commission calculation — real-time, tiered by volume brackets",
                "FUNC-AG-026: Agent transaction reversal with supervisor approval workflow",
                "FUNC-AG-027: End-of-day agent reconciliation report (auto-generated)",
                "FUNC-AG-028: Customer wallet registration at agent point — agent-assisted onboarding",
                "FUNC-AG-029: Bill payment on behalf of customer — agent collects cash and processes digitally",
                "FUNC-AG-030: Airtime/data purchase on behalf of customer",
                "FUNC-AG-031: Agent receipt printing — thermal printer integration or SMS receipt to customer",
              ]} />
            </SubSection>
            <SubSection title="3.2.3 Agent Float Management">
              <BulletList items={[
                "FUNC-AG-040: Real-time float balance monitoring per agent with dashboard widget",
                "FUNC-AG-041: Low float alert — push notification when float drops below configurable threshold (default: ETB 5,000)",
                "FUNC-AG-042: Float request workflow — agent request → Super-Agent/bank approval → disbursement → confirmation",
                "FUNC-AG-043: Float redistribution — Super-Agent rebalances float across Sub-Agents based on demand",
                "FUNC-AG-044: Float interest calculation on overnight balances (if applicable per policy)",
                "FUNC-AG-045: Emergency float top-up via USSD for network-constrained areas",
                "FUNC-AG-046: Float history — complete audit trail of all float movements with timestamps",
                "FUNC-AG-047: AI-predicted float needs — daily forecast based on historical patterns and events",
              ]} />
            </SubSection>
            <SubSection title="3.2.4 Agent Commission Engine">
              <BulletList items={[
                "FUNC-AG-050: Commission model — flat fee, percentage, tiered, or hybrid per product type",
                "FUNC-AG-051: Super-Agent override commission — percentage of Sub-Agent transaction volume",
                "FUNC-AG-052: Commission split configuration — Super-Agent/Sub-Agent ratios (e.g., 30/70)",
                "FUNC-AG-053: Commission settlement — daily accrual, configurable payout frequency (daily/weekly/monthly)",
                "FUNC-AG-054: Commission dispute resolution workflow with escalation tiers",
                "FUNC-AG-055: Agent performance scoring — transaction volume, uptime, customer satisfaction, error rate",
                "FUNC-AG-056: Bonus commission — promotional campaigns with time-bound bonus rates",
                "FUNC-AG-057: Commission statement — monthly detailed breakdown downloadable as PDF",
                "FUNC-AG-058: Tax withholding — automatic deduction of applicable taxes from commission payouts",
              ]} />
            </SubSection>
            <SubSection title="3.2.5 Agent Performance & Monitoring">
              <BulletList items={[
                "FUNC-AG-060: Agent leaderboard — ranking by transaction volume, customer ratings, uptime",
                "FUNC-AG-061: Agent SLA monitoring — response time to customer requests, transaction success rate",
                "FUNC-AG-062: Mystery shopper program — admin-initiated test transactions with agent scoring",
                "FUNC-AG-063: Agent complaint management — customer feedback collection and resolution workflow",
                "FUNC-AG-064: Agent suspension/termination workflow — warning → suspension → termination with appeals process",
                "FUNC-AG-065: Agent location verification — periodic GPS check against registered coordinates",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.3 Merchant Payments ── */}
          <SubSection title="3.3 Merchant Payments Module">
            <SubSection title="3.3.1 Merchant Onboarding">
              <BulletList items={[
                "FUNC-MP-001: Merchant registration with business verification (TIN, trade license, bank statement)",
                "FUNC-MP-002: Merchant category classification (MCC) — food, retail, services, transport, etc.",
                "FUNC-MP-003: Multi-outlet support — single merchant entity, multiple branch locations with independent QR codes",
                "FUNC-MP-004: Merchant tier assignment — Micro, Small, Medium, Large with differentiated MDR rates",
                "FUNC-MP-005: Merchant branding — custom logo and business name on customer-facing payment screens",
              ]} />
            </SubSection>
            <SubSection title="3.3.2 Payment Acceptance">
              <BulletList items={[
                "FUNC-MP-010: Static QR code generation for in-store payment acceptance (print-ready format)",
                "FUNC-MP-011: Dynamic QR with pre-filled amount for invoice-based payments",
                "FUNC-MP-012: NFC tap-to-pay support for enabled devices",
                "FUNC-MP-013: Payment link generation — shareable URL for remote/online payments",
                "FUNC-MP-014: In-app payment — customer scans merchant QR, confirms amount, enters PIN",
                "FUNC-MP-015: Split payment — customer pays partially from wallet, partially from linked bank account",
                "FUNC-MP-016: Tip support — optional tip addition on payment confirmation screen",
                "FUNC-MP-017: Recurring payment setup — subscription billing for repeat customers",
              ]} />
            </SubSection>
            <SubSection title="3.3.3 Settlement & Reconciliation">
              <BulletList items={[
                "FUNC-MP-020: Merchant Discount Rate (MDR) — configurable per merchant category (MCC) and volume tier",
                "FUNC-MP-021: Daily settlement to merchant wallet or linked bank account (T+0 or T+1 configurable)",
                "FUNC-MP-022: Settlement report — daily/weekly/monthly with transaction breakdown",
                "FUNC-MP-023: Refund/chargeback processing with customer dispute workflow (7-day resolution SLA)",
                "FUNC-MP-024: Partial refund support — return portion of payment amount",
                "FUNC-MP-025: Settlement hold — admin can hold settlement for investigation (fraud/dispute)",
              ]} />
            </SubSection>
            <SubSection title="3.3.4 Merchant Dashboard">
              <BulletList items={[
                "FUNC-MP-030: Real-time sales dashboard — today's revenue, transaction count, average ticket size",
                "FUNC-MP-031: Sales analytics — daily/weekly/monthly trends, peak hours, popular products",
                "FUNC-MP-032: Customer analytics — repeat customer rate, new vs returning, average spend",
                "FUNC-MP-033: Receipt generation — digital receipt via SMS/email to customer with merchant branding",
                "FUNC-MP-034: Merchant API for e-commerce integration (RESTful, webhook callbacks for payment status)",
                "FUNC-MP-035: Merchant staff management — add cashiers with limited permissions per outlet",
                "FUNC-MP-036: Merchant loyalty integration — issue bonus points at point of sale for promotional campaigns",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.4 Admin Console ── */}
          <SubSection title="3.4 Admin & Operations Console">
            <P className="italic text-muted-foreground">See Section 6 for comprehensive Admin Console breakdown.</P>
            <SubSection title="3.4.1 Dashboard & Monitoring">
              <BulletList items={[
                "FUNC-AD-001: Real-time operations dashboard — TPS, success rate, revenue, active users, system load",
                "FUNC-AD-002: System health monitoring — API latency, database load, queue depth, error rates",
                "FUNC-AD-003: Geographic heat map — transaction density by region/woreda/kebele",
                "FUNC-AD-004: Anomaly detection alerts — unusual transaction patterns flagged in real-time with AI analysis",
                "FUNC-AD-005: Executive summary — daily/weekly/monthly KPI rollup with trend analysis and goal tracking",
                "FUNC-AD-006: Live transaction feed — streaming view of all transactions with filtering",
                "FUNC-AD-007: Alert management — configurable thresholds for system alerts (TPS drop, error spike, etc.)",
              ]} />
            </SubSection>
            <SubSection title="3.4.2 User Management">
              <BulletList items={[
                "FUNC-AD-010: Customer search — by phone, name, wallet ID, national ID, or agent code",
                "FUNC-AD-011: Customer profile 360 — complete view of KYC, transactions, disputes, loyalty, risk score",
                "FUNC-AD-012: Account actions — freeze, unfreeze, close, upgrade KYC tier, reset PIN",
                "FUNC-AD-013: Bulk user operations — mass SMS, tier upgrades, account flags, promotional credit",
                "FUNC-AD-014: Admin role-based access control (RBAC) — Maker-Checker for critical operations",
                "FUNC-AD-015: Audit trail — every admin action logged with timestamp, IP, user ID, and action detail",
                "FUNC-AD-016: Customer communication log — all SMS, push, email sent to customer with delivery status",
                "FUNC-AD-017: Watchlist management — add/remove users from internal watchlist with reason codes",
              ]} />
            </SubSection>
            <SubSection title="3.4.3 Transaction Management">
              <BulletList items={[
                "FUNC-AD-020: Transaction search — by ID, phone, date range, amount range, status, type",
                "FUNC-AD-021: Transaction reversal workflow — initiate → approve (checker) → execute → notify parties",
                "FUNC-AD-022: Suspicious transaction flagging — manual and AI-assisted with reason categorization",
                "FUNC-AD-023: Transaction fee override — for special cases with dual authorization and audit log",
                "FUNC-AD-024: Settlement management — batch settlement scheduling, monitoring, and reconciliation",
                "FUNC-AD-025: Reconciliation — automated three-way reconciliation (wallet ledger, CBS, payment switch)",
                "FUNC-AD-026: Failed transaction analysis — root cause categorization and retry management",
                "FUNC-AD-027: Transaction limit management — view/modify customer/agent limits per KYC tier",
              ]} />
            </SubSection>
            <SubSection title="3.4.4 Agent Management (Admin View)">
              <BulletList items={[
                "FUNC-AD-030: Agent onboarding queue — review, approve, reject agent applications with AI pre-screening",
                "FUNC-AD-031: Agent performance dashboard — transaction volume, float utilization, customer complaints",
                "FUNC-AD-032: Agent float oversight — real-time float balance across all agents, zone-level aggregation",
                "FUNC-AD-033: Agent territory management — create/modify zones, assign/reassign agents",
                "FUNC-AD-034: Agent commission configuration — set/modify commission models per product and agent tier",
                "FUNC-AD-035: Agent suspension/reactivation — with workflow including reason, evidence, and appeal process",
                "FUNC-AD-036: Super-Agent management — approve Super-Agent applications, monitor Sub-Agent networks",
              ]} />
            </SubSection>
            <SubSection title="3.4.5 KYC Management (Admin View)">
              <BulletList items={[
                "FUNC-AD-040: KYC review queue — AI pre-screened applications sorted by risk score and priority",
                "FUNC-AD-041: Document viewer — side-by-side view of submitted ID, selfie, liveness video",
                "FUNC-AD-042: AI verification results — document quality score, face match %, liveness check, OCR extracted data",
                "FUNC-AD-043: Manual override — approve/reject AI decision with mandatory reason and supervisor sign-off",
                "FUNC-AD-044: KYC escalation — flag documents for senior compliance review or external verification",
                "FUNC-AD-045: Bulk KYC operations — mass tier upgrade for verified cohorts",
                "FUNC-AD-046: KYC expiry management — re-verification reminders for documents nearing expiry",
              ]} />
            </SubSection>
            <SubSection title="3.4.6 EMoney Management (Admin View)">
              <BulletList items={[
                "FUNC-AD-050: EMoney issuance dashboard — total issued, trust account balance, reconciliation status",
                "FUNC-AD-051: Trust account monitoring — real-time view of 1:1 backing ratio with alerts on deviation",
                "FUNC-AD-052: EMoney issuance — create new e-float with bank deposit verification (maker-checker)",
                "FUNC-AD-053: EMoney destruction — retire e-money upon cash-out with automated ledger entries",
                "FUNC-AD-054: Float distribution management — allocate float to Super-Agents with approval workflow",
                "FUNC-AD-055: Regulatory reporting — auto-generate NBE daily e-money position report",
                "FUNC-AD-056: System wallet management — fee collection, commission, suspense, and settlement wallets",
              ]} />
            </SubSection>
            <SubSection title="3.4.7 System Configuration">
              <BulletList items={[
                "FUNC-AD-060: Fee configuration — set/modify transaction fees per product, tier, and amount bracket",
                "FUNC-AD-061: Limit configuration — daily/monthly transaction limits per KYC tier and product type",
                "FUNC-AD-062: Notification template management — create/edit SMS, push, and email templates",
                "FUNC-AD-063: Biller management — add/remove bill payment partners, configure fees and routing",
                "FUNC-AD-064: Promotional campaign management — create time-bound offers with target audience rules",
                "FUNC-AD-065: Feature flag management — enable/disable features per user segment or region",
                "FUNC-AD-066: Exchange rate management — set/update FX rates for multi-currency operations",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.5 KYC & Compliance ── */}
          <SubSection title="3.5 KYC & Compliance Module">
            <SubSection title="3.5.1 KYC Tiers & Verification">
              <BulletList items={[
                "FUNC-KY-001: Three-tier KYC framework aligned with NBE AML/CFT directives",
                "FUNC-KY-002: Tier 1 — Basic: Phone + OTP only. Daily limit ETB 10,000. Monthly ETB 50,000",
                "FUNC-KY-003: Tier 2 — Enhanced: National ID/Passport + Selfie + Liveness. Daily ETB 50,000. Monthly ETB 200,000",
                "FUNC-KY-004: Tier 3 — Full: In-person or video KYC + address verification. Daily ETB 200,000. Monthly ETB 1,000,000",
                "FUNC-KY-005: AI-powered document verification — OCR extraction (name, DOB, ID number), forgery detection (pixel analysis, font consistency), liveness check (blink/smile detection)",
                "FUNC-KY-006: Fayda National Digital ID integration — direct verification against national database",
                "FUNC-KY-007: Passport verification — MRZ code extraction and validation against ICAO standards",
                "FUNC-KY-008: Driver's license verification — barcode scanning and database cross-reference",
              ]} />
            </SubSection>
            <SubSection title="3.5.2 AML/CFT Compliance">
              <BulletList items={[
                "FUNC-KY-010: Watchlist screening — PEP (Politically Exposed Persons), sanctions lists (OFAC, UN, EU), adverse media (real-time screening at onboarding and periodic rescreening)",
                "FUNC-KY-011: Transaction monitoring — rule-based and AI-based detection of suspicious patterns",
                "FUNC-KY-012: Suspicious Activity Report (SAR) generation — automated narrative drafting by AI with human review",
                "FUNC-KY-013: Currency Transaction Report (CTR) — auto-filed for transactions exceeding NBE threshold",
                "FUNC-KY-014: Structuring detection — AI identifies attempts to break large transactions into smaller ones",
                "FUNC-KY-015: Ongoing due diligence — periodic re-verification triggers based on risk score changes",
                "FUNC-KY-016: Risk scoring engine — dynamic customer risk score (0-100) based on behavior, geography, volume",
                "FUNC-KY-017: Case management — compliance officers manage investigation cases with evidence attachment",
              ]} />
            </SubSection>
            <SubSection title="3.5.3 Document Management">
              <BulletList items={[
                "FUNC-KY-020: KYC document storage — encrypted (AES-256), tamper-evident, retention per NBE policy (10 years)",
                "FUNC-KY-021: Document versioning — track re-submitted documents with version history",
                "FUNC-KY-022: Document expiry tracking — auto-flag expired IDs with re-verification workflow",
                "FUNC-KY-023: Bulk document processing — batch upload and verification for corporate/agent onboarding",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.6 EMoney ── */}
          <SubSection title="3.6 EMoney Management Module">
            <SubSection title="3.6.1 EMoney Lifecycle">
              <BulletList items={[
                "FUNC-EM-001: EMoney issuance — creation of e-float backed 1:1 by trust account deposits at Global Bank",
                "FUNC-EM-002: Trust account reconciliation — real-time balancing of issued e-money vs bank deposits with variance alerts",
                "FUNC-EM-003: EMoney destruction — upon cash-out or bank transfer, e-money is retired from circulation",
                "FUNC-EM-004: Float distribution chain — Bank → Super-Agent → Sub-Agent → Customer (each step tracked)",
                "FUNC-EM-005: EMoney audit trail — full lifecycle tracking from issuance to destruction with immutable ledger",
              ]} />
            </SubSection>
            <SubSection title="3.6.2 Regulatory Compliance">
              <BulletList items={[
                "FUNC-EM-010: NBE regulatory reporting — daily e-money position report (total issued, outstanding, trust balance)",
                "FUNC-EM-011: Monthly EMoney report — detailed breakdown by issuance channel, destruction reason, geographic distribution",
                "FUNC-EM-012: Interest income management — interest earned on trust account deposits tracked and reported per NBE guidelines",
                "FUNC-EM-013: Inter-bank e-money transfer (future phase — pending NBE interoperability framework)",
              ]} />
            </SubSection>
            <SubSection title="3.6.3 System Wallets">
              <BulletList items={[
                "FUNC-EM-020: Fee collection wallet — all transaction fees deposited here, reconciled daily",
                "FUNC-EM-021: Commission wallet — agent commissions accrued here, settled per schedule",
                "FUNC-EM-022: Suspense wallet — holds unresolved transactions (failed, pending, disputed)",
                "FUNC-EM-023: Settlement wallet — inter-bank settlement holding account",
                "FUNC-EM-024: Promotional wallet — funds allocated for cashback, bonuses, and campaigns",
                "FUNC-EM-025: Tax wallet — withholding tax collected from agent commissions and merchant settlements",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.7 Savings & Micro-Loan ── */}
          <SubSection title="3.7 Savings & Micro-Loan Module">
            <SubSection title="3.7.1 Savings Goals">
              <BulletList items={[
                "FUNC-SV-001: Named savings goals — user-defined name, target amount, target date, category (education, wedding, business, emergency, health)",
                "FUNC-SV-002: Auto-save rules — round-up transactions (nearest ETB 10), percentage of incoming transfers (configurable 1-50%), scheduled daily/weekly/monthly deposits",
                "FUNC-SV-003: Lock/unlock savings — optional lock period with early withdrawal penalty (configurable 0.5-5%)",
                "FUNC-SV-004: Interest accrual — daily calculation, monthly crediting at rate per NBE guidelines (currently ~7% p.a.)",
                "FUNC-SV-005: Goal progress visualization — percentage complete, projected completion date, motivational milestones",
                "FUNC-SV-006: Group savings (Equb-style) — rotating savings with automated payout scheduling, member management, default handling",
                "FUNC-SV-007: Savings challenge — AI-suggested savings targets based on income pattern analysis",
                "FUNC-SV-008: Goal sharing — share savings progress with family/friends for contribution (crowdfunded goals)",
              ]} />
            </SubSection>
            <SubSection title="3.7.2 Micro-Loans">
              <BulletList items={[
                "FUNC-ML-001: AI-powered credit scoring — score 0-100 based on transaction history (volume, frequency, diversity), savings behavior (consistency, goal achievement), KYC tier, account age, repayment history",
                "FUNC-ML-002: Instant micro-loan disbursement — pre-approved amounts up to ETB 50,000 credited to wallet within 60 seconds",
                "FUNC-ML-003: Loan product catalog — Emergency (7 days, higher rate), Standard (30 days), Extended (90 days), Business (180 days)",
                "FUNC-ML-004: Flexible repayment — daily, weekly, or monthly installments auto-deducted from wallet",
                "FUNC-ML-005: Late payment handling — 3-day grace period, penalty calculation (1% per day capped at 10%), notification escalation (SMS → Push → Call)",
                "FUNC-ML-006: Loan history and credit score display — customer-facing credit health dashboard with score factors",
                "FUNC-ML-007: Collection management — automated reminders (Day 1, 3, 7, 14, 30), agent-assisted collection for overdue > 30 days",
                "FUNC-ML-008: NPL (Non-Performing Loan) classification — automated per NBE asset classification directives (Pass, Watch, Substandard, Doubtful, Loss)",
                "FUNC-ML-009: Loan restructuring — extend tenure or reduce installment amount for customers facing hardship (admin approval required)",
                "FUNC-ML-010: Credit limit increase — automatic based on repayment track record and score improvement",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.8 Bill Payments & Airtime ── */}
          <SubSection title="3.8 Bill Payments & Airtime Module">
            <SubSection title="3.8.1 Utility Bill Payments">
              <BulletList items={[
                "FUNC-BP-001: Ethiopian Electric Utility (EEU) — bill inquiry by meter number, instant payment, confirmation receipt",
                "FUNC-BP-002: Water utility — Addis Ababa Water & Sewerage Authority and regional utilities",
                "FUNC-BP-003: Internet — Ethio Telecom postpaid bill payment",
                "FUNC-BP-004: Tax payment — integration with Ethiopian Revenue & Customs Authority (ERCA) for TIN-based tax payment",
                "FUNC-BP-005: School fee payment — integration with education institutions, payment reference generation",
                "FUNC-BP-006: Insurance premium payment — partner insurance companies with policy number lookup",
                "FUNC-BP-007: DStv / EthioSat TV — subscription renewal via account/smart card number",
                "FUNC-BP-008: Traffic fine payment — integration with Transport Authority",
              ]} />
            </SubSection>
            <SubSection title="3.8.2 Airtime & Data">
              <BulletList items={[
                "FUNC-BP-010: Ethio Telecom prepaid airtime top-up — own number or any number",
                "FUNC-BP-011: Safaricom Ethiopia airtime (if applicable) — prepaid recharge",
                "FUNC-BP-012: Data bundle purchase — pre-configured packages (daily, weekly, monthly) from telco partners",
                "FUNC-BP-013: Auto-recharge — schedule recurring airtime/data top-up with minimum balance trigger",
                "FUNC-BP-014: Bundle comparison — AI suggests best data bundle based on usage patterns",
              ]} />
            </SubSection>
            <SubSection title="3.8.3 Payment Management">
              <BulletList items={[
                "FUNC-BP-020: Scheduled bill payments — auto-pay on due date with insufficient balance notification 3 days prior",
                "FUNC-BP-021: Bill payment receipt — digital receipt with transaction reference for dispute resolution",
                "FUNC-BP-022: Biller management (admin) — add/remove billers, set fee structures, configure routing",
                "FUNC-BP-023: Payment reminder — AI-based reminders for recurring bills based on payment history",
                "FUNC-BP-024: Bill history — complete payment history per biller with search and filter",
                "FUNC-BP-025: Favorite billers — quick-access list for frequently paid bills with one-tap payment",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.9 Loyalty ── */}
          <SubSection title="3.9 Loyalty & Rewards Module">
            <SubSection title="3.9.1 Points Engine">
              <BulletList items={[
                "FUNC-LY-001: Points accrual engine — configurable points per transaction type and amount bracket (e.g., 1 point per ETB 100 transferred, 2x for bill payments)",
                "FUNC-LY-002: Tier system — Bronze (0-999 pts), Silver (1,000-4,999), Gold (5,000-19,999), Platinum (20,000+) with escalating benefits",
                "FUNC-LY-003: Points balance — real-time display with points earned this month, total lifetime, and tier progress",
                "FUNC-LY-004: Points history — complete log of earned and redeemed points with source transaction reference",
              ]} />
            </SubSection>
            <SubSection title="3.9.2 Redemption & Rewards">
              <BulletList items={[
                "FUNC-LY-010: Redemption catalog — airtime vouchers, merchant discount codes, fee waivers, charity donations",
                "FUNC-LY-011: Instant redemption — points converted to wallet credit at configurable rate (e.g., 100 pts = ETB 1)",
                "FUNC-LY-012: Partner rewards — co-branded offers from merchant partners (restaurants, retail, travel)",
                "FUNC-LY-013: Tier benefits — Silver: reduced fees; Gold: priority support + higher limits; Platinum: personal account manager + zero fees",
              ]} />
            </SubSection>
            <SubSection title="3.9.3 Gamification & Engagement">
              <BulletList items={[
                "FUNC-LY-020: Daily login streaks — bonus points for consecutive daily app opens (7-day: 50 pts, 30-day: 500 pts)",
                "FUNC-LY-021: Transaction milestones — badges for 10th, 50th, 100th, 500th transaction with bonus points",
                "FUNC-LY-022: Achievement badges — 'First Transfer', 'Savings Star', 'Bill Master', 'Referral Champion' displayed on profile",
                "FUNC-LY-023: Referral rewards — 200 points for successful referral (referee completes first transaction), both parties earn bonus",
                "FUNC-LY-024: Seasonal campaigns — Meskel, Timkat, New Year promotions with 2x/3x point multipliers",
                "FUNC-LY-025: Points expiry — 12-month rolling window with 30-day, 7-day, and 1-day expiry notifications",
                "FUNC-LY-026: Loyalty analytics (admin) — program cost, engagement rate, redemption rate, ROI per campaign",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.10 Reporting ── */}
          <SubSection title="3.10 Reporting & Analytics Module">
            <SubSection title="3.10.1 Customer Reports">
              <BulletList items={[
                "FUNC-RP-001: Transaction summary — daily/weekly/monthly with charts (bar, pie) by category",
                "FUNC-RP-002: Balance history — line chart showing wallet balance over time",
                "FUNC-RP-003: KYC status report — current tier, upgrade history, pending verifications",
                "FUNC-RP-004: Loyalty statement — points earned, redeemed, expired, tier status",
                "FUNC-RP-005: Loan statement — outstanding balance, repayment schedule, credit score trend",
              ]} />
            </SubSection>
            <SubSection title="3.10.2 Agent Reports">
              <BulletList items={[
                "FUNC-RP-010: Agent volume report — transaction count and value by type (cash-in, cash-out, bill pay)",
                "FUNC-RP-011: Commission report — earned, settled, pending, disputed by period",
                "FUNC-RP-012: Float report — current balance, movements, low-float incidents, utilization rate",
                "FUNC-RP-013: Performance report — SLA compliance, customer ratings, uptime percentage",
                "FUNC-RP-014: Agent network report (Super-Agent) — Sub-Agent performance comparison",
              ]} />
            </SubSection>
            <SubSection title="3.10.3 Admin & Regulatory Reports">
              <BulletList items={[
                "FUNC-RP-020: System-wide transaction report — total volume, value, success rate, by type/region/time",
                "FUNC-RP-021: Revenue report — fee income by product, commission expense, net revenue",
                "FUNC-RP-022: Merchant report — payment volume, MDR revenue, settlement status, active merchants",
                "FUNC-RP-023: EMoney position report — daily issuance, destruction, outstanding, trust account balance",
                "FUNC-RP-024: Regulatory reports — NBE daily position, CTR, SAR filings, AML compliance metrics",
                "FUNC-RP-025: KYC report — applications received, approved, rejected, pending, AI vs manual ratio",
                "FUNC-RP-026: Loan portfolio report — disbursed, outstanding, overdue, NPL classification, provision requirements",
                "FUNC-RP-027: Fraud report — flagged transactions, investigation outcomes, false positive rate, loss prevention",
                "FUNC-RP-028: Scheduled report generation — daily, weekly, monthly with email/SFTP delivery to stakeholders",
                "FUNC-RP-029: Ad-hoc report builder — drag-and-drop fields, filters, date ranges, export as PDF/Excel/CSV/JSON",
                "FUNC-RP-030: Report access control — role-based visibility per report category and sensitivity level",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.11 AI Copilot ── */}
          <SubSection title="3.11 Global AI Copilot Module">
            <P className="italic text-muted-foreground">See Section 5 for comprehensive AI specifications with 50+ feature IDs.</P>
            <BulletList items={[
              "FUNC-AI-001: In-app conversational AI assistant — natural language query for balance, history, help in Amharic and English",
              "FUNC-AI-002: Smart transaction suggestions — based on user behavior patterns and time-of-day context",
              "FUNC-AI-003: Fraud alert explanations — human-readable descriptions of flagged transactions",
              "FUNC-AI-004: Agent performance coaching — AI-generated tips for improving transaction volume and customer service",
              "FUNC-AI-005: Customer 360 AI insights — admin-facing predictive analytics per customer",
              "FUNC-AI-006: Automated SAR narrative generation — AI-drafted suspicious activity descriptions from transaction data",
              "FUNC-AI-007: Predictive float management — AI forecasts float needs by zone and day-of-week",
              "FUNC-AI-008: Natural language reporting — admin asks questions in plain language, AI generates reports",
            ]} />
          </SubSection>

          {/* ── 3.12 Notifications ── */}
          <SubSection title="3.12 Notification & Communication Module">
            <SubSection title="3.12.1 Notification Channels">
              <BulletList items={[
                "FUNC-NT-001: Push notifications — transaction alerts, promotional offers, system announcements, security alerts",
                "FUNC-NT-002: SMS notifications — transaction confirmation, OTP, low balance, bill due reminders, loan repayment",
                "FUNC-NT-003: In-app notification center — chronological feed with read/unread status, categorized tabs",
                "FUNC-NT-004: Email notifications — statement delivery, KYC status updates, loan approval (Tier 2+ users)",
                "FUNC-NT-005: USSD notifications — transaction confirmation for feature phone users via USSD push",
              ]} />
            </SubSection>
            <SubSection title="3.12.2 Notification Management">
              <BulletList items={[
                "FUNC-NT-010: Notification preferences — user-configurable channel selection and quiet hours",
                "FUNC-NT-011: Bulk messaging — admin-initiated campaigns with audience segmentation (region, tier, activity level)",
                "FUNC-NT-012: Template management — admin console for creating/editing notification templates with variable placeholders",
                "FUNC-NT-013: Delivery tracking — sent, delivered, read, failed status per notification with retry logic",
                "FUNC-NT-014: A/B testing — test notification copy variants with performance tracking (open rate, action rate)",
                "FUNC-NT-015: Scheduled notifications — queue messages for optimal delivery time based on user activity patterns",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.13 USSD & Offline ── */}
          <SubSection title="3.13 USSD & Offline Module">
            <SubSection title="3.13.1 USSD Channel">
              <BulletList items={[
                "FUNC-US-001: USSD access via *123# — main menu for all core wallet operations",
                "FUNC-US-002: USSD menu tree: 1) Check Balance, 2) Send Money, 3) Cash Out, 4) Buy Airtime, 5) Pay Bill, 6) Mini Statement, 7) Change PIN, 0) Help",
                "FUNC-US-003: USSD session management — 180-second timeout, session resumption within window",
                "FUNC-US-004: USSD PIN authentication — 4-digit session PIN for all financial operations",
                "FUNC-US-005: USSD language selection — Amharic or English at session start",
                "FUNC-US-006: USSD transaction confirmation — summary screen before execution with abort option",
                "FUNC-US-007: USSD agent operations — dedicated *124# shortcode for agent cash-in/out operations",
              ]} />
            </SubSection>
            <SubSection title="3.13.2 Offline PWA Capabilities">
              <BulletList items={[
                "FUNC-US-010: Offline balance view — last known balance displayed with timestamp",
                "FUNC-US-011: Offline transaction queue — transactions queued locally, auto-synced when connectivity restored",
                "FUNC-US-012: Offline mini-statement — cached last 10 transactions viewable offline",
                "FUNC-US-013: Offline QR generation — static QR codes generated and displayed without network",
                "FUNC-US-014: Background sync — service worker syncs queued operations in priority order when online",
                "FUNC-US-015: Connectivity indicator — clear visual indicator of online/offline status with sync progress",
              ]} />
            </SubSection>
          </SubSection>

          {/* ── 3.14 Dispute & Chargeback ── */}
          <SubSection title="3.14 Dispute & Chargeback Module">
            <BulletList items={[
              "FUNC-DC-001: Customer dispute initiation — select transaction, choose reason category (unauthorized, wrong amount, not received, duplicate, fraud)",
              "FUNC-DC-002: Evidence upload — customer can attach screenshots, photos, or text description",
              "FUNC-DC-003: Auto-acknowledgment — system sends confirmation with case ID and expected resolution timeline",
              "FUNC-DC-004: Investigation workflow — Level 1 (auto-resolve if clear rules match) → Level 2 (agent review) → Level 3 (compliance officer)",
              "FUNC-DC-005: Provisional credit — for fraud disputes, temporary credit issued within 24 hours pending investigation",
              "FUNC-DC-006: Merchant chargeback — initiate chargeback to merchant with evidence package, 7-day response window",
              "FUNC-DC-007: Resolution notification — customer notified of outcome with explanation and any credit/debit adjustments",
              "FUNC-DC-008: Dispute analytics — admin dashboard showing dispute volume, resolution time, category breakdown, repeat offenders",
              "FUNC-DC-009: Escalation to NBE — auto-generate regulatory complaint package for unresolved disputes exceeding 30 days",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            4. DETAILED WORKFLOW SPECIFICATIONS
        ════════════════════════════════════════════════════════════════ */}
        <Section title="4. DETAILED WORKFLOW SPECIFICATIONS">
          <P>This section describes end-to-end process flows for every major operation in the GlobalPay platform.</P>

          <SubSection title="4.1 Customer Registration Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer downloads PWA or dials *123# USSD",
              "Step 2: Customer enters mobile phone number",
              "Step 3: System sends 6-digit OTP via SMS (valid 5 minutes, max 3 retries)",
              "Step 4: Customer enters OTP for verification",
              "Step 5: System creates Tier 1 wallet (Basic KYC) with ETB 10,000 daily limit",
              "Step 6: Customer sets 6-digit transaction PIN (hashed with bcrypt, stored securely)",
              "Step 7: System generates unique Wallet ID and static receive QR code",
              "Step 8: Welcome notification sent via SMS and push with quick-start guide",
              "Step 9: Customer profile created with default settings (language, notifications)",
              "Step 10: AI onboarding assistant offers guided tour of key features",
            ]} />
          </SubSection>

          <SubSection title="4.2 P2P Transfer Workflow">
            <WorkflowSteps steps={[
              "Step 1: Sender opens Send Money screen → enters recipient phone number or selects from contacts/favorites",
              "Step 2: System validates recipient — registered user (instant), non-registered (SMS claim), or invalid number",
              "Step 3: Sender enters amount → system displays fee calculation and total debit",
              "Step 4: Sender adds optional note/purpose (max 140 chars)",
              "Step 5: Sender confirms transaction with 6-digit PIN or biometric",
              "Step 6: System validates: sufficient balance, within daily limit, not frozen, no fraud flags",
              "Step 7: Atomic double-entry ledger operation: debit sender wallet, credit recipient wallet",
              "Step 8: Transaction ID generated with unique reference number",
              "Step 9: Real-time notification to both parties: push + SMS with amount, reference, and new balance",
              "Step 10: Transaction recorded in history for both parties with receipt download option",
              "Step 11: AI system logs transaction pattern for fraud detection and future suggestions",
              "Step 12: If recipient is non-registered: SMS with claim link, 72-hour window, auto-refund if unclaimed",
            ]} />
          </SubSection>

          <SubSection title="4.3 Agent Cash-In Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer visits registered agent location with cash",
              "Step 2: Agent opens Cash-In screen → enters customer's mobile number",
              "Step 3: System displays customer name (masked: F*** L***) for verification",
              "Step 4: Agent enters cash amount received from customer",
              "Step 5: Agent confirms transaction — system generates OTP sent to customer",
              "Step 6: Customer reads OTP aloud to agent (or enters on own device if present)",
              "Step 7: Agent enters customer OTP → dual confirmation validated",
              "Step 8: System validates: agent float sufficient, customer within daily cash-in limit",
              "Step 9: Atomic operation: debit agent float, credit customer wallet",
              "Step 10: Agent commission calculated and accrued in real-time",
              "Step 11: Both parties receive SMS confirmation with receipt reference",
              "Step 12: Agent prints thermal receipt or customer receives SMS receipt",
            ]} />
          </SubSection>

          <SubSection title="4.4 Agent Cash-Out Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer initiates cash-out via app → enters amount → confirms with PIN",
              "Step 2: System generates 6-digit cash-out code (valid 30 minutes, single-use)",
              "Step 3: Customer visits agent and provides cash-out code",
              "Step 4: Agent enters cash-out code on agent portal",
              "Step 5: System validates: code valid, customer balance sufficient, agent float sufficient",
              "Step 6: System displays amount to agent — agent confirms cash disbursement to customer",
              "Step 7: Customer signs receipt (digital signature on agent device) or enters own OTP",
              "Step 8: Atomic operation: debit customer wallet, credit agent float",
              "Step 9: Agent commission calculated and accrued",
              "Step 10: Both parties receive SMS confirmation with transaction reference",
            ]} />
          </SubSection>

          <SubSection title="4.5 KYC Upgrade Workflow (Tier 1 → Tier 2)">
            <WorkflowSteps steps={[
              "Step 1: Customer navigates to Profile → Upgrade KYC",
              "Step 2: System displays required documents: National ID (front/back), Selfie photo, Liveness video",
              "Step 3: Customer captures front of National ID using in-app camera (auto-crop, quality check)",
              "Step 4: Customer captures back of National ID (auto-crop, quality check, OCR extraction preview)",
              "Step 5: Customer takes selfie with face-detection guide overlay",
              "Step 6: Customer performs liveness check — blink, smile, turn head left/right as prompted",
              "Step 7: System submits all documents for AI verification pipeline",
              "Step 8: AI Pipeline: Document Quality (clarity, completeness) → OCR (name, DOB, ID#) → Forgery Detection (pixel analysis, font consistency, edge detection) → Face Match (selfie vs ID photo, >90% confidence required) → Liveness Verification (anti-spoofing, replay detection)",
              "Step 9: AI generates verification score (0-100) and verdict: Auto-Approve (>85), Review (60-85), Reject (<60)",
              "Step 10: Auto-Approved: KYC tier upgraded immediately, limits increased, customer notified",
              "Step 11: Review: Document queued for manual compliance review with AI-extracted data pre-filled",
              "Step 12: Rejected: Customer notified with specific rejection reason and re-submission guidance",
              "Step 13: Compliance officer reviews flagged documents → Approve/Reject/Request additional info",
              "Step 14: All decisions logged in audit trail with officer ID, timestamp, and decision reason",
            ]} />
          </SubSection>

          <SubSection title="4.6 Bill Payment Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer selects Pay Bills → chooses biller category (Electricity, Water, Telecom, Tax)",
              "Step 2: Customer selects specific biller (e.g., EEU) → enters account/meter number",
              "Step 3: System queries biller API for outstanding balance and customer name",
              "Step 4: System displays bill details: customer name, amount due, due date",
              "Step 5: Customer confirms amount (can pay full or partial if allowed by biller)",
              "Step 6: Customer enters 6-digit PIN for authorization",
              "Step 7: System validates balance, processes payment to biller via integration",
              "Step 8: Biller acknowledges payment with confirmation code",
              "Step 9: Customer wallet debited, fee wallet credited, biller settlement scheduled",
              "Step 10: Digital receipt generated with biller reference number — SMS and in-app",
              "Step 11: Transaction categorized as 'Bills' for spending analytics",
            ]} />
          </SubSection>

          <SubSection title="4.7 Merchant QR Payment Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer opens app → taps 'Scan & Pay' → camera activates",
              "Step 2: Customer scans merchant's static or dynamic QR code",
              "Step 3: System decodes QR → displays merchant name, logo, and category",
              "Step 4: For static QR: customer enters payment amount. For dynamic QR: amount pre-filled",
              "Step 5: Optional: customer adds tip amount",
              "Step 6: System displays total (amount + tip + any surcharge) and fee breakdown",
              "Step 7: Customer confirms with PIN or biometric",
              "Step 8: Atomic operation: debit customer wallet, credit merchant wallet (less MDR)",
              "Step 9: MDR fee deposited to bank fee collection wallet",
              "Step 10: Loyalty points awarded to customer based on merchant category and amount",
              "Step 11: Digital receipt sent to customer (SMS/push) and merchant dashboard updated",
              "Step 12: Merchant settlement queued (T+0 or T+1 based on configuration)",
            ]} />
          </SubSection>

          <SubSection title="4.8 Micro-Loan Application Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer opens Micro-Loan section → views pre-approved limit and credit score",
              "Step 2: AI displays credit score (0-100) with contributing factors: transaction history (35%), savings behavior (25%), repayment history (20%), KYC tier (10%), account age (10%)",
              "Step 3: Customer selects loan product: Emergency (7d), Standard (30d), Extended (90d), Business (180d)",
              "Step 4: Customer enters desired amount (within pre-approved limit)",
              "Step 5: System calculates: interest rate, total repayment, installment amount, repayment schedule",
              "Step 6: Customer reviews loan agreement with terms and conditions (scrollable, must reach bottom)",
              "Step 7: Customer accepts terms with PIN confirmation — digital signature captured",
              "Step 8: System performs final eligibility check: KYC tier, existing loans, blacklist",
              "Step 9: Loan approved → amount disbursed to customer wallet within 60 seconds",
              "Step 10: Repayment schedule created with auto-deduction from wallet enabled",
              "Step 11: Customer receives loan confirmation SMS with schedule summary",
              "Step 12: First installment date set — reminder notifications scheduled (3 days, 1 day, due date, overdue)",
              "Step 13: Loan entry created in admin loan portfolio dashboard with risk classification",
            ]} />
          </SubSection>

          <SubSection title="4.9 Savings Goal Creation Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer opens Savings → 'Create New Goal'",
              "Step 2: Customer enters goal name, target amount, target date, category",
              "Step 3: System suggests auto-save rules based on income pattern (AI recommendation)",
              "Step 4: Customer configures auto-save: round-up (nearest ETB 10), % of income, scheduled amount",
              "Step 5: Customer optionally locks savings until target date (with early withdrawal penalty warning)",
              "Step 6: Goal created with progress bar at 0% and projected completion date",
              "Step 7: Interest rate applied (per NBE guidelines) with daily accrual, monthly credit",
              "Step 8: AI sends periodic encouragement: progress milestones (25%, 50%, 75%), savings tips",
              "Step 9: Upon reaching target: customer notified, funds unlocked (if locked), celebration animation",
            ]} />
          </SubSection>

          <SubSection title="4.10 Agent Onboarding Workflow">
            <WorkflowSteps steps={[
              "Step 1: Prospective agent accesses agent registration portal or is referred by Super-Agent",
              "Step 2: Agent fills application: personal details, business details, location, banking information",
              "Step 3: Document upload: National ID, Business License, Trade License, TIN Certificate, Bank Statement (3 months), Photograph of business premises",
              "Step 4: AI pre-screening: document verification, business license validity, TIN cross-reference, geo-location validation",
              "Step 5: Application enters compliance review queue (AI-scored, priority ordered)",
              "Step 6: Compliance officer reviews: documents, background check results, zone availability",
              "Step 7: Approved: NBE agent code assigned, agent account created, initial float allocated",
              "Step 8: Agent receives welcome kit: QR code standee, branding materials (digital), PIN credentials",
              "Step 9: Agent completes mandatory in-app training modules (video + quiz, 80% pass required)",
              "Step 10: Agent activated — can begin processing transactions",
              "Step 11: 30-day probation period with enhanced monitoring and daily performance review",
            ]} />
          </SubSection>

          <SubSection title="4.11 Fraud Detection Workflow">
            <WorkflowSteps steps={[
              "Step 1: Transaction initiated → real-time fraud scoring engine evaluates",
              "Step 2: Rule engine checks: velocity (>5 txns in 10 min), amount (>2x average), geography (new device/location), beneficiary (first-time large amount), time (unusual hours)",
              "Step 3: AI model scores transaction risk (0-100): Low (<30), Medium (30-70), High (>70)",
              "Step 4: Low risk: transaction proceeds normally",
              "Step 5: Medium risk: transaction proceeds, flagged for post-transaction review within 24 hours",
              "Step 6: High risk: transaction blocked, customer notified, step-up authentication required (OTP + security question)",
              "Step 7: If customer passes step-up: transaction released with manual review flag",
              "Step 8: If customer fails step-up: transaction permanently blocked, account temporarily frozen",
              "Step 9: Flagged transactions appear in admin fraud dashboard with AI-generated risk narrative",
              "Step 10: Compliance officer investigates: reviews transaction chain, customer history, related accounts",
              "Step 11: Decision: clear (false positive), escalate (SAR), freeze account, or notify law enforcement",
              "Step 12: All decisions logged in compliance case management system with evidence trail",
            ]} />
          </SubSection>

          <SubSection title="4.12 EMoney Issuance Workflow">
            <WorkflowSteps steps={[
              "Step 1: Bank treasury deposits funds into designated trust account at Global Bank",
              "Step 2: Treasury officer initiates EMoney issuance request in admin console (maker)",
              "Step 3: Request details: amount, trust account reference, purpose (agent float, promotional)",
              "Step 4: Senior treasury officer reviews and approves (checker) — dual authorization enforced",
              "Step 5: System validates trust account balance ≥ issuance amount (real-time CBS query)",
              "Step 6: EMoney created in system ledger — issuance entry recorded with unique reference",
              "Step 7: System wallet credited with newly issued e-float",
              "Step 8: Float allocated to Super-Agents or system wallets as directed",
              "Step 9: Trust reconciliation updated — outstanding e-money vs trust balance verified",
              "Step 10: NBE daily position report auto-updated with new issuance",
              "Step 11: Audit trail: timestamp, officer IDs, amount, trust reference, reconciliation status",
            ]} />
          </SubSection>

          <SubSection title="4.13 Dispute Resolution Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer opens transaction → taps 'Report Issue' → selects reason category",
              "Step 2: System pre-fills transaction details, customer adds description and optional evidence",
              "Step 3: Dispute ticket created with unique Case ID, customer receives acknowledgment SMS",
              "Step 4: Level 1 — Auto-Resolution Engine: checks for clear rule matches (duplicate transaction, system error confirmed by logs)",
              "Step 5: If auto-resolvable: refund processed, customer notified, case closed (< 1 hour)",
              "Step 6: Level 2 — Agent Review: customer service agent reviews evidence, contacts counterparty if applicable",
              "Step 7: Agent decision: approve refund, partial refund, reject with explanation, or escalate",
              "Step 8: Level 3 — Compliance Review: for fraud disputes or amounts > ETB 10,000",
              "Step 9: Compliance officer investigates with full transaction chain analysis and AI assistance",
              "Step 10: Final decision communicated to customer with detailed explanation",
              "Step 11: If unresolved > 30 days: auto-escalate to senior management, regulatory complaint package prepared",
            ]} />
          </SubSection>

          <SubSection title="4.14 Loyalty Points Redemption Workflow">
            <WorkflowSteps steps={[
              "Step 1: Customer opens Loyalty → views points balance, tier, and available rewards",
              "Step 2: Customer browses redemption catalog: airtime, merchant vouchers, fee waivers, charity",
              "Step 3: Customer selects reward → system shows points required and confirms availability",
              "Step 4: Customer confirms redemption with PIN",
              "Step 5: Points deducted, reward fulfilled: airtime credited instantly, voucher code generated, or fee waiver applied",
              "Step 6: Redemption receipt with reward details sent via push notification",
              "Step 7: Partner merchant notified (if merchant voucher) with redemption code for verification",
            ]} />
          </SubSection>

          <SubSection title="4.15 Admin Transaction Reversal Workflow">
            <WorkflowSteps steps={[
              "Step 1: Admin Level 1 (Maker) searches for transaction by ID or customer phone",
              "Step 2: Maker reviews transaction details, selects 'Initiate Reversal'",
              "Step 3: Maker enters reversal reason, attaches supporting evidence (customer complaint ID, system error log)",
              "Step 4: System validates: transaction is reversible (not already reversed, within reversal window)",
              "Step 5: Reversal request submitted to approval queue → Admin Level 2 (Checker) notified",
              "Step 6: Checker reviews: original transaction, reversal reason, evidence, impact analysis",
              "Step 7: Checker approves or rejects with mandatory comment",
              "Step 8: If approved: atomic reversal executed — debit recipient, credit sender, fees refunded",
              "Step 9: Both original parties notified of reversal with reference number",
              "Step 10: Reversal recorded in audit trail with maker ID, checker ID, timestamps, and reason",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            5. GLOBAL AI COPILOT — COMPREHENSIVE SPECIFICATIONS
        ════════════════════════════════════════════════════════════════ */}
        <Section title="5. GLOBAL AI COPILOT — COMPREHENSIVE SPECIFICATIONS">
          <SubSection title="5.1 Overview">
            <P>Global AI is an intelligent conversational assistant embedded across all GlobalPay touchpoints — customer wallet, agent portal, merchant dashboard, and admin console. It combines large language model (LLM) capabilities with domain-specific financial services knowledge to provide contextual, actionable, and compliant assistance.</P>
          </SubSection>

          <SubSection title="5.2 Customer-Facing AI Features">
            <BulletList items={[
              "AI-CUST-001: Natural language balance inquiry — 'What is my balance?' in Amharic ('ባላንሴ ስንት ነው?') or English",
              "AI-CUST-002: Transaction search — 'Show me all transfers to Abebe last month' with date/amount/type filters",
              "AI-CUST-003: Smart suggestions — 'You usually pay your EEU bill around this time. Would you like to pay now?'",
              "AI-CUST-004: Financial health insights — 'You've saved 23% more this month. Keep it up! Your spending on transport increased by 15%'",
              "AI-CUST-005: Bill reminder — 'Your Ethio Telecom bill of ETB 500 is due in 3 days. Auto-pay is not set up.'",
              "AI-CUST-006: Fraud alert explanation — 'We blocked a transfer of ETB 5,000 because it was from an unusual location. If this was you, verify to proceed.'",
              "AI-CUST-007: Product discovery — 'Did you know you can earn 2x points on bill payments this week?'",
              "AI-CUST-008: Guided onboarding — Step-by-step KYC upgrade assistance with camera guidance",
              "AI-CUST-009: Dispute resolution guide — AI walks customer through dispute filing with pre-filled data",
              "AI-CUST-010: Savings coaching — 'If you save ETB 50/day, you'll reach your wedding goal by March 2027'",
              "AI-CUST-011: Loan eligibility check — 'Based on your history, you qualify for up to ETB 15,000. Want to apply?'",
              "AI-CUST-012: Spending categorization — 'Last month you spent ETB 3,200 on food, ETB 1,800 on transport, ETB 500 on utilities'",
              "AI-CUST-013: Transfer assistance — 'Send ETB 500 to Tigist' → AI confirms recipient, amount, fee, and processes with single confirmation",
              "AI-CUST-014: FAQ and help — instant answers to common questions without leaving the chat",
              "AI-CUST-015: Multilingual support — Amharic, English, with context-aware language switching mid-conversation",
              "AI-CUST-016: Voice input — speech-to-text for Amharic and English commands (mobile mic integration)",
              "AI-CUST-017: Transaction explanation — 'What was the ETB 200 charge on Feb 15?' → AI looks up and explains",
              "AI-CUST-018: Budget assistant — 'Help me create a monthly budget' → AI generates personalized budget based on spending history",
            ]} />
          </SubSection>

          <SubSection title="5.3 Agent-Facing AI Features">
            <BulletList items={[
              "AI-AGNT-001: Float prediction — 'Based on trends, you'll need ETB 50,000 float top-up by Thursday. Request now?'",
              "AI-AGNT-002: Performance coaching — 'Your cash-out volume is 15% below zone average. Tip: offer cash-out reminders to bill payment customers'",
              "AI-AGNT-003: Customer onboarding assistant — AI guides agents through customer registration steps with document checklist",
              "AI-AGNT-004: Transaction troubleshooting — 'Customer's cash-out failed because their daily limit was reached. They can try again tomorrow or upgrade KYC'",
              "AI-AGNT-005: Commission optimizer — 'Process 5 more cash-in transactions today to reach the next commission tier (ETB 200 bonus)'",
              "AI-AGNT-006: Compliance guide — 'This customer's ID appears expired. Request a valid ID before proceeding with cash-out above ETB 5,000'",
              "AI-AGNT-007: Daily summary — 'Today: 45 transactions, ETB 890 commission earned, float balance ETB 12,340. Top up recommended by end of day.'",
              "AI-AGNT-008: Customer identification assist — AI helps agent verify customer identity via structured questions when documents unavailable",
              "AI-AGNT-009: Training content — on-demand micro-lessons for new products, policy changes, and compliance updates",
              "AI-AGNT-010: Anomaly alert — 'Unusual: 3 large cash-outs from different customers in last 10 minutes. Verify carefully.'",
            ]} />
          </SubSection>

          <SubSection title="5.4 Merchant-Facing AI Features">
            <BulletList items={[
              "AI-MRCH-001: Sales insights — 'Your Tuesday lunchtime revenue increased 30% after adding the QR standee near the entrance'",
              "AI-MRCH-002: Customer trends — 'Your top 20 repeat customers account for 45% of revenue. Consider a loyalty offer for them'",
              "AI-MRCH-003: Settlement tracking — 'Your settlement for yesterday (ETB 23,450) will arrive by 2 PM today'",
              "AI-MRCH-004: Chargeback defense — 'A customer disputed ETB 800 payment. Here's the receipt and timestamp for your response'",
              "AI-MRCH-005: Promotional suggestions — 'Run a 2x loyalty points campaign this weekend to boost slow Saturday traffic'",
              "AI-MRCH-006: Inventory hints — AI correlates payment data with peak hours to suggest staffing and stock levels",
            ]} />
          </SubSection>

          <SubSection title="5.5 Admin-Facing AI Features">
            <BulletList items={[
              "AI-ADMN-001: Customer 360 AI summary — One-click AI-generated customer risk and behavior profile with churn probability",
              "AI-ADMN-002: Anomaly narrative — AI explains why a transaction was flagged with supporting evidence and similar past cases",
              "AI-ADMN-003: SAR auto-draft — AI generates Suspicious Activity Report narrative from transaction data, customer history, and pattern analysis",
              "AI-ADMN-004: Predictive analytics — Churn prediction (7-day, 30-day), revenue forecasting, agent attrition risk, float demand by zone",
              "AI-ADMN-005: Natural language reporting — 'Show me agent commission totals for Addis Ababa last quarter' → generates table with charts",
              "AI-ADMN-006: Policy impact simulation — 'What if we reduce cash-out fees by 10%?' → revenue impact model with confidence intervals",
              "AI-ADMN-007: Regulatory compliance checker — AI validates operations against NBE directive requirements, flags gaps",
              "AI-ADMN-008: Fraud ring detection — AI identifies networks of related accounts conducting suspicious coordinated activity",
              "AI-ADMN-009: Agent zone optimization — AI recommends optimal zone boundaries based on population density and transaction data",
              "AI-ADMN-010: KYC document verification — AI pre-screens uploaded documents with quality, forgery, and face-match scores",
              "AI-ADMN-011: Operational forecasting — 'Expected TPS peak tomorrow at 2 PM due to salary day. Auto-scale resources recommended.'",
              "AI-ADMN-012: Report generation — 'Generate the monthly NBE regulatory report' → AI compiles all required data points",
              "AI-ADMN-013: Root cause analysis — When system errors spike, AI correlates logs and identifies likely root cause",
              "AI-ADMN-014: Customer segmentation — AI clusters customers by behavior for targeted product offerings and campaigns",
              "AI-ADMN-015: Loan portfolio analysis — 'Which loan segments have the highest default risk?' → AI generates risk heat map",
            ]} />
          </SubSection>

          <SubSection title="5.6 AI Technical Architecture">
            <BulletList items={[
              "Model: GPT-4o / GPT-5 via Azure OpenAI (data residency compliant) with local LLM fallback for offline scenarios",
              "Retrieval-Augmented Generation (RAG): Vector database (pgvector) for product docs, FAQs, NBE directives, training materials",
              "Tool calling: AI can query balance, fetch transactions, initiate workflows, generate reports via function calling (20+ tools)",
              "Guardrails: Content filtering (no financial advice beyond product info), PII redaction in logs, hallucination detection, compliance boundary enforcement",
              "Context window: Conversation history management with sliding window (last 20 messages) + summarization for long sessions",
              "Latency target: < 2 seconds for first token, < 5 seconds for complete response on standard queries",
              "Fallback: Graceful degradation to rule-based responses if AI service unavailable (<3s timeout)",
              "Personalization: User-specific context (balance, recent transactions, KYC tier, preferences) injected into system prompt",
              "Safety: Financial transaction commands require explicit user confirmation — AI cannot auto-execute transfers",
              "Analytics: Every AI interaction logged for quality monitoring, intent classification accuracy, user satisfaction scoring",
              "Training: Continuous improvement via feedback loops — user thumbs up/down, escalation to human agent tracking",
              "Cost optimization: Response caching for common queries, token usage monitoring with budget alerts",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            6. ADMIN CONSOLE — DETAILED FUNCTIONAL BREAKDOWN
        ════════════════════════════════════════════════════════════════ */}
        <Section title="6. ADMIN CONSOLE — DETAILED FUNCTIONAL BREAKDOWN">
          <P>The Admin Console is a comprehensive web-based management platform accessible to authorized bank staff with role-based permissions. This section provides granular specifications for every admin feature.</P>

          <SubSection title="6.1 Admin Roles & Permissions">
            <BulletList items={[
              "ADM-ROLE-001: System Administrator — full access to all modules, user management, system configuration",
              "ADM-ROLE-002: Operations Manager — transaction management, settlement, reconciliation, agent management",
              "ADM-ROLE-003: Compliance Officer — KYC review, AML monitoring, SAR filing, watchlist management",
              "ADM-ROLE-004: Treasury Officer — EMoney management, trust account oversight, float allocation",
              "ADM-ROLE-005: Customer Service — user profile view, dispute management, PIN reset, basic account actions",
              "ADM-ROLE-006: Analytics Viewer — read-only access to dashboards, reports, and analytics",
              "ADM-ROLE-007: Agent Manager — agent onboarding, performance monitoring, territory management",
              "ADM-ROLE-008: Auditor — read-only access to all modules, audit trail viewer, report download",
              "ADM-ROLE-009: Maker-Checker enforcement — all critical operations require dual authorization (different officers)",
              "ADM-ROLE-010: IP whitelisting — admin access restricted to approved IP ranges and VPN",
            ]} />
          </SubSection>

          <SubSection title="6.2 Admin Dashboard (Detailed)">
            <SubSection title="6.2.1 Real-Time Operations Dashboard">
              <BulletList items={[
                "ADM-DASH-001: Transaction volume widget — live TPS counter, hourly/daily trend line, comparison to previous period",
                "ADM-DASH-002: Success rate widget — current success rate %, failed transaction count, error category breakdown",
                "ADM-DASH-003: Revenue widget — today's fee income, MTD revenue, YTD revenue, target vs actual gauge",
                "ADM-DASH-004: Active users widget — currently active sessions, DAU/MAU, new registrations today",
                "ADM-DASH-005: System health — API response time (P50/P95/P99), database CPU, queue depth, error rate",
                "ADM-DASH-006: Geographic heat map — interactive map showing transaction density by region/woreda",
                "ADM-DASH-007: Live transaction feed — scrolling list of recent transactions with type, amount, status icons",
                "ADM-DASH-008: Alert panel — active alerts (fraud flags, system issues, threshold breaches) with severity color coding",
                "ADM-DASH-009: Agent network status — total active agents, agents online now, float utilization percentage",
                "ADM-DASH-010: EMoney position — total issued, outstanding, trust balance, reconciliation status indicator",
              ]} />
            </SubSection>
            <SubSection title="6.2.2 Executive KPI Dashboard">
              <BulletList items={[
                "ADM-DASH-020: Monthly KPI scorecard — registration growth, transaction growth, revenue, NPS score",
                "ADM-DASH-021: Financial inclusion metrics — new Tier 1 registrations by region, urban vs rural split",
                "ADM-DASH-022: Agent network growth — new agents activated, coverage map, uncovered zones",
                "ADM-DASH-023: Product adoption — % of users using each product (P2P, bills, savings, loans, loyalty)",
                "ADM-DASH-024: Customer lifetime value (CLV) — average revenue per user, cohort analysis",
                "ADM-DASH-025: Churn dashboard — 30-day inactive rate, AI-predicted churn risk, re-engagement campaign results",
              ]} />
            </SubSection>
          </SubSection>

          <SubSection title="6.3 Admin User Management (Detailed)">
            <BulletList items={[
              "ADM-USR-001: Advanced customer search — multi-field search with auto-suggest, partial matching, regex support",
              "ADM-USR-002: Customer 360 profile — single page view: personal info, KYC status, wallet balance, transaction summary (30/60/90 days), active loans, savings goals, loyalty tier, risk score, communication log, dispute history, linked devices",
              "ADM-USR-003: Account actions panel — Freeze (immediate), Unfreeze (with reason), Close (30-day process), Reset PIN (OTP to customer), Force KYC re-verification, Assign to watchlist, Override transaction limit (temporary, with expiry)",
              "ADM-USR-004: Customer communication — send individual SMS, push notification, or email with template selection and tracking",
              "ADM-USR-005: Bulk operations — CSV upload for mass actions (tier upgrade, credit, flag, message), preview before execution, rollback capability",
              "ADM-USR-006: Customer timeline — chronological view of all events: registration, KYC changes, transactions, disputes, communications, AI interactions",
              "ADM-USR-007: Related accounts — AI-identified linked accounts (shared device, shared beneficiaries, similar patterns) for fraud investigation",
            ]} />
          </SubSection>

          <SubSection title="6.4 Admin Transaction Management (Detailed)">
            <BulletList items={[
              "ADM-TXN-001: Transaction search — by ID, sender/receiver phone, date range, amount range, type, status, agent, region",
              "ADM-TXN-002: Transaction detail view — full details including internal ledger entries, fee breakdown, processing timestamps, routing information",
              "ADM-TXN-003: Transaction reversal — maker-checker workflow with reason categorization and evidence attachment",
              "ADM-TXN-004: Batch reversal — for system errors affecting multiple transactions (emergency procedure with senior approval)",
              "ADM-TXN-005: Fee override — modify fee for specific transaction (e.g., goodwill gesture) with dual authorization",
              "ADM-TXN-006: Settlement dashboard — pending settlements by merchant/agent, scheduled settlement times, failed settlement retry",
              "ADM-TXN-007: Reconciliation tool — three-way match: internal ledger, CBS posting, payment switch confirmation. Mismatch flagging and resolution workflow",
              "ADM-TXN-008: Failed transaction analysis — categorized by failure reason (insufficient funds, limit exceeded, timeout, system error), retry management",
              "ADM-TXN-009: Transaction export — filtered results exportable as CSV/Excel/PDF for audit or investigation purposes",
            ]} />
          </SubSection>

          <SubSection title="6.5 Admin KYC Queue (Detailed)">
            <BulletList items={[
              "ADM-KYC-001: KYC review queue — sortable by AI score, submission date, risk level, region, document type",
              "ADM-KYC-002: AI pre-screening results — document quality (0-100), OCR confidence, face match %, liveness pass/fail, forgery risk score",
              "ADM-KYC-003: Side-by-side document viewer — zoom, rotate, contrast adjust for submitted documents",
              "ADM-KYC-004: OCR extracted data — pre-filled fields (name, DOB, ID number, expiry) for officer verification",
              "ADM-KYC-005: Decision panel — Approve, Reject (with reason code), Request Additional Info (with specific request), Escalate to Senior Compliance",
              "ADM-KYC-006: Batch review — select multiple AI-approved applications for bulk approval (senior officer only)",
              "ADM-KYC-007: KYC statistics — today's queue depth, officer productivity (reviews/hour), average decision time, AI accuracy metrics",
              "ADM-KYC-008: Re-verification queue — expired documents flagged for follow-up, customer notification triggered",
            ]} />
          </SubSection>

          <SubSection title="6.6 Admin Agent Management (Detailed)">
            <BulletList items={[
              "ADM-AGT-001: Agent onboarding queue — applications listed with AI pre-screening score, document status, zone availability",
              "ADM-AGT-002: Agent profile — contact details, business info, zone assignment, float balance, commission summary, performance score, complaint history",
              "ADM-AGT-003: Agent performance dashboard — leaderboard (zone, national), transaction trends, commission earnings chart, SLA compliance",
              "ADM-AGT-004: Float management — view all agent float balances, allocate/withdraw float, set agent-specific float limits",
              "ADM-AGT-005: Zone management — create/edit zones on map, assign/reassign agents, view zone-level metrics",
              "ADM-AGT-006: Commission configuration — create/edit commission models per product, set tier brackets, configure special promotional rates",
              "ADM-AGT-007: Agent suspension — initiate suspension with reason, notification to agent, impact analysis (customers affected)",
              "ADM-AGT-008: Super-Agent portal — view Sub-Agent networks, performance roll-ups, float distribution management",
              "ADM-AGT-009: Agent compliance — training completion tracking, certification status, compliance violation history",
            ]} />
          </SubSection>

          <SubSection title="6.7 Admin EMoney Management (Detailed)">
            <BulletList items={[
              "ADM-EM-001: EMoney dashboard — total issued, outstanding in circulation, trust account balance, reconciliation variance, backing ratio gauge",
              "ADM-EM-002: Issuance form — maker enters amount and trust account deposit reference, system validates against CBS",
              "ADM-EM-003: Checker approval — reviewer verifies trust deposit, approves issuance, system creates e-float",
              "ADM-EM-004: Destruction log — all e-money retirements (cash-out, bank transfer) with automated tracking",
              "ADM-EM-005: Float allocation — distribute issued e-float to Super-Agents with allocation history",
              "ADM-EM-006: Reconciliation report — daily/monthly with line-by-line entries, variance analysis, auditor sign-off",
              "ADM-EM-007: System wallet monitor — real-time balances of all system wallets (fee, commission, suspense, settlement, promotional, tax)",
              "ADM-EM-008: NBE report generator — auto-populate required fields, generate in prescribed format, submit via SFTP",
            ]} />
          </SubSection>

          <SubSection title="6.8 Admin Reporting (Detailed)">
            <BulletList items={[
              "ADM-RPT-001: Report catalog — categorized library of all available reports (operational, financial, regulatory, agent, merchant, KYC, fraud, loan)",
              "ADM-RPT-002: Scheduled reports — configure report, recipients, frequency (daily/weekly/monthly), delivery (email/SFTP/dashboard)",
              "ADM-RPT-003: Ad-hoc report builder — select data source, drag-and-drop columns, apply filters, add calculated fields, preview, export",
              "ADM-RPT-004: Regulatory report templates — pre-built NBE-compliant templates for daily position, CTR, SAR, AML compliance",
              "ADM-RPT-005: Report versioning — track edits, compare versions, maintain audit trail for regulatory submissions",
              "ADM-RPT-006: Dashboard builder — create custom dashboards with widgets (charts, tables, gauges, maps) and share with team",
              "ADM-RPT-007: Data export — CSV, Excel, PDF, JSON, API endpoint for BI tool integration",
              "ADM-RPT-008: Report access control — role-based access per report with download permission management",
            ]} />
          </SubSection>

          <SubSection title="6.9 Admin Analytics (Detailed)">
            <BulletList items={[
              "ADM-ANL-001: Transaction analytics — volume/value trends, type distribution, peak hours, regional breakdown, success/failure rates",
              "ADM-ANL-002: Customer analytics — registration funnel, activation rate, KYC conversion, product adoption, engagement scoring",
              "ADM-ANL-003: Agent analytics — network growth, coverage map, performance distribution, float utilization, commission cost analysis",
              "ADM-ANL-004: Revenue analytics — fee income by product, commission expense, net revenue, revenue per user, revenue per transaction",
              "ADM-ANL-005: Fraud analytics — flagged transaction volume, investigation outcomes, false positive rate, loss prevention amount, pattern trends",
              "ADM-ANL-006: Loan analytics — portfolio size, disbursement trends, repayment rate, NPL ratio, credit score distribution, risk segmentation",
              "ADM-ANL-007: Loyalty analytics — points issued vs redeemed, tier distribution, program cost, engagement impact on transaction frequency",
              "ADM-ANL-008: Cohort analysis — customer behavior by registration month, retention curves, LTV by acquisition channel",
              "ADM-ANL-009: Predictive analytics — AI-powered churn prediction, revenue forecasting, demand forecasting, capacity planning",
              "ADM-ANL-010: Benchmark analytics — compare metrics across regions, agent zones, time periods with statistical significance testing",
            ]} />
          </SubSection>

          <SubSection title="6.10 Admin System Configuration">
            <BulletList items={[
              "ADM-CFG-001: Fee management — configure transaction fees per product type, customer tier, amount bracket, with effective date scheduling",
              "ADM-CFG-002: Limit management — set daily/monthly/per-transaction limits by KYC tier and product, with override capability",
              "ADM-CFG-003: Notification templates — create/edit SMS, push, email templates with variable placeholders ({{name}}, {{amount}}, {{ref}})",
              "ADM-CFG-004: Biller management — add/remove bill payment partners, configure fee structures, test connectivity, enable/disable",
              "ADM-CFG-005: Promotion engine — create time-bound campaigns (cashback, bonus points, zero-fee) with target audience rules and budget cap",
              "ADM-CFG-006: Feature flags — enable/disable features per user segment, region, or percentage rollout (canary deployment)",
              "ADM-CFG-007: Exchange rate management — set/update FX rates for multi-currency operations with rate history",
              "ADM-CFG-008: System parameters — timeout values, retry counts, session durations, OTP validity, PIN attempt limits",
              "ADM-CFG-009: API key management — generate/revoke keys for integration partners with scope and rate limit configuration",
              "ADM-CFG-010: Audit log viewer — searchable, filterable log of all admin actions with export capability",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            7. TECHNICAL ARCHITECTURE
        ════════════════════════════════════════════════════════════════ */}
        <Section title="7. TECHNICAL ARCHITECTURE & SPECIFICATIONS">
          <SubSection title="7.1 Architecture Overview">
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
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤   │
│  │ Loyalty  │ │ Dispute  │ │  Fraud   │ │  Audit   │   │
│  │ Engine   │ │ Service  │ │ Detector │ │ Service  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    DATA LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │PostgreSQL│ │  Redis   │ │  Object  │ │  Event   │   │
│  │(Primary) │ │ (Cache)  │ │ Storage  │ │  Stream  │   │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤   │
│  │ pgvector │ │ Sessions │ │KYC Docs  │ │  Kafka   │   │
│  │ (AI RAG) │ │Rate Limit│ │ Receipts │ │  /Queue  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
              `}</pre>
            </div>
          </SubSection>

          <SubSection title="7.2 Technology Stack">
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
                <TechRow layer="UI Framework" tech="Tailwind CSS + shadcn/ui" reason="Consistent design system, rapid development, accessibility built-in" />
                <TechRow layer="Backend" tech="Supabase (PostgreSQL + Edge Functions)" reason="Real-time subscriptions, row-level security, serverless scale" />
                <TechRow layer="Authentication" tech="Supabase Auth + OTP + Biometric" reason="Multi-factor, phone-first, NBE compliant" />
                <TechRow layer="API Gateway" tech="Edge Functions + Rate Limiting" reason="DDoS protection, throttling, API key management" />
                <TechRow layer="Caching" tech="Redis (via Upstash)" reason="Session management, rate limiting, real-time counters" />
                <TechRow layer="File Storage" tech="Supabase Storage (S3-compatible)" reason="KYC documents, receipts, encrypted at rest (AES-256)" />
                <TechRow layer="AI/ML" tech="GPT-4o/5 via Azure OpenAI + pgvector RAG" reason="Conversational AI, fraud detection, credit scoring, compliance" />
                <TechRow layer="Event Streaming" tech="Supabase Realtime + Webhooks" reason="Real-time notifications, event-driven architecture" />
                <TechRow layer="Monitoring" tech="Sentry + Custom Analytics + Prometheus" reason="Error tracking, performance monitoring, usage analytics" />
                <TechRow layer="CI/CD" tech="GitHub Actions + Lovable Cloud" reason="Automated testing, staged deployments, rollback" />
                <TechRow layer="SMS Gateway" tech="Ethio Telecom SMPP / Africa's Talking" reason="OTP delivery, transaction notifications, USSD integration" />
              </tbody>
            </table>
          </SubSection>

          <SubSection title="7.3 Database Schema (Core Tables)">
            <BulletList items={[
              "users — id (UUID), phone, email, full_name, language_pref, status, created_at, last_active_at",
              "user_profiles — id, user_id (FK), date_of_birth, gender, address_region, address_woreda, address_kebele",
              "wallets — wallet_id, user_id (FK), balance (DECIMAL 18,2), currency, status, kyc_tier, daily_limit, monthly_limit, frozen_at",
              "transactions — txn_id (UUID), from_wallet, to_wallet, amount, fee, type (ENUM), status (ENUM), reference, note, created_at, completed_at, reversed_at",
              "transaction_ledger — entry_id, txn_id (FK), wallet_id, debit_credit (ENUM), amount, balance_after, created_at",
              "agents — agent_id, user_id (FK), type (ENUM: super/sub/direct/merchant), parent_agent_id, zone_id (FK), float_balance, status, nbe_code, activated_at",
              "agent_zones — zone_id, name, region, geo_polygon (PostGIS), parent_zone_id, max_agents",
              "agent_commissions — commission_id, agent_id (FK), txn_id (FK), amount, type, tier_bracket, settled, settlement_period",
              "kyc_documents — doc_id, user_id (FK), doc_type (ENUM), file_url, ai_quality_score, ai_face_match, ai_forgery_score, verification_status, verified_by, verified_at",
              "kyc_verifications — verification_id, user_id, from_tier, to_tier, status, ai_score, reviewer_id, decision_reason, created_at, decided_at",
              "savings_goals — goal_id, user_id (FK), name, category, target_amount, current_amount, target_date, auto_save_rule (JSONB), locked_until, interest_rate, created_at",
              "loans — loan_id, user_id (FK), product_type, amount, interest_rate, tenure_days, total_repayable, outstanding, status (ENUM), credit_score_at_disbursement, disbursed_at, due_at",
              "loan_repayments — repayment_id, loan_id (FK), amount, principal, interest, penalty, paid_at, status",
              "emoney_ledger — entry_id, type (ENUM: issue/destroy), amount, trust_balance_after, reference, maker_id, checker_id, created_at",
              "merchants — merchant_id, user_id (FK), business_name, mcc_code, mdr_rate, settlement_schedule, status",
              "merchant_outlets — outlet_id, merchant_id (FK), name, address, qr_code_url, geo_lat, geo_lng",
              "notifications — notif_id, user_id (FK), channel (ENUM), template_id, payload (JSONB), sent_at, delivered_at, read_at, status",
              "loyalty_points — point_id, user_id (FK), points, source_type, source_txn_id, earned_at, expires_at, redeemed_at",
              "loyalty_tiers — tier_id, name, min_points, max_points, benefits (JSONB)",
              "disputes — dispute_id, txn_id (FK), customer_id, reason_category, description, evidence_urls, status, level, assigned_to, created_at, resolved_at",
              "fraud_flags — flag_id, txn_id (FK), risk_score, rule_triggered, ai_narrative, status, investigated_by, created_at",
              "audit_log — log_id, admin_id (FK), action, entity_type, entity_id, old_value (JSONB), new_value (JSONB), ip_address, created_at",
              "user_roles — id (UUID), user_id (FK auth.users), role (ENUM: admin/moderator/user), UNIQUE(user_id, role)",
              "admin_sessions — session_id, admin_id, ip_address, user_agent, started_at, last_active_at, ended_at",
              "system_wallets — wallet_id, type (ENUM: fee/commission/suspense/settlement/promotional/tax), balance, last_reconciled_at",
              "billers — biller_id, name, category, api_endpoint, fee_model (JSONB), status, created_at",
              "notification_templates — template_id, channel, name, body_template, variables (JSONB), language, created_at",
            ]} />
          </SubSection>

          <SubSection title="7.4 API Specifications">
            <P>All APIs follow RESTful conventions with JSON payloads. Authentication via JWT Bearer tokens with refresh token rotation. Versioned under /api/v1/.</P>
            <SubSection title="7.4.1 Wallet APIs">
              <BulletList items={[
                "POST /api/v1/wallet/register — Create new wallet (phone, OTP verification)",
                "GET /api/v1/wallet/balance — Real-time balance inquiry",
                "POST /api/v1/wallet/transfer — Initiate P2P transfer (recipient, amount, PIN)",
                "POST /api/v1/wallet/request — Request money from contact",
                "POST /api/v1/wallet/cashin — Agent-initiated cash-in",
                "POST /api/v1/wallet/cashout — Customer-initiated cash-out code generation",
                "POST /api/v1/wallet/cashout/redeem — Agent redeems cash-out code",
                "GET /api/v1/wallet/statement?from=&to=&type=&page=&limit= — Transaction history with filters",
                "PUT /api/v1/wallet/freeze — Freeze wallet (self-service or admin)",
                "PUT /api/v1/wallet/unfreeze — Unfreeze wallet (admin only)",
                "POST /api/v1/wallet/link-bank — Link bank account with CBS verification",
              ]} />
            </SubSection>
            <SubSection title="7.4.2 Agent APIs">
              <BulletList items={[
                "POST /api/v1/agent/register — Submit agent application",
                "GET /api/v1/agent/float — Agent float balance",
                "POST /api/v1/agent/float/request — Float top-up request",
                "POST /api/v1/agent/float/transfer — Agent-to-agent float transfer",
                "GET /api/v1/agent/commission — Commission summary (period filter)",
                "GET /api/v1/agent/performance — Performance metrics and scoring",
                "GET /api/v1/agent/reconciliation — End-of-day reconciliation report",
              ]} />
            </SubSection>
            <SubSection title="7.4.3 Merchant APIs">
              <BulletList items={[
                "POST /api/v1/merchant/register — Merchant registration",
                "POST /api/v1/merchant/qr/generate — Generate static/dynamic QR",
                "POST /api/v1/merchant/pay — Process QR payment",
                "POST /api/v1/merchant/refund — Initiate refund",
                "GET /api/v1/merchant/settlement — Settlement history",
                "GET /api/v1/merchant/analytics — Sales analytics",
                "POST /api/v1/merchant/webhook — Configure payment notification webhook",
              ]} />
            </SubSection>
            <SubSection title="7.4.4 KYC & Compliance APIs">
              <BulletList items={[
                "POST /api/v1/kyc/upload — Document upload for KYC verification",
                "GET /api/v1/kyc/status — Current KYC tier and pending verifications",
                "POST /api/v1/kyc/verify — AI verification pipeline trigger",
                "GET /api/v1/kyc/queue — Admin: KYC review queue with AI scores",
                "PUT /api/v1/kyc/decide — Admin: approve/reject KYC application",
                "POST /api/v1/compliance/sar — Generate SAR (AI-assisted)",
                "GET /api/v1/compliance/watchlist/check — Screen against watchlists",
              ]} />
            </SubSection>
            <SubSection title="7.4.5 Other APIs">
              <BulletList items={[
                "POST /api/v1/bills/pay — Bill payment initiation",
                "POST /api/v1/airtime/topup — Airtime purchase",
                "POST /api/v1/savings/create — Create savings goal",
                "PUT /api/v1/savings/:id — Update savings goal (deposit, withdraw, modify rules)",
                "POST /api/v1/loan/apply — Micro-loan application",
                "GET /api/v1/loan/eligibility — Check loan eligibility and pre-approved amount",
                "POST /api/v1/loan/repay — Manual loan repayment",
                "GET /api/v1/loyalty/balance — Points balance inquiry",
                "POST /api/v1/loyalty/redeem — Redeem points for reward",
                "POST /api/v1/ai/chat — AI copilot conversation endpoint",
                "POST /api/v1/dispute/create — Create dispute case",
                "GET /api/v1/notifications — Notification feed with pagination",
                "PUT /api/v1/notifications/preferences — Update notification preferences",
              ]} />
            </SubSection>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            8. SECURITY ARCHITECTURE
        ════════════════════════════════════════════════════════════════ */}
        <Section title="8. SECURITY ARCHITECTURE">
          <SubSection title="8.1 Data Protection">
            <BulletList items={[
              "SEC-001: End-to-end encryption — TLS 1.3 for data in transit, AES-256 for data at rest",
              "SEC-002: Transaction PIN — 6-digit PIN for all financial operations, stored as bcrypt hash (cost factor 12)",
              "SEC-003: Biometric authentication — fingerprint/face ID for supported devices via Web Authentication API",
              "SEC-004: OTP verification — time-based OTP via SMS for critical operations (6-digit, 5-min validity, max 3 retries)",
              "SEC-005: Session management — JWT with 15-minute access token, 7-day refresh token rotation, device binding",
              "SEC-006: PII encryption — sensitive fields (national ID, DOB) encrypted at application level before database storage",
            ]} />
          </SubSection>
          <SubSection title="8.2 Access Control">
            <BulletList items={[
              "SEC-010: Role-Based Access Control (RBAC) — separate user_roles table with security definer functions (no role on profile table)",
              "SEC-011: Row-Level Security (RLS) — database-enforced access control per user/role on all tables",
              "SEC-012: Maker-Checker — dual authorization for all critical admin operations (reversal, issuance, freeze, config changes)",
              "SEC-013: Admin IP whitelisting — console access restricted to approved IP ranges",
              "SEC-014: API key management — unique keys per integration partner with scope restrictions and rate limits",
            ]} />
          </SubSection>
          <SubSection title="8.3 Threat Protection">
            <BulletList items={[
              "SEC-020: Rate limiting — per-user, per-IP, per-endpoint with progressive backoff (429 responses)",
              "SEC-021: Fraud detection — real-time rule engine + AI anomaly detection scoring (see Workflow 4.11)",
              "SEC-022: Geo-fencing — agent transactions restricted to registered zone coordinates (PostGIS validation)",
              "SEC-023: Device binding — wallet bound to registered device, new device requires re-verification with OTP + security question",
              "SEC-024: Anti-replay — transaction nonce and timestamp validation to prevent replay attacks",
              "SEC-025: Input validation — strict schema validation on all API inputs to prevent injection attacks",
              "SEC-026: CORS — strict Cross-Origin Resource Sharing policies on all API endpoints",
            ]} />
          </SubSection>
          <SubSection title="8.4 Compliance & Audit">
            <BulletList items={[
              "SEC-030: Audit logging — immutable log of all system events with 7-year retention (admin actions, transaction events, security events)",
              "SEC-031: Penetration testing — quarterly external pen tests with 30-day remediation SLA",
              "SEC-032: PCI-DSS alignment — card data handling (if applicable) per PCI standards",
              "SEC-033: Data residency — all customer data stored within Ethiopian jurisdiction (or approved cloud region)",
              "SEC-034: Key management — HSM-backed encryption key management with key rotation schedule",
              "SEC-035: Vulnerability scanning — automated weekly scans of all endpoints with CI/CD integration",
            ]} />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            9. INTEGRATIONS
        ════════════════════════════════════════════════════════════════ */}
        <Section title="9. INTEGRATION SPECIFICATIONS">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">System</th>
                <th className="text-left p-3 font-semibold">Protocol</th>
                <th className="text-left p-3 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <TechRow layer="Core Banking System (CBS)" tech="ISO 8583 / REST API" reason="Account verification, fund transfer, balance inquiry, trust account management" />
              <TechRow layer="National ID (Fayda/NIDIS)" tech="REST API" reason="Identity verification for KYC — name, photo, ID number validation" />
              <TechRow layer="Ethio Telecom" tech="REST API / SMPP" reason="SMS gateway (OTP, notifications), airtime/data purchase, USSD hosting" />
              <TechRow layer="EthSwitch" tech="ISO 8583" reason="Interbank transfers, ATM cardless withdrawal, payment routing" />
              <TechRow layer="Ethiopian Electric Utility (EEU)" tech="REST API" reason="Meter inquiry, bill payment, payment confirmation" />
              <TechRow layer="Water Utilities" tech="REST API" reason="Bill inquiry and payment for regional water authorities" />
              <TechRow layer="ERCA" tech="REST API" reason="Tax payment processing via TIN lookup" />
              <TechRow layer="NBE Reporting" tech="SFTP / REST API" reason="Regulatory report submission (daily position, CTR, SAR)" />
              <TechRow layer="Credit Bureau" tech="REST API" reason="Credit score inquiry and reporting for micro-loans" />
              <TechRow layer="Insurance Partners" tech="REST API" reason="Premium collection, policy inquiry, claims integration" />
              <TechRow layer="Azure OpenAI" tech="REST API" reason="AI copilot, fraud detection ML, credit scoring, document verification" />
              <TechRow layer="Payment Card Networks" tech="EMV / Tokenization API" reason="Card-linked wallet operations (Phase 2)" />
              <TechRow layer="DStv / EthioSat" tech="REST API" reason="TV subscription renewal" />
              <TechRow layer="Education Institutions" tech="REST API / SFTP" reason="School fee payment with student ID lookup" />
            </tbody>
          </table>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            10. NON-FUNCTIONAL REQUIREMENTS
        ════════════════════════════════════════════════════════════════ */}
        <Section title="10. NON-FUNCTIONAL REQUIREMENTS">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">Requirement</th>
                <th className="text-left p-3 font-semibold">Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Availability", "99.95% uptime SLA (excludes planned maintenance windows of max 4 hours/month)"],
                ["Scalability", "Horizontal scaling to 10,000 TPS with auto-scaling infrastructure"],
                ["Latency", "< 500ms API response time (P95); < 2s end-to-end transaction; < 200ms cached queries"],
                ["Concurrent Users", "Support 500,000 concurrent active sessions with graceful degradation"],
                ["Data Retention", "Transaction data: 10 years; Audit logs: 7 years; KYC docs: 10 years; AI conversation logs: 2 years"],
                ["Backup & Recovery", "RPO: 1 minute; RTO: 15 minutes; Daily full backup + continuous WAL archiving; Cross-region replica"],
                ["Offline Support", "PWA offline mode: balance view, transaction queue (up to 20 pending), sync on reconnect within 30 seconds"],
                ["Accessibility", "WCAG 2.1 AA compliance; screen reader support; high contrast mode; minimum 44px touch targets"],
                ["Localization", "Amharic (primary), English, Afaan Oromoo (Phase 2), Tigrinya (Phase 2)"],
                ["Browser Support", "Chrome 90+, Safari 15+, Firefox 90+, Samsung Internet 15+, Opera Mini (basic mode)"],
                ["Minimum Device", "Android 8.0+ with 1GB RAM; iOS 14+; 2G/EDGE network capable (<50KB initial payload)"],
                ["App Size", "PWA initial load < 2MB; cached assets < 10MB; offline data < 5MB"],
                ["Security Compliance", "NBE ICT Risk Management Directive; PCI-DSS (if card integration); ISO 27001 alignment"],
              ].map(([req, spec]) => (
                <tr key={req}>
                  <td className="p-3 font-medium">{req}</td>
                  <td className="p-3 text-muted-foreground">{spec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            11. DEPLOYMENT
        ════════════════════════════════════════════════════════════════ */}
        <Section title="11. DEPLOYMENT & INFRASTRUCTURE">
          <BulletList items={[
            "Primary hosting: Cloud-native deployment (AWS / Azure Africa region or local data center per NBE requirements)",
            "CDN: Edge caching for static assets — Cloudflare with Ethiopian PoP for < 50ms asset delivery",
            "Database: PostgreSQL 15 with read replicas, connection pooling (PgBouncer, max 10,000 connections)",
            "Container orchestration: Kubernetes (EKS/AKS) with auto-scaling pod policies (CPU > 70% trigger)",
            "CI/CD pipeline: GitHub Actions → Lint → Test → Build → Stage → UAT → Production (blue-green deployment)",
            "Environment separation: Development → Staging → UAT → Pre-Production → Production (5 environments)",
            "Disaster Recovery: Active-passive setup with automated failover (< 15 min RTO), cross-region backup",
            "Monitoring stack: Prometheus (metrics) + Grafana (dashboards) + Sentry (errors) + custom business metrics",
            "Log management: Centralized logging with structured JSON logs, 90-day hot storage, 2-year cold archive",
            "Load testing: Regular load tests simulating 2x expected peak (salary days, holidays) with performance baselines",
          ]} />
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            12. FEATURES & BENEFITS
        ════════════════════════════════════════════════════════════════ */}
        <Section title="12. FEATURES & BENEFITS SUMMARY">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold">Feature</th>
                <th className="text-left p-3 font-semibold">Benefit to Global Bank Ethiopia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["PWA with Offline Mode", "Serves customers in low-connectivity areas; reduces app store dependency; <2MB initial download"],
                ["AI-Powered Copilot (50+ features)", "Reduces call center volume by 40%; improves customer self-service; powers fraud detection and compliance"],
                ["Agent Banking Network (4-tier)", "Extends reach to 800+ woredas without branch infrastructure; 50,000+ agent capacity"],
                ["Real-Time Fraud Detection", "Reduces fraud losses by 60% vs rule-only systems; sub-second risk scoring on every transaction"],
                ["Tiered KYC Framework", "Balances financial inclusion with regulatory compliance; AI-powered verification reduces manual review by 60%"],
                ["Micro-Loan Engine", "New revenue stream; addresses credit gap; AI credit scoring enables instant disbursement"],
                ["Loyalty & Gamification", "Increases transaction frequency by 25%, reduces churn by 15%; drives product adoption"],
                ["EMoney Trust Management", "Automated NBE compliance; real-time reconciliation; eliminates manual trust account tracking"],
                ["Multi-Channel Access (PWA+USSD+SMS)", "Ensures 100% population coverage regardless of device or connectivity level"],
                ["Comprehensive Reporting (30+ reports)", "Regulatory reporting automation saves 200+ man-hours monthly; real-time decision support"],
                ["Maker-Checker Workflows", "Reduces operational risk; enforces four-eyes principle for all critical operations"],
                ["Modular Microservices Architecture", "Independent service scaling; phase-based rollout; technology agnostic; future-proof"],
                ["Merchant QR Payments", "Cashless commerce enablement; new MDR revenue stream; merchant ecosystem growth"],
                ["Dispute Management System", "Structured resolution process; regulatory compliance; improved customer trust"],
                ["USSD Channel", "Financial inclusion for 60M+ feature phone users; no internet required"],
              ].map(([feature, benefit]) => (
                <tr key={feature}>
                  <td className="p-3 font-medium">{feature}</td>
                  <td className="p-3 text-muted-foreground">{benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ════════════════════════════════════════════════════════════════
            13. IMPLEMENTATION ROADMAP
        ════════════════════════════════════════════════════════════════ */}
        <Section title="13. IMPLEMENTATION ROADMAP">
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
                ["Phase 1 — Foundation", "Months 1–4", "Core wallet (registration, P2P, balance), Cash-In/Out, Agent onboarding & float, Basic KYC (Tier 1), Admin dashboard (core), SMS notifications, USSD basic menu"],
                ["Phase 2 — Expansion", "Months 5–8", "Bill payments (EEU, Ethio Telecom), Airtime/data, Merchant QR payments, Savings goals (basic), Enhanced KYC (Tier 2 with AI), Admin reporting (10+ reports), Push notifications"],
                ["Phase 3 — Intelligence", "Months 9–12", "Global AI Copilot (customer + agent), Micro-loans (AI credit scoring), Loyalty program (points + tiers), Advanced analytics, Fraud detection (AI-powered), Dispute management, Full KYC (Tier 3 with video)"],
                ["Phase 4 — Scale", "Months 13–18", "Interbank transfers (EthSwitch), Super-Agent management, Multi-outlet merchant, Group savings (Equb), Insurance premium payment, Admin advanced features, Multi-language (Afaan Oromoo, Tigrinya), ATM cardless withdrawal"],
                ["Phase 5 — Innovation", "Months 19–24", "Open API marketplace, Cross-border remittance corridors, IoT payment integration, Voice banking, Advanced AI (policy simulation, predictive analytics), NFC tap-to-pay, Corporate bulk payments, Merchant e-commerce API"],
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

        {/* ════════════════════════════════════════════════════════════════
            14. RISK MITIGATION
        ════════════════════════════════════════════════════════════════ */}
        <Section title="14. RISK MITIGATION">
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
                ["Network connectivity in rural areas", "High", "Offline-first PWA with queued transactions, USSD fallback, SMS confirmation, <50KB payloads"],
                ["NBE regulatory changes", "Medium", "Modular compliance engine, quarterly NBE alignment reviews, dedicated regulatory liaison"],
                ["Fraud & cybersecurity threats", "High", "AI fraud detection (sub-second scoring), encryption at rest/transit, quarterly pen testing, SOC monitoring, bug bounty program"],
                ["Agent network quality & trust", "Medium", "AI performance scoring, automated dormancy detection, training modules, mystery shopper program, complaint management"],
                ["Technology obsolescence", "Low", "Open standards, modular microservices architecture, vendor-agnostic design, regular dependency updates"],
                ["Data residency & sovereignty", "High", "Local hosting option, encrypted replication within approved jurisdictions, NBE data sovereignty compliance"],
                ["Scalability under peak loads", "Medium", "Auto-scaling infrastructure, load testing at 2x peak, graceful degradation, circuit breakers, CDN caching"],
                ["User adoption & digital literacy", "Medium", "Simplified UX, Amharic-first design, agent-assisted onboarding, AI copilot guidance, in-app tutorials"],
                ["Integration partner dependencies", "Medium", "Retry logic, circuit breakers, fallback paths, SLA monitoring per partner, multi-provider SMS"],
                ["Key personnel dependency", "Low", "Comprehensive documentation, cross-training, runbooks for all critical processes"],
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

        {/* ════════════════════════════════════════════════════════════════
            15. APPENDICES
        ════════════════════════════════════════════════════════════════ */}
        <Section title="15. APPENDICES">
          <SubSection title="Appendix A: Glossary of Terms">
            <BulletList items={[
              "KYC — Know Your Customer: Customer identity verification process",
              "AML — Anti-Money Laundering: Regulations to prevent financial crimes",
              "CFT — Counter Financing of Terrorism: Measures to prevent terrorism financing",
              "PEP — Politically Exposed Person: High-risk individual requiring enhanced due diligence",
              "CTR — Currency Transaction Report: Mandatory report for large cash transactions",
              "SAR — Suspicious Activity Report: Report filed for transactions suggesting criminal activity",
              "MCC — Merchant Category Code: Classification code for merchant business type",
              "MDR — Merchant Discount Rate: Fee charged to merchants on each transaction",
              "TPS — Transactions Per Second: Throughput capacity metric",
              "RTO — Recovery Time Objective: Maximum acceptable downtime after failure",
              "RPO — Recovery Point Objective: Maximum acceptable data loss after failure",
              "CBS — Core Banking System: The bank's central transaction processing system",
              "RBAC — Role-Based Access Control: Permission system based on user roles",
              "RLS — Row-Level Security: Database-level access control per row",
              "RAG — Retrieval-Augmented Generation: AI technique combining search with language generation",
              "PWA — Progressive Web App: Web application with native app-like capabilities",
              "USSD — Unstructured Supplementary Service Data: Protocol for feature phone interactions",
              "EMoney — Electronic Money: Digital representation of fiat currency backed by trust account deposits",
              "Float — Electronic value held by agents for cash-in/cash-out operations",
              "NBE — National Bank of Ethiopia: The central bank and primary financial regulator",
              "NPL — Non-Performing Loan: Loan in default or close to default",
              "OCR — Optical Character Recognition: AI extraction of text from document images",
              "OTP — One-Time Password: Single-use verification code sent via SMS",
              "Equb — Traditional Ethiopian rotating savings association",
              "Woreda — Administrative district in Ethiopia",
              "Kebele — Smallest administrative unit in Ethiopia",
            ]} />
          </SubSection>
          <SubSection title="Appendix B: NBE Directive Reference Table">
            <BulletList items={[
              "Mobile and Internet Banking Services Directive — FIS/01/2012: Registration, transaction limits, security requirements",
              "National Payment System Proclamation — 718/2011: Legal framework for electronic payments",
              "EMoney Issuance Directive — ONPS/01/2020: Trust account requirements, issuance/destruction rules",
              "Agent Banking Directive — FIS/04/2012: Agent qualification, territory, operations, reporting",
              "AML/CFT Directive — FIC/01/2014: Customer due diligence, transaction monitoring, SAR filing",
              "ICT Risk Management Directive — BSD/13/2021: Cybersecurity, data protection, incident response",
              "Credit Information Sharing Directive — BSD/15/2022: Credit bureau integration, data sharing protocols",
            ]} />
          </SubSection>
          <SubSection title="Appendix C: Document References">
            <BulletList items={[
              "Appendix C-1: API Endpoint Catalog (Complete Swagger/OpenAPI 3.0 documentation) — separate document",
              "Appendix C-2: Database Entity-Relationship Diagram (ERD) — separate document",
              "Appendix C-3: UI/UX Wireframes & Design System Documentation — separate document",
              "Appendix C-4: Test Strategy Document — Unit, Integration, E2E, Performance, Security testing — separate document",
              "Appendix C-5: Service Level Agreement (SLA) Template — separate document",
              "Appendix C-6: Change Management & Governance Framework — separate document",
              "Appendix C-7: Data Flow Diagrams (DFD) for all major processes — separate document",
              "Appendix C-8: Threat Model and Security Assessment — separate document",
            ]} />
          </SubSection>
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
              <p className="text-sm font-bold">Reviewed By:</p>
              <div className="border-b border-border pb-8" />
              <p className="text-xs text-muted-foreground">Chief Information Officer</p>
              <p className="text-xs text-muted-foreground">Global Bank Ethiopia S.C.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-sm font-bold">Approved By:</p>
              <div className="border-b border-border pb-8" />
              <p className="text-xs text-muted-foreground">Chief Technology Officer</p>
              <p className="text-xs text-muted-foreground">Global Bank Ethiopia S.C.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">Authorized By:</p>
              <div className="border-b border-border pb-8" />
              <p className="text-xs text-muted-foreground">President / Chief Executive Officer</p>
              <p className="text-xs text-muted-foreground">Global Bank Ethiopia S.C.</p>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            © {new Date().getFullYear()} Global Bank Ethiopia S.C. — All Rights Reserved. This document is CONFIDENTIAL and intended solely for the Management of Global Bank Ethiopia S.C. and authorized regulatory bodies. Unauthorized distribution, reproduction, or disclosure is strictly prohibited.
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

const WorkflowSteps = ({ steps }: { steps: string[] }) => (
  <ol className="space-y-1.5 ml-4">
    {steps.map((step, i) => (
      <li key={i} className="text-sm text-muted-foreground flex gap-2">
        <span className="text-gold font-mono text-xs mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
        <span>{step.replace(/^Step \d+:\s*/, '')}</span>
      </li>
    ))}
  </ol>
);

const TechRow = ({ layer, tech, reason }: { layer: string; tech: string; reason: string }) => (
  <tr>
    <td className="p-3 font-medium">{layer}</td>
    <td className="p-3">{tech}</td>
    <td className="p-3 text-muted-foreground">{reason}</td>
  </tr>
);

export default ProposalDocument;
