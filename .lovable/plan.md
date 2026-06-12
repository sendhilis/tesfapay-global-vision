# Lift Nisir portals into ABX platform modules

This is a sizable port: **61 page files across 4 portals**, **31 SQL migrations**, **10 edge functions**, **2 contexts**, **9 portal-specific hooks**, **shared components**, and Nisir's own design tokens. To keep look & feel + behavior 100% identical while not breaking existing ABX, the work is split into 4 phases.

## Architecture

```text
ABX Wizard (existing)
└── Platform Modules Registry
    ├── bankgpt, smart-branch, abx, ...   (existing)
    └── nisir-retail | nisir-ib | nisir-agency | nisir-merchant   (NEW)
            │
            ▼
        ModuleHost
            │
            ▼
   <NisirPortalMount portal="retail|ib|agency|merchant">
       <NisirProviders>            ← AuthProvider, LanguageProvider, QueryClient, NisirToaster
         <NisirCssScope>           ← imports Nisir index.css scoped to .nisir-scope
           <MemoryRouter basename="/" initialEntries={["/retail"]}>
             <Routes>  …Nisir's original routes, file-for-file…  </Routes>
           </MemoryRouter>
         </NisirCssScope>
       </NisirProviders>
   </NisirPortalMount>
```

Key invariant: **the lifted .tsx files are copied byte-for-byte**. All ABX-specific wrapping happens in the mount layer.

## Phase 1 — Backend port (one migration + edge functions)

- Read all 31 Nisir migrations, concatenate into one consolidated migration applied to ABX Cloud (idempotent `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, etc.). RLS + triggers + enums preserved.
- Copy all 10 edge functions to `supabase/functions/` (aml-screening, bdp-ingest, bdp-seed-demo, create-test-users, integration-test-proxy, integration-webhook-receiver, kyc-verify, loan-engine, loan-reminder, nisir-ai-chat). They use `Deno.env.get('SUPABASE_*')` already → no edits needed.
- Add `supabase/config.toml` entries for any function with `verify_jwt = false` (kyc-verify, nisir-ai-chat, etc., matching Nisir).

## Phase 2 — Code lift (verbatim copies)

Using `cross_project--read_project_file` → `code--write`:

- `src/nisir/pages/{retail,ib,agency,merchant}/*` — all 61 files copied unchanged
- `src/nisir/components/**` — agency/, copilot/, kyc/, loans/, payments/, KycTierCard, LanguageToggle, MobilePortalLayout, NavLink, NisirAIWidget, OtpVerificationDialog, TechurateABXFooter
- `src/nisir/contexts/{LanguageContext,MerchantWalletContext}.tsx`
- `src/nisir/hooks/{useAuth,useAccounts,useLoans,useNotifications,useProfile,useTransactions,useTransactionToasts,useCorporateRole,useBDPReport,useDailyBriefing}.tsx`
- `src/nisir/data/regulatoryReportMockData.ts`
- `src/nisir/index.css` — Nisir's tokens, wrapped under `.nisir-scope { … }` via a small build step (or imported as-is and namespaced by giving Nisir tokens distinct names — see Technical notes)
- `src/nisir/assets/**` via `cross_project--copy_project_asset`

Path remap: a single `tsconfig` path alias `@nisir/*` → `src/nisir/*`. Inside copied files, the `@/` alias inside `src/nisir/**` resolves to `src/nisir/**` via a vite alias rule so internal imports (`@/components/ui/button`, `@/hooks/useAuth`) keep working without edits.

## Phase 3 — Mount layer + registry

New ABX-side files (small):

- `src/platform/nisir/NisirProviders.tsx` — wraps QueryClient + LanguageProvider + AuthProvider + Toasters
- `src/platform/nisir/NisirPortalMount.tsx` — MemoryRouter + Routes per portal (Retail / IB / Agency / Merchant). Routes copy-pasted from Nisir App.tsx, minus the cross-portal ones.
- `src/platform/nisir/demoAutoLogin.ts` — on first mount, seeds a demo user session via `supabase.auth.signInWithPassword` against a fixed test account created by `create-test-users` edge function.
- Update `src/platform/ModuleRegistry.ts` — add 4 modules (`nisir-retail`, `nisir-ib`, `nisir-agency`, `nisir-merchant`) with icons (Smartphone, Globe, Store, Building2), category Customer Channels, status `live`.
- Update `src/platform/ModuleHost.tsx` — switch on those 4 ids, render `<NisirPortalMount portal="…"/>`.
- Add a launchpad tile after Go-Live for each enabled portal (uses existing PlatformModule route `/platform/:moduleId`).

## Phase 4 — Dependencies & validation

- Install missing deps: `framer-motion`, `qrcode.react`, `react-markdown`, `next-themes`, `vaul`, `input-otp` (skip ones already present).
- Run `code--exec` typecheck-equivalent (rg for obvious unresolved imports).
- Browser smoke test: open `/setup`, enable all 4 Nisir modules, hit Go Live, navigate to each portal via launchpad, verify landing renders identical to nisir-hub.lovable.app.

## Technical notes

- **CSS scoping**: Nisir uses HSL semantic tokens like ABX but with different values. To avoid clobbering ABX, I'll wrap Nisir's `:root { --background: … }` block as `.nisir-scope { --background: … }` and add `className="nisir-scope"` to `NisirPortalMount`. Tailwind classes inside Nisir components resolve against the nearest CSS-var scope, so look & feel stays identical.
- **Auth**: Nisir's `useAuth` uses `supabase.auth`. Since we're porting the schema to ABX Cloud and ABX uses the same Supabase client singleton, sessions Just Work. `demoAutoLogin` signs in a seeded demo user (`retail-demo@nisir.test`, etc.) the first time a portal is mounted with no session — preserves the Protected Route gate without ever showing the Nisir login screen.
- **Routing**: MemoryRouter with `basename="/"` keeps Nisir's hardcoded `<Link to="/retail/accounts">` working. Browser URL stays at `/platform/nisir-retail`; portal navigation is internal.
- **What does NOT change**: zero edits to existing ABX files except `App.tsx` (no change needed — modules render via existing `/platform/:moduleId`), `ModuleRegistry.ts` (4 new entries), `ModuleHost.tsx` (4 new switch cases), `vite.config.ts` (1 alias rule), `tsconfig.json` (1 path).

## What I'm NOT doing (per your scope answer)

- Not porting Nisir's `/admin/*` console — ABX already has admin and you didn't include it.
- Not porting LandingPage / AuthPage / ProductShowcase — those are app shell, not portal modules.
- Not touching existing ABX modules (BankGPT, ABX, Smart Branch, etc.).

## Estimated size

Roughly 90+ file copies + 1 migration + 10 edge functions + ~7 new mount-layer files. This will run across **3–4 build loops** to stay within tool-call limits. After approval I'll start with Phase 1 (backend) so the schema is live before any UI lift.
