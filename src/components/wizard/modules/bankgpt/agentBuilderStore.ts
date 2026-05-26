/**
 * Agent Builder extended config — persisted to localStorage so it survives
 * reloads in the prototype. Keyed by agent id. Backend-agnostic so a future
 * Spring Boot service can replace the storage layer.
 */
import { useCallback, useEffect, useState } from "react";

const KEY = "abx.bankgpt.agentbuilder.v1";

export type KbDoc = {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "url";
  size: string;          // human readable
  status: "pending" | "indexing" | "indexed" | "error";
  chunks?: number;
  tokens?: number;
  indexedAt?: string;
  enabled: boolean;
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
  sandbox: { runs: TestRun[] };
  widget: {
    surfaces: string[];  // "home" | "wallet" | "loans" | "cards" | "investments"
    triggers: string[];  // "idle" | "low_balance" | "post_txn" | "salary_credit" | "manual"
    style: "bubble" | "inline" | "fullscreen";
    enabled: boolean;
  };
  goLive: {
    personaComplete: boolean;
    kbIndexed: boolean;
    sandboxPassed: boolean;
    widgetPlaced: boolean;
    activated: boolean;
  };
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
    sandbox: { runs: [] },
    widget: { surfaces: ["home"], triggers: ["manual"], style: "bubble", enabled: false },
    goLive: { personaComplete: false, kbIndexed: false, sandboxPassed: false, widgetPlaced: false, activated: false },
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

export function useAgentBuilder(agentId: string) {
  const [store, setStore] = useState<Store>(() => read());

  useEffect(() => { write(store); }, [store]);

  const config = store.configs[agentId] ?? defaultBuilderConfig();

  const update = useCallback((patch: Partial<AgentBuilderConfig> | ((c: AgentBuilderConfig) => AgentBuilderConfig)) => {
    setStore((s) => {
      const current = s.configs[agentId] ?? defaultBuilderConfig();
      const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
      return { ...s, configs: { ...s.configs, [agentId]: next } };
    });
  }, [agentId]);

  return { config, update };
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
