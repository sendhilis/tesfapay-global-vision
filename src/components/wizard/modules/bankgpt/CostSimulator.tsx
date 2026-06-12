/**
 * CostSimulator — On-Prem vs Hybrid OPEX simulator for BankGPT.
 *
 * Built for Ethiopia's price-sensitive context. Lets the bank start with ONE
 * agent and incrementally add inference modules (agents) as the customer base
 * and conversation volume grows. Each agent is treated as a small overlay
 * module with its own model footprint, GPU share and token mix. Costs are
 * computed for three deployment modes:
 *   - On-Prem Open Source (Llama 3.1 / Qwen2.5 / Mistral on local GPUs)
 *   - Hybrid (PII/workhorse on-prem, frontier reasoning to cloud)
 *   - Cloud-Only (Lovable AI Gateway / OpenAI baseline for comparison)
 *
 * No backend calls — pure client-side calculation. Numbers are indicative,
 * conservative, and sourced from public Ethio-Telecom power tariffs,
 * NVIDIA reseller list prices, and Hugging Face / vLLM throughput benchmarks
 * (2025). Adjust the constants block to recalibrate.
 */
import { useMemo, useState, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Cpu, Cloud, Server, TrendingUp, Zap, DollarSign, Users,
  MessageSquare, Plus, Minus, AlertTriangle, CheckCircle2, Layers,
  Lock, KeyRound, Mic,
} from "lucide-react";
import { Framework360, type Mode as F360Mode } from "./cost/Framework360";
import { PerformanceScorecard } from "./cost/PerformanceScorecard";

// ───────── Voice Stack constants ─────────
// Avg per voice turn: ~250 TTS chars (≈ 18 sec spoken Amharic/English) + ~5 sec STT.
const VOICE_TTS_CHARS_PER_TURN = 250;
const VOICE_STT_SECONDS_PER_TURN = 5;
// ElevenLabs Creator-tier blended pricing (multilingual_v2):
const EL_TTS_USD_PER_1K_CHARS = 0.18;     // ≈ $0.045/turn
const EL_STT_USD_PER_HOUR     = 0.40;     // ≈ $0.00056/turn — negligible
type VoiceMode = "elevenlabs" | "hybrid" | "onprem";
const VOICE_MODES: { id: VoiceMode; label: string; desc: string; capex: number; monthlyFixed: number }[] = [
  { id: "elevenlabs", label: "ElevenLabs Cloud", desc: "Per-character billing. Best voice quality. Cloud egress required.", capex: 0,    monthlyFixed: 0 },
  { id: "hybrid",     label: "Hybrid (Whisper on-prem + ElevenLabs TTS)", desc: "Free STT on shared GPU; only Amharic TTS billed to ElevenLabs.", capex: 500,  monthlyFixed: 50 },
  { id: "onprem",     label: "Full On-Prem (Whisper + Piper-Amharic)", desc: "CPU-only Piper voice (one-time training). Zero per-turn cost.", capex: 2000, monthlyFixed: 215 },
];

// ───────── Constants (indicative, Ethiopia 2025) ─────────
const ETB_PER_USD = 135;             // NBE indicative rate
const KWH_PRICE_USD = 0.04;          // Industrial tariff Addis (~ETB 5.4)
const PUE = 1.6;                     // Tier-III DC overhead
const DEPRECIATION_MONTHS = 36;      // 3-yr amortisation

// GPU catalogue (street price USD, idle+load watts, tokens/sec for 8B Q4)
const GPUS = {
  L4:    { name: "NVIDIA L4 24GB",    capex: 8500,  watts: 72,  tps: 95,  vram: 24 },
  L40S:  { name: "NVIDIA L40S 48GB",  capex: 11500, watts: 350, tps: 240, vram: 48 },
  H100:  { name: "NVIDIA H100 80GB",  capex: 32000, watts: 700, tps: 850, vram: 80 },
} as const;
type GpuKey = keyof typeof GPUS;

// Agent module catalogue — each is an "inference add-on"
type AgentModule = {
  id: string; name: string; role: string;
  model: string;            // Open-source model used on-prem
  paramsB: number;          // Billions
  avgTokensPerTurn: number; // in+out
  recommendedGpu: GpuKey;
  cloudUsdPerMTok: number;  // Cloud equivalent (input+output blended)
  enabled: boolean;
  required?: boolean;       // The starter agent
};

const DEFAULT_AGENTS: AgentModule[] = [
  { id: "selam",   name: "Selam-Bot",       role: "Retail concierge (EN+አማ)", model: "Llama-3.1-8B-Instruct",  paramsB: 8,  avgTokensPerTurn: 600,  recommendedGpu: "L40S", cloudUsdPerMTok: 0.30, enabled: true, required: true },
  { id: "dawit",   name: "Dawit-Bot",       role: "Lending & micro-loan",      model: "Qwen2.5-7B-Instruct",   paramsB: 7,  avgTokensPerTurn: 900,  recommendedGpu: "L40S", cloudUsdPerMTok: 0.30, enabled: false },
  { id: "hanna",   name: "Hanna-Bot",       role: "Savings & Equb coach",      model: "Mistral-7B-Instruct",   paramsB: 7,  avgTokensPerTurn: 700,  recommendedGpu: "L40S", cloudUsdPerMTok: 0.30, enabled: false },
  { id: "mesfin",  name: "Mesfin-Bot",      role: "Cards & disputes",          model: "Llama-3.1-8B-Instruct", paramsB: 8,  avgTokensPerTurn: 800,  recommendedGpu: "L40S", cloudUsdPerMTok: 0.30, enabled: false },
  { id: "tigist",  name: "Tigist-Bot",      role: "Fraud / AML watchdog",      model: "Qwen2.5-14B-Instruct",  paramsB: 14, avgTokensPerTurn: 1200, recommendedGpu: "H100", cloudUsdPerMTok: 1.20, enabled: false },
  { id: "abebe",   name: "Abebe-Bot",       role: "Council reasoner (frontier)", model: "Llama-3.1-70B (Q4)",  paramsB: 70, avgTokensPerTurn: 2000, recommendedGpu: "H100", cloudUsdPerMTok: 3.00, enabled: false },
];

