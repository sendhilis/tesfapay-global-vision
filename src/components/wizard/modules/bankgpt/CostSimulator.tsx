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
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Cpu, Cloud, Server, TrendingUp, Zap, DollarSign, Users,
  MessageSquare, Plus, Minus, AlertTriangle, CheckCircle2, Layers,
} from "lucide-react";

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

    const totals = {
      onprem: perAgent.reduce((s, p) => s + p.onpremCost, 0),
      hybrid: perAgent.reduce((s, p) => s + p.hybridCost, 0),
      cloud:  perAgent.reduce((s, p) => s + p.cloudCost,  0),
      tokensM: perAgent.reduce((s, p) => s + p.tokensM,   0),
      gpus:   perAgent.reduce((s, p) => s + p.gpusNeeded, 0),
      turns:  monthlyTurns,
    };

    const cheapest = (["onprem","hybrid","cloud"] as const).reduce((a, b) => totals[a] < totals[b] ? a : b);
    const costPerTurn = {
      onprem: totals.onprem / Math.max(1, monthlyTurns),
      hybrid: totals.hybrid / Math.max(1, monthlyTurns),
      cloud:  totals.cloud  / Math.max(1, monthlyTurns),
    };

    return { perAgent, totals, capex, cheapest, costPerTurn };
  }, [customers, turnsPerCustomerMonth, enabled]);

  return (
    <div className="space-y-4">
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
          const total = stats.totals[m.id];
          const perTurn = stats.costPerTurn[m.id];
          const isCheapest = stats.cheapest === m.id;
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
                  <span className="text-[10px] text-muted-foreground">Monthly OPEX</span>
                  <span className="text-lg font-bold text-foreground">${Math.round(total).toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">ETB equivalent</span>
                  <span className="text-xs text-tesfa-gold font-semibold">ETB {Math.round(total * ETB_PER_USD).toLocaleString()}</span>
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
            ${Math.round(stats.totals.cloud - stats.totals.onprem).toLocaleString()}/mo
          </span>
          <span> vs Cloud · </span>
          <span className="text-foreground font-semibold">Hybrid saves </span>
          <span className="text-amber-400 font-bold">
            ${Math.round(stats.totals.cloud - stats.totals.hybrid).toLocaleString()}/mo
          </span>
          <span> · Annual on-prem savings: </span>
          <span className="text-tesfa-gold font-bold">
            ETB {Math.round((stats.totals.cloud - stats.totals.onprem) * 12 * ETB_PER_USD).toLocaleString()}
          </span>
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

      {/* Ethiopia price-sensitivity advisor */}
      <PricingAdvisor customers={customers} totalOnprem={stats.totals.onprem} totalCloud={stats.totals.cloud} agentCount={enabled.length} />
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

function PricingAdvisor({ customers, totalOnprem, totalCloud, agentCount }: { customers: number; totalOnprem: number; totalCloud: number; agentCount: number }) {
  const arpu = customers > 0 ? totalOnprem / customers : 0; // cost per customer per month
  const sensitive = arpu > 0.50; // > $0.50 / customer / month is high for ET
  const recommendation =
    customers < 25_000   ? "Start cloud-only. Volume too low to justify GPU CAPEX. Re-evaluate at 25K customers."
  : customers < 100_000  ? "Hybrid sweet spot — workhorse on-prem (1× L40S), frontier reasoning still cloud."
  : customers < 500_000  ? "Full on-prem becomes cheaper. Add 2nd L40S for redundancy. Frontier 70B optional."
                         : "Tier-1 scale. Dedicated 2× H100 cluster pays back in <12 months vs cloud.";

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
            <Metric label="Payback vs cloud" value={totalCloud > totalOnprem ? `${Math.max(1, Math.round((stats_capex_estimate(agentCount)) / Math.max(1, totalCloud - totalOnprem)))} mo` : "—"} />
            <Metric label="3-yr TCO saved" value={`$${Math.max(0, Math.round((totalCloud - totalOnprem) * 36)).toLocaleString()}`} />
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

// Rough CAPEX estimate for payback calc (avg $20K per active agent's GPU)
function stats_capex_estimate(agents: number) {
  return agents * 20_000;
}
