import { useState } from "react";
import { useWizard } from "@/contexts/BankConfigContext";
import { STEPS, TOTAL_STEPS } from "@/lib/wizard-config";
import { WizardSidebar } from "./WizardSidebar";
import { PreviewPanel } from "./PreviewPanel";
import { STEP_REGISTRY } from "./steps";
import { ChevronLeft, ChevronRight, Save, Smartphone } from "lucide-react";

export function WizardShell() {
  const { stepIdx, next, prev, config, completed } = useWizard();
  const step = STEPS[stepIdx];
  const Component = STEP_REGISTRY[step.id];
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSaveDraft = () => {
    try {
      const blob = new Blob([JSON.stringify({ config, stepIdx, completed: Array.from(completed) }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `bankconfig-${config.bank.shortName || "draft"}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="abx-scope flex min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <WizardSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-[var(--background)]/85 backdrop-blur border-b border-[var(--line)] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] px-2 py-1 rounded bg-[var(--ink)] text-[var(--teal)]">{step.id}</span>
            <span className="text-[12px] text-[var(--ink-soft)]">{step.section}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[var(--ink-soft)]">
            <span className="font-mono">{stepIdx + 1} / {TOTAL_STEPS}</span>
            <button onClick={() => setPreviewOpen(true)} className="xl:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--line)] hover:border-[var(--ink)]/40">
              <Smartphone className="w-3 h-3" /> Preview
            </button>
            <button onClick={handleSaveDraft} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--line)] hover:border-[var(--ink)]/40">
              <Save className="w-3 h-3" /> Save draft
            </button>
          </div>
        </header>
        <div className="flex-1 px-8 md:px-14 py-14 max-w-4xl w-full mx-auto">
          {Component ? <Component /> : <div>Step not found</div>}
        </div>
        <footer className="sticky bottom-0 bg-[var(--background)]/90 backdrop-blur border-t border-[var(--line)] px-8 py-4 flex items-center justify-between">
          <button onClick={prev} disabled={stepIdx === 0} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--line)] text-[13px] disabled:opacity-30 hover:border-[var(--ink)]/40">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="hidden md:flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === stepIdx ? "w-8 bg-[var(--ink)]" : i < stepIdx ? "w-2 bg-[var(--teal)]" : "w-2 bg-[var(--line)]"}`} />
            ))}
          </div>
          <button onClick={() => { if (stepIdx === TOTAL_STEPS - 1) { document.getElementById("w36-golive")?.click(); } else { next(); } }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--ink)] text-[var(--cream)] text-[13px] font-medium hover:opacity-90">
            {stepIdx === TOTAL_STEPS - 1 ? "Complete & Go Live" : "Continue"} <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </main>
      <PreviewPanel open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
