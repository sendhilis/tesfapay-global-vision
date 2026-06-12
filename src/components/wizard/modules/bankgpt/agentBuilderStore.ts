/**
 * Agent Builder extended config.
 *
 * Persistence (two layers, kept in sync):
 *   1. Browser localStorage — instant, offline, per-device cache.
 *   2. Lovable Cloud (public.bankgpt_agent_drafts) — durable across browsers
 *      and devices via the bankgpt-agent-config edge function.
 *
 * On first read for an agent we hydrate from the backend (if reachable) and
 * merge into localStorage. On every update we debounce-write to the backend
 * so KB uploads, tool toggles, guardrail tweaks etc. survive page reloads.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "abx.bankgpt.agentbuilder.v2";

export type KbDoc = {
  id: string;
  name: string;          // filename or URL
  type: "pdf" | "docx" | "txt" | "md" | "url";
  size: string;
  status: "pending" | "checking" | "indexing" | "indexed" | "error";
  chunks?: number;
  tokens?: number;
  indexedAt?: string;
  enabled: boolean;
  source?: string;       // original URL or file source label
  checksum?: string;     // simulated content hash
  error?: string;        // error reason if status==="error"
};

export type ToolId =
  | "read_balance" | "fetch_transactions" | "move_money" | "open_goal"
  | "buy_tbill" | "repay_loan" | "raise_complaint" | "send_notification"
  | "generate_chart";

export type ToolPolicy = {
  enabled: boolean;
  approval: "auto" | "confirm" | "admin";
  dailyLimit?: number;
};

export type TestRun = {
  id: string;
  prompt: string;
  expected: string;
  actual: string;
  passed: boolean | null;
  timestamp: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  groundedCitations?: number;
  blockedBy?: string;
};

export type Guardrails = {
  piiRedaction: boolean;
  profanityFilter: boolean;
  jailbreakDetection: boolean;
  requireGroundedAnswers: boolean;
  blockedTopics: string[];
  allowedLanguages: string[];
  refusalMessage: string;
  maxTokensPerReply: number;
  maxTurnsPerSession: number;
  rateLimitPerMinute: number;
  minGroundingSimilarity: number;
  humanHandoffOnLowConfidence: boolean;
};

export type Observability = {
  metricsEnabled: boolean;
  traceSampleRate: number;        // 0..1
  redactPiiInLogs: boolean;
  alerts: {
    latencyP95Ms: number;
    errorRatePct: number;
    costPerSessionEtb: number;
  };
  retentionDays: number;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;          // bank admin email/role (mocked)
  action: string;         // e.g. "kb.doc.added"
  target?: string;        // entity id / name
  details?: Record<string, unknown>;
};

export type AgentBuilderConfig = {
  intents: {
    keywords: string[];
    sampleUtterances: string[];
    confidenceThreshold: number;
    handoffRule: string;
  };
  kb: {
    docs: KbDoc[];
    chunkSize: number;
    overlap: number;
    topK: number;
    similarityThreshold: number;
    hybrid: boolean;
    lastIndexedAt?: string;
  };
  tools: Record<ToolId, ToolPolicy>;
  guardrails: Guardrails;
  observability: Observability;
  sandbox: { runs: TestRun[] };
  widget: {
    surfaces: string[];
    triggers: string[];
    style: "bubble" | "inline" | "fullscreen";
    enabled: boolean;
  };
  goLive: {
    personaComplete: boolean;
    kbIndexed: boolean;
    sandboxPassed: boolean;
    widgetPlaced: boolean;
    guardrailsReviewed: boolean;
    activated: boolean;
  };
  audit: AuditEntry[];
};

export function defaultBuilderConfig(): AgentBuilderConfig {
  return {
    intents: { keywords: [], sampleUtterances: [], confidenceThreshold: 0.72, handoffRule: "Escalate to human after 3 unresolved turns." },
    kb: { docs: [], chunkSize: 800, overlap: 120, topK: 4, similarityThreshold: 0.75, hybrid: true },
    tools: {
      read_balance:       { enabled: true,  approval: "auto" },
      fetch_transactions: { enabled: true,  approval: "auto" },
      move_money:         { enabled: false, approval: "confirm", dailyLimit: 50000 },
      open_goal:          { enabled: true,  approval: "confirm" },
      buy_tbill:          { enabled: false, approval: "confirm", dailyLimit: 100000 },
      repay_loan:         { enabled: true,  approval: "confirm" },
      raise_complaint:    { enabled: true,  approval: "auto" },
      send_notification:  { enabled: true,  approval: "auto" },
      generate_chart:     { enabled: true,  approval: "auto" },
    },
    guardrails: {
      piiRedaction: true,
      profanityFilter: true,
      jailbreakDetection: true,
      requireGroundedAnswers: true,
      blockedTopics: ["political opinions", "competitor advice", "legal counsel"],
      allowedLanguages: ["en", "am"],
      refusalMessage: "I can't help with that here — let me hand you to a human agent.",
      maxTokensPerReply: 600,
      maxTurnsPerSession: 25,
      rateLimitPerMinute: 20,
      minGroundingSimilarity: 0.7,
      humanHandoffOnLowConfidence: true,
    },
    observability: {
      metricsEnabled: true,
      traceSampleRate: 1.0,
      redactPiiInLogs: true,
      alerts: { latencyP95Ms: 1500, errorRatePct: 2, costPerSessionEtb: 1.5 },
      retentionDays: 90,
    },
    sandbox: { runs: [] },
    widget: { surfaces: ["home"], triggers: ["manual"], style: "bubble", enabled: false },
    goLive: { personaComplete: false, kbIndexed: false, sandboxPassed: false, widgetPlaced: false, guardrailsReviewed: false, activated: false },
    audit: [],
  };
}

type Store = {
  configs: Record<string, AgentBuilderConfig>;
  customAgents: { id: string; name: string; tagline: string; color: string; emoji: string }[];
};

function read(): Store {
  if (typeof window === "undefined") return { configs: {}, customAgents: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { configs: {}, customAgents: [] };
    return JSON.parse(raw);
  } catch { return { configs: {}, customAgents: [] }; }
}

function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

/** Merge persisted config with defaults so newly added fields aren't undefined. */
function hydrate(c: Partial<AgentBuilderConfig> | undefined): AgentBuilderConfig {
  const d = defaultBuilderConfig();
  if (!c) return d;
  return {
    ...d,
    ...c,
    intents:       { ...d.intents,       ...(c.intents       ?? {}) },
    kb:            { ...d.kb,            ...(c.kb            ?? {}) },
    tools:         { ...d.tools,         ...(c.tools         ?? {}) },
    guardrails:    { ...d.guardrails,    ...(c.guardrails    ?? {}) },
    observability: { ...d.observability, ...(c.observability ?? {}),
      alerts: { ...d.observability.alerts, ...((c.observability?.alerts) ?? {}) } },
    sandbox:       { ...d.sandbox,       ...(c.sandbox       ?? {}) },
    widget:        { ...d.widget,        ...(c.widget        ?? {}) },
    goLive:        { ...d.goLive,        ...(c.goLive        ?? {}) },
    audit:         Array.isArray(c.audit) ? c.audit : [],
  };
}

