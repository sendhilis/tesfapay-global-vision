/**
 * BankGPT Production Promotion — 12-step catalog.
 * Drives the Launch Console wizard for Sandbox → UAT → Prod promotion.
 *
 * Steps are idempotent + gated. Some carry a `dependsOn` list: the engine
 * refuses to run them until the named steps have status="passed" in the same
 * environment (used for the Tenant App Build → Channel Embedding split, so we
 * never hand out SDK snippets for an app that hasn't been baked yet).
 *
 * Step 4 (CBS Schema Probe) is the honest verification gate: it probes the
 * bank's actual UAT/PROD CBS through the configured connector and produces
 * per-field presence / type / PII round-trip evidence. Step 3's "100% coverage"
 * is *declared* mapping completeness; step 4 is *measured* CBS reality.
 *
 * Production steps 10, 11, 12 additionally require explicit Admin approval.
 *
 * Per-environment defaults live in `defaultConfigByEnv` so the wizard surfaces
 * real UAT / PROD wiring (broker fleets, mTLS, schema registry, etc.) instead
 * of the same mock for every lane.
 */
import {
  Server, ShieldCheck, Database, Radio, BookOpen,
  Sparkles, Package, Plug, FlaskConical, GitBranch, Activity,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";

export type PromotionEnv = "sandbox" | "uat" | "prod";
export type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped" | "awaiting_approval";

export interface PromotionStepDef {
  key: string;
  index: number;          // 1..N (currently 11)
  title: string;
  shortTitle: string;
  description: string;
  why: string;
  icon: LucideIcon;
  /** Approximate simulated duration in ms (per environment). */
  simulatedMs: { sandbox: number; uat: number; prod: number };
  /** Environments where an Admin must approve before this step can run. */
  approvalRequiredIn: PromotionEnv[];
  /** Step keys that must be `passed` in the same env before this step can run. */
  dependsOn?: string[];
  /** Baseline config shown in the step drawer. */
  defaultConfig: Record<string, unknown>;
  /** Per-env overrides merged onto `defaultConfig` when a fresh run is seeded. */
  defaultConfigByEnv?: Partial<Record<PromotionEnv, Record<string, unknown>>>;
  /**
   * Per-env config keys that MUST be a non-empty string before this step can run.
   * The engine fails the step with a clear log instead of silently auto-passing.
   * Use for live-environment prerequisites (e.g. CBS endpoint URL, vault refs).
   */
  requiredConfigByEnv?: Partial<Record<PromotionEnv, string[]>>;
  /** Evidence keys the simulation will populate on success. */
  evidenceKeys: string[];
}

// ---------- canonical CBS event feed catalog (used by step 4) ---------------
// This is the *full* set of bank-side events BankGPT can subscribe to. The
// wizard exposes it as toggle-per-feed so a bank starts with a sane production
// baseline instead of an empty JSON blob.
export interface CbsEventFeed {
  feed: string;            // canonical event name BankGPT publishes downstream
  cbs_topic: string;       // bank-side source topic / table on the CBS
  description: string;
  throughput_tps: number;  // expected steady-state events/sec
  contains_pii: boolean;
  enabled: boolean;
}

export const DEFAULT_CBS_EVENT_FEEDS: CbsEventFeed[] = [
  { feed: "txn_posted",      cbs_topic: "FBNK.TXN.POSTED",    description: "Account-to-account postings (debits + credits) from CBS GL.",        throughput_tps: 850, contains_pii: true,  enabled: true  },
  { feed: "txn_reversed",    cbs_topic: "FBNK.TXN.REVERSED",  description: "Operator / system reversals of previously posted transactions.",     throughput_tps: 12,  contains_pii: true,  enabled: true  },
  { feed: "salary_credited", cbs_topic: "FBNK.SAL.CREDIT",    description: "Bulk salary inflows tagged with employer payroll batch id.",          throughput_tps: 40,  contains_pii: true,  enabled: true  },
  { feed: "atm_withdrawal",  cbs_topic: "SWITCH.ATM.WDR",     description: "On-us + remote-on-us ATM cash withdrawals from card switch.",         throughput_tps: 220, contains_pii: true,  enabled: true  },
  { feed: "card_auth",       cbs_topic: "SWITCH.CARD.AUTH",   description: "POS / e-com card authorisation requests (approved + declined).",     throughput_tps: 1200,contains_pii: true,  enabled: true  },
  { feed: "bill_payment",    cbs_topic: "FBNK.BILLPAY",       description: "Utility / telco / gov bill payment confirmations.",                   throughput_tps: 65,  contains_pii: false, enabled: true  },
  { feed: "standing_order",  cbs_topic: "FBNK.SO.EXEC",       description: "Scheduled standing-order executions.",                                throughput_tps: 35,  contains_pii: false, enabled: true  },
  { feed: "loan_disbursed",  cbs_topic: "FBNK.LD.DISBURSE",   description: "Loan booking + first disbursement events from LD module.",            throughput_tps: 3,   contains_pii: true,  enabled: true  },
  { feed: "loan_repaid",     cbs_topic: "FBNK.LD.REPAY",      description: "Scheduled + ad-hoc loan repayment postings.",                         throughput_tps: 18,  contains_pii: true,  enabled: true  },
  { feed: "kyc_updated",     cbs_topic: "FBNK.CUS.KYC",       description: "KYC tier / document / risk-rating changes on a customer record.",     throughput_tps: 4,   contains_pii: true,  enabled: true  },
  { feed: "account_opened",  cbs_topic: "FBNK.ACC.OPEN",      description: "New CASA / loan / deposit account opening.",                          throughput_tps: 6,   contains_pii: true,  enabled: true  },
  { feed: "account_closed",  cbs_topic: "FBNK.ACC.CLOSE",     description: "Account closure / dormancy state transitions.",                        throughput_tps: 1,   contains_pii: true,  enabled: true  },
  { feed: "fx_settled",      cbs_topic: "FBNK.FX.SETTLE",     description: "FX deal settlements at end of value date.",                           throughput_tps: 8,   contains_pii: false, enabled: false },
  { feed: "complaint_filed", cbs_topic: "CRM.COMPLAINT",      description: "CRM complaint / case tickets that customers raise.",                  throughput_tps: 2,   contains_pii: true,  enabled: true  },
];

// ---------- canonical CDP entity catalog (used by step 3) -------------------
// This mirrors the *actual* runtime shape consumed by the BankGPT Mesh agents:
//   • src/platform/customerDataPlatform.ts  → CustomerProfile (single-customer
//     360° used by chat / council / nudges).
//   • src/components/wizard/modules/bankgpt/cdp/ethiopiaCustomers.ts → Customer
//     (Ethiopian segmented dataset used by CDP Dashboard + persona views).
//
// Every field an agent can reason on must appear here, with a classification
// (pii | sensitive | passthrough) and a CBS source hint so the bank can sign
// off the mapping during the promotion run instead of discovering gaps later.
export type CdpFieldClass = "pii" | "sensitive" | "passthrough";

export interface CdpField {
  canonical: string;       // BankGPT-side canonical name
  cbs_source: string;      // bank-side CBS field / table.column / API path
  type: "string" | "number" | "boolean" | "date" | "enum" | "object" | "array";
  classification: CdpFieldClass;
  required: boolean;
  notes?: string;
}

export interface CdpEntity {
  key: string;             // canonical entity id
  label: string;
  consumedBy: string[];    // agent personas reading this entity
  fields: CdpField[];
}

export const CDP_CANONICAL_ENTITIES: CdpEntity[] = [
  {
    key: "identity",
    label: "Identity & demographics",
    consumedBy: ["concierge", "onboarding", "service_agent"],
    fields: [
      { canonical: "customer_id",       cbs_source: "FBNK.CUSTOMER.@ID",          type: "string", classification: "passthrough", required: true },
      { canonical: "full_name",         cbs_source: "FBNK.CUSTOMER.NAME.1",       type: "string", classification: "pii",         required: true },
      { canonical: "first_name",        cbs_source: "FBNK.CUSTOMER.SHORT.NAME",   type: "string", classification: "pii",         required: true },
      { canonical: "national_id",       cbs_source: "FBNK.CUSTOMER.FAYDA.ID",     type: "string", classification: "pii",         required: true,  notes: "Tokenized at edge — never lands in vector store." },
      { canonical: "phone",             cbs_source: "FBNK.CUSTOMER.PHONE.1",      type: "string", classification: "pii",         required: true },
      { canonical: "email",             cbs_source: "FBNK.CUSTOMER.EMAIL.1",      type: "string", classification: "pii",         required: false },
      { canonical: "address",           cbs_source: "FBNK.CUSTOMER.ADDRESS",      type: "string", classification: "pii",         required: false },
      { canonical: "city",              cbs_source: "FBNK.CUSTOMER.TOWN.COUNTRY", type: "string", classification: "passthrough", required: true },
      { canonical: "region",            cbs_source: "FBNK.CUSTOMER.REGION",       type: "enum",   classification: "passthrough", required: true,  notes: "Addis Ababa | Oromia | Amhara | Tigray | SNNPR | Sidama | Dire Dawa | Harari" },
      { canonical: "age",               cbs_source: "FBNK.CUSTOMER.DATE.OF.BIRTH",type: "number", classification: "sensitive",   required: true },
      { canonical: "occupation",        cbs_source: "FBNK.CUSTOMER.OCCUPATION",   type: "string", classification: "passthrough", required: false },
      { canonical: "primary_language",  cbs_source: "FBNK.CUSTOMER.LANGUAGE",     type: "enum",   classification: "passthrough", required: true,  notes: "am | om | ti | en" },
      { canonical: "segment",           cbs_source: "FBNK.CUSTOMER.SECTOR",       type: "enum",   classification: "passthrough", required: true,  notes: "Retail | Corporate | Merchant" },
      { canonical: "persona",           cbs_source: "derived (CDP)",              type: "enum",   classification: "passthrough", required: false, notes: "Urban Hustler | Market Trader | Salaried Professional | Diaspora Sender" },
      { canonical: "currency",          cbs_source: "FBNK.CUSTOMER.BASE.CCY",     type: "enum",   classification: "passthrough", required: true,  notes: "ETB" },
    ],
  },
  {
    key: "balances",
    label: "Balances & cash flow",
    consumedBy: ["concierge", "savings_coach", "investment_coach"],
    fields: [
      { canonical: "wallet_balance_etb",    cbs_source: "FBNK.ACCOUNT.WORKING.BAL (CASA)", type: "number", classification: "sensitive",   required: true },
      { canonical: "savings_balance_etb",   cbs_source: "FBNK.ACCOUNT.WORKING.BAL (SAV)",  type: "number", classification: "sensitive",   required: true },
      { canonical: "balance",               cbs_source: "Σ FBNK.ACCOUNT.WORKING.BAL",      type: "number", classification: "sensitive",   required: true,  notes: "Aggregate balance used by Ethiopia CDP." },
      { canonical: "monthly_inflow_etb",    cbs_source: "agg(FBNK.STMT.ENTRY credits 30d)",type: "number", classification: "sensitive",   required: true },
      { canonical: "monthly_outflow_etb",   cbs_source: "agg(FBNK.STMT.ENTRY debits 30d)", type: "number", classification: "sensitive",   required: true },
      { canonical: "monthly_income",        cbs_source: "agg(salary_credited feed 90d/3)", type: "number", classification: "sensitive",   required: true },
      { canonical: "monthly_spend",         cbs_source: "agg(card_auth + bill_payment)",   type: "number", classification: "sensitive",   required: true },
      { canonical: "net_worth_etb",         cbs_source: "derived (CDP)",                   type: "number", classification: "sensitive",   required: false },
      { canonical: "debt_to_income",        cbs_source: "derived (CDP)",                   type: "number", classification: "sensitive",   required: false },
      { canonical: "savings_rate",          cbs_source: "derived (CDP)",                   type: "number", classification: "passthrough", required: true },
    ],
  },
  {
    key: "scores",
    label: "Scores & risk",
    consumedBy: ["loan_agent", "service_agent", "investment_coach"],
    fields: [
      { canonical: "credit_score",      cbs_source: "BUREAU.SCORE.LATEST",       type: "number", classification: "sensitive",   required: true,  notes: "300–850" },
      { canonical: "score_trend",       cbs_source: "derived (Δ 30d)",           type: "number", classification: "passthrough", required: false },
      { canonical: "engagement_score",  cbs_source: "derived (CDP behavioural)", type: "number", classification: "passthrough", required: false, notes: "0–100" },
      { canonical: "risk_tier",         cbs_source: "FBNK.CUSTOMER.RISK.RATING", type: "enum",   classification: "sensitive",   required: true,  notes: "low | medium | high" },
      { canonical: "kyc_tier",          cbs_source: "FBNK.CUSTOMER.KYC.LEVEL",   type: "enum",   classification: "passthrough", required: true,  notes: "1 | 2 | 3" },
      { canonical: "credit_factors",    cbs_source: "BUREAU.SCORE.FACTORS[]",    type: "array",  classification: "sensitive",   required: false, notes: "{factor, weight, status}[]" },
    ],
  },
  {
    key: "holdings",
    label: "Holdings (loans, cards, investments, savings goals)",
    consumedBy: ["loan_agent", "investment_coach", "savings_coach", "service_agent"],
    fields: [
      { canonical: "loans",          cbs_source: "FBNK.LD.LOANS.AND.DEPOSITS where TYPE=LOAN", type: "array", classification: "sensitive", required: true,  notes: "{id, product, principal, outstanding, monthlyInstallment, rate, nextDueDate, status}[]" },
      { canonical: "cards",          cbs_source: "CARDMS.CARDS where CUSTOMER=@id",            type: "array", classification: "sensitive", required: true,  notes: "{id, brand, type, last4, limit?, outstanding?, status}[]" },
      { canonical: "investments",    cbs_source: "FBNK.SC.POSITION + FBNK.LD where TYPE=DEP",  type: "array", classification: "sensitive", required: false, notes: "{id, instrument, principal, currentValue, rate, maturityDate}[]" },
      { canonical: "savings_goals",  cbs_source: "BANKGPT.GOALS (control plane)",              type: "array", classification: "passthrough", required: false, notes: "{id, name, target, saved, dueDate}[]" },
    ],
  },
  {
    key: "transactions",
    label: "Transactions",
    consumedBy: ["concierge", "savings_coach", "service_agent"],
    fields: [
      { canonical: "recent_transactions", cbs_source: "FBNK.STMT.ENTRY last 90d", type: "array", classification: "sensitive", required: true, notes: "{id, date, merchant, category, amount}[]" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics & aggregates",
    consumedBy: ["concierge", "savings_coach", "investment_coach", "loan_agent"],
    fields: [
      { canonical: "monthly_trend",      cbs_source: "agg(FBNK.STMT.ENTRY by month, 6m)",  type: "array",  classification: "passthrough", required: true,  notes: "{month, inflow, outflow, savings}[]" },
      { canonical: "spend_by_category",  cbs_source: "agg(card_auth + bill_payment by MCC)", type: "array", classification: "passthrough", required: true, notes: "{category, amount}[]" },
    ],
  },
  {
    key: "signals",
    label: "Behavioural signals (drive proactive nudges)",
    consumedBy: ["concierge", "savings_coach", "loan_agent", "service_agent"],
    fields: [
      { canonical: "signals.last_salary_credited_at",      cbs_source: "latest(salary_credited feed)",       type: "date",    classification: "sensitive",   required: false },
      { canonical: "signals.low_balance_flag",             cbs_source: "derived (balance < threshold)",      type: "boolean", classification: "passthrough", required: true  },
      { canonical: "signals.missed_installment_last_90d",  cbs_source: "count(FBNK.LD.SCHEDULE missed 90d)", type: "number",  classification: "sensitive",   required: true  },
      { canonical: "signals.days_since_login",             cbs_source: "BANKGPT.SESSIONS.LATEST",            type: "number",  classification: "passthrough", required: false },
      { canonical: "signals.overspend_category",           cbs_source: "derived (top Δ vs 90d avg)",         type: "string",  classification: "passthrough", required: false },
      { canonical: "signals.eligible_for_loan_etb",        cbs_source: "derived (pre-qual engine)",          type: "number",  classification: "sensitive",   required: false },
      { canonical: "signals.eligible_for_tbill_etb",       cbs_source: "derived (cash sweep engine)",        type: "number",  classification: "sensitive",   required: false },
    ],
  },
];

/** Flat list helper — used by the wizard to compute "fields_mapped" totals. */
export const CDP_ALL_FIELDS: CdpField[] = CDP_CANONICAL_ENTITIES.flatMap((e) => e.fields);

// ---------- step catalog ----------------------------------------------------

export const PROMOTION_STEPS: PromotionStepDef[] = [
  {
    key: "tenant_provisioning",
    index: 1,
    title: "Tenant Provisioning",
    shortTitle: "Tenant",
    description:
      "Create an isolated bank tenant in the BankGPT control plane: DB schema, vector index, object bucket, KMS key, Kafka topic prefix, API keys & webhook secrets.",
    why: "Hard multi-tenancy. One bank's data, prompts, and audit logs can never leak into another's.",
    icon: Server,
    simulatedMs: { sandbox: 1800, uat: 2600, prod: 3400 },
    approvalRequiredIn: [],
    defaultConfig: {
      tenant_id: "cbe-et",
      region: "af-east-1",
      kms_alias: "alias/bankgpt-cbe",
      kafka_topic_prefix: "bankgpt.cbe",
    },
    defaultConfigByEnv: {
      sandbox: { tenant_id: "cbe-et-sbx",  kafka_topic_prefix: "bankgpt.cbe.sbx",  kms_alias: "alias/bankgpt-cbe-sbx" },
      uat:     { tenant_id: "cbe-et-uat",  kafka_topic_prefix: "bankgpt.cbe.uat",  kms_alias: "alias/bankgpt-cbe-uat" },
      prod:    { tenant_id: "cbe-et-prod", kafka_topic_prefix: "bankgpt.cbe.prod", kms_alias: "alias/bankgpt-cbe-prod" },
    },
    evidenceKeys: ["tenant_id", "vector_index", "kms_key_arn", "webhook_secret_id"],
  },
  {
    key: "sso_federation",
    index: 2,
    title: "Identity Federation (SSO)",
    shortTitle: "SSO",
    description:
      "Wire BankGPT admin console to the bank's IdP via OIDC or SAML 2.0. Map roles BankGPT-Admin / AgentDesigner / Auditor / Viewer. MFA inherited from bank policy.",
    why: "Bank staff log in with existing corporate credentials. Deprovisioning is automatic.",
    icon: ShieldCheck,
    simulatedMs: { sandbox: 1500, uat: 2200, prod: 2800 },
    approvalRequiredIn: [],
    defaultConfig: {
      protocol: "OIDC",
      issuer_url: "https://login.bank.example/oidc",
      role_mappings: {
        "BankGPT-Admin":         "GRP_BANKGPT_ADMIN",
        "BankGPT-AgentDesigner": "GRP_BANKGPT_DESIGN",
        "BankGPT-Auditor":       "GRP_BANKGPT_AUDIT",
        "BankGPT-Viewer":        "GRP_BANKGPT_VIEW",
      },
      mfa_inherited: true,
    },
    defaultConfigByEnv: {
      sandbox: { issuer_url: "https://idp-sandbox.bankgpt.local/oidc", mfa_inherited: false },
      uat:     { issuer_url: "https://login-uat.bank.example/oidc",     mfa_inherited: true  },
      prod:    { issuer_url: "https://login.bank.example/oidc",         mfa_inherited: true  },
    },
    evidenceKeys: ["idp_metadata_url", "test_login_user", "role_assertion_hash"],
  },
  {
    key: "cdp_schema_binding",
    index: 3,
    title: "CDP Schema Binding",
    shortTitle: "CDP",
    description:
      "Connect the Customer Data Platform to the bank's core systems. Map every canonical entity the BankGPT Mesh agents consume (identity, balances, scores, holdings, transactions, analytics, signals) onto CBS / bureau / CRM sources, then set PII tokenization & data-residency policy.",
    why: "Agents reason on a clean, consistent customer 360 regardless of CBS messiness. Missing a field here = a blind spot for every downstream agent.",
    icon: Database,
    simulatedMs: { sandbox: 2000, uat: 3000, prod: 3800 },
    approvalRequiredIn: [],
    defaultConfig: {
      source_system: "T24 R22",
      residency: "on-prem-aa",
      // Field-class policy — derived from the canonical catalog so the JSON
      // editor stays readable while still being the source of truth.
      tokenized_fields:   CDP_ALL_FIELDS.filter((f) => f.classification === "pii").map((f) => f.canonical),
      sensitive_fields:   CDP_ALL_FIELDS.filter((f) => f.classification === "sensitive").map((f) => f.canonical),
      passthrough_fields: CDP_ALL_FIELDS.filter((f) => f.classification === "passthrough").map((f) => f.canonical),
      // Full canonical schema → CBS source mapping. Bank admin reviews & edits
      // these per environment to match their real T24 / Flexcube schema.
      canonical_entities: CDP_CANONICAL_ENTITIES.map((e) => ({
        entity: e.key,
        label: e.label,
        consumed_by: e.consumedBy,
        fields: e.fields.map((f) => ({
          canonical: f.canonical,
          cbs_source: f.cbs_source,
          type: f.type,
          classification: f.classification,
          required: f.required,
          ...(f.notes ? { notes: f.notes } : {}),
        })),
      })),
    },
    defaultConfigByEnv: {
      sandbox: {
        source_system: "Synthetic CBS (BankGPT)",
        residency: "lovable-cloud",
        cbs_endpoint: "synthetic-cbs://bankgpt",
        cbs_auth_ref: "synthetic",
      },
      uat: {
        source_system: "T24 R22 — UAT clone",
        residency: "on-prem-aa-uat",
        // Bank must fill these before Step 3 can pass in UAT.
        cbs_endpoint: "",
        cbs_auth_ref: "",
      },
      prod: {
        source_system: "T24 R22 — Production",
        residency: "on-prem-aa",
        // Bank must fill these before Step 3 can pass in PROD.
        cbs_endpoint: "",
        cbs_auth_ref: "",
      },
    },
    requiredConfigByEnv: {
      uat:  ["cbs_endpoint", "cbs_auth_ref"],
      prod: ["cbs_endpoint", "cbs_auth_ref"],
    },
    evidenceKeys: ["mapping_doc_id", "tokenization_policy_hash", "fields_mapped", "entities_mapped", "binding_mode"],
  },
  // ---- NEW step 4 — honest CBS verification ---------------------------------
  {
    key: "cbs_schema_probe",
    index: 4,
    title: "CBS Schema Probe",
    shortTitle: "CBS Probe",
    description:
      "Honesty gate on Step 3. Probes the bank's actual UAT/PROD CBS through the configured connector and verifies — per canonical field — that the bank really returns it (presence), with the right shape (type/format conformance), and that PII tokens survive the round-trip through the vault. Sandbox auto-passes with mode=synthetic; UAT and PROD execute against the live connector.",
    why: "Step 3 only proves we *declared* the right schema. Step 4 proves the bank's CBS *actually delivers* it. Without this gate, every downstream agent reasons on fields that may be empty, mis-typed, or never tokenised — and you only find out in production.",
    icon: SearchCheck,
    simulatedMs: { sandbox: 1200, uat: 4200, prod: 5400 },
    approvalRequiredIn: [],
    dependsOn: ["cdp_schema_binding"],
    defaultConfig: {
      mode: "synthetic",                       // overridden per-env below
      sample_size: 50,
      presence_threshold_pct: 95,              // a field counts as "present" if ≥ N% of samples carry it
      type_conformance_required_pct: 98,
      pii_round_trip_required: true,
      fail_on_missing_required_field: true,
      probe_via: "integration-test-proxy",     // edge function that holds the connector creds
      timeout_ms: 30000,
    },
    defaultConfigByEnv: {
      sandbox: {
        mode: "synthetic",
        sample_size: 10,
        probe_via: "synthetic-cbs",
        fail_on_missing_required_field: false,
      },
      uat: {
        mode: "live",
        sample_size: 50,
        probe_via: "integration-test-proxy",
        cbs_endpoint: "https://cbs-uat-api.bank.internal/customer-service/v1",
        cbs_auth_ref: "vault:secret/bankgpt/uat/cbs/api-token",
      },
      prod: {
        mode: "live",
        sample_size: 200,
        probe_via: "integration-test-proxy",
        cbs_endpoint: "https://cbs-prod-api.bank.internal/customer-service/v1",
        cbs_auth_ref: "vault:secret/bankgpt/prod/cbs/api-token",
        presence_threshold_pct: 98,
      },
    },
    evidenceKeys: [
      "mode",
      "cbs_endpoint",
      "samples_probed",
      "fields_declared",
      "fields_present",
      "fields_missing",
      "type_violations",
      "pii_round_trip_ok",
      "conformance_pct",
      "field_results",
    ],
  },
  {
    key: "event_stream",
    index: 5,
    title: "Event Stream Wiring (CDC)",
    shortTitle: "CDC",
    description:
      "Open a live event feed from CBS / card-switch / mobile banking via Debezium / Kafka Connect. The CBS configured here in the UAT and PROD lanes is the bank's actual core banking system — Sandbox uses a BankGPT-hosted synthetic CBS so designers can build without bank infra.",
    why: "Agents react in real-time. 'Your salary landed — auto-sweep ETB 2,000 to Equb?' needs live events.",
    icon: Radio,
    simulatedMs: { sandbox: 2400, uat: 3600, prod: 5200 },
    approvalRequiredIn: [],
    // The shape here must stay compatible with CBSConnectionMapper → CBSMapperConfig.
    defaultConfig: {
      cbs_vendor: "Temenos T24",
      cdc_connector: "debezium-postgres",
      source_db_host: "",
      source_db_port: "5432",
      source_db_name: "cbs",
      source_db_user: "bankgpt_reader",
      bootstrap_brokers: "kafka-1:9092,kafka-2:9092",
      schema_registry_url: "",
      tls_enabled: true,
      mtls_cert_ref: "",
      dead_letter_topic: "bankgpt.dlq.cbs",
      backfill_days: 90,
      event_feeds: DEFAULT_CBS_EVENT_FEEDS,
      // legacy free-form mapping kept for backwards-compat with earlier rows
      topic_map: DEFAULT_CBS_EVENT_FEEDS
        .filter((f) => f.enabled)
        .slice(0, 5)
        .map((f) => ({ cbs_topic: f.cbs_topic, canonical_event: f.feed })),
    },
    defaultConfigByEnv: {
      sandbox: {
        cbs_vendor: "BankGPT Synthetic CBS",
        cdc_connector: "debezium-postgres",
        source_db_host: "synthetic-cbs.bankgpt.local",
        source_db_name: "cbs_synth",
        bootstrap_brokers: "kafka-sbx-1:9092",
        schema_registry_url: "http://sr-sbx.bankgpt.local:8081",
        tls_enabled: false,
        mtls_cert_ref: "",
        dead_letter_topic: "bankgpt.sbx.dlq.cbs",
        backfill_days: 7,
      },
      uat: {
        cbs_vendor: "Temenos T24 R22",
        cdc_connector: "debezium-oracle",
        source_db_host: "cbs-uat-db.bank.internal",
        source_db_port: "1521",
        source_db_name: "T24UAT",
        source_db_user: "BANKGPT_CDC_RO",
        bootstrap_brokers: "kafka-uat-1.bank.internal:9093,kafka-uat-2.bank.internal:9093",
        schema_registry_url: "https://sr-uat.bank.internal:8081",
        tls_enabled: true,
        mtls_cert_ref: "vault:secret/bankgpt/uat/mtls/cbs-cdc",
        dead_letter_topic: "bankgpt.uat.dlq.cbs",
        backfill_days: 30,
      },
      prod: {
        cbs_vendor: "Temenos T24 R22",
        cdc_connector: "oracle-goldengate",
        source_db_host: "cbs-prod-db.bank.internal",
        source_db_port: "1521",
        source_db_name: "T24PROD",
        source_db_user: "BANKGPT_CDC_RO",
        bootstrap_brokers:
          "kafka-prod-1.bank.internal:9093,kafka-prod-2.bank.internal:9093,kafka-prod-3.bank.internal:9093,kafka-prod-4.bank.internal:9093,kafka-prod-5.bank.internal:9093",
        schema_registry_url: "https://sr-prod.bank.internal:8081",
        tls_enabled: true,
        mtls_cert_ref: "vault:secret/bankgpt/prod/mtls/cbs-cdc",
        dead_letter_topic: "bankgpt.prod.dlq.cbs",
        backfill_days: 90,
      },
    },
    evidenceKeys: ["connector_id", "topics_active", "backfill_rows", "lag_ms"],
  },
  {
    key: "knowledge_ingestion",
    index: 6,
    title: "Knowledge Ingestion (RAG)",
    shortTitle: "RAG",
    description:
      "Crawl product PDFs, T&Cs, FAQs, branch SOPs, NBE circulars, internal Confluence. Chunk → embed → per-tenant vector index. Set refresh cadence & source-of-truth precedence.",
    why: "Agents answer from the bank's own approved content — not hallucinations.",
    icon: BookOpen,
    simulatedMs: { sandbox: 2800, uat: 4200, prod: 5800 },
    approvalRequiredIn: [],
    defaultConfig: {
      sources: ["s3://bank-policies", "https://intranet.bank/confluence", "https://nbe.gov.et/circulars"],
      refresh_cron: "0 2 * * *",
      precedence: ["nbe_circulars", "internal_policy", "product_pdf", "faq"],
    },
    defaultConfigByEnv: {
      sandbox: {
        sources: ["s3://bankgpt-demo-corpus/cbe", "https://demo-faqs.bankgpt.local"],
        refresh_cron: "0 */6 * * *",
      },
      uat: {
        sources: [
          "s3://bank-policies-uat",
          "https://intranet-uat.bank.example/confluence",
          "https://nbe.gov.et/circulars",
        ],
        refresh_cron: "0 3 * * *",
      },
      prod: {
        sources: [
          "s3://bank-policies",
          "https://intranet.bank.example/confluence",
          "https://nbe.gov.et/circulars",
          "https://bank.example/products",
        ],
        refresh_cron: "0 2 * * *",
      },
    },
    evidenceKeys: ["documents_indexed", "chunks_embedded", "vector_count", "refresh_cron"],
  },
  {
    key: "persona_calibration",
    index: 7,
    title: "Agent Persona Calibration",
    shortTitle: "Persona",
    description:
      "Tune the 6 Mesh agents (Amara, Selam-Bot, Nuru, Kea, Dawit-Bot, Hana) to the bank brand: tone, language (EN/አማ/Afaan Oromoo), avatars, opening lines, guardrails.",
    why: "Agents feel like the bank's own staff, not a generic chatbot.",
    icon: Sparkles,
    simulatedMs: { sandbox: 1600, uat: 2400, prod: 3000 },
    approvalRequiredIn: [],
    defaultConfig: {
      languages: ["en", "am", "om"],
      formality: "professional-warm",
      brand_primary: "#0F4C81",
      guardrails: { dawit_max_loan_etb: 50000, require_human_above: true },
    },
    defaultConfigByEnv: {
      sandbox: { guardrails: { dawit_max_loan_etb: 5000,  require_human_above: false } },
      uat:     { guardrails: { dawit_max_loan_etb: 25000, require_human_above: true  } },
      prod:    { guardrails: { dawit_max_loan_etb: 50000, require_human_above: true  } },
    },
    evidenceKeys: ["agents_calibrated", "guardrail_policy_id", "brand_kit_hash"],
  },
  // ---- NEW step 7 -------------------------------------------------------
  {
    key: "tenant_app_build",
    index: 8,
    title: "Tenant App Build & Publish",
    shortTitle: "App Build",
    description:
      "Bake the tenant-scoped BankGPT app: compile the SDK + agent manifest, bind brand kit, guardrail policy, RAG index pointer, CBS webhook endpoint and tenant API base URL into a signed, versioned artifact. Publish it to the tenant's runtime endpoint (e.g. https://{tenant}.bankgpt.abx/v1) so channels have something real to point at.",
    why: "Channel embedding can't issue snippets for an app that hasn't been built. This is the only step that produces a deployable artifact — everything before it is configuration.",
    icon: Package,
    simulatedMs: { sandbox: 2200, uat: 3400, prod: 4400 },
    approvalRequiredIn: [],
    dependsOn: ["tenant_provisioning", "sso_federation", "cdp_schema_binding", "cbs_schema_probe", "event_stream", "knowledge_ingestion", "persona_calibration"],
    defaultConfig: {
      build_target: "tenant-runtime",
      signing_key_alias: "alias/bankgpt-build-signing",
      include_artifacts: ["web-sdk", "android-sdk", "ios-sdk", "agent-manifest", "brand-kit", "guardrail-policy"],
      publish: true,
    },
    defaultConfigByEnv: {
      sandbox: { signing_key_alias: "alias/bankgpt-build-signing-sbx", publish: true,  include_artifacts: ["web-sdk", "agent-manifest", "brand-kit"] },
      uat:     { signing_key_alias: "alias/bankgpt-build-signing-uat", publish: true,  include_artifacts: ["web-sdk", "android-sdk", "ios-sdk", "agent-manifest", "brand-kit", "guardrail-policy"] },
      prod:    { signing_key_alias: "alias/bankgpt-build-signing-prod", publish: true, include_artifacts: ["web-sdk", "android-sdk", "ios-sdk", "agent-manifest", "brand-kit", "guardrail-policy"] },
    },
    evidenceKeys: ["app_version", "manifest_hash", "sdk_bundle_url", "tenant_api_base_url", "signing_cert_id"],
  },
  // ---- renamed: step 8 (was 7) -----------------------------------------
  {
    key: "channel_embedding",
    index: 9,
    title: "Channel Embedding",
    shortTitle: "Channels",
    description:
      "Surface the published tenant app inside existing customer channels: mobile SDK (Kotlin/Swift), iFrame for IB, web widget + SIP/STT/TTS for branch & call-center, WhatsApp/Telegram webhook bridge. Snippets point at the artifact built in Step 7.",
    why: "Zero rewrite of existing channels — paste one snippet per surface, all pointing at the signed app build.",
    icon: Plug,
    simulatedMs: { sandbox: 1800, uat: 2700, prod: 3400 },
    approvalRequiredIn: [],
    dependsOn: ["tenant_app_build"],
    defaultConfig: {
      surfaces: ["mobile_android", "mobile_ios", "internet_banking", "branch_tablet", "call_center", "whatsapp"],
      sdk_version: "1.4.2",
    },
    defaultConfigByEnv: {
      sandbox: { surfaces: ["web_widget", "internet_banking"] },
      uat:     { surfaces: ["mobile_android", "mobile_ios", "internet_banking", "branch_tablet"] },
      prod:    { surfaces: ["mobile_android", "mobile_ios", "internet_banking", "branch_tablet", "call_center", "whatsapp"] },
    },
    evidenceKeys: ["snippets_issued", "sdk_version", "channel_health"],
  },
  {
    key: "uat_smoke_pack",
    index: 10,
    title: "UAT Smoke Pack",
    shortTitle: "Smoke",
    description:
      "~250 auto-generated scenarios: balance enquiry, transfers, loan FAQ, complaints, Amharic intent, council deliberation, fraud-flag handling + OWASP LLM Top 10 adversarial prompts. Asserts chat p95 < 3.5s, council p95 < 90s, hallucination < 2%.",
    why: "Bank's UAT team gets a pre-passed evidence pack on Day 1.",
    icon: FlaskConical,
    simulatedMs: { sandbox: 3200, uat: 5400, prod: 6800 },
    approvalRequiredIn: ["prod"],
    dependsOn: ["channel_embedding"],
    defaultConfig: {
      scenario_count: 250,
      include_owasp_llm_top10: true,
      sla: { chat_p95_ms: 3500, council_p95_ms: 90000, hallucination_pct: 2 },
    },
    defaultConfigByEnv: {
      sandbox: { scenario_count: 60,  include_owasp_llm_top10: false },
      uat:     { scenario_count: 250, include_owasp_llm_top10: true  },
      prod:    { scenario_count: 500, include_owasp_llm_top10: true  },
    },
    evidenceKeys: ["scenarios_passed", "scenarios_total", "p95_chat_ms", "p95_council_ms", "hallucination_pct", "owasp_findings"],
  },
  {
    key: "blue_green_cutover",
    index: 11,
    title: "Blue/Green Cutover",
    shortTitle: "Cutover",
    description:
      "Ramp traffic 1% → 10% → 50% → 100% via feature flag. Side-by-side run with real-time SLO dashboard + auto-rollback on error-budget burn. DNS/API-gateway flip is the only hard change.",
    why: "Zero-downtime go-live with one-click rollback at any ramp.",
    icon: GitBranch,
    simulatedMs: { sandbox: 2200, uat: 3600, prod: 5400 },
    approvalRequiredIn: ["prod"],
    dependsOn: ["uat_smoke_pack"],
    defaultConfig: {
      ramp_schedule_pct: [1, 10, 50, 100],
      error_budget_burn_threshold: 2.0,
      auto_rollback: true,
    },
    defaultConfigByEnv: {
      sandbox: { ramp_schedule_pct: [100],              auto_rollback: false },
      uat:     { ramp_schedule_pct: [10, 50, 100],      auto_rollback: true  },
      prod:    { ramp_schedule_pct: [1, 10, 50, 100],   auto_rollback: true  },
    },
    evidenceKeys: ["ramp_completed_pct", "error_rate_pct", "rollback_triggered", "cutover_ts"],
  },
  {
    key: "post_golive_slo",
    index: 12,
    title: "Post Go-Live SLO Monitoring",
    shortTitle: "SLO",
    description:
      "Per-tenant Grafana dashboards (latency, cost-per-conversation, CSAT, deflection, hallucination). CDP/embedding drift detection. WORM audit log per prompt/response. Monthly model-eval + kill-switch.",
    why: "Productionised AI — NBE-grade evidence quality, not a one-time launch.",
    icon: Activity,
    simulatedMs: { sandbox: 1400, uat: 2000, prod: 2600 },
    approvalRequiredIn: ["prod"],
    dependsOn: ["blue_green_cutover"],
    defaultConfig: {
      dashboards: ["latency", "cost_per_conv", "csat", "deflection", "hallucination"],
      drift_check_cron: "0 */6 * * *",
      audit_log: "worm-s3",
      kill_switch_enabled: true,
    },
    defaultConfigByEnv: {
      sandbox: { audit_log: "lovable-cloud", kill_switch_enabled: false },
      uat:     { audit_log: "worm-s3-uat",   kill_switch_enabled: true  },
      prod:    { audit_log: "worm-s3-prod",  kill_switch_enabled: true  },
    },
    evidenceKeys: ["dashboards_provisioned", "drift_baseline_id", "audit_bucket", "kill_switch_arn"],
  },
];

export function getStep(key: string): PromotionStepDef | undefined {
  return PROMOTION_STEPS.find((s) => s.key === key);
}

export const TOTAL_STEPS = PROMOTION_STEPS.length;

export const ENV_LABEL: Record<PromotionEnv, string> = {
  sandbox: "Sandbox",
  uat: "UAT",
  prod: "Production",
};

export const ENV_DESCRIPTION: Record<PromotionEnv, string> = {
  sandbox: "Synthetic CBS + demo data. No approvals required. Safe for designers.",
  uat: "Bank's actual UAT CBS + masked production extract. Bank UAT team validates evidence pack.",
  prod: "Live bank CBS + real customers. Steps 10, 11, 12 require Admin approval before advancing.",
};
