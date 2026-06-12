/**
 * CDPSchemaCoverage — read-only summary above the JSON editor for Step 3.
 * Lists every canonical entity, field count, and PII / sensitive / passthrough
 * split so the bank admin can confirm the mapping is complete without parsing
 * the raw JSON.
 */
import { CDP_CANONICAL_ENTITIES, CDP_ALL_FIELDS, type CdpFieldClass } from "@/lib/bankgpt-promotion-steps";
import { ShieldAlert, Lock, Check } from "lucide-react";

const CLASS_META: Record<CdpFieldClass, { label: string; tone: string; Icon: typeof ShieldAlert }> = {
  pii:         { label: "PII (tokenized)",     tone: "text-red-500",     Icon: Lock },
  sensitive:   { label: "Sensitive (in-VPC)",  tone: "text-amber-500",   Icon: ShieldAlert },
  passthrough: { label: "Passthrough",         tone: "text-emerald-500", Icon: Check },
};

export function CDPSchemaCoverage() {
  const total = CDP_ALL_FIELDS.length;
  const byClass = (c: CdpFieldClass) => CDP_ALL_FIELDS.filter((f) => f.classification === c).length;

  return (
    <section className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Canonical schema coverage
        </h4>
        <span className="text-[10px] font-mono text-muted-foreground">
          {CDP_CANONICAL_ENTITIES.length} entities · {total} fields
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {(Object.keys(CLASS_META) as CdpFieldClass[]).map((c) => {
          const { label, tone, Icon } = CLASS_META[c];
          return (
            <div key={c} className="rounded border border-border bg-background p-2">
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${tone}`}>
                <Icon className="w-3 h-3" /> {label}
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">{byClass(c)}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {CDP_CANONICAL_ENTITIES.map((e) => {
          const req = e.fields.filter((f) => f.required).length;
          return (
            <div key={e.key} className="flex items-start justify-between gap-3 text-[11px] border-t border-border/60 pt-1.5">
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate">{e.label}</div>
                <div className="text-muted-foreground text-[10px] truncate">
                  consumed by: {e.consumedBy.join(", ")}
                </div>
              </div>
              <div className="shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                {e.fields.length} fields · {req} required
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground leading-snug">
        Edit the JSON below to remap a <span className="font-mono">canonical → cbs_source</span> for this
        bank's T24 / Flexcube schema. Removing a required field will block downstream agents that depend on it.
      </p>
    </section>
  );
}
