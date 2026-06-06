/**
 * Credit & Debit Card Specialist — one-click demo preset.
 *
 * Loads a fully-configured BankGPT agent (persona, KB URL, intents, tools,
 * guardrails reviewed) so the demo can jump straight to the Voice Sandbox.
 *
 * Bank knowledge-base URL is configurable per demo via the input on the
 * roster card. Defaults to a public bank cards page so the agent has
 * something real to "ground" against.
 */
import type { BankConfig } from "@/contexts/BankConfigContext";
import { defaultBuilderConfig, type AgentBuilderConfig } from "./agentBuilderStore";

export const CARD_AGENT_ID = "cardSpecialist";

export const DEFAULT_CARD_KB_URL = "https://www.cbe.com.et/personal-banking/cards/";

export function buildCardSpecialistMeshAgent(bankName: string) {
  return {
    id: CARD_AGENT_ID,
    name: "Card Concierge",
    emoji: "💳",
    tagline: "Credit & debit card specialist — everything cards, end-to-end.",
    color: "#7C3AED",
    enabled: true,
    avatarStyle: "illustrated" as const,
    tone: { formal_casual: 55, terse_verbose: 35, reserved_expressive: 65 },
    usesEmoji: true,
    greetingOnHandoff: `Hi {firstName}! I'm the Card Concierge for ${bankName}. I can answer anything about your credit or debit cards — limits, fees, statements, lost-card blocks, EMIs, foreign-currency, rewards. What can I help with?`,
    handoffMessage: "Let me bring in our Card Concierge — she handles all credit and debit card matters.",
    keywords: [
      "card", "credit card", "debit card", "visa", "mastercard", "cvv",
      "pin", "block card", "lost card", "stolen", "limit", "atm",
      "statement", "emi", "instalment", "rewards", "points", "cashback",
      "foreign", "fx", "international", "chargeback", "dispute", "fee",
    ],
    systemPrompt: [
      `You are the bank's Credit & Debit Card Specialist.`,
      `You handle EVERYTHING about cards end-to-end: applications, eligibility, limits, fees, interest, billing cycles, statement charges, EMI conversions, rewards and cashback, ATM/POS issues, lost / stolen card blocking, replacement, PIN reset, OTP issues, dispute & chargeback initiation, foreign currency transactions, contactless & tokenisation, virtual cards, supplementary cards.`,
      `When a customer asks for a destructive or sensitive action (block card, raise dispute, change limit), explain what you would do, ask for confirmation in plain language, and indicate it will go through the bank's approval workflow.`,
      `Always cite the bank's official card terms when quoting a fee or limit. If you do not know a specific number from the bank's knowledge base, say so clearly and offer to escalate to a human agent.`,
      `Never invent fees or rewards rates. Never disclose CVV, full PAN or PIN — ask the customer not to share these.`,
    ].join("\n"),
    sampleReplies: [
      "Your VISA Gold's domestic ATM limit is ETB 20,000/day. Want me to walk you through raising it?",
      "Blocking the card now. You'll get an SMS confirmation in about 30 seconds. Reorder a replacement?",
      "That ETB 1,200 charge looks foreign-merchant. Want me to start a dispute? It takes about 5 minutes.",
    ],
    position: { x: 0.65, y: 0.82 },
  };
}

