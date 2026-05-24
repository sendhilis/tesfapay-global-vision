/**
 * W-MOD · Platform Modules
 * Bank admin picks which Techurate modules form their ABX bundle.
 */
import { useMemo, useState } from "react";
import { Check, Settings2 } from "lucide-react";
import { useWizard } from "@/contexts/BankConfigContext";
import {
  ABX_MODULES,
  CATEGORY_LABEL,
  MODULES_BY_CATEGORY,
  defaultEnabledModuleIds,
  type AbxModule,
  type ModuleCategory,
} from "@/platform/ModuleRegistry";
import { ModuleSettingsPanel } from "@/components/wizard/modules/ModuleSettingsPanel";

const STATUS_BADGE: Record<AbxModule["status"], { label: string; cls: string }> = {
  live:    { label: "Live",        cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  beta:    { label: "Beta",        cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  stub:    { label: "Ready to wire", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  planned: { label: "Planned",     cls: "bg-muted text-muted-foreground" },
};

export function WMOD_PlatformModules() {
  const { config, setConfig } = useWizard();
  const enabled = useMemo(
    () => new Set(config.enabledModules ?? defaultEnabledModuleIds()),
    [config.enabledModules],
  );

  function toggle(id: string) {
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id); else next.add(id);
    setConfig({ ...config, enabledModules: Array.from(next) });
  }

  function selectAll() {
    setConfig({ ...config, enabledModules: ABX_MODULES.map((m) => m.id) });
  }
  function resetDefaults() {
    setConfig({ ...config, enabledModules: defaultEnabledModuleIds() });
  }

  const total = ABX_MODULES.length;
  const on = enabled.size;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] px-2 py-1 rounded bg-[var(--ink)] text-[var(--teal)]">
          W-MOD · Platform
        </span>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Pick the modules that make up your ABX platform.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every module is an existing Techurate product. The ABX shell themes, authenticates and routes them as one
        seamless experience — you are not rebuilding anything.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-3 text-sm">
        <div>
          <strong className="text-foreground">{on}</strong>
          <span className="text-muted-foreground"> of {total} modules enabled</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button onClick={resetDefaults} className="text-muted-foreground hover:text-foreground transition">
            Reset to defaults
          </button>
          <button onClick={selectAll} className="text-primary hover:underline">
            Enable all
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {(Object.keys(MODULES_BY_CATEGORY) as ModuleCategory[]).map((cat) => (
          <section key={cat}>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              {CATEGORY_LABEL[cat]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODULES_BY_CATEGORY[cat].map((m) => {
                const Icon = m.icon;
                const isOn = enabled.has(m.id);
                const isLocked = m.id === "wallet"; // wallet is always on
                return (
                  <button
                    key={m.id}
                    onClick={() => !isLocked && toggle(m.id)}
                    disabled={isLocked}
                    className={
                      "group text-left rounded-xl border p-4 transition-all " +
                      (isOn
                        ? "border-primary/60 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:bg-card/80") +
                      (isLocked ? " cursor-default opacity-90" : " cursor-pointer")
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          "shrink-0 rounded-lg p-2 transition " +
                          (isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
                        }
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{m.name}</h3>
                          <span className={"text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded " + STATUS_BADGE[m.status].cls}>
                            {STATUS_BADGE[m.status].label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-snug">{m.description}</p>
                      </div>
                      <div
                        className={
                          "ml-2 mt-0.5 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition " +
                          (isOn
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border")
                        }
                      >
                        {isOn && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Each enabled module mounts inside the ABX shell via <code className="bg-muted px-1.5 py-0.5 rounded">&lt;ModuleHost/&gt;</code>.
        Today they render a placeholder; once Techurate publishes the federation <code className="bg-muted px-1.5 py-0.5 rounded">remoteEntry.js</code> they
        light up automatically — no rebuild needed.
      </p>
    </div>
  );
}