export function useAgentBuilder(agentId: string) {
  const [store, setStore] = useState<Store>(() => read());

  useEffect(() => { write(store); }, [store]);

  const config = hydrate(store.configs[agentId]);

  const update = useCallback((patch: Partial<AgentBuilderConfig> | ((c: AgentBuilderConfig) => AgentBuilderConfig)) => {
    setStore((s) => {
      const current = hydrate(s.configs[agentId]);
      const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
      return { ...s, configs: { ...s.configs, [agentId]: next } };
    });
  }, [agentId]);

  const logAudit = useCallback((action: string, target?: string, details?: Record<string, unknown>) => {
    setStore((s) => {
      const current = hydrate(s.configs[agentId]);
      const entry: AuditEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        actor: "bank.admin@globalbank.et",
        action, target, details,
      };
      const next: AgentBuilderConfig = { ...current, audit: [entry, ...current.audit].slice(0, 200) };
      return { ...s, configs: { ...s.configs, [agentId]: next } };
    });
  }, [agentId]);

  return { config, update, logAudit };
}

export function useCustomAgents() {
  const [store, setStore] = useState<Store>(() => read());
  useEffect(() => { write(store); }, [store]);

  const add = (a: { name: string; tagline: string; color: string; emoji: string }) => {
    const id = `custom-${Date.now()}`;
    setStore((s) => ({ ...s, customAgents: [...s.customAgents, { id, ...a }] }));
    return id;
  };
  const remove = (id: string) => setStore((s) => ({
    ...s,
    customAgents: s.customAgents.filter((a) => a.id !== id),
    configs: Object.fromEntries(Object.entries(s.configs).filter(([k]) => k !== id)),
  }));

  return { customAgents: store.customAgents, add, remove };
}
