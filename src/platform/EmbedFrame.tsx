/**
 * <EmbedFrame/> — mounts a third-party URL inside a sandboxed iframe with a
 * runtime preflight that checks whether the target allows embedding
 * (`X-Frame-Options` and `Content-Security-Policy: frame-ancestors`).
 *
 * Because browsers do not expose iframe load failures triggered by XFO/CSP
 * to JS (the parent only sees a successful `load` event on an empty doc),
 * we do a best-effort `fetch(..., { method: "HEAD" })` from the parent to
 * inspect headers. If the target sends CORS for the parent origin we can
 * read them and produce a precise verdict; otherwise we mount the iframe
 * optimistically and fall back to a load-timeout heuristic — but always
 * surface the URL + troubleshooting so the bank ops team can fix it on
 * the Techurate side.
 */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, ShieldAlert } from "lucide-react";

type CheckState =
  | { kind: "checking" }
  | { kind: "allowed"; via: "headers-ok" | "opaque-assumed" }
  | {
      kind: "blocked";
      reason: string;
      detail?: string;
      xfo?: string | null;
      csp?: string | null;
    }
  | { kind: "network-error"; message: string };

type Props = {
  url: string;
  title: string;
  className?: string;
  /** Height applied to both iframe and error card. */
  style?: React.CSSProperties;
};

