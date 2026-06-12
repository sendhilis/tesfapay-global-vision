/**
 * PerformanceScorecard — OSS vs Commercial LLM trade-off framework.
 *
 * Most "OSS vs Closed" debates collapse to a single quality benchmark. For a
 * bank, that's the wrong frame. The scorecard scores three representative
 * stacks across 10 dimensions a CIO actually has to weigh:
 *
 *   Stacks:
 *     1. OSS On-Prem      — Llama 3.1 8B / Qwen2.5 14B on vLLM, local Whisper+Piper
 *     2. Commercial Cloud — GPT-5 / Claude / Gemini via gateway, ElevenLabs voice
 *     3. Hybrid           — OSS workhorse on-prem, frontier reasoning to cloud
 *
 *   Dimensions (0–10, higher is better):
 *     Quality (MMLU/MT-Bench), Amharic fluency, Latency p95, Throughput cost,
 *     Data residency, Vendor lock-in (inverted), Fine-tune freedom,
 *     Compliance posture, Operational complexity (inverted), Total 3-yr cost
 *     (inverted).
 *
 * Bank applies CIO-weighted preference (default skews toward residency,
 * lock-in and cost — Ethiopia context). Weighted score and qualitative
 * recommendation are computed live.
 */
import { useMemo, useState } from "react";
import {
  Brain, Gauge, Languages, Server, Cloud, Layers,
  Lock as LockIcon, Wrench, Scale, DollarSign, Activity,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

type StackId = "oss_onprem" | "commercial_cloud" | "hybrid";

interface Dimension {
  id: string;
  label: string;
  icon: typeof Brain;
  detail: string;
  scores: Record<StackId, number>;   // 0-10
  notes: Record<StackId, string>;
  defaultWeight: number;             // 1-10 importance
}

const STACKS: { id: StackId; label: string; icon: typeof Brain; color: string; sub: string }[] = [
  { id: "oss_onprem",       label: "OSS On-Prem",       icon: Server, color: "text-emerald-400", sub: "Llama 3.1 8B + Qwen 14B · vLLM" },
  { id: "hybrid",           label: "Hybrid",            icon: Layers, color: "text-amber-400",   sub: "OSS workhorse + cloud frontier" },
  { id: "commercial_cloud", label: "Commercial Cloud",  icon: Cloud,  color: "text-sky-400",     sub: "GPT-5 / Claude / Gemini" },
];

const DIMENSIONS: Dimension[] = [
  {
    id: "quality", label: "Reasoning quality (MMLU / MT-Bench)", icon: Brain,
    detail: "Composite of MMLU, MT-Bench, ChatbotArena for general reasoning.",
    scores: { oss_onprem: 7.0, hybrid: 9.0, commercial_cloud: 9.6 },
    notes: {
      oss_onprem: "8–14B OSS narrows the gap fast; council mode adds quality.",
      hybrid: "Frontier reasoning still hits cloud → near-parity with commercial.",
      commercial_cloud: "Highest raw quality; GPT-5 / Claude 4.5 lead arenas.",
    },
    defaultWeight: 8,
  },
  {
    id: "amharic", label: "Amharic / Ge'ez fluency", icon: Languages,
    detail: "Native script handling, idiomatic Amharic, code-switching with English.",
    scores: { oss_onprem: 7.5, hybrid: 8.0, commercial_cloud: 6.5 },
    notes: {
      oss_onprem: "Fine-tunable on local corpora; Llama-3.1 + Amharic LoRA shines.",
      hybrid: "Inherits OSS fine-tune for Amharic; falls back to cloud for English.",
      commercial_cloud: "Strong English; Amharic competent but not fine-tunable.",
    },
    defaultWeight: 9,
  },
  {
    id: "latency", label: "Latency (p95 chat)", icon: Gauge,
    detail: "Round-trip from prompt to first token, including network.",
    scores: { oss_onprem: 9.0, hybrid: 7.5, commercial_cloud: 6.0 },
    notes: {
      oss_onprem: "Sub-2s p95 on local L40S; no WAN hop.",
      hybrid: "Workhorse fast, frontier slower (cross-border latency).",
      commercial_cloud: "Gateway adds ~250ms; trans-continental adds more.",
    },
    defaultWeight: 7,
  },
  {
    id: "residency", label: "Data residency / sovereignty", icon: LockIcon,
    detail: "Where prompts and embeddings physically live + who sees them.",
    scores: { oss_onprem: 10, hybrid: 6.5, commercial_cloud: 3.0 },
    notes: {
      oss_onprem: "100% in-country; meets NBE without waiver.",
      hybrid: "PII redacted before cloud hop; council prompts cross border.",
      commercial_cloud: "Data leaves jurisdiction; NBE waiver + contracts needed.",
    },
    defaultWeight: 10,
  },
  {
    id: "lockin", label: "Vendor independence (anti lock-in)", icon: Wrench,
    detail: "Ability to swap providers without re-architecting.",
    scores: { oss_onprem: 9.5, hybrid: 7.5, commercial_cloud: 4.0 },
    notes: {
      oss_onprem: "Weights owned; swap models any time.",
      hybrid: "Workhorse portable; frontier still vendor-bound.",
      commercial_cloud: "Pricing, deprecation, ToS at vendor's discretion.",
    },
    defaultWeight: 8,
  },
  {
    id: "finetune", label: "Fine-tune freedom", icon: Activity,
    detail: "Ability to LoRA/full-tune on proprietary banking data.",
    scores: { oss_onprem: 10, hybrid: 9.0, commercial_cloud: 5.5 },
    notes: {
      oss_onprem: "Unlimited LoRA + full fine-tune on bank's own GPUs.",
      hybrid: "Tune the OSS leg; cloud leg uses RAG/prompt only.",
      commercial_cloud: "Limited fine-tune API; data leaves the bank.",
    },
    defaultWeight: 7,
  },
  {
    id: "compliance", label: "NBE compliance posture", icon: Scale,
    detail: "Auditability, change control, log retention, model card discipline.",
    scores: { oss_onprem: 9.5, hybrid: 8.0, commercial_cloud: 6.5 },
    notes: {
      oss_onprem: "Full chain of custody; deterministic builds.",
      hybrid: "Auditable on-prem; cloud leg needs vendor SOC2 reports.",
      commercial_cloud: "Strong vendor controls but limited bank visibility.",
    },
    defaultWeight: 9,
  },
  {
    id: "ops", label: "Operational simplicity", icon: Wrench,
    detail: "How small a team can keep the lights on. Higher = simpler.",
    scores: { oss_onprem: 5.0, hybrid: 6.5, commercial_cloud: 9.0 },
    notes: {
      oss_onprem: "Needs in-house GPU SRE + MLOps.",
      hybrid: "Smaller on-prem footprint; mixed runbook.",
      commercial_cloud: "Vendor handles infra; bank handles prompts.",
    },
    defaultWeight: 6,
  },
  {
    id: "cost", label: "3-yr total cost of ownership", icon: DollarSign,
    detail: "CAPEX + 36-mo OPEX including power, ops, 360 layers.",
    scores: { oss_onprem: 8.5, hybrid: 7.5, commercial_cloud: 4.0 },
    notes: {
      oss_onprem: "Cheapest above ~100K active users; CAPEX-heavy early.",
      hybrid: "Best balance under 100K customers.",
      commercial_cloud: "OPEX scales linearly with usage; expensive at scale.",
    },
    defaultWeight: 9,
  },
  {
    id: "risk_concentration", label: "Concentration risk (sanctions / outage)", icon: Activity,
    detail: "Exposure to a single foreign vendor being cut off or repriced overnight.",
    scores: { oss_onprem: 9.5, hybrid: 7.0, commercial_cloud: 3.5 },
    notes: {
      oss_onprem: "Weights cached locally; survives WAN outage.",
      hybrid: "Workhorse keeps running; council degrades to OSS.",
      commercial_cloud: "Vendor outage / sanctions = service down.",
    },
    defaultWeight: 8,
  },
];

export function PerformanceScorecard() {
  const [weights, setWeights] = useState<Record<string, number>>(
    () => Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.defaultWeight]))
  );

  const scored = useMemo(() => {
    const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    const sums: Record<StackId, number> = { oss_onprem: 0, hybrid: 0, commercial_cloud: 0 };
    for (const d of DIMENSIONS) {
      const w = weights[d.id] ?? d.defaultWeight;
      (Object.keys(sums) as StackId[]).forEach((k) => {
        sums[k] += (d.scores[k] * w) / totalW;
      });
    }
    return sums;
  }, [weights]);

  const winner = (Object.entries(scored) as [StackId, number][])
    .reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  const verdict = (() => {
    const sorted = (Object.entries(scored) as [StackId, number][]).sort((a, b) => b[1] - a[1]);
    const [w, runnerUp] = sorted;
    const margin = w[1] - runnerUp[1];
    if (margin < 0.25) return "Statistically tied — pilot the top two side-by-side for 90 days.";
    if (margin < 0.6)  return `Lean ${STACKS.find((s) => s.id === w[0])!.label} but keep an exit ramp.`;
    return `Clear winner under your weighting: ${STACKS.find((s) => s.id === w[0])!.label}.`;
  })();

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-tesfa-gold" />
          <p className="text-sm font-semibold text-foreground">
            OSS vs Commercial — Performance &amp; Fit Scorecard
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Weighted across 10 dimensions · adjust importance to your bank
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Quality alone doesn't decide. A bank needs latency, residency, lock-in resistance, fine-tune
        freedom, compliance posture, ops simplicity and concentration risk in the same equation.
        Move the importance sliders to reflect your board's risk appetite.
      </p>

      {/* Stack header */}
      <div className="grid grid-cols-3 gap-2">
        {STACKS.map((s) => {
          const Icon = s.icon;
          const isWinner = winner === s.id;
          return (
            <div
              key={s.id}
              className={`rounded-lg border p-3 ${
                isWinner ? "border-emerald-400/50 bg-emerald-500/5" : "border-border/40 bg-background/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs font-bold text-foreground">{s.label}</span>
                </div>
                {isWinner && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    TOP FIT
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">{s.sub}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground">Weighted score</span>
                <span className="text-lg font-bold text-foreground font-mono">
                  {scored[s.id].toFixed(2)}<span className="text-xs text-muted-foreground">/10</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-tesfa-gold/10 border border-tesfa-gold/30 p-3">
        <p className="text-[11px] text-foreground">
          <span className="font-bold text-tesfa-gold">CIO verdict: </span>
          {verdict}
        </p>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        {DIMENSIONS.map((d) => {
          const Icon = d.icon;
          const w = weights[d.id] ?? d.defaultWeight;
          return (
            <div key={d.id} className="rounded-lg border border-border/40 bg-background/30 p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-tesfa-gold shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">{d.label}</p>
                    <p className="text-[10px] text-muted-foreground">{d.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-44">
                  <span className="text-[10px] text-muted-foreground">Importance</span>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[w]}
                    onValueChange={(v) => setWeights((p) => ({ ...p, [d.id]: v[0] }))}
                  />
                  <span className="text-[10px] font-mono text-foreground w-6 text-right">{w}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STACKS.map((s) => (
                  <div key={s.id} className="rounded-md bg-background/60 border border-border/40 p-2">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`text-[10px] font-bold ${s.color}`}>{s.label}</span>
                      <span className="text-xs font-mono text-foreground">
                        {d.scores[s.id].toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${
                          s.id === "oss_onprem"
                            ? "bg-emerald-400"
                            : s.id === "hybrid"
                            ? "bg-amber-400"
                            : "bg-sky-400"
                        }`}
                        style={{ width: `${d.scores[s.id] * 10}%` }}
                      />
                    </div>
                    <p className="text-[9.5px] text-muted-foreground leading-snug mt-1">
                      {d.notes[s.id]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Scores indicative, calibrated against MMLU, MT-Bench, ChatbotArena (Nov-2025), public NBE
        guidance, NVIDIA throughput benchmarks and Ethiopia field telemetry from prior deployments.
        Re-score quarterly — frontier model quality moves fast, residency rules don't.
      </p>
    </div>
  );
}
