/**
 * Launchpad — Post-go-live home. Renders ONLY the platform modules
 * the bank enabled in the ABX wizard. If exactly one module is
 * enabled, auto-redirects to it.
 *
 * @route / (when BankConfig is published)
 */
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Settings2, Sparkles } from "lucide-react";
import { useBankConfig, useWizard } from "@/contexts/BankConfigContext";
import { ABX_MODULES, getModule, type AbxModule } from "@/platform/ModuleRegistry";
import AdminBar from "@/components/AdminBar";

function moduleRoute(m: AbxModule) {
  // Wallet has its own dedicated layout; everything else mounts via ModuleHost.
  return m.id === "wallet" ? "/wallet" : `/platform/${m.id}`;
}

export default function Launchpad({ skipAutoRedirect = false }: { skipAutoRedirect?: boolean } = {}) {
  const cfg = useBankConfig();
  const { reset } = useWizard();
  const navigate = useNavigate();

  const enabled = useMemo(
    () =>
      (cfg.enabledModules ?? [])
        .map((id) => getModule(id))
        .filter((m): m is AbxModule => !!m),
    [cfg.enabledModules],
  );

  // If only one module is enabled, skip the launchpad entirely.
  useEffect(() => {
    if (!skipAutoRedirect && enabled.length === 1) {
      navigate(moduleRoute(enabled[0]), { replace: true });
    }
  }, [enabled, navigate, skipAutoRedirect]);

  return (
    <div className="min-h-dvh bg-background">
      <AdminBar label="Modules Launchpad" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3 w-3" /> ABX · Live
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-foreground">
              {cfg.bank.name}
            </h1>
            <p className="text-sm text-muted-foreground">{cfg.bank.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/console/integrations")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="h-3.5 w-3.5" /> Integration URLs
            </button>
            <button
              onClick={() => navigate("/setup")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="h-3.5 w-3.5" /> Reconfigure
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Enabled platform modules · {enabled.length} of {ABX_MODULES.length}
        </h2>

        {enabled.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No modules enabled. Open the wizard's <strong>Platform Modules</strong> step to turn some on.
            </p>
            <button
              onClick={() => navigate("/setup")}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              Open Wizard <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enabled.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(moduleRoute(m))}
                  className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {m.status}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{m.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {m.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              reset();
              navigate("/setup");
            }}
            className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
          >
            Reset configuration
          </button>
        </div>
      </main>
    </div>
  );
}
