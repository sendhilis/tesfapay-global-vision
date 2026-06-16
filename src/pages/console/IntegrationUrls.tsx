/**
 * Console → Integration URLs
 * Lets the bank repoint Mobile Banking & ABX Lending iframe modules
 * per environment (Sandbox / UAT / PROD) without a rebuild.
 *
 * @route /console/integrations
 */
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Save, RotateCcw, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import AdminBar from "@/components/AdminBar";
import {
  INTEGRATION_ENVS,
  type IntegrationEnv,
  getActiveEnv,
  setActiveEnv,
  getOverride,
  setOverride,
  clearOverride,
} from "@/lib/integrationUrls";

type ModuleRow = {
  id: "mobile-banking" | "abx-lending" | "bankgpt";
  name: string;
  envVarName: string;
  defaultUrl: string;
  buildTimeValue?: string;
};

const MODULES: ModuleRow[] = [
  {
    id: "mobile-banking",
    name: "ABX Mobile Banking",
    envVarName: "VITE_ABX_MB_URL",
    defaultUrl: "https://abxmobilebanking.techurate.world",
    buildTimeValue: import.meta.env.VITE_ABX_MB_URL as string | undefined,
  },
  {
    id: "abx-lending",
    name: "ABX Lending",
    envVarName: "VITE_ABX_LENDING_URL",
    defaultUrl: "https://abxlending.techurate.world",
    buildTimeValue: import.meta.env.VITE_ABX_LENDING_URL as string | undefined,
  },
  {
    id: "bankgpt",
    name: "BankGPT · AI Mesh",
    envVarName: "VITE_BANKGPT_URL",
    defaultUrl: "/platform/bankgpt",
    buildTimeValue: import.meta.env.VITE_BANKGPT_URL as string | undefined,
  },
];

export default function IntegrationUrlsConsole() {
  const [env, setEnv] = useState<IntegrationEnv>(getActiveEnv());
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const m of MODULES) next[m.id] = getOverride(m.id, env);
    setValues(next);
    setSavedKey(null);
  }, [env]);

  const handleEnvChange = (e: IntegrationEnv) => {
    setActiveEnv(e);
    setEnv(e);
  };

  const handleSave = (m: ModuleRow) => {
    const v = (values[m.id] ?? "").trim();
    if (v) setOverride(m.id, env, v);
    else clearOverride(m.id, env);
    setSavedKey(m.id);
    setTimeout(() => setSavedKey((k) => (k === m.id ? null : k)), 1800);
  };

  const handleReset = (m: ModuleRow) => {
    clearOverride(m.id, env);
    setValues((s) => ({ ...s, [m.id]: "" }));
    setSavedKey(m.id);
    setTimeout(() => setSavedKey((k) => (k === m.id ? null : k)), 1800);
  };

  return (
    <div className="min-h-dvh bg-background">
      <AdminBar label="Console · Integration URLs" />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary">
              ABX Console
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-foreground">
              Integration URLs
            </h1>
            <p className="text-sm text-muted-foreground">
              Repoint Techurate iframe modules per environment. Saved overrides apply immediately.
            </p>
          </div>
          <Link
            to="/launchpad"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Launchpad
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Environment selector */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Active environment</h2>
              <p className="text-xs text-muted-foreground">
                Iframe modules launched from the Launchpad will use the URLs configured for this environment.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              {INTEGRATION_ENVS.map((e) => (
                <button
                  key={e}
                  onClick={() => handleEnvChange(e)}
                  className={
                    "px-4 py-1.5 text-xs uppercase tracking-wider rounded-full transition " +
                    (env === e
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Module rows */}
        {MODULES.map((m) => {
          const current = (values[m.id] ?? "").trim();
          const effective = current || m.buildTimeValue || m.defaultUrl;
          return (
            <section key={m.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Build-time variable: <code className="rounded bg-muted px-1.5 py-0.5">{m.envVarName}</code>
                  </p>
                </div>
                {savedKey === m.id && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>

              <label className="mt-4 block text-xs font-medium text-muted-foreground">
                Override URL for <span className="uppercase">{env}</span>
              </label>
              <input
                type="url"
                value={values[m.id] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [m.id]: e.target.value }))}
                placeholder={m.buildTimeValue || m.defaultUrl}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Effective URL:{" "}
                  <a
                    href={effective}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground hover:text-primary"
                  >
                    {effective} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReset(m)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                  <button
                    onClick={() => handleSave(m)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
                  >
                    <Save className="h-3 w-3" /> Save for {env.toUpperCase()}
                  </button>
                </div>
              </div>
            </section>
          );
        })}

        <p className="text-[11px] text-muted-foreground">
          Overrides are stored locally in this browser (per device). For a fleet-wide default, set the
          corresponding <code>VITE_*</code> variable at build time.
        </p>
      </main>
    </div>
  );
}
