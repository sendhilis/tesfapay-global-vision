/**
 * StepDetailDrawer — drawer/dialog for a single promotion step. Shows
 * description + "Why", an editable JSON config, run / approve actions,
 * and the EvidenceViewer with logs.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Play, ShieldCheck, RotateCw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getStep, ENV_LABEL, TOTAL_STEPS, PROMOTION_STEPS, type PromotionEnv } from "@/lib/bankgpt-promotion-steps";
import type { StepState } from "@/hooks/useBankgptPromotion";
import { EvidenceViewer } from "./EvidenceViewer";
import { CBSConnectionMapper, type CBSMapperConfig } from "./CBSConnectionMapper";
import { CDPSchemaCoverage } from "./CDPSchemaCoverage";
import { CBSSchemaProbeReport } from "./CBSSchemaProbeReport";

export function StepDetailDrawer({
  open, onOpenChange, stepKey, env, tenantId, step, allSteps, onRun, onApprove, onConfigChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stepKey: string | null;
  env: PromotionEnv;
  tenantId: string;
  step: StepState | undefined;
  allSteps: Record<string, StepState>;
  onRun: (key: string) => void;
  onApprove: (key: string, approver: string) => void;
  onConfigChange: (key: string, cfg: Record<string, unknown>) => void;
}) {
  const def = stepKey ? getStep(stepKey) : undefined;
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (step) setDraft(JSON.stringify(step.config, null, 2));
    setErr(null);
  }, [step, stepKey]);

  const needsApproval = def?.approvalRequiredIn.includes(env) ?? false;
  const isApproved = !!step?.approvedBy;

  const missingDeps = useMemo(() => {
    if (!def?.dependsOn?.length) return [] as string[];
    return def.dependsOn.filter((k) => allSteps[k]?.status !== "passed");
  }, [def, allSteps]);
  const isBlockedByDeps = missingDeps.length > 0;

  const canRun = useMemo(() => {
    if (!step) return false;
    if (step.status === "running") return false;
    if (needsApproval && !isApproved) return false;
    if (isBlockedByDeps) return false;
    return true;
  }, [step, needsApproval, isApproved, isBlockedByDeps]);

  if (!def || !step) return null;

  const saveConfig = () => {
    try {
      const parsed = JSON.parse(draft);
      onConfigChange(def.key, parsed);
      setErr(null);
    } catch (e) {
      setErr("Invalid JSON: " + (e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <span>Step {def.index} / {TOTAL_STEPS}</span>
            <span>·</span>
            <span>{ENV_LABEL[env]} lane</span>
          </div>
          <DialogTitle className="text-xl flex items-center gap-2">
            <def.icon className="w-5 h-5 text-tesfa-gold" />
            {def.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {def.description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-tesfa-gold/30 bg-tesfa-gold/5 p-3 text-[12px]">
          <span className="font-semibold text-foreground">Why this matters: </span>
          <span className="text-muted-foreground">{def.why}</span>
        </div>

        {needsApproval && !isApproved && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-[12px]">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-400">
                Admin approval required for Production
              </div>
              <div className="text-muted-foreground mt-0.5">
                This step cannot run in the Production lane until a BankGPT-Admin approves it.
              </div>
            </div>
          </div>
        )}

        {isBlockedByDeps && (
          <div className="flex items-start gap-2 rounded-md border border-sky-500/40 bg-sky-500/5 p-3 text-[12px]">
            <AlertTriangle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-semibold text-sky-600 dark:text-sky-400">
                Locked — upstream steps must pass first
              </div>
              <ul className="text-muted-foreground mt-1 space-y-0.5">
                {missingDeps.map((k) => {
                  const dep = PROMOTION_STEPS.find((s) => s.key === k);
                  if (!dep) return null;
                  return (
                    <li key={k}>
                      • Step {dep.index} · <span className="font-semibold text-foreground">{dep.title}</span>{" "}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                        (currently {allSteps[k]?.status ?? "pending"})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Approved by <span className="font-mono">{step.approvedBy}</span> at{" "}
            <span className="font-mono">{step.approvedAt && new Date(step.approvedAt).toLocaleString()}</span>
          </div>
        )}

        {def.key === "event_stream" ? (
          <section>
            <CBSConnectionMapper
              env={env}
              tenantId={tenantId}
              value={step.config as Partial<CBSMapperConfig>}
              onChange={(next) => onConfigChange(def.key, next as unknown as Record<string, unknown>)}
            />
          </section>
        ) : (
          <section className="space-y-3">
            {def.key === "cdp_schema_binding" && <CDPSchemaCoverage />}
            {def.key === "cbs_schema_probe" && <CBSSchemaProbeReport evidence={step.evidence} />}
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Step configuration (JSON)
              </h4>
              <button
                onClick={saveConfig}
                className="text-[10px] text-tesfa-gold font-semibold hover:underline"
              >
                Save config
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-44 rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] resize-y"
              spellCheck={false}
            />
            {err && <div className="text-[11px] text-red-500 mt-1">{err}</div>}
          </section>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={() => onRun(def.key)}
            disabled={!canRun}
            className="bg-tesfa-gold text-tesfa-dark hover:bg-tesfa-gold/90"
          >
            {step.status === "running" ? (
              <><RotateCw className="w-4 h-4 mr-1.5 animate-spin" /> Running…</>
            ) : step.status === "passed" ? (
              <><Play className="w-4 h-4 mr-1.5" /> Re-run step</>
            ) : (
              <><Play className="w-4 h-4 mr-1.5" /> Run step ({ENV_LABEL[env]})</>
            )}
          </Button>
          {needsApproval && !isApproved && (
            <Button
              variant="outline"
              onClick={() => onApprove(def.key, "admin@bank.example")}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Approve (Admin)
            </Button>
          )}
        </div>

        <EvidenceViewer evidence={step.evidence} logs={step.logs} />
      </DialogContent>
    </Dialog>
  );
}
