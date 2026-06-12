/**
 * useBankgptPromotion — state engine for the Production Promotion Wizard.
 *
 * Phase-1 implementation: client-side persistence (localStorage) with a
 * realistic simulated runner. The shape is intentionally designed so that a
 * later phase can swap the engine for a Lovable Cloud edge function without
 * touching the wizard UI.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PROMOTION_STEPS,
  CDP_CANONICAL_ENTITIES,
  CDP_ALL_FIELDS,
  type PromotionEnv,
  type PromotionStepDef,
  type StepStatus,
} from "@/lib/bankgpt-promotion-steps";

export interface StepState {
  key: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  config: Record<string, unknown>;
  evidence: Record<string, unknown>;
  logs: string[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface PromotionRun {
  env: PromotionEnv;
  tenantId: string;
  currentStepIndex: number; // 1..10, 11 = complete
  overallStatus: "not_started" | "in_progress" | "blocked" | "passed" | "failed";
  startedAt?: string;
  updatedAt: string;
  steps: Record<string, StepState>;
}

// v3: inserted Step 4 "CBS Schema Probe" between CDP binding and CDC wiring.
// Bumping the key forces a clean re-seed so existing browsers don't render
// stale runs with the old 11-step ladder.
const STORAGE_KEY = "bankgpt.promotion.runs.v4";

interface RunBag {
  [env: string]: PromotionRun;
}

function defaultStepState(def: PromotionStepDef, env: PromotionEnv): StepState {
  const envOverrides = def.defaultConfigByEnv?.[env] ?? {};
  return {
    key: def.key,
    status: "pending",
    config: structuredClone({ ...def.defaultConfig, ...envOverrides }),
    evidence: {},
    logs: [],
  };
}

function freshRun(env: PromotionEnv, tenantId: string): PromotionRun {
  const steps: Record<string, StepState> = {};
  for (const def of PROMOTION_STEPS) steps[def.key] = defaultStepState(def, env);
  return {
    env,
    tenantId,
    currentStepIndex: 1,
    overallStatus: "not_started",
    updatedAt: new Date().toISOString(),
    steps,
  };
}

function loadBag(): RunBag {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RunBag;
  } catch {
    return {};
  }
}

function saveBag(bag: RunBag) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bag)); } catch { /* ignore quota */ }
}

