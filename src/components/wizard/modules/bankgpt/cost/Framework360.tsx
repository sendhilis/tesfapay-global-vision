/**
 * Framework360 — 360° operating-cost overlay for BankGPT.
 *
 * The base CostSimulator handles GPU compute, power, ops, infra uplift, setup
 * and voice. That is necessary but not sufficient for a banking deployment.
 * This overlay layers in every other operating cost a CIO/CFO needs to
 * provision before signing off:
 *
 *   1. Connectivity & egress  (Ethio Telecom leased lines, cloud egress GB)
 *   2. Disaster Recovery      (warm DR site, cross-DC replication, RPO/RTO drills)
 *   3. Security Operations    (24×7 SOC, SIEM, HSM/KMS, annual pen-test)
 *   4. Observability & SRE    (Datadog/Grafana, log retention, on-call rotation)
 *   5. Backup & retention     (NBE 7-yr retention, immutable cold storage)
 *   6. Vendor support         (NVIDIA enterprise, OEM hardware, OS support)
 *   7. Model lifecycle        (fine-tuning compute, eval harness, labelling)
 *   8. Change & training      (staff upskilling, prompt-engineering centre)
 *   9. Cyber insurance        (per ETB premium, breach response retainer)
 *  10. Risk reserve           (10% contingency for FX, sanctions, hardware delay)
 *
 * Each layer carries a per-mode monthly OPEX and one-time CAPEX. The parent
 * passes (customers, agents, baseTotals); we return delta totals that fold
 * into headline OPEX/CAPEX in CostSimulator.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Network, ShieldCheck, Activity, HardDrive, LifeBuoy,
  GraduationCap, Umbrella, AlertOctagon, Wrench, FlaskConical, Globe2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Mode = "onprem" | "hybrid" | "cloud";

export type Framework360Layer = {
  id: string;
  label: string;
  icon: LucideIcon;
  why: string;
  // Per-mode monthly OPEX (USD)
  monthly: Record<Mode, number>;
  // Per-mode one-time CAPEX (USD)
  capex: Record<Mode, number>;
  enabled: boolean;
  optional?: boolean;
};

const ETB_PER_USD = 135;

export function buildLayers(customers: number, gpuCount: number): Framework360Layer[] {
  // Cost scales loosely with customer base and on-prem footprint.
  const scaleK = Math.max(1, customers / 50_000);    // 50K = baseline
  const gpuScale = Math.max(1, gpuCount);

  return [
    {
      id: "connectivity",
      label: "Connectivity & egress",
      icon: Network,
      why: "Ethio Telecom redundant leased lines (primary + backup) and cloud egress GBs. On-prem mostly avoids egress.",
      monthly: {
        onprem: Math.round(1200 + 200 * scaleK),         // 2× leased lines
        hybrid: Math.round(1500 + 350 * scaleK),         // lines + cloud egress
        cloud:  Math.round(800  + 600 * scaleK),         // higher egress, lighter lines
      },
      capex: { onprem: 8_000, hybrid: 6_000, cloud: 2_000 },
      enabled: true,
    },
    {
      id: "dr",
      label: "Disaster Recovery",
      icon: LifeBuoy,
      why: "Warm DR site (Hawassa/Bahir Dar), cross-DC replication, quarterly RPO/RTO drills. NBE requires <4hr RTO.",
      monthly: {
        onprem: Math.round(2200 + 320 * gpuScale),       // mirrored GPUs at 50% capacity
        hybrid: Math.round(1400 + 160 * gpuScale),
        cloud:  900,                                      // multi-region built in
      },
      capex: { onprem: 65_000, hybrid: 35_000, cloud: 5_000 },
      enabled: true,
    },
    {
      id: "secops",
      label: "Security operations (SOC + SIEM + HSM)",
      icon: ShieldCheck,
      why: "24×7 SOC analysts, SIEM (Wazuh/Splunk), HSM rental, annual NBE pen-test, model red-team retainer.",
      monthly: {
        onprem: 6500,
        hybrid: 5200,
        cloud:  3800,                                     // shared SOC, no HSM
      },
      capex: { onprem: 45_000, hybrid: 30_000, cloud: 10_000 },
      enabled: true,
    },
    {
      id: "observability",
      label: "Observability & SRE on-call",
      icon: Activity,
      why: "Metrics + log retention (Prometheus + Loki / Datadog), tracing, on-call rotation, error budgets.",
      monthly: {
        onprem: Math.round(1800 + 90 * gpuScale),
        hybrid: Math.round(1600 + 60 * gpuScale),
        cloud:  Math.round(2200 + 40 * gpuScale),         // SaaS observability priced per host
      },
      capex: { onprem: 12_000, hybrid: 9_000, cloud: 4_000 },
      enabled: true,
    },
    {
      id: "backup",
      label: "Backup & 7-year retention",
      icon: HardDrive,
      why: "NBE mandates 7-yr immutable retention of customer interactions. S3-IA-equivalent + tape archive.",
      monthly: {
        onprem: Math.round(900 + 0.0008 * customers),    // tape + NAS
        hybrid: Math.round(700 + 0.0010 * customers),
        cloud:  Math.round(400 + 0.0020 * customers),    // cheap object storage but per GB
      },
      capex: { onprem: 22_000, hybrid: 14_000, cloud: 3_000 },
      enabled: true,
    },
    {
      id: "vendor_support",
      label: "Vendor & OEM support",
      icon: Wrench,
      why: "NVIDIA AI Enterprise (per GPU), Dell/HPE 24×7 4-hr hardware response, RHEL/Ubuntu Pro, vLLM/Triton SLA.",
      monthly: {
        onprem: Math.round(450 * gpuScale + 600),
        hybrid: Math.round(280 * gpuScale + 500),
        cloud:  Math.round(900),                          // hyperscaler enterprise support
      },
      capex: { onprem: 0, hybrid: 0, cloud: 0 },
      enabled: true,
    },
    {
      id: "lifecycle",
      label: "Model lifecycle (fine-tune + eval + labelling)",
      icon: FlaskConical,
      why: "Quarterly fine-tunes on Amharic banking corpus, eval harness compute, in-house labelling team (4 FTE).",
      monthly: {
        onprem: 4800,                                     // labelling team dominates
        hybrid: 4500,
        cloud:  5200,                                     // managed fine-tune surcharge
      },
      capex: { onprem: 28_000, hybrid: 22_000, cloud: 12_000 },
      enabled: true,
    },
    {
      id: "training",
      label: "Change mgmt & staff training",
      icon: GraduationCap,
      why: "Branch staff prompt-literacy, ops runbook training, executive risk briefings, model card education.",
      monthly: { onprem: 1800, hybrid: 1500, cloud: 1200 },
      capex: { onprem: 35_000, hybrid: 25_000, cloud: 15_000 },
      enabled: true,
    },
    {
      id: "insurance",
      label: "Cyber & E&O insurance",
      icon: Umbrella,
      why: "Cyber-liability premium scaled to AUM exposure + AI errors-and-omissions rider + breach response retainer.",
      monthly: {
        onprem: Math.round(1400 + 6 * scaleK),
        hybrid: Math.round(1500 + 7 * scaleK),
        cloud:  Math.round(1900 + 9 * scaleK),            // higher premium for cloud data residency
      },
      capex: { onprem: 0, hybrid: 0, cloud: 0 },
      enabled: true,
    },
    {
      id: "egress_residency",
      label: "Data residency / sovereignty premium",
      icon: Globe2,
      why: "Cloud-only attracts a sovereign-data risk premium (legal review, NBE waiver fees, contractual indemnities).",
      monthly: { onprem: 0, hybrid: 350, cloud: 1800 },
      capex: { onprem: 0, hybrid: 8_000, cloud: 25_000 },
      enabled: true,
      optional: true,
    },
    {
      id: "risk_reserve",
      label: "Risk reserve (10% contingency)",
      icon: AlertOctagon,
      why: "Forex slippage (USD/ETB), sanctions-driven hardware delay, model deprecation churn. Held back, not spent.",
      // Computed dynamically below from sub-total; placeholder zeros here.
      monthly: { onprem: 0, hybrid: 0, cloud: 0 },
      capex: { onprem: 0, hybrid: 0, cloud: 0 },
      enabled: true,
    },
  ];
}

interface Props {
  customers: number;
  gpuCount: number;
  baseMonthly: Record<Mode, number>;
  baseCapex: Record<Mode, number>;
  onChange: (delta: { monthly: Record<Mode, number>; capex: Record<Mode, number> }) => void;
}

export function Framework360({ customers, gpuCount, baseMonthly, baseCapex, onChange }: Props) {
  const [layers, setLayers] = useState<Framework360Layer[]>(() => buildLayers(customers, gpuCount));

  // Rebuild defaults when scale changes, preserving enable state.
  useEffect(() => {
    setLayers((prev) => {
      const fresh = buildLayers(customers, gpuCount);
      return fresh.map((l) => ({ ...l, enabled: prev.find((p) => p.id === l.id)?.enabled ?? l.enabled }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, gpuCount]);

  const totals = useMemo(() => {
    const m: Record<Mode, number> = { onprem: 0, hybrid: 0, cloud: 0 };
    const c: Record<Mode, number> = { onprem: 0, hybrid: 0, cloud: 0 };
    for (const l of layers) {
      if (!l.enabled || l.id === "risk_reserve") continue;
      (["onprem","hybrid","cloud"] as Mode[]).forEach((k) => {
        m[k] += l.monthly[k];
        c[k] += l.capex[k];
      });
    }
    // Risk reserve = 10% of (base + 360 monthly) when its toggle is on
    const reserve = layers.find((l) => l.id === "risk_reserve");
    if (reserve?.enabled) {
      (["onprem","hybrid","cloud"] as Mode[]).forEach((k) => {
        m[k] += Math.round(0.10 * (baseMonthly[k] + m[k]));
      });
    }
    return { monthly: m, capex: c };
  }, [layers, baseMonthly]);

  // Push delta upward whenever it changes.
  useEffect(() => { onChange(totals); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [totals]);

  const toggle = (id: string) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-tesfa-gold" />
          <p className="text-sm font-semibold text-foreground">360° Operating Framework — beyond raw compute</p>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {layers.filter((l) => l.enabled).length}/{layers.length} layers active
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Compute is &lt;40% of the real TCO for a regulated bank. Toggle layers to model the full
        cost of running BankGPT as a production banking service — network, DR, SecOps, observability,
        backup, support, lifecycle, training, insurance, sovereignty and a risk reserve.
      </p>

      <div className="space-y-1.5">
        {layers.map((l) => {
          const Icon = l.icon;
          return (
            <div
              key={l.id}
              className={`rounded-lg border p-2.5 transition-colors ${
                l.enabled ? "border-tesfa-gold/30 bg-tesfa-gold/5" : "border-border/40 bg-background/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => toggle(l.id)}
                    className={`h-5 w-9 rounded-full transition-colors shrink-0 mt-0.5 ${
                      l.enabled ? "bg-emerald-500/70" : "bg-muted"
                    }`}
                    aria-label={`Toggle ${l.label}`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                        l.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <Icon className="h-3.5 w-3.5 text-tesfa-gold mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{l.label}</span>
                      {l.optional && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">optional</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">{l.why}</p>
                  </div>
                </div>
                {l.enabled && l.id !== "risk_reserve" && (
                  <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
                    <span className="text-emerald-400">OP ${l.monthly.onprem.toLocaleString()}</span>
                    <span className="text-amber-400">HY ${l.monthly.hybrid.toLocaleString()}</span>
                    <span className="text-sky-400">CL ${l.monthly.cloud.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        {(["onprem","hybrid","cloud"] as Mode[]).map((k) => (
          <div key={k} className="rounded-lg border border-border/40 bg-background/40 p-3">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
              {k === "onprem" ? "On-Prem 360 add-on" : k === "hybrid" ? "Hybrid 360 add-on" : "Cloud 360 add-on"}
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-muted-foreground">Monthly OPEX</span>
              <span className="text-sm font-bold text-foreground font-mono">
                +${totals.monthly[k].toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-muted-foreground">One-time CAPEX</span>
              <span className="text-xs text-tesfa-gold font-mono">
                +${totals.capex[k].toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-border/40 mt-1">
              <span className="text-[10px] text-muted-foreground">ETB monthly</span>
              <span className="text-[11px] text-tesfa-gold font-mono">
                ETB {Math.round(totals.monthly[k] * ETB_PER_USD).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Indicative Addis-landed pricing, 2025. SOC headcount blended at $1,800/mo loaded. Risk reserve auto-computed at 10%
        of (compute + 360) once enabled. Toggle the sovereignty premium off if NBE has granted a written cloud waiver.
      </p>
    </div>
  );
}