const MODES = [
  { id: "onprem",  label: "On-Prem OSS",  icon: Server, color: "text-emerald-400", desc: "All agents on local GPUs, open-source models only" },
  { id: "hybrid",  label: "Hybrid",       icon: Layers, color: "text-amber-400",   desc: "Workhorse on-prem, frontier (70B+) to cloud" },
  { id: "cloud",   label: "Cloud Only",   icon: Cloud,  color: "text-sky-400",     desc: "Baseline — every token billed to gateway" },
] as const;

export function CostSimulator() {
  const [customers, setCustomers] = useState(50_000);
  const [turnsPerCustomerMonth, setTurns] = useState(8);
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("hybrid");
  const [voiceSharePct, setVoiceSharePct] = useState(30); // % of turns that are voice
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const [f360, setF360] = useState<{ monthly: Record<F360Mode, number>; capex: Record<F360Mode, number> }>({
    monthly: { onprem: 0, hybrid: 0, cloud: 0 },
    capex:   { onprem: 0, hybrid: 0, cloud: 0 },
  });
  const handleF360 = useCallback(
    (d: { monthly: Record<F360Mode, number>; capex: Record<F360Mode, number> }) => setF360(d),
    []
  );

  const toggleAgent = (id: string) =>
    setAgents(a => a.map(x => x.id === id && !x.required ? { ...x, enabled: !x.enabled } : x));

  const enabled = agents.filter(a => a.enabled);

  // ───────── Math ─────────
  const stats = useMemo(() => {
    const monthlyTurns = customers * turnsPerCustomerMonth;
    // Distribute turns across enabled agents (Selam takes 50%, rest split remainder)
    const weights = enabled.map((a, i) => a.id === "selam" ? 0.5 : (0.5 / Math.max(1, enabled.length - 1)));

    const perAgent = enabled.map((a, i) => {
      const turns = monthlyTurns * weights[i];
      const tokensM = (turns * a.avgTokensPerTurn) / 1_000_000;
      const gpu = GPUS[a.recommendedGpu];
      // How many GPUs needed? Assume 60% utilisation ceiling.
      const tokensPerSecNeeded = (turns * a.avgTokensPerTurn) / (30 * 24 * 3600);
      const gpusNeeded = Math.max(1, Math.ceil(tokensPerSecNeeded / (gpu.tps * 0.6)));

      const gpuCapex = gpusNeeded * gpu.capex;            // upfront $ for GPUs alone
      const capexMonthly = gpuCapex / DEPRECIATION_MONTHS;
      const powerKwh = (gpusNeeded * gpu.watts * PUE * 24 * 30) / 1000;
      const powerCost = powerKwh * KWH_PRICE_USD;
      // Ops overhead: 1 SRE per 8 GPUs at $1800/mo Addis salary fully loaded
      const opsCost = (gpusNeeded / 8) * 1800;
      const onpremCost = capexMonthly + powerCost + opsCost;

      const cloudCost = tokensM * a.cloudUsdPerMTok;

      // Hybrid: frontier agents (>20B) go cloud, rest on-prem
      const isCloudInHybrid = a.paramsB > 20;
      const hybridCost = isCloudInHybrid ? cloudCost : onpremCost;
      const hybridCapex = isCloudInHybrid ? 0 : gpuCapex;

      return { agent: a, turns, tokensM, gpusNeeded, gpuCapex, hybridCapex, capexMonthly, powerCost, opsCost, onpremCost, cloudCost, hybridCost };
    });

    // ───── Upfront CAPEX (one-time provisioning) ─────
    const gpuCapexOnprem = perAgent.reduce((s, p) => s + p.gpuCapex,    0);
    const gpuCapexHybrid = perAgent.reduce((s, p) => s + p.hybridCapex, 0);
    // Infra uplift: servers, NVLink, 100G switching, NVMe storage, KMS/HSM, racks, UPS ≈ 40% of GPU spend
    const INFRA_UPLIFT = 0.40;
    // One-time software, integration, NBE compliance, pen-test, training
    const SETUP_ONPREM = 80_000;
    const SETUP_HYBRID = 40_000;
    const SETUP_CLOUD  = 15_000;

    const capex = {
      onprem: gpuCapexOnprem * (1 + INFRA_UPLIFT) + SETUP_ONPREM,
      hybrid: gpuCapexHybrid * (1 + INFRA_UPLIFT) + SETUP_HYBRID,
      cloud:  SETUP_CLOUD,
      gpuOnprem: gpuCapexOnprem,
      gpuHybrid: gpuCapexHybrid,
      infraOnprem: gpuCapexOnprem * INFRA_UPLIFT,
      infraHybrid: gpuCapexHybrid * INFRA_UPLIFT,
      setupOnprem: SETUP_ONPREM,
      setupHybrid: SETUP_HYBRID,
      setupCloud:  SETUP_CLOUD,
    };

    // ───── Voice Stack costs ─────
    const voiceTurns = monthlyTurns * (voiceSharePct / 100);
    const elTtsCost = (voiceTurns * VOICE_TTS_CHARS_PER_TURN / 1000) * EL_TTS_USD_PER_1K_CHARS;
    const elSttCost = (voiceTurns * VOICE_STT_SECONDS_PER_TURN / 3600) * EL_STT_USD_PER_HOUR;
    const elFull   = elTtsCost + elSttCost;
    const elTtsOnly = elTtsCost;             // hybrid still pays TTS to ElevenLabs
    const cfg = VOICE_MODES.find(v => v.id === voiceMode)!;
    const voiceMonthly =
      voiceMode === "elevenlabs" ? elFull
    : voiceMode === "hybrid"     ? elTtsOnly + cfg.monthlyFixed
    :                              cfg.monthlyFixed;
    const voiceCapex = cfg.capex;
    // Reference cost for "what if we used ElevenLabs cloud across the board"
    const voiceCloudReference = elFull;

    const baseTotals = {
      onprem: perAgent.reduce((s, p) => s + p.onpremCost, 0),
      hybrid: perAgent.reduce((s, p) => s + p.hybridCost, 0),
      cloud:  perAgent.reduce((s, p) => s + p.cloudCost,  0),
    };
    const totals = {
      onprem: baseTotals.onprem + voiceMonthly,
      hybrid: baseTotals.hybrid + voiceMonthly,
      cloud:  baseTotals.cloud  + voiceCloudReference, // cloud-only always uses EL
      tokensM: perAgent.reduce((s, p) => s + p.tokensM,   0),
      gpus:   perAgent.reduce((s, p) => s + p.gpusNeeded, 0),
      turns:  monthlyTurns,
    };

    // Fold voice CAPEX into provisioning totals (cloud mode = 0 voice capex)
    capex.onprem += voiceCapex;
    capex.hybrid += voiceCapex;

    const cheapest = (["onprem","hybrid","cloud"] as const).reduce((a, b) => totals[a] < totals[b] ? a : b);
    const costPerTurn = {
      onprem: totals.onprem / Math.max(1, monthlyTurns),
      hybrid: totals.hybrid / Math.max(1, monthlyTurns),
      cloud:  totals.cloud  / Math.max(1, monthlyTurns),
    };

    const voice = {
      mode: voiceMode, cfg, voiceTurns, voiceMonthly, voiceCapex,
      elFull, elTtsOnly, voiceCloudReference,
      savingsVsElevenLabs: Math.max(0, elFull - voiceMonthly),
    };

    return { perAgent, totals, capex, cheapest, costPerTurn, voice };
  }, [customers, turnsPerCustomerMonth, enabled, voiceMode, voiceSharePct]);

  // Fold 360°-framework deltas into the effective headline numbers so every
  // downstream card (totals, payback, savings) reflects the true bank TCO.
  const eff = useMemo(() => {
    const monthly = {
      onprem: stats.totals.onprem + f360.monthly.onprem,
      hybrid: stats.totals.hybrid + f360.monthly.hybrid,
      cloud:  stats.totals.cloud  + f360.monthly.cloud,
    };
    const capex = {
      onprem: stats.capex.onprem + f360.capex.onprem,
      hybrid: stats.capex.hybrid + f360.capex.hybrid,
      cloud:  stats.capex.cloud  + f360.capex.cloud,
    };
    const cheapest = (["onprem","hybrid","cloud"] as const).reduce((a, b) =>
      monthly[a] < monthly[b] ? a : b
    );
    const turns = Math.max(1, stats.totals.turns);
    const costPerTurn = {
      onprem: monthly.onprem / turns,
      hybrid: monthly.hybrid / turns,
      cloud:  monthly.cloud  / turns,
    };
    return { monthly, capex, cheapest, costPerTurn };
  }, [stats, f360]);

  const handleUnlock = () => {
    if (pwd === "Techurate@9123") { setUnlocked(true); setErr(false); }
    else { setErr(true); }
  };

  return (
    <div className="space-y-4">
      {!unlocked && (
        <div className="glass rounded-xl p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-8">
          <div className="h-12 w-12 rounded-full bg-tesfa-gold/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-tesfa-gold" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Restricted Access</h3>
          <p className="text-[11px] text-muted-foreground mb-4">
            Cost Simulator contains budget provisioning data. Enter the password to unlock.
          </p>
          <div className="w-full flex flex-col gap-3">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setErr(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                placeholder="Enter password"
                className="w-full h-10 rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {err && <p className="text-[11px] text-destructive">Incorrect password</p>}
            <button
              onClick={handleUnlock}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {unlocked && (
        <>
          {/* Header strip */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-tesfa-gold mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">On-Prem Cost Simulator — Start Small, Scale Smart</p>
            <p className="text-[11px] text-muted-foreground">
              Ethiopia-tuned OPEX model. Start with one agent, add inference modules as conversation volume justifies the GPU.
              Costs assume Addis industrial power (USD {KWH_PRICE_USD}/kWh), PUE {PUE}, {DEPRECIATION_MONTHS}-month GPU depreciation, USD/ETB ≈ {ETB_PER_USD}.
            </p>
          </div>
        </div>
      </div>

      {/* Scale controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScaleCard
          icon={Users} label="Active customers" value={customers.toLocaleString()} sub="Onboarded wallet users"
          min={1000} max={2_000_000} step={1000} val={customers} onChange={setCustomers}
        />
        <ScaleCard
          icon={MessageSquare} label="Conversation turns / customer / month" value={`${turnsPerCustomerMonth} turns`} sub="Industry: 4–12 for retail banking"
          min={1} max={40} step={1} val={turnsPerCustomerMonth} onChange={setTurns}
        />
      </div>

      {/* Three-mode totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map(m => {
          const total = eff.monthly[m.id];
          const perTurn = eff.costPerTurn[m.id];
          const isCheapest = eff.cheapest === m.id;
          const Icon = m.icon;
          return (
            <div key={m.id} className={`glass rounded-xl p-4 border ${isCheapest ? "border-emerald-400/40" : "border-transparent"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${m.color}`} />
                  <span className="text-xs font-bold text-foreground">{m.label}</span>
                </div>
                {isCheapest && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> BEST
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">{m.desc}</p>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">Upfront CAPEX (all-in)</span>
                  <span className="text-sm font-bold text-foreground">${Math.round(eff.capex[m.id]).toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">Monthly OPEX (all-in)</span>
                  <span className="text-lg font-bold text-foreground">${Math.round(total).toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">ETB OPEX/mo</span>
                  <span className="text-xs text-tesfa-gold font-semibold">ETB {Math.round(total * ETB_PER_USD).toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[9px] text-muted-foreground italic">incl. 360° layers</span>
                  <span className="text-[10px] text-muted-foreground font-mono">+${Math.round(f360.monthly[m.id]).toLocaleString()}/mo</span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Cost per turn</span>
                  <span className="text-xs text-foreground font-mono">${perTurn.toFixed(4)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Savings callout */}
      <div className="glass rounded-xl p-3 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">On-Prem saves </span>
          <span className="text-emerald-400 font-bold">
            ${Math.round(eff.monthly.cloud - eff.monthly.onprem).toLocaleString()}/mo
          </span>
          <span> vs Cloud · </span>
          <span className="text-foreground font-semibold">Hybrid saves </span>
          <span className="text-amber-400 font-bold">
            ${Math.round(eff.monthly.cloud - eff.monthly.hybrid).toLocaleString()}/mo
          </span>
          <span> · Annual on-prem savings: </span>
          <span className="text-tesfa-gold font-bold">
            ETB {Math.round((eff.monthly.cloud - eff.monthly.onprem) * 12 * ETB_PER_USD).toLocaleString()}
          </span>
        </p>
      </div>

      {/* Minimum-viable CAPEX — Selam-only OSS floor */}
      <MinViableCapex customers={customers} turnsPerCustomerMonth={turnsPerCustomerMonth} voiceCapex={stats.voice.voiceCapex} />




      {/* CAPEX vs OPEX — Definitions legend */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-tesfa-gold" />
          <p className="text-sm font-semibold text-foreground">How to read this: CAPEX vs OPEX</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/40 bg-background/30 p-3">
            <p className="text-xs font-bold text-tesfa-gold mb-1">CAPEX — one-time, before go-live</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Spent <span className="text-foreground font-semibold">once</span> to stand the platform up; depreciated over {DEPRECIATION_MONTHS} months for accounting.
              Covers: <span className="text-foreground">GPUs</span> (NVIDIA street price, Addis-landed) ·
              <span className="text-foreground"> Infra uplift</span> (servers, NVLink, 100G switching, NVMe, racks, UPS — ~40% of GPU spend) ·
              <span className="text-foreground"> Setup &amp; integration</span> (vLLM/Triton, Keycloak SSO, RAG, Kafka CDC) ·
              <span className="text-foreground"> NBE pen-test &amp; staff training</span> ·
              <span className="text-foreground"> 360° compliance buildout</span> (HSM, SIEM bootstrap, DR site, insurance binders).
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/30 p-3">
            <p className="text-xs font-bold text-tesfa-gold mb-1">OPEX — recurring, every month</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Spent <span className="text-foreground font-semibold">every month</span> to keep the platform live.
              Covers: <span className="text-foreground">GPU depreciation</span> (CAPEX ÷ {DEPRECIATION_MONTHS}mo) ·
              <span className="text-foreground"> Power</span> (Addis industrial ${KWH_PRICE_USD}/kWh, PUE {PUE}) ·
              <span className="text-foreground"> SRE / Ops staff</span> ·
              <span className="text-foreground"> Cloud token bills</span> (hybrid/cloud modes) ·
              <span className="text-foreground"> Voice STT/TTS</span> ·
              <span className="text-foreground"> 360° run costs</span> (SOC, SIEM seats, vendor support, leased lines, DR drills, insurance premiums).
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          The headline cards at the top show <span className="text-foreground font-semibold">all-in</span> numbers
          (compute + 360° layers). The breakdown below splits the same total into its two pieces so every dollar is accounted for.
        </p>
      </div>

      {/* CAPEX Provisioning Breakdown */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-tesfa-gold" />
            <p className="text-sm font-semibold text-foreground">Upfront CAPEX — Budget Provisioning</p>
          </div>
          <span className="text-[10px] text-muted-foreground">One-time spend before go-live · 36-mo depreciation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* On-Prem CAPEX */}
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-foreground">On-Prem OSS</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 mb-1">Compute &amp; integration</p>
            <CapexRow label={`GPUs (${stats.totals.gpus}×)`} value={stats.capex.gpuOnprem} />
            <CapexRow label="Servers, network, storage, KMS, racks" value={stats.capex.infraOnprem} />
            <CapexRow label="Setup, integration, NBE pen-test" value={stats.capex.setupOnprem} />
            <div className="mt-1 flex items-baseline justify-between text-[10px] text-muted-foreground">
              <span>Subtotal — compute</span>
              <span className="font-mono">${Math.round(stats.capex.onprem).toLocaleString()}</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-2 mb-1">360° compliance &amp; ops buildout</p>
            <CapexRow label="HSM, SIEM bootstrap, DR site, insurance" value={f360.capex.onprem} />
            <div className="border-t border-border/40 mt-2 pt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-foreground">Total CAPEX (all-in)</span>
              <div className="text-right">
                <p className="text-base font-bold text-emerald-400">${Math.round(eff.capex.onprem).toLocaleString()}</p>
                <p className="text-[10px] text-tesfa-gold font-mono">ETB {Math.round(eff.capex.onprem * ETB_PER_USD).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Hybrid CAPEX */}
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-foreground">Hybrid</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 mb-1">Compute &amp; integration</p>
            <CapexRow label="GPUs (workhorse only)" value={stats.capex.gpuHybrid} />
            <CapexRow label="Infra uplift (40%)" value={stats.capex.infraHybrid} />
            <CapexRow label="Setup + cloud onboarding" value={stats.capex.setupHybrid} />
            <div className="mt-1 flex items-baseline justify-between text-[10px] text-muted-foreground">
              <span>Subtotal — compute</span>
              <span className="font-mono">${Math.round(stats.capex.hybrid).toLocaleString()}</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-2 mb-1">360° compliance &amp; ops buildout</p>
            <CapexRow label="HSM, SIEM bootstrap, DR site, insurance" value={f360.capex.hybrid} />
            <div className="border-t border-border/40 mt-2 pt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-foreground">Total CAPEX (all-in)</span>
              <div className="text-right">
                <p className="text-base font-bold text-amber-400">${Math.round(eff.capex.hybrid).toLocaleString()}</p>
                <p className="text-[10px] text-tesfa-gold font-mono">ETB {Math.round(eff.capex.hybrid * ETB_PER_USD).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Cloud CAPEX */}
          <div className="rounded-lg border border-sky-400/30 bg-sky-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-foreground">Cloud Only</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 mb-1">Compute &amp; integration</p>
            <CapexRow label="GPUs" value={0} />
            <CapexRow label="Infra" value={0} />
            <CapexRow label="Setup + integration" value={stats.capex.setupCloud} />
            <div className="mt-1 flex items-baseline justify-between text-[10px] text-muted-foreground">
              <span>Subtotal — compute</span>
              <span className="font-mono">${Math.round(stats.capex.cloud).toLocaleString()}</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-2 mb-1">360° compliance &amp; ops buildout</p>
            <CapexRow label="Sovereignty, app-layer pen-test" value={f360.capex.cloud} />
            <div className="border-t border-border/40 mt-2 pt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-foreground">Total CAPEX (all-in)</span>
              <div className="text-right">
                <p className="text-base font-bold text-sky-400">${Math.round(eff.capex.cloud).toLocaleString()}</p>
                <p className="text-[10px] text-tesfa-gold font-mono">ETB {Math.round(eff.capex.cloud * ETB_PER_USD).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CAPEX vs OPEX payback */}
        <div className="mt-3 rounded-lg bg-background/40 border border-border/40 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">On-Prem payback vs Cloud</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">
              {eff.monthly.cloud > eff.monthly.onprem
                ? `${Math.ceil(eff.capex.onprem / (eff.monthly.cloud - eff.monthly.onprem))} months`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Hybrid payback vs Cloud</p>
            <p className="text-sm font-bold text-amber-400 font-mono">
              {eff.monthly.cloud > eff.monthly.hybrid
                ? `${Math.ceil(eff.capex.hybrid / (eff.monthly.cloud - eff.monthly.hybrid))} months`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">CAPEX delta (On-Prem − Hybrid)</p>
            <p className="text-sm font-bold text-foreground font-mono">
              ${Math.round(eff.capex.onprem - eff.capex.hybrid).toLocaleString()}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Reconciles to the headline cards: <span className="text-foreground font-mono">Compute &amp; integration</span> +
          <span className="text-foreground font-mono"> 360° buildout</span> =
          <span className="text-foreground font-mono"> Total CAPEX (all-in)</span>.
          Assumptions: GPU street price (NVIDIA reseller, Addis-landed). Infra uplift = 40% of GPU spend covers DL380/XE servers, NVLink, 100G switching, NVMe storage, HSM/KMS, racks, UPS.
          Setup covers vLLM/Triton install, Keycloak SSO, RAG pipeline, Kafka/Debezium CDC, NBE pen-test and staff training.
        </p>
      </div>

      {/* OPEX Monthly Run-Cost Breakdown */}
      {(() => {
        const dep    = stats.perAgent.reduce((s, p) => s + p.capexMonthly, 0);
        const power  = stats.perAgent.reduce((s, p) => s + p.powerCost,    0);
        const ops    = stats.perAgent.reduce((s, p) => s + p.opsCost,      0);
        const depHy  = stats.perAgent.reduce((s, p) => s + (p.agent.paramsB > 20 ? 0 : p.capexMonthly), 0);
        const powHy  = stats.perAgent.reduce((s, p) => s + (p.agent.paramsB > 20 ? 0 : p.powerCost),    0);
        const opsHy  = stats.perAgent.reduce((s, p) => s + (p.agent.paramsB > 20 ? 0 : p.opsCost),      0);
        const tokHy  = stats.perAgent.reduce((s, p) => s + (p.agent.paramsB > 20 ? p.cloudCost : 0),    0);
        const tokCl  = stats.perAgent.reduce((s, p) => s + p.cloudCost, 0);
        const vMo    = stats.voice.voiceMonthly;
        const vClRef = stats.voice.voiceCloudReference;

        const rows: { label: string; sub: string; on: number; hy: number; cl: number }[] = [
          { label: "GPU depreciation",       sub: `GPU CAPEX ÷ ${DEPRECIATION_MONTHS} mo`,            on: dep,   hy: depHy, cl: 0 },
          { label: "Power & cooling",        sub: `Addis $${KWH_PRICE_USD}/kWh · PUE ${PUE}`,         on: power, hy: powHy, cl: 0 },
          { label: "SRE / Ops staff",        sub: "1 SRE per 8 GPUs @ $1,800/mo loaded",              on: ops,   hy: opsHy, cl: 0 },
          { label: "Cloud token bills",      sub: "Frontier (>20B) in hybrid · all tokens in cloud",  on: 0,     hy: tokHy, cl: tokCl },
          { label: "Voice STT / TTS",        sub: `${voiceSharePct}% voice share · ${stats.voice.cfg.label}`, on: vMo, hy: vMo, cl: vClRef },
          { label: "360° run costs",         sub: "SOC, SIEM seats, vendor support, leased lines, DR, insurance", on: f360.monthly.onprem, hy: f360.monthly.hybrid, cl: f360.monthly.cloud },
        ];
        const tot = {
          on: rows.reduce((s, r) => s + r.on, 0),
          hy: rows.reduce((s, r) => s + r.hy, 0),
          cl: rows.reduce((s, r) => s + r.cl, 0),
        };
        const pct = (v: number, t: number) => t > 0 ? `${Math.round((v / t) * 100)}%` : "0%";

        return (
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-tesfa-gold" />
                <p className="text-sm font-semibold text-foreground">Monthly OPEX — Run-Cost Breakdown</p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Every recurring dollar, split by line item · reconciles to headline OPEX
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/40">
                    <th className="text-left py-2 pr-3">Line item</th>
                    <th className="text-right py-2 px-2 text-emerald-400">On-Prem</th>
                    <th className="text-right py-2 px-2 text-emerald-400/70 font-normal">%</th>
                    <th className="text-right py-2 px-2 text-amber-400">Hybrid</th>
                    <th className="text-right py-2 px-2 text-amber-400/70 font-normal">%</th>
                    <th className="text-right py-2 px-2 text-sky-400">Cloud</th>
                    <th className="text-right py-2 px-2 text-sky-400/70 font-normal">%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className="border-b border-border/20">
                      <td className="py-2 pr-3">
                        <p className="text-foreground font-semibold">{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">{r.sub}</p>
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">${Math.round(r.on).toLocaleString()}</td>
                      <td className="text-right py-2 px-2 font-mono text-[10px] text-muted-foreground">{pct(r.on, tot.on)}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">${Math.round(r.hy).toLocaleString()}</td>
                      <td className="text-right py-2 px-2 font-mono text-[10px] text-muted-foreground">{pct(r.hy, tot.hy)}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">${Math.round(r.cl).toLocaleString()}</td>
                      <td className="text-right py-2 px-2 font-mono text-[10px] text-muted-foreground">{pct(r.cl, tot.cl)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border/60">
                    <td className="py-2 pr-3 text-[11px] font-bold text-foreground">Total monthly OPEX (all-in)</td>
                    <td className="text-right py-2 px-2 font-mono font-bold text-emerald-400">${Math.round(tot.on).toLocaleString()}</td>
                    <td></td>
                    <td className="text-right py-2 px-2 font-mono font-bold text-amber-400">${Math.round(tot.hy).toLocaleString()}</td>
                    <td></td>
                    <td className="text-right py-2 px-2 font-mono font-bold text-sky-400">${Math.round(tot.cl).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-[10px] text-muted-foreground">in ETB / mo</td>
                    <td className="text-right py-1 px-2 font-mono text-[10px] text-tesfa-gold">ETB {Math.round(tot.on * ETB_PER_USD).toLocaleString()}</td>
                    <td></td>
                    <td className="text-right py-1 px-2 font-mono text-[10px] text-tesfa-gold">ETB {Math.round(tot.hy * ETB_PER_USD).toLocaleString()}</td>
                    <td></td>
                    <td className="text-right py-1 px-2 font-mono text-[10px] text-tesfa-gold">ETB {Math.round(tot.cl * ETB_PER_USD).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              <span className="text-foreground font-semibold">How to read:</span> the first three rows (GPU depreciation, power, SRE) are
              the <span className="text-foreground">infrastructure</span> portion — non-existent in pure cloud because you rent compute by the token.
              <span className="text-foreground"> Cloud token bills</span> dominate cloud mode and appear in hybrid only for frontier (&gt;20B) reasoning.
              <span className="text-foreground"> Voice</span> is a separate stack (STT+TTS) that bypasses the LLM bill.
              <span className="text-foreground"> 360° run costs</span> are the regulated-bank overhead (SOC, SIEM, DR drills, insurance, vendor support) layered on top.
              Toggle agents, voice mode, or 360° layers above and every row recomputes.
            </p>
          </div>
        );
      })()}



      {/* Voice Stack add-on */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-tesfa-gold" />
            <p className="text-sm font-semibold text-foreground">Voice Stack add-on (STT + TTS)</p>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {stats.voice.voiceTurns.toFixed(0).toLocaleString()} voice turns/mo · {voiceSharePct}% share
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          ElevenLabs is cloud-only and per-character billed — hidden line item not covered by the LLM model above.
          Whisper (STT) and Piper-Amharic (TTS) run on-prem with negligible per-turn cost; the trade-off is a one-time CAPEX (mostly Piper Amharic voice training).
        </p>

        {/* Voice share slider */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Voice share of conversations</span>
            <span className="text-[10px] text-foreground font-mono">{voiceSharePct}%</span>
          </div>
          <Slider min={0} max={100} step={5} value={[voiceSharePct]} onValueChange={(v) => setVoiceSharePct(v[0])} />
        </div>

        {/* Voice mode picker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {VOICE_MODES.map(m => {
            const isSel = voiceMode === m.id;
            // Compute that mode's monthly cost for display
            const elTts = (stats.voice.voiceTurns * VOICE_TTS_CHARS_PER_TURN / 1000) * EL_TTS_USD_PER_1K_CHARS;
            const elStt = (stats.voice.voiceTurns * VOICE_STT_SECONDS_PER_TURN / 3600) * EL_STT_USD_PER_HOUR;
            const monthly =
              m.id === "elevenlabs" ? elTts + elStt
            : m.id === "hybrid"     ? elTts + m.monthlyFixed
            :                         m.monthlyFixed;
            return (
              <button
                key={m.id}
                onClick={() => setVoiceMode(m.id)}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  isSel ? "border-tesfa-gold/60 bg-tesfa-gold/10" : "border-border/40 bg-background/30 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{m.label}</span>
                  {isSel && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 leading-snug">{m.desc}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">Monthly</span>
                  <span className="text-sm font-bold text-foreground">${Math.round(monthly).toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">One-time CAPEX</span>
                  <span className="text-[11px] text-tesfa-gold font-mono">${m.capex.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg bg-background/40 border border-border/40 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Voice OPEX / mo</p>
            <p className="text-sm font-bold text-foreground font-mono">${Math.round(stats.voice.voiceMonthly).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">vs ElevenLabs-only</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">
              {stats.voice.savingsVsElevenLabs > 0 ? `−$${Math.round(stats.voice.savingsVsElevenLabs).toLocaleString()}/mo` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Voice CAPEX payback</p>
            <p className="text-sm font-bold text-amber-400 font-mono">
              {stats.voice.savingsVsElevenLabs > 0 && stats.voice.voiceCapex > 0
                ? `${Math.ceil(stats.voice.voiceCapex / stats.voice.savingsVsElevenLabs)} mo`
                : "—"}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Engine map — STT: <span className="font-mono">faster-whisper large-v3</span> (Amharic-capable, runs on shared L4) ·
          TTS on-prem: <span className="font-mono">Piper</span> with custom Amharic voice trained from ~10hr corpus (CPU inference, zero GPU).
          ElevenLabs pricing: ${EL_TTS_USD_PER_1K_CHARS}/1K chars TTS, ${EL_STT_USD_PER_HOUR}/hr STT. Assumes {VOICE_TTS_CHARS_PER_TURN} chars + {VOICE_STT_SECONDS_PER_TURN}s per voice turn.
        </p>
      </div>

      {/* Agent overlay modules */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Inference modules in the Mesh</p>
            <p className="text-[10px] text-muted-foreground">Toggle agents on/off. Each one adds its own GPU footprint and token bill.</p>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {enabled.length} of {agents.length} active · {stats.totals.gpus} GPU(s) · {stats.totals.tokensM.toFixed(1)}M tok/mo
          </span>
        </div>

        <div className="space-y-2">
          {agents.map(a => {
            const row = stats.perAgent.find(p => p.agent.id === a.id);
            const gpu = GPUS[a.recommendedGpu];
            return (
              <div key={a.id}
                   className={`rounded-lg border p-3 transition-colors ${
                     a.enabled ? "border-tesfa-gold/30 bg-tesfa-gold/5" : "border-border/40 bg-background/30"
                   }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleAgent(a.id)}
                      disabled={a.required}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        a.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"
                      } ${a.required ? "opacity-60 cursor-not-allowed" : "hover:opacity-80"}`}
                    >
                      {a.enabled ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{a.name}</span>
                        {a.required && <span className="text-[9px] px-1 py-0.5 rounded bg-tesfa-gold/20 text-tesfa-gold font-bold">STARTER</span>}
                        <span className="text-[10px] text-muted-foreground">· {a.role}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {a.model} · {a.paramsB}B params · {a.avgTokensPerTurn} tok/turn · {gpu.name}
                      </p>
                    </div>
                  </div>
                  {a.enabled && row && (
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-[10px] text-muted-foreground">
                        {row.gpusNeeded}× GPU · {row.tokensM.toFixed(1)}M tok
                      </p>
                      <p className="text-xs text-foreground font-mono">
                        ${Math.round(row.onpremCost).toLocaleString()}/mo on-prem
                      </p>
                      <p className="text-[10px] text-sky-400 font-mono">
                        ${Math.round(row.cloudCost).toLocaleString()}/mo cloud
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-agent breakdown table */}
      {enabled.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-tesfa-gold" /> Per-module OPEX breakdown
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40">
                  <th className="text-left py-2 pr-3">Module</th>
                  <th className="text-right py-2 px-2">GPUs</th>
                  <th className="text-right py-2 px-2">CAPEX/mo</th>
                  <th className="text-right py-2 px-2">Power</th>
                  <th className="text-right py-2 px-2">Ops</th>
                  <th className="text-right py-2 px-2 text-emerald-400">On-Prem</th>
                  <th className="text-right py-2 px-2 text-amber-400">Hybrid</th>
                  <th className="text-right py-2 pl-2 text-sky-400">Cloud</th>
                </tr>
              </thead>
              <tbody>
                {stats.perAgent.map(r => (
                  <tr key={r.agent.id} className="border-b border-border/20">
                    <td className="py-2 pr-3 text-foreground font-semibold">{r.agent.name}</td>
                    <td className="text-right px-2 font-mono">{r.gpusNeeded}</td>
                    <td className="text-right px-2 font-mono">${Math.round(r.capexMonthly).toLocaleString()}</td>
                    <td className="text-right px-2 font-mono">${Math.round(r.powerCost).toLocaleString()}</td>
                    <td className="text-right px-2 font-mono">${Math.round(r.opsCost).toLocaleString()}</td>
                    <td className="text-right px-2 font-mono text-emerald-400">${Math.round(r.onpremCost).toLocaleString()}</td>
                    <td className="text-right px-2 font-mono text-amber-400">${Math.round(r.hybridCost).toLocaleString()}</td>
                    <td className="text-right pl-2 font-mono text-sky-400">${Math.round(r.cloudCost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360° operating framework — every layer beyond raw compute */}
      <Framework360
        customers={customers}
        gpuCount={stats.totals.gpus}
        baseMonthly={stats.totals}
        baseCapex={stats.capex}
        onChange={handleF360}
      />

      {/* OSS vs Commercial performance & fit scorecard */}
      <PerformanceScorecard />

      {/* Ethiopia price-sensitivity advisor */}
      <PricingAdvisor customers={customers} totalOnprem={eff.monthly.onprem} totalCloud={eff.monthly.cloud} agentCount={enabled.length} capexOnprem={eff.capex.onprem} />
    </>)}
    </div>
  );
}

function CapexRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[10px] text-muted-foreground truncate pr-2">{label}</span>
      <span className="text-[11px] text-foreground font-mono shrink-0">${Math.round(value).toLocaleString()}</span>
    </div>
  );
}

function ScaleCard({
  icon: Icon, label, value, sub, min, max, step, val, onChange,
}: { icon: any; label: string; value: string; sub: string; min: number; max: number; step: number; val: number; onChange: (v: number) => void }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-tesfa-gold" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold text-foreground">{value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[val]} onValueChange={(v) => onChange(v[0])} />
      <p className="text-[10px] text-muted-foreground mt-1.5">{sub}</p>
    </div>
  );
}

function PricingAdvisor({ customers, totalOnprem, totalCloud, agentCount, capexOnprem }: { customers: number; totalOnprem: number; totalCloud: number; agentCount: number; capexOnprem: number }) {
  const arpu = customers > 0 ? totalOnprem / customers : 0;
  const sensitive = arpu > 0.50;
  const recommendation =
    customers < 25_000   ? "Start cloud-only. Volume too low to justify GPU CAPEX. Re-evaluate at 25K customers."
  : customers < 100_000  ? "Hybrid sweet spot — workhorse on-prem (1× L40S), frontier reasoning still cloud."
  : customers < 500_000  ? "Full on-prem becomes cheaper. Add 2nd L40S for redundancy. Frontier 70B optional."
                         : "Tier-1 scale. Dedicated 2× H100 cluster pays back in <12 months vs cloud.";

  const monthlySaving = Math.max(1, totalCloud - totalOnprem);
  const paybackMo = totalCloud > totalOnprem ? Math.ceil(capexOnprem / monthlySaving) : null;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start gap-3">
        {sensitive
          ? <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          : <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold text-foreground">Ethiopia price-sensitivity check</p>
            <span className="text-[10px] font-mono text-muted-foreground">
              ${arpu.toFixed(3)} / customer / month
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{recommendation}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            <Metric label="Active agents" value={`${agentCount}`} />
            <Metric label="Cost / 1K customers" value={`$${(arpu * 1000).toFixed(0)}/mo`} />
            <Metric label="Payback vs cloud" value={paybackMo ? `${paybackMo} mo` : "—"} />
            <Metric label="3-yr TCO saved" value={`$${Math.max(0, Math.round((totalCloud - totalOnprem) * 36 - capexOnprem)).toLocaleString()}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/40 p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-bold text-foreground font-mono">{value}</p>
    </div>
  );
}

/**
 * MinViableCapex — answers the bank's literal question:
 * "If I run ONLY Selam-Bot (the mandatory retail concierge) on OSS for N customers,
 *  what is the floor CAPEX I must budget?"
 *
 * Computed independently of the agent toggles so the floor never disappears when
 * the user experiments. Three tiers: Bare-metal MVP, Lean production, Full 360°.
 */
function MinViableCapex({
  customers, turnsPerCustomerMonth, voiceCapex,
}: { customers: number; turnsPerCustomerMonth: number; voiceCapex: number }) {
  const monthlyTurns = customers * turnsPerCustomerMonth;
  const gpu = GPUS.L40S;
  const tokensPerSec = (monthlyTurns * 600) / (30 * 24 * 3600);
  const gpusNeeded = Math.max(1, Math.ceil(tokensPerSec / (gpu.tps * 0.6)));
  const gpuCapex   = gpusNeeded * gpu.capex;
  const infra      = gpuCapex * 0.40;
  const setup      = 80_000;
  const bareMetal  = gpuCapex + infra + setup + voiceCapex;

  const leanFloor  = 65_000 + 45_000 + 22_000 + 12_000; // DR + SecOps + Backup + Observability
  const leanProd   = bareMetal + leanFloor;

  const full360add = 8_000 + 65_000 + 45_000 + 12_000 + 22_000 + 28_000 + 35_000;
  const full360    = bareMetal + full360add;

  const tiers = [
    {
      key: "mvp", label: "Bare-metal MVP",
      tone: "border-sky-400/30 bg-sky-500/5",
      pill: "Lab / pilot only", pillTone: "bg-sky-500/20 text-sky-300",
      total: bareMetal,
      desc: "Just enough hardware to serve Selam. Not NBE-certifiable on its own.",
      rows: [
        [`${gpusNeeded}× ${gpu.name}`, gpuCapex],
        ["Infra uplift (servers, NVLink, 100G, NVMe, racks, UPS — 40% of GPU)", infra],
        ["Setup, integration, NBE pen-test, training", setup],
        ["Voice stack one-time", voiceCapex],
      ] as [string, number][],
    },
    {
      key: "lean", label: "Lean production (NBE-ready)",
      tone: "border-emerald-400/30 bg-emerald-500/5",
      pill: "Recommended floor", pillTone: "bg-emerald-500/20 text-emerald-300",
      total: leanProd,
      desc: "Adds the four layers NBE will insist on: warm DR, SOC + SIEM + HSM, 7-yr backups, observability.",
      rows: [
        ["Bare-metal MVP (above)", bareMetal],
        ["Warm DR site", 65_000],
        ["SecOps bootstrap (SOC + SIEM + HSM + pen-test)", 45_000],
        ["Backup & 7-yr retention", 22_000],
        ["Observability + SRE on-call", 12_000],
      ] as [string, number][],
    },
    {
      key: "full", label: "Full 360° (everything)",
      tone: "border-tesfa-gold/30 bg-tesfa-gold/5",
      pill: "Headline simulator number", pillTone: "bg-tesfa-gold/20 text-tesfa-gold",
      total: full360,
      desc: "Adds connectivity buildout, model lifecycle (fine-tune + labelling), and change-management training.",
      rows: [
        ["Lean production (above)", leanProd],
        ["Connectivity & egress buildout", 8_000],
        ["Model lifecycle (fine-tune + labelling)", 28_000],
        ["Change mgmt & staff training", 35_000],
      ] as [string, number][],
    },
  ];

  return (
    <div className="glass rounded-xl p-4 border border-tesfa-gold/30">
      <div className="flex items-start gap-3 mb-3 flex-wrap">
        <Server className="h-5 w-5 text-tesfa-gold mt-0.5 shrink-0" />
        <div className="flex-1 min-w-[240px]">
          <p className="text-sm font-semibold text-foreground">
            Minimum-viable CAPEX — <span className="text-tesfa-gold">Selam-only OSS</span> @ {customers.toLocaleString()} customers
          </p>
          <p className="text-[11px] text-muted-foreground">
            Direct answer to "cheapest OSS on-prem CAPEX if I run only Selam". Independent of the agent toggles below.
            Sizing: {monthlyTurns.toLocaleString()} turns/mo ≈ {tokensPerSec.toFixed(0)} tok/s sustained → <span className="text-foreground font-mono">{gpusNeeded}× {gpu.name}</span> at 60% utilisation ceiling.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiers.map((t) => (
          <div key={t.key} className={`rounded-lg border ${t.tone} p-3`}>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-foreground">{t.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${t.pillTone}`}>{t.pill}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug mb-2">{t.desc}</p>
            <div className="space-y-0.5 mb-2">
              {t.rows.map(([label, v]) => (
                <div key={label} className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground truncate">{label}</span>
                  <span className="text-[10px] text-foreground font-mono shrink-0">${Math.round(v).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/40 pt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-foreground">Total CAPEX</span>
              <div className="text-right">
                <p className="text-base font-bold text-foreground">${Math.round(t.total).toLocaleString()}</p>
                <p className="text-[10px] text-tesfa-gold font-mono">ETB {Math.round(t.total * ETB_PER_USD).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        <span className="text-foreground font-semibold">How to read this:</span> the absolute floor for a single-agent (Selam) OSS deployment at {customers.toLocaleString()} customers is
        <span className="text-sky-400 font-mono"> ${Math.round(bareMetal).toLocaleString()}</span> in hardware + integration, but no NBE-regulated bank can go live on that.
        The realistic minimum is <span className="text-emerald-400 font-semibold">Lean production</span> at
        <span className="text-emerald-400 font-mono"> ${Math.round(leanProd).toLocaleString()}</span>.
        The headline cards reflect the <span className="text-tesfa-gold font-semibold">Full 360°</span> number; tune it down by switching off optional 360° layers below.
      </p>
    </div>
  );
}