export function buildCardSpecialistBuilderConfig(kbUrl: string): AgentBuilderConfig {
  const c = defaultBuilderConfig();
  return {
    ...c,
    intents: {
      ...c.intents,
      keywords: [
        "card", "credit card", "debit card", "block card", "lost card",
        "limit", "statement", "emi", "rewards", "dispute", "fee", "pin", "cvv",
      ],
      sampleUtterances: [
        "I lost my debit card, please block it",
        "What's the annual fee on my credit card?",
        "How do I convert this purchase to EMI?",
        "Why was I charged a foreign-currency fee?",
        "Raise the daily ATM limit on my VISA Gold",
        "Show me my last statement",
        "I want to apply for a new credit card",
        "There's a fraudulent charge on my card",
      ],
      confidenceThreshold: 0.7,
      handoffRule: "Escalate to a human card-ops officer for: confirmed fraud, dispute > ETB 50,000, or after 3 unresolved turns.",
    },
    kb: {
      ...c.kb,
      docs: [
        {
          id: `doc-card-${Date.now()}`,
          name: kbUrl,
          type: "url",
          size: "—",
          status: "indexed",
          chunks: 64,
          tokens: 12400,
          indexedAt: new Date().toISOString(),
          enabled: true,
          source: kbUrl,
          checksum: "cardkb01",
        },
        {
          id: `doc-card-fees-${Date.now()}`,
          name: "Card Fees & Charges Schedule.pdf",
          type: "pdf",
          size: "182 KB",
          status: "indexed",
          chunks: 28,
          tokens: 5400,
          indexedAt: new Date().toISOString(),
          enabled: true,
          source: "upload",
          checksum: "feesch01",
        },
        {
          id: `doc-card-tnc-${Date.now()}`,
          name: "Cardholder Terms & Conditions.pdf",
          type: "pdf",
          size: "412 KB",
          status: "indexed",
          chunks: 86,
          tokens: 18200,
          indexedAt: new Date().toISOString(),
          enabled: true,
          source: "upload",
          checksum: "tncs0001",
        },
      ],
      lastIndexedAt: new Date().toISOString(),
    },
    tools: {
      ...c.tools,
      read_balance:       { enabled: true,  approval: "auto" },
      fetch_transactions: { enabled: true,  approval: "auto" },
      raise_complaint:    { enabled: true,  approval: "auto" },
      send_notification:  { enabled: true,  approval: "auto" },
      move_money:         { enabled: true,  approval: "confirm", dailyLimit: 100000 },
      repay_loan:         { enabled: true,  approval: "confirm" },
      generate_chart:     { enabled: true,  approval: "auto" },
      open_goal:          { enabled: false, approval: "confirm" },
      buy_tbill:          { enabled: false, approval: "admin" },
    },
    goLive: {
      personaComplete: true,
      kbIndexed: true,
      sandboxPassed: false,
      widgetPlaced: true,
      guardrailsReviewed: true,
      activated: false,
    },
    widget: { ...c.widget, surfaces: ["cards", "home"], triggers: ["manual", "post_txn"], style: "bubble" },
    audit: [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "demo.preset@globalbank.et",
        action: "demo.cardSpecialist.loaded",
        target: CARD_AGENT_ID,
        details: { kbUrl, preset: "card-specialist-v1" },
      },
    ],
  };
}

/**
 * Apply the preset: writes both the mesh-agents entry (via setConfig)
 * and the builder config (directly into localStorage so useAgentBuilder
 * picks it up on next render).
 */
export function applyCardSpecialistPreset(
  bankCfg: BankConfig,
  setConfig: (c: BankConfig) => void,
  kbUrl: string,
) {
  const meshAgent = buildCardSpecialistMeshAgent(bankCfg.bank?.name || "the bank");
  setConfig({
    ...bankCfg,
    ai: {
      ...bankCfg.ai,
      mesh: {
        ...bankCfg.ai.mesh,
        agents: { ...bankCfg.ai.mesh.agents, [CARD_AGENT_ID]: meshAgent } as any,
      },
    },
  });

  // Patch the agent-builder localStorage store directly so the
  // useAgentBuilder hook hydrates with the pre-loaded config.
  try {
    const KEY = "abx.bankgpt.agentbuilder.v2";
    const raw = localStorage.getItem(KEY);
    const store = raw ? JSON.parse(raw) : { configs: {}, customAgents: [] };
    store.configs = store.configs || {};
    store.configs[CARD_AGENT_ID] = buildCardSpecialistBuilderConfig(kbUrl);
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Failed to seed builder config", e);
  }
}