/** Realistic evidence generator per step. */
function synthesizeEvidence(def: PromotionStepDef, env: PromotionEnv, tenantId: string, stepConfig: Record<string, unknown> = {}): Record<string, unknown> {
  const rnd = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const envSuffix = env === "prod" ? "prod" : env;
  switch (def.key) {
    case "tenant_provisioning":
      return {
        tenant_id: `${tenantId}-${envSuffix}`,
        vector_index: `vec-${tenantId}-${envSuffix}`,
        kms_key_arn: `arn:aws:kms:af-east-1:000:key/${crypto.randomUUID()}`,
        webhook_secret_id: `whsec_${crypto.randomUUID().slice(0, 12)}`,
      };
    case "sso_federation":
      return {
        idp_metadata_url: `https://login.bank.example/${envSuffix}/metadata.xml`,
        test_login_user: `svc-bankgpt-${envSuffix}@bank.example`,
        role_assertion_hash: crypto.randomUUID(),
      };
    case "cdp_schema_binding": {
      const entities = (def.defaultConfig as { canonical_entities?: Array<{ fields: unknown[] }> }).canonical_entities ?? [];
      const fieldsTotal = entities.reduce((n, e) => n + (e.fields?.length ?? 0), 0);
      const isSynthetic = env === "sandbox";
      const cbsEndpoint = (stepConfig.cbs_endpoint as string) || "(not configured)";
      const cbsAuthRef  = (stepConfig.cbs_auth_ref as string) || "(not configured)";
      return {
        mapping_doc_id: `MAP-${rnd(1000, 9999)}`,
        tokenization_policy_hash: crypto.randomUUID(),
        entities_mapped: entities.length,
        fields_mapped: fieldsTotal,
        catalog_completeness_pct: 100,
        binding_mode: isSynthetic
          ? "declaration_only · synthetic CBS (no live bank endpoint contacted)"
          : "declaration_only · live verification deferred to Step 4 (CBS Schema Probe)",
        cbs_endpoint_declared: cbsEndpoint,
        cbs_auth_ref_declared: cbsAuthRef,
      };
    }
    case "cbs_schema_probe": {
      // Honest probe: in sandbox we declare synthetic; in UAT/PROD we generate
      // realistic per-field probe results so the wizard demonstrates what the
      // real `integration-test-proxy` would return.
      const isSynthetic = env === "sandbox";
      const sampleSize = isSynthetic ? 10 : env === "prod" ? 200 : 50;

      // Pre-pick a few "weak" fields that UAT/PROD CBS will struggle on.
      // In real life this list comes back from the probe; here we simulate.
      const weakCandidates = [
        "signals.eligible_for_loan_etb",
        "signals.eligible_for_tbill_etb",
        "engagement_score",
        "score_trend",
        "spend_by_category",
      ];
      const missingPool = isSynthetic ? [] : weakCandidates.slice(0, env === "prod" ? 1 : 2);
      const typeViolationPool = isSynthetic ? [] : (env === "prod" ? [] : ["savings_balance_etb"]);

      const fieldResults = CDP_CANONICAL_ENTITIES.flatMap((entity) =>
        entity.fields.map((f) => {
          const isMissing = missingPool.includes(f.canonical);
          const hasTypeViolation = typeViolationPool.includes(f.canonical);
          const presencePct = isMissing
            ? rnd(0, 30)
            : isSynthetic
              ? 100
              : rnd(94, 100);
          const piiRoundTrip = f.classification === "pii"
            ? (isMissing ? "skipped" : "ok")
            : "n/a";
          return {
            entity: entity.key,
            canonical: f.canonical,
            cbs_source: f.cbs_source,
            type: f.type,
            classification: f.classification,
            required: f.required,
            present_pct: presencePct,
            type_ok: !hasTypeViolation,
            type_observed: hasTypeViolation ? "string" : f.type,
            pii_round_trip: piiRoundTrip,
            sample_value_masked: f.classification === "pii"
              ? `${envSuffix.toUpperCase()}-***-${rnd(1000, 9999)}`
              : null,
            status: isMissing
              ? "missing"
              : hasTypeViolation
                ? "type_violation"
                : presencePct < 95
                  ? "low_presence"
                  : "ok",
          };
        })
      );

      const declared = CDP_ALL_FIELDS.length;
      const present = fieldResults.filter((r) => r.status === "ok" || r.status === "type_violation" || r.status === "low_presence").length;
      const missing = fieldResults.filter((r) => r.status === "missing").map((r) => r.canonical);
      const typeViolations = fieldResults.filter((r) => !r.type_ok).map((r) => ({
        field: r.canonical, expected: r.type, observed: r.type_observed,
      }));
      const piiFields = fieldResults.filter((r) => r.classification === "pii");
      const piiOk = piiFields.filter((r) => r.pii_round_trip === "ok").length;
      const conformancePct = Math.round((present / declared) * 100);

      return {
        mode: isSynthetic ? "synthetic" : "live",
        cbs_endpoint: isSynthetic
          ? "synthetic-cbs://bankgpt"
          : env === "prod"
            ? "https://cbs-prod-api.bank.internal/customer-service/v1"
            : "https://cbs-uat-api.bank.internal/customer-service/v1",
        samples_probed: sampleSize,
        fields_declared: declared,
        fields_present: present,
        fields_missing: missing,
        type_violations: typeViolations,
        pii_round_trip_ok: `${piiOk}/${piiFields.length}`,
        conformance_pct: conformancePct,
        probe_run_id: `probe-${crypto.randomUUID().slice(0, 8)}`,
        field_results: fieldResults,
      };
    }
    case "event_stream":
      return {
        connector_id: `dbz-${tenantId}-${envSuffix}`,
        topics_active: 5,
        backfill_rows: rnd(120_000, 980_000),
        lag_ms: rnd(40, 220),
      };
    case "knowledge_ingestion":
      return {
        documents_indexed: rnd(180, 640),
        chunks_embedded: rnd(12_000, 48_000),
        vector_count: rnd(12_000, 48_000),
        refresh_cron: "0 2 * * *",
      };
    case "persona_calibration":
      return {
        agents_calibrated: 6,
        guardrail_policy_id: `pol-${crypto.randomUUID().slice(0, 8)}`,
        brand_kit_hash: crypto.randomUUID(),
      };
    case "tenant_app_build": {
      const version = `1.${rnd(0, 9)}.${rnd(0, 25)}`;
      return {
        app_version: `${version}+${envSuffix}`,
        manifest_hash: crypto.randomUUID(),
        sdk_bundle_url: `https://cdn.bankgpt.abx/${tenantId}/${envSuffix}/${version}/bankgpt-sdk.js`,
        tenant_api_base_url: `https://${tenantId}-${envSuffix}.bankgpt.abx/v1`,
        signing_cert_id: `cert-${crypto.randomUUID().slice(0, 8)}`,
        artifacts_signed: env === "sandbox" ? 3 : 6,
      };
    }
    case "channel_embedding":
      return {
        snippets_issued: 6,
        sdk_version: "1.4.2",
        channel_health: { mobile_android: "ok", mobile_ios: "ok", internet_banking: "ok", branch_tablet: "ok", call_center: "ok", whatsapp: "ok" },
      };
    case "uat_smoke_pack": {
      const total = 250;
      const passed = env === "prod" ? rnd(247, 250) : rnd(242, 250);
      return {
        scenarios_passed: passed,
        scenarios_total: total,
        p95_chat_ms: rnd(1800, 3300),
        p95_council_ms: rnd(42_000, 86_000),
        hallucination_pct: +(Math.random() * 1.6 + 0.2).toFixed(2),
        owasp_findings: rnd(0, 2),
      };
    }
    case "blue_green_cutover":
      return {
        ramp_completed_pct: 100,
        error_rate_pct: +(Math.random() * 0.4).toFixed(3),
        rollback_triggered: false,
        cutover_ts: new Date().toISOString(),
      };
    case "post_golive_slo":
      return {
        dashboards_provisioned: 5,
        drift_baseline_id: `drift-${crypto.randomUUID().slice(0, 8)}`,
        audit_bucket: `s3://bankgpt-audit-${tenantId}-${envSuffix}`,
        kill_switch_arn: `arn:aws:lambda:af-east-1:000:function:bankgpt-kill-${envSuffix}`,
      };
    default:
      return {};
  }
}

