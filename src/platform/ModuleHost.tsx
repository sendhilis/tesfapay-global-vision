/**
 * <ModuleHost moduleId="..." />
 * ─────────────────────────────────────────────────────────────
 * Runtime entry point for a federated Techurate module.
 *
 * Today: renders a polished "Coming soon" stub so the platform
 * shape is visible end-to-end in the wizard preview.
 *
 * Tomorrow: switch on `module.remoteEntry` + `module.exposedModule`
 * and do:
 *
 *     const Remote = React.lazy(() => loadRemote(module));
 *     return <Suspense fallback={...}><Remote {...ctx}/></Suspense>;
 *
 * Each remote receives the same shared context (auth token,
 * theme tokens, bank config, i18n) via React Context — the
 * Techurate teams do not need to re-implement any of it.
 */

import { useMemo } from "react";
import { Lock, Sparkles } from "lucide-react";
import { getModule, type AbxModule } from "./ModuleRegistry";
import { useBankConfig } from "@/contexts/BankConfigContext";
import { BankGPTView } from "@/components/wizard/modules/BankGPTView";
import type { NisirPortal } from "@/platform/NisirPortalMount";

const NISIR_PORTAL_MAP: Record<string, NisirPortal> = {
  "mobile-banking": "retail",
  "internet-banking": "ib",
  "agency-banking": "agency",
  "merchant-portal": "merchant",
};

type Props = {
  moduleId: string;
  className?: string;
};

export function ModuleHost({ moduleId, className }: Props) {
  const cfg = useBankConfig();
  const mod = useMemo(() => getModule(moduleId), [moduleId]);
  const enabled = (cfg.enabledModules ?? []).includes(moduleId);

  if (!mod) return <UnknownModule id={moduleId} className={className} />;
  if (!enabled) return <DisabledModule mod={mod} className={className} />;

  // Native ABX modules with bespoke runtime UI go here.
  if (mod.id === "bankgpt") return <div className={className}><BankGPTView /></div>;

  // Generic iframe mount — preferred for live Techurate apps hosted at their
  // own origin (e.g. ABX Core Mobile Banking). When `iframeUrl` is set on the
  // module registry entry, it takes precedence over the bundled Nisir portal.
  if (mod.iframeUrl) {
    return (
      <iframe
        title={mod.name}
        src={mod.iframeUrl}
        // sandbox keeps the embedded app isolated; allow-same-origin is needed
        // for cookie-based session/SSO with the Techurate backend.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        referrerPolicy="strict-origin-when-cross-origin"
        className={
          "w-full rounded-2xl border border-border bg-card " + (className ?? "")
        }
        style={{ height: "calc(100vh - 180px)", minHeight: 640 }}
      />
    );
  }

  // Nisir Digital portals — sandboxed in an iframe so their MemoryRouter
  // doesn't nest inside the ABX BrowserRouter (forbidden in React Router v6).
  const nisirPortal = NISIR_PORTAL_MAP[mod.id];
  if (nisirPortal) {
    return (
      <iframe
        title={mod.name}
        src={`/_nisir/${nisirPortal}`}
        className={
          "w-full rounded-2xl border border-border bg-card " + (className ?? "")
        }
        style={{ height: "calc(100vh - 180px)", minHeight: 640 }}
      />
    );
  }

  // TODO: when remoteEntry is set, swap in React.lazy + Module Federation here.
  return <StubModule mod={mod} className={className} />;
}

function StubModule({ mod, className }: { mod: AbxModule; className?: string }) {
  const Icon = mod.icon;
  return (
    <div
      className={
        "w-full rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center " +
        (className ?? "")
      }
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
        <Sparkles className="h-3 w-3" /> ABX Module · {mod.status}
      </div>
      <div className="mt-6 flex items-center justify-center">
        <div className="rounded-2xl bg-primary/10 p-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">{mod.name}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{mod.description}</p>
      <p className="mt-6 text-xs text-muted-foreground/80">
        Federation slot ready. Drop in <code className="rounded bg-muted px-1.5 py-0.5">{mod.id}</code>'s
        <code className="ml-1 rounded bg-muted px-1.5 py-0.5">remoteEntry.js</code> to mount the live module here.
      </p>
    </div>
  );
}

function DisabledModule({ mod, className }: { mod: AbxModule; className?: string }) {
  const Icon = mod.icon;
  return (
    <div className={"w-full rounded-2xl border border-border bg-muted/40 p-10 text-center " + (className ?? "")}>
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Lock className="h-3 w-3" /> Module disabled
      </div>
      <Icon className="mx-auto mt-6 h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 text-xl font-semibold text-foreground">{mod.name}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Enable this module from the wizard's <strong>Platform Modules</strong> step to make it available.
      </p>
    </div>
  );
}

function UnknownModule({ id, className }: { id: string; className?: string }) {
  return (
    <div className={"w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center " + (className ?? "")}>
      <p className="text-sm text-destructive">
        Unknown module id: <code>{id}</code>
      </p>
    </div>
  );
}
