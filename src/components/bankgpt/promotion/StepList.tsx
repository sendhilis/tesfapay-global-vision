/**
 * StepList — vertical 10-step ladder. Click any step to open detail drawer.
 */
import { Check, Clock, Loader2, ShieldAlert, XCircle, ChevronRight } from "lucide-react";
import { PROMOTION_STEPS, type PromotionEnv } from "@/lib/bankgpt-promotion-steps";
import type { StepState } from "@/hooks/useBankgptPromotion";

const STATUS_BADGE: Record<string, { label: string; cls: string; Icon: any }> = {
  pending:            { label: "Pending",            cls: "bg-muted text-muted-foreground",                    Icon: Clock },
  running:            { label: "Running",            cls: "bg-sky-500/15 text-sky-500",                        Icon: Loader2 },
  passed:             { label: "Passed",             cls: "bg-emerald-500/15 text-emerald-500",                Icon: Check },
  failed:             { label: "Failed",             cls: "bg-red-500/15 text-red-500",                        Icon: XCircle },
  awaiting_approval:  { label: "Awaiting Approval",  cls: "bg-amber-500/15 text-amber-500",                    Icon: ShieldAlert },
  skipped:            { label: "Skipped",            cls: "bg-muted text-muted-foreground",                    Icon: Clock },
};

export function StepList({
  env, steps, onOpen,
}: {
  env: PromotionEnv;
  steps: Record<string, StepState>;
  onOpen: (stepKey: string) => void;
}) {
  return (
    <ol className="space-y-2">
      {PROMOTION_STEPS.map((def) => {
        const s = steps[def.key];
        const status = s?.status ?? "pending";
        const meta = STATUS_BADGE[status];
        const needsApproval = def.approvalRequiredIn.includes(env);
        const missingDeps = (def.dependsOn ?? []).filter((k) => steps[k]?.status !== "passed");
        const locked = missingDeps.length > 0 && status !== "passed";
        const Icon = def.icon;
        return (
          <li key={def.key}>
            <button
              onClick={() => onOpen(def.key)}
              className="w-full text-left flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-tesfa-gold/50 transition-all group"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-foreground shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-muted-foreground w-6 text-center">
                {String(def.index).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{def.title}</span>
                  {needsApproval && (
                    <span className="text-[9px] uppercase tracking-wider text-amber-500 border border-amber-500/40 rounded px-1.5 py-0.5">
                      Admin gate
                    </span>
                  )}
                  {locked && (
                    <span className="text-[9px] uppercase tracking-wider text-sky-500 border border-sky-500/40 rounded px-1.5 py-0.5">
                      Locked · waits on {missingDeps.length}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {def.description}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full ${meta.cls}`}>
                <meta.Icon className={`w-3 h-3 ${status === "running" ? "animate-spin" : ""}`} />
                {meta.label}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