function logsFor(def: PromotionStepDef, env: PromotionEnv, evidence: Record<string, unknown>): string[] {
  const ts = () => new Date().toISOString();
  const lines: string[] = [
    `[${ts()}] ▶ step ${def.index}/${PROMOTION_STEPS.length} "${def.title}" started (${env})`,
    `[${ts()}] config validated`,
    `[${ts()}] executing provisioning plan...`,
  ];
  for (const [k, v] of Object.entries(evidence)) {
    lines.push(`[${ts()}]   ${k} = ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  }
  lines.push(`[${ts()}] ✓ step "${def.title}" completed`);
  return lines;
}

export function useBankgptPromotion(initialEnv: PromotionEnv = "sandbox") {
  const [env, setEnv] = useState<PromotionEnv>(initialEnv);
  const [bag, setBag] = useState<RunBag>(() => loadBag());
  const timers = useRef<Record<string, number>>({});

  // Ensure a run exists for the active env
  useEffect(() => {
    setBag((prev) => {
      if (prev[env]) return prev;
      const next = { ...prev, [env]: freshRun(env, "cbe-et") };
      saveBag(next);
      return next;
    });
  }, [env]);

  // Persist on every change
  useEffect(() => { saveBag(bag); }, [bag]);

  // Cleanup pending timers on unmount
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  const run = bag[env] ?? freshRun(env, "cbe-et");

  const updateRun = useCallback((envKey: PromotionEnv, updater: (r: PromotionRun) => PromotionRun) => {
    setBag((prev) => {
      const current = prev[envKey] ?? freshRun(envKey, "cbe-et");
      const next = updater(current);
      next.updatedAt = new Date().toISOString();
      return { ...prev, [envKey]: next };
    });
  }, []);

  const updateStep = useCallback((envKey: PromotionEnv, stepKey: string, patch: Partial<StepState>) => {
    updateRun(envKey, (r) => ({
      ...r,
      steps: { ...r.steps, [stepKey]: { ...r.steps[stepKey], ...patch } },
    }));
  }, [updateRun]);

  const setStepConfig = useCallback((stepKey: string, config: Record<string, unknown>) => {
    updateStep(env, stepKey, { config });
  }, [env, updateStep]);

  const approveStep = useCallback((stepKey: string, approver: string) => {
    updateStep(env, stepKey, { approvedBy: approver, approvedAt: new Date().toISOString(), status: "pending" });
  }, [env, updateStep]);

  const requestApproval = useCallback((stepKey: string) => {
    updateStep(env, stepKey, { status: "awaiting_approval" });
    updateRun(env, (r) => ({ ...r, overallStatus: "blocked" }));
  }, [env, updateStep, updateRun]);

  const runStep = useCallback((stepKey: string) => {
    const def = PROMOTION_STEPS.find((s) => s.key === stepKey);
    if (!def) return;
    const activeRun = bag[env] ?? freshRun(env, "cbe-et");
    const current = activeRun.steps[stepKey];

    // Hard dependency gate — won't run until upstream steps are `passed` in this env.
    if (def.dependsOn?.length) {
      const missing = def.dependsOn.filter((k) => activeRun.steps[k]?.status !== "passed");
      if (missing.length) {
        const ts = new Date().toISOString();
        const missingTitles = missing
          .map((k) => PROMOTION_STEPS.find((s) => s.key === k)?.title ?? k)
          .join(", ");
        updateStep(env, stepKey, {
          logs: [
            ...(current.logs ?? []),
            `[${ts}] ✗ blocked: waiting on ${missingTitles}`,
          ],
        });
        return;
      }
    }

    // Per-env required-config gate — fails the step (instead of silently
    // auto-passing) when the bank hasn't filled in live-environment wiring like
    // the CBS endpoint or vault auth ref.
    const requiredKeys = def.requiredConfigByEnv?.[env] ?? [];
    if (requiredKeys.length) {
      const cfg = current.config ?? {};
      const missingCfg = requiredKeys.filter((k) => {
        const v = (cfg as Record<string, unknown>)[k];
        return typeof v !== "string" || v.trim() === "";
      });
      if (missingCfg.length) {
        const ts = new Date().toISOString();
        updateStep(env, stepKey, {
          status: "failed",
          completedAt: ts,
          logs: [
            ...(current.logs ?? []),
            `[${ts}] ✗ cannot run in ${env.toUpperCase()} — required config missing: ${missingCfg.join(", ")}`,
            `[${ts}]   open the step config above and fill in the bank's live values, then re-run.`,
          ],
        });
        updateRun(env, (r) => ({ ...r, overallStatus: "blocked" }));
        return;
      }
    }

    const needsApproval = def.approvalRequiredIn.includes(env);
    if (needsApproval && !current.approvedBy) {
      requestApproval(stepKey);
      return;
    }
    updateStep(env, stepKey, {
      status: "running",
      startedAt: new Date().toISOString(),
      logs: [`[${new Date().toISOString()}] queued`],
    });
    updateRun(env, (r) => ({
      ...r,
      overallStatus: "in_progress",
      startedAt: r.startedAt ?? new Date().toISOString(),
    }));

    const ms = def.simulatedMs[env];
    timers.current[stepKey] = window.setTimeout(() => {
      const evidence = synthesizeEvidence(def, env, run.tenantId, current.config);
      const logs = logsFor(def, env, evidence);
      updateStep(env, stepKey, {
        status: "passed",
        completedAt: new Date().toISOString(),
        evidence,
        logs,
      });
      updateRun(env, (r) => {
        const allPassed = PROMOTION_STEPS.every((s) =>
          s.key === stepKey ? true : r.steps[s.key]?.status === "passed"
        );
        const nextIndex = Math.min(def.index + 1, PROMOTION_STEPS.length + 1);
        return {
          ...r,
          currentStepIndex: Math.max(r.currentStepIndex, nextIndex),
          overallStatus: allPassed ? "passed" : "in_progress",
        };
      });
    }, ms);
  }, [bag, env, run.tenantId, requestApproval, updateRun, updateStep]);

  const resetEnv = useCallback(() => {
    setBag((prev) => {
      const next = { ...prev, [env]: freshRun(env, prev[env]?.tenantId ?? "cbe-et") };
      saveBag(next);
      return next;
    });
  }, [env]);

  const setTenantId = useCallback((tenantId: string) => {
    updateRun(env, (r) => ({ ...r, tenantId }));
  }, [env, updateRun]);

  const progressPct = useMemo(() => {
    const passed = PROMOTION_STEPS.filter((s) => run.steps[s.key]?.status === "passed").length;
    return Math.round((passed / PROMOTION_STEPS.length) * 100);
  }, [run]);

  return {
    env, setEnv,
    run,
    progressPct,
    setStepConfig,
    runStep,
    approveStep,
    requestApproval,
    resetEnv,
    setTenantId,
  };
}
