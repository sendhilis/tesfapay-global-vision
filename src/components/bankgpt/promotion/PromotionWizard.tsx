/**
 * PromotionWizard — main shell for the BankGPT Production Promotion Wizard.
 *
 * Renders inside the BankGPT module's "Launch Console" tab.
 * Three-lane environment switcher → 10-step ladder → step detail drawer with
 * config, run/approve actions, evidence pack and execution logs.
 */
import { useMemo, useState } from "react";
import { Rocket, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBankgptPromotion } from "@/hooks/useBankgptPromotion";
import { ENV_LABEL, PROMOTION_STEPS, type PromotionEnv } from "@/lib/bankgpt-promotion-steps";
import { EnvironmentSwitcher } from "./EnvironmentSwitcher";
import { StepList } from "./StepList";
import { StepDetailDrawer } from "./StepDetailDrawer";

export function PromotionWizard() {
  const sandbox = useBankgptPromotion("sandbox");
  const uat     = useBankgptPromotion("uat");
  const prod    = useBankgptPromotion("prod");

  const [env, setEnv] = useState<PromotionEnv>("sandbox");
  const active = env === "sandbox" ? sandbox : env === "uat" ? uat : prod;

  const [openKey, setOpenKey] = useState<string | null>(null);
  const drawerOpen = openKey !== null;

  const progressByEnv = useMemo<Record<PromotionEnv, number>>(() => ({
    sandbox: sandbox.progressPct, uat: uat.progressPct, prod: prod.progressPct,
  }), [sandbox.progressPct, uat.progressPct, prod.progressPct]);

  const runAll = () => {
    // Best-effort run all unblocked steps in sequence (fire-and-forget; engine handles ordering)
    PROMOTION_STEPS.forEach((s) => {
      const st = active.run.steps[s.key]?.status;
      if (st === "pending" || st === "failed") active.runStep(s.key);
    });
  };

  const activeStep = openKey ? active.run.steps[openKey] : undefined;

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Rocket className="w-3 h-3" />
              Launch Console · Production Promotion Wizard
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Promote BankGPT from Sandbox → UAT → Production
            </h2>
            <p className="text-[12px] text-muted-foreground max-w-2xl mt-1">
              Run each of the {PROMOTION_STEPS.length} production-grade steps per environment. Evidence packs,
              logs and approvals are captured for audit. Step 8 (Channel Embedding) only unlocks
              once Step 7 (Tenant App Build) publishes a signed artifact. Production steps 9, 10
              and 11 require explicit Admin approval before they can advance.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={active.resetEnv}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset {ENV_LABEL[env]}
            </Button>
            <Button
              size="sm"
              onClick={runAll}
              className="bg-tesfa-gold text-tesfa-dark hover:bg-tesfa-gold/90"
            >
              Run all pending
            </Button>
          </div>
        </div>

        <EnvironmentSwitcher value={env} onChange={setEnv} progressByEnv={progressByEnv} />
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {ENV_LABEL[env]} promotion ladder
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Tenant <span className="font-mono">{active.run.tenantId}</span> ·{" "}
              {active.progressPct}% complete · status{" "}
              <span className="font-semibold text-foreground">{active.run.overallStatus}</span>
            </p>
          </div>
        </div>
        <StepList env={env} steps={active.run.steps} onOpen={setOpenKey} />
      </div>

      <StepDetailDrawer
        open={drawerOpen}
        onOpenChange={(v) => !v && setOpenKey(null)}
        stepKey={openKey}
        env={env}
        tenantId={active.run.tenantId}
        step={activeStep}
        allSteps={active.run.steps}
        onRun={active.runStep}
        onApprove={active.approveStep}
        onConfigChange={active.setStepConfig}
      />
    </div>
  );
}