function evaluateHeaders(xfo: string | null, csp: string | null):
  | { ok: true }
  | { ok: false; reason: string; detail: string } {
  const parentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  if (xfo) {
    const v = xfo.toLowerCase();
    if (v.includes("deny")) {
      return { ok: false, reason: "X-Frame-Options: DENY", detail: "The target refuses to be embedded in any frame." };
    }
    if (v.includes("sameorigin")) {
      return {
        ok: false,
        reason: "X-Frame-Options: SAMEORIGIN",
        detail: `Only the target's own origin may frame it. Embedding from ${parentOrigin} is blocked.`,
      };
    }
  }
  if (csp) {
    // Pull frame-ancestors directive
    const m = csp.match(/frame-ancestors([^;]*)/i);
    if (m) {
      const sources = m[1].trim().toLowerCase();
      if (sources === "" || sources === "'none'") {
        return {
          ok: false,
          reason: "CSP frame-ancestors 'none'",
          detail: "The target's Content-Security-Policy forbids embedding in any frame.",
        };
      }
      // Naive allow check: explicit parent origin, *, or host pattern containing it.
      const host = parentOrigin.replace(/^https?:\/\//, "");
      const tokens = sources.split(/\s+/).filter(Boolean);
      const allowed = tokens.some((t) => {
        if (t === "*" || t === "https:" || t === "http:") return true;
        if (t === parentOrigin.toLowerCase()) return true;
        if (t.includes(host)) return true;
        // wildcard subdomain match (e.g. https://*.lovable.app)
        if (t.startsWith("https://*.") || t.startsWith("http://*.")) {
          const suffix = t.replace(/^https?:\/\/\*\./, "");
          if (host.endsWith(suffix)) return true;
        }
        return false;
      });
      if (!allowed) {
        return {
          ok: false,
          reason: "CSP frame-ancestors mismatch",
          detail: `Allowed sources: ${tokens.join(" ")}. Parent origin ${parentOrigin} is not listed.`,
        };
      }
    }
  }
  return { ok: true };
}

export function EmbedFrame({ url, title, className, style }: Props) {
  const [state, setState] = useState<CheckState>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadFiredRef = useRef(false);

  // Preflight: HEAD (then GET fallback) to inspect XFO / CSP headers.
  useEffect(() => {
    let cancelled = false;
    setState({ kind: "checking" });
    loadFiredRef.current = false;

    async function run() {
      const tryFetch = async (method: "HEAD" | "GET") => {
        return fetch(url, {
          method,
          mode: "cors",
          credentials: "omit",
          redirect: "follow",
          cache: "no-store",
        });
      };

      try {
        let res: Response;
        try {
          res = await tryFetch("HEAD");
        } catch {
          res = await tryFetch("GET");
        }
        if (cancelled) return;
        const xfo = res.headers.get("x-frame-options");
        const csp = res.headers.get("content-security-policy");
        const verdict = evaluateHeaders(xfo, csp);
        if (verdict.ok === true) {
          setState({ kind: "allowed", via: "headers-ok" });
        } else {
          const v = verdict as { ok: false; reason: string; detail: string };
          setState({
            kind: "blocked",
            reason: v.reason,
            detail: v.detail,
            xfo,
            csp,
          });
        }


      } catch (err) {
        // CORS-blocked HEAD/GET means we cannot read headers. Mount the iframe
        // optimistically and rely on the load-timeout heuristic below.
        if (cancelled) return;
        setState({ kind: "allowed", via: "opaque-assumed" });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  // Load-timeout heuristic for the opaque case: XFO/CSP-blocked iframes still
  // fire `load` (on an empty doc) in most browsers, but if `load` never fires
  // within 8s the target is unreachable / very slow / blocked at the network
  // layer — surface a clear error.
  useEffect(() => {
    if (state.kind !== "allowed" || state.via !== "opaque-assumed") return;
    const t = window.setTimeout(() => {
      if (!loadFiredRef.current) {
        setState({
          kind: "network-error",
          message:
            "Iframe did not load within 8 seconds. The host may be unreachable, very slow, or blocking the request at the network layer.",
        });
      }
    }, 8000);
    return () => window.clearTimeout(t);
  }, [state, attempt]);

  const containerStyle: React.CSSProperties = {
    height: "calc(100vh - 180px)",
    minHeight: 640,
    ...style,
  };

  if (state.kind === "checking") {
    return (
      <div
        className={
          "flex w-full items-center justify-center rounded-2xl border border-border bg-card/60 " +
          (className ?? "")
        }
        style={containerStyle}
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying that <code className="rounded bg-muted px-1.5 py-0.5">{url}</code> permits embedding…
        </div>
      </div>
    );
  }

  if (state.kind === "blocked" || state.kind === "network-error") {
    return (
      <BlockedCard
        url={url}
        state={state}
        className={className}
        style={containerStyle}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  }

  // Allowed (either by headers or optimistically). Render the iframe.
  return (
    <iframe
      key={attempt}
      ref={iframeRef}
      title={title}
      src={url}
      onLoad={() => {
        loadFiredRef.current = true;
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
      allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      referrerPolicy="strict-origin-when-cross-origin"
      className={"w-full rounded-2xl border border-border bg-card " + (className ?? "")}
      style={containerStyle}
    />
  );
}

function BlockedCard({
  url,
  state,
  className,
  style,
  onRetry,
}: {
  url: string;
  state: Extract<CheckState, { kind: "blocked" } | { kind: "network-error" }>;
  className?: string;
  style?: React.CSSProperties;
  onRetry: () => void;
}) {
  const parentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const isHeader = state.kind === "blocked";

  return (
    <div
      className={
        "flex w-full flex-col rounded-2xl border border-destructive/30 bg-destructive/5 p-6 " +
        (className ?? "")
      }
      style={style}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-destructive/10 p-2">
          {isHeader ? (
            <ShieldAlert className="h-5 w-5 text-destructive" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-destructive">
            Embedding blocked
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {isHeader ? state.reason : "Iframe failed to load"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isHeader
              ? state.detail
              : state.message}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <ExternalLink className="h-3 w-3" /> Open in new tab
          </a>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-card p-4 text-xs">
        <div className="grid grid-cols-[120px_1fr] gap-y-1.5">
          <span className="text-muted-foreground">Target URL</span>
          <code className="break-all">{url}</code>
          <span className="text-muted-foreground">Parent origin</span>
          <code className="break-all">{parentOrigin}</code>
          {isHeader && (
            <>
              <span className="text-muted-foreground">X-Frame-Options</span>
              <code className="break-all">{state.xfo ?? "(not set)"}</code>
              <span className="text-muted-foreground">CSP frame-ancestors</span>
              <code className="break-all">
                {state.csp
                  ? (state.csp.match(/frame-ancestors[^;]*/i)?.[0] ?? "(not set)")
                  : "(not set)"}
              </code>
            </>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
          How to fix (server-side, on the embedded app)
        </div>
        <ol className="mt-3 space-y-2 text-sm text-foreground/90">
          <li>
            <strong>1.</strong> Remove the <code className="rounded bg-muted px-1.5 py-0.5">X-Frame-Options</code> response
            header, or set it to a value that permits framing (modern browsers ignore
            anything other than <code>DENY</code> / <code>SAMEORIGIN</code>; use CSP instead).
          </li>
          <li>
            <strong>2.</strong> Add a Content-Security-Policy header that explicitly
            allows this shell's origin:
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-[11px]">
{`Content-Security-Policy: frame-ancestors ${parentOrigin} https://*.lovable.app https://abxbankgpt.techurate.world;`}
            </pre>
          </li>
          <li>
            <strong>3.</strong> Serve over HTTPS with a valid certificate (mixed
            content will also block the iframe).
          </li>
          <li>
            <strong>4.</strong> If the embedded app uses cookies for session/SSO,
            set them with <code>SameSite=None; Secure</code> so they survive the
            cross-site iframe context.
          </li>
          <li>
            <strong>5.</strong> After deploying the header changes, click{" "}
            <strong>Retry</strong> above. Use <strong>Open in new tab</strong> in
            the meantime to verify the app itself is reachable.
          </li>
        </ol>
        {!isHeader && (
          <p className="mt-3 text-xs text-muted-foreground">
            Note: the parent shell could not read response headers from the target
            (CORS-restricted), so this verdict is based on a load-timeout. If the
            app is actually reachable and only slow, the iframe may still appear
            on retry.
          </p>
        )}
      </div>
    </div>
  );
}
