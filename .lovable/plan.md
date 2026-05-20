## Goal

Make the **ABX Setup Wizard** the first thing a bank admin sees when they open GlobalPay. As the bank fills it in, the **GlobalPay wallet** rebrands itself live (colors, fonts, radius, navigation, home layout, KYC method, products, AI tone, Ethiopia features, etc.) so the bank can preview their own branded app while still in the wizard.

## Tech reality

The ABX project runs on **TanStack Start**; GlobalPay runs on **Vite + React Router**. So this is a **port**, not a copy. The wizard logic, state shape, and UI translate cleanly — only the routing layer changes.

## What I'll bring over

1. `WizardContext` (state, persistence, 36-step navigation, `BankConfig` shape) — ported 1:1.
2. `wizard-config.ts` (10 modules · 36 steps definitions) — copied as-is.
3. `WizardShell`, `WizardSidebar`, `PreviewPanel`, `AbxLogo` — ported; CSS variables (`--ink`, `--teal`, `--cream`, `--line`, `--background`) added to `index.css` so the wizard keeps ABX's editorial look.
4. `steps.tsx` (W01–W36, ~1.2k lines) — copied whole.

## How it lights up GlobalPay

Add a new `BankConfigContext` that **reads the same `abx.wizard.v1` localStorage key** the wizard writes to. The wallet subscribes to it and:

- Pushes `brand.primaryColor / secondaryColor / surfaceColor / background / text*` into CSS vars (`--primary`, `--accent`, `--background`, `--foreground`) as HSL on every change.
- Swaps `bank.name`, `bank.shortName`, `bank.tagline`, `bank.logoLabel` into `WalletLayout` top bar, `Index`, `LoginPage`, `Onboarding`.
- Reflects `ux.navigationStyle` (bottom-tabs / side-drawer / floating-hub / ai-first) in `WalletLayout`'s nav.
- Reflects `ux.homeScreenLayout` (balance-hero / card-grid / feed / agent-chat) in `WalletHome`.
- Reflects `ux.cardStyle`, `ux.density`, `ux.animationLevel`, `brand.borderRadius`, `brand.shadowStyle` via Tailwind class tokens.
- Reflects `ux.darkModeSupport`, `ux.rtlSupport`.
- Wires `onboarding.kycMethod` + `livenessCheckEnabled` + `selfieRequired` into `KYCUpgrade` (so the bank can flip Voice KYC ↔ Video KYC ↔ Fayda and see it in the wallet preview).
- Replaces `products` array used in `WalletHome` / `MicroLoan` cards.
- Surfaces `ai.tone` + active `agents` inside `TesfaAI`.
- Drives Ethiopia features (Fayda, Eth-Switch, calendar, NBE reports) in `AdminReports` / `AdminEMoney` views.

Same-tab updates are immediate (React state); cross-tab updates use the `storage` event so the preview phone updates as the wizard is filled.

## Routes

```text
/setup            → WizardShell (new first-engagement screen for bank admin)
/setup/preview    → Mobile preview frame embedding the live wallet
/                 → Index (existing) — adds a "Bank setup wizard" CTA when no BankConfig is published yet
/wallet/*         → reads BankConfig and rebrands live
/admin/*          → unchanged, gains a "Re-open setup wizard" link in AdminLayout
```

The wizard's "Complete & Go Live" sets a `published: true` flag in localStorage so subsequent visits land directly on the branded wallet.

## File plan

New:
- `src/contexts/BankConfigContext.tsx` (wizard state + applies CSS vars + persists)
- `src/lib/wizard-config.ts` (steps + modules)
- `src/components/wizard/AbxLogo.tsx`
- `src/components/wizard/WizardShell.tsx`
- `src/components/wizard/WizardSidebar.tsx`
- `src/components/wizard/PreviewPanel.tsx` (renders `<WalletHome />` inside an iPhone frame)
- `src/components/wizard/steps.tsx` (W01–W36, ported)
- `src/pages/SetupWizard.tsx` (route wrapper)

Edited:
- `src/App.tsx` — add `BankConfigProvider`, add `/setup` route, redirect `/` to `/setup` when not yet published.
- `src/index.css` — add ABX wizard CSS vars + branding CSS-var bridge.
- `src/pages/wallet/WalletLayout.tsx` — bank name, logo label, nav-style switch.
- `src/pages/wallet/WalletHome.tsx` — home-screen-layout switch, products from config.
- `src/pages/wallet/KYCUpgrade.tsx` — kycMethod-driven flow selector.
- `src/components/TesfaAI.tsx` — tone + active agents from config.
- `src/pages/admin/AdminLayout.tsx` — "Re-open setup wizard" link.

## Non-goals (so I don't over-reach)

- I won't touch the backend templates / Spring Boot folders.
- I won't restyle every existing wallet page pixel-perfectly to every wizard option — I'll wire the high-impact tokens (colors, fonts, radius, nav, home layout, KYC, products, AI tone). Fine-grained per-screen variants can come after you confirm the architecture works.
- I won't add a real auth wall on `/setup`; the wizard's W01 "Welcome & Auth" stays a click-through, matching the source project.

## Order of execution

1. Add CSS vars + `BankConfigContext` + route scaffolding (wallet still works, no wizard yet).
2. Port `wizard-config.ts`, shell, sidebar, preview panel, logo.
3. Port `steps.tsx` whole.
4. Wire the live-bridge: CSS-var injection + wallet layout/home/KYC/AI reading from config.
5. Quick QA pass: open `/setup`, change primary color → wallet repaints; change bank name → top bar updates; change KYC method → KYC page changes; click Go Live → redirect to `/wallet`.
