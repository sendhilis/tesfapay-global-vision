/**
 * EvidenceViewer — renders the JSON evidence + execution logs for a step.
 */
export function EvidenceViewer({
  evidence, logs,
}: {
  evidence: Record<string, unknown>;
  logs: string[];
}) {
  const hasEvidence = Object.keys(evidence ?? {}).length > 0;
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Evidence pack
        </h4>
        {hasEvidence ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] space-y-1 max-h-64 overflow-auto">
            {Object.entries(evidence).map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <span className="text-muted-foreground shrink-0">{k}</span>
                <span className="text-foreground break-all">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            No evidence yet. Run the step to populate.
          </p>
        )}
      </section>
      <section>
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Execution log
        </h4>
        <div className="rounded-lg border border-border bg-black/85 text-emerald-300 p-3 font-mono text-[10.5px] leading-relaxed max-h-72 overflow-auto">
          {logs.length === 0 ? (
            <span className="text-emerald-300/40">// no log lines yet</span>
          ) : (
            logs.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </section>
    </div>
  );
}
