/**
 * Runtime overrides for module iframe URLs (per environment).
 * Persisted in localStorage so the bank can repoint Mobile Banking
 * or ABX Lending without a rebuild.
 *
 * Precedence at render time:
 *   1. localStorage override for the active env
 *   2. Vite build-time env var (VITE_ABX_MB_URL / VITE_ABX_LENDING_URL)
 *   3. Hard-coded default in ModuleRegistry
 */

export type IntegrationEnv = "sandbox" | "uat" | "prod";

export const INTEGRATION_ENVS: IntegrationEnv[] = ["sandbox", "uat", "prod"];

type ModuleId = "mobile-banking" | "abx-lending";

type Overrides = Partial<Record<IntegrationEnv, Partial<Record<ModuleId, string>>>>;

const STORAGE_KEY = "abx.integrationUrls.v1";
const ACTIVE_ENV_KEY = "abx.integrationUrls.activeEnv";

function safeGet(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function safeSet(value: Overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function getActiveEnv(): IntegrationEnv {
  try {
    const v = localStorage.getItem(ACTIVE_ENV_KEY) as IntegrationEnv | null;
    return v && INTEGRATION_ENVS.includes(v) ? v : "sandbox";
  } catch {
    return "sandbox";
  }
}

export function setActiveEnv(env: IntegrationEnv) {
  try {
    localStorage.setItem(ACTIVE_ENV_KEY, env);
    window.dispatchEvent(new CustomEvent("abx:integration-urls-changed"));
  } catch {
    /* ignore */
  }
}

export function getOverride(moduleId: ModuleId, env: IntegrationEnv): string {
  const all = safeGet();
  return all[env]?.[moduleId] ?? "";
}

export function getAllOverrides(): Overrides {
  return safeGet();
}

export function setOverride(moduleId: ModuleId, env: IntegrationEnv, url: string) {
  const all = safeGet();
  const next: Overrides = { ...all, [env]: { ...(all[env] ?? {}), [moduleId]: url.trim() } };
  if (!next[env]?.[moduleId]) delete next[env]?.[moduleId];
  safeSet(next);
  window.dispatchEvent(new CustomEvent("abx:integration-urls-changed"));
}

export function clearOverride(moduleId: ModuleId, env: IntegrationEnv) {
  const all = safeGet();
  if (all[env]) {
    delete all[env]![moduleId];
    if (Object.keys(all[env]!).length === 0) delete all[env];
  }
  safeSet(all);
  window.dispatchEvent(new CustomEvent("abx:integration-urls-changed"));
}

/**
 * Resolve the effective iframe URL for a module, honoring the active-env
 * override before falling back to the registry default.
 */
export function resolveIframeUrl(moduleId: string, fallback: string): string {
  if (moduleId !== "mobile-banking" && moduleId !== "abx-lending") return fallback;
  const env = getActiveEnv();
  const override = getOverride(moduleId, env).trim();
  return override || fallback;
}
