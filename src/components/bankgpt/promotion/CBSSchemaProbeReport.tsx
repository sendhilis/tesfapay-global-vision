/**
 * CBSSchemaProbeReport — renders the per-field CBS probe results for Step 4.
 *
 * Reads structured evidence written by useBankgptPromotion's `cbs_schema_probe`
 * synthesiser and surfaces:
 *   • headline conformance + sample size + endpoint (synthetic vs live)
 *   • per-field table with status, presence %, type conformance, PII round-trip
 *   • explicit missing / type-violation callouts
 *
 * In Sandbox the evidence will be `mode: "synthetic"` with 100% coverage; in
 * UAT/PROD the report shows real misses so the user can act on them.
 */
import { AlertTriangle, CheckCircle2, ShieldAlert, FlaskConical } from "lucide-react";

type FieldResult = {
  entity: string;
  canonical: string;
  cbs_source: string;
  type: string;
  classification: "pii" | "sensitive" | "passthrough";
  required: boolean;
  present_pct: number;
  type_ok: boolean;
  type_observed: string;
  pii_round_trip: "ok" | "skipped" | "n/a";
  sample_value_masked: string | null;
  status: "ok" | "missing" | "type_violation" | "low_presence";
};

interface Evidence {
  mode?: "synthetic" | "live";
  cbs_endpoint?: string;
  samples_probed?: number;
  fields_declared?: number;
  fields_present?: number;
  fields_missing?: string[];
  type_violations?: Array<{ field: string; expected: string; observed: string }>;
  pii_round_trip_ok?: string;
  conformance_pct?: number;
  probe_run_id?: string;
  field_results?: FieldResult[];
}

const STATUS_STYLE: Record<FieldResult["status"], string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  missing: "text-red-500",
  type_violation: "text-amber-500",
  low_presence: "text-amber-500",
};

const STATUS_LABEL: Record<FieldResult["status"], string> = {
  ok: "OK",
  missing: "MISSING",
  type_violation: "TYPE",
  low_presence: "LOW",
};

export function CBSSchemaProbeReport({ evidence }: { evidence: Record<string, unknown> }) {
  const e = evidence as Evidence;
  if (!e.field_results || e.field_results.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-[11px] text-muted-foreground">
        <FlaskConical className="w-4 h-4 inline mr-1.5 -mt-0.5" />
        No probe results yet. Run the step to query the CBS connector and produce per-field evidence.
      </div>
    );
  }

  const isSynthetic = e.mode === "synthetic";
  const conformance = e.conformance_pct ?? 0;
  const conformanceTone =
    conformance >= 95 ? "text-emerald-600 dark:text-emerald-400"
    : conformance >= 85 ? "text-amber-500"
    : "text-red-500";

  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            CBS Schema Probe — measured CBS reality
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            {isSynthetic
              ? "Sandbox lane: probe ran against the synthetic CBS. No bank infra was contacted."
              : "Live lane: probe queried the bank's CBS through the configured connector and verified every canonical field end-to-end."}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-2xl font-bold ${conformanceTone}`}>{conformance}%</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            CBS conformance
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Mode" value={isSynthetic ? "Synthetic" : "Live"} />
        <Stat label="Samples probed" value={String(e.samples_probed ?? 0)} />
        <Stat
          label="Fields present"
          value={`${e.fields_present ?? 0} / ${e.fields_declared ?? 0}`}
        />
        <Stat label="PII round-trip" value={e.pii_round_trip_ok ?? "—"} />
      </div>

      {(e.fields_missing?.length ?? 0) > 0 && (
        <Callout
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          tone="red"
          title={`${e.fields_missing!.length} declared field${e.fields_missing!.length === 1 ? "" : "s"} not returned by CBS`}
        >
          {e.fields_missing!.join(", ")}
        </Callout>
      )}

      {(e.type_violations?.length ?? 0) > 0 && (
        <Callout
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          tone="amber"
          title={`${e.type_violations!.length} type conformance violation${e.type_violations!.length === 1 ? "" : "s"}`}
        >
          {e.type_violations!
            .map((v) => `${v.field} (expected ${v.expected}, got ${v.observed})`)
            .join(" · ")}
        </Callout>
      )}

      {(e.fields_missing?.length ?? 0) === 0 && (e.type_violations?.length ?? 0) === 0 && (
        <Callout
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          tone="emerald"
          title="All declared fields present and well-typed"
        >
          Every canonical field returned by CBS within the presence threshold; PII tokenisation round-trip verified.
        </Callout>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-[10.5px] font-mono">
            <thead className="bg-muted/60 sticky top-0">
              <tr className="text-left text-muted-foreground">
                <th className="px-2 py-1.5 font-normal">Canonical</th>
                <th className="px-2 py-1.5 font-normal">CBS source</th>
                <th className="px-2 py-1.5 font-normal text-right">Present %</th>
                <th className="px-2 py-1.5 font-normal">Type</th>
                <th className="px-2 py-1.5 font-normal">PII</th>
                <th className="px-2 py-1.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {e.field_results.map((r) => (
                <tr key={r.canonical} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-2 py-1 text-foreground">{r.canonical}</td>
                  <td className="px-2 py-1 text-muted-foreground truncate max-w-[180px]" title={r.cbs_source}>
                    {r.cbs_source}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">{r.present_pct}%</td>
                  <td className="px-2 py-1">
                    {r.type_ok
                      ? <span className="text-muted-foreground">{r.type}</span>
                      : <span className="text-amber-500">{r.type}→{r.type_observed}</span>}
                  </td>
                  <td className="px-2 py-1 text-muted-foreground">{r.pii_round_trip}</td>
                  <td className={`px-2 py-1 font-semibold ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {e.probe_run_id && (
        <div className="text-[9px] font-mono text-muted-foreground">
          probe_run_id: {e.probe_run_id}
          {e.cbs_endpoint && <> · endpoint: <span className="break-all">{e.cbs_endpoint}</span></>}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="text-[12px] font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function Callout({
  icon, tone, title, children,
}: {
  icon: React.ReactNode;
  tone: "red" | "amber" | "emerald";
  title: string;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "red"     ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
    : tone === "amber" ? "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
    :                    "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
  return (
    <div className={`rounded-md border px-3 py-2 text-[11px] ${toneClass}`}>
      <div className="flex items-center gap-1.5 font-semibold">{icon}<span>{title}</span></div>
      <div className="mt-1 text-[10.5px] opacity-90 break-words">{children}</div>
    </div>
  );
}
