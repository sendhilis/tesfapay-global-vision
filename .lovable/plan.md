# Wizard Redesign: Theme-First Model

## The Problem

Today the wizard exposes ~36 freeform inputs (hex pickers, font dropdowns, layout toggles). A bank admin can produce visually broken combinations, and even when they don't, the **wallet preview never visibly transforms** because the wizard's outputs are too granular and unopinionated to make the wallet *feel* different. The user sees "old wallet UI" because individually swapping `--primary` doesn't restructure layout, type scale, card shape, motion, or imagery — it just retints.

## The Fix: ABX-Curated Themes + Bounded Overrides

Replace freeform design choices with **4 ABX-designed themes**. Each theme is a complete, opinionated design system (palette + typography + radius + shadow + density + motion + home layout + card style + nav style + imagery). Banks pick one theme, then customize **only inside the safe envelope** of that theme — primary accent shift (within hue family), bank name/logo/tagline, product list, AI tone. No raw hex pickers, no font dropdowns, no layout selector.

### The 4 ABX Themes

| Theme | Vibe | Palette | Type | Radius | Density | Home Layout | Nav |
|-------|------|---------|------|--------|---------|-------------|-----|
| **Emerald Heritage** | Ethiopian premium banking (current GlobalPay) | Deep green + gold | Sora / Plus Jakarta | 24px | Comfortable | Hero balance + grid | Bottom tabs |
| **Indigo Modern** | Fintech challenger | Indigo + white | Space Grotesk / Inter | 16px | Compact | Compact cards + list | Bottom tabs |
| **Onyx Premium** | Private banking | Black + champagne gold | Cormorant / Inter | 8px | Spacious | Minimal hero + list | Floating hub |
| **Coral Daily** | Mass-market youth | Coral + cream | Outfit / Figtree | 32px | Comfortable | Stories + bento | Bottom tabs |

Each theme ships its own CSS token block, font pair, motion register, and wallpaper/gradient.

### What the Wizard Becomes

Drop the 36-step monster down to a focused flow:

1. **W01** Welcome
2. **W02** Bank identity (name, short name, tagline, logo)
3. **W03** **Pick your theme** — 4 large visual cards rendering an actual mini-wallet preview for each theme (not swatches — real UI)
4. **W04** Accent tuning — slider that shifts theme's primary within its hue family (±20°) + light/dark mode toggle. No raw hex.
5. **W05** Home layout variant — 2-3 theme-approved variants only (e.g. Emerald offers "Hero+Grid" or "Stacked Cards")
6. **W06** Products (existing card builder — keep)
7. **W07** AI tone (existing — keep)
8. **W08** Onboarding / KYC method (existing — keep)
9. **W09** Compliance (Fayda, NBE — keep)
10. **W10** Review & Go Live — full-wallet preview, then publish

All the freeform M1/M2 steps (W07 colour picker, W08 7-colour palette, W09 font picker, W10 visual style, W11 nav style, W12 home layout, W13 interaction, W14 UX details) **collapse into W03+W04+W05** above. The persona/branch/process/Ethiopia modules either stay as-is (compliance, branches) or get hidden behind an "Advanced" disclosure.

### Why The Preview Will Actually Change Now

Each theme overrides **the full token surface** the wallet reads:
- All semantic colors (`--primary`, `--background`, `--card`, `--foreground`, `--muted`, `--border`, `--accent`, plus legacy `--tesfa-gold`, `--tesfa-green`, `--gradient-green`, `--gradient-gold`)
- Font family for body + display
- `--radius` (drives every rounded-* class)
- Shadow tokens
- Density scale (drives padding via a `data-density` attribute on `<html>`)
- A `data-theme` attribute on `<html>` so theme-specific CSS rules can target structural changes (e.g. `[data-theme="onyx"] .wallet-card { border-radius: 4px; backdrop-filter: blur(20px); }`)

The wallet's `WalletHome` reads `data-theme` to pick between 2-3 home-layout variants the chosen theme allows. Same for `WalletLayout` nav style.

## Technical Details

### New files
- `src/lib/abx-themes.ts` — the 4 theme definitions (tokens, font pair, allowed layout variants, accent hue range)
- `src/components/wizard/ThemePickerCard.tsx` — renders mini-wallet preview per theme
- `src/components/wizard/AccentTuner.tsx` — hue-shift slider bounded to theme
- `src/components/wallet/HomeVariants/` — 2-3 home layout components selectable per theme

### Edited files
- `src/lib/wizard-config.ts` — collapse STEPS to ~10 entries
- `src/contexts/BankConfigContext.tsx` — add `themeId`, `accentShift`, `homeVariant`; `applyBrandTokens` writes full token surface + `data-theme` + `data-density` attrs
- `src/components/wizard/steps.tsx` — new W03/W04/W05 step components; delete now-obsolete steps
- `src/index.css` — add theme-scoped rules `[data-theme="emerald"|"indigo"|"onyx"|"coral"] { ... }` for structural differences not expressible via tokens
- `src/pages/wallet/WalletHome.tsx` — read `themeId` + `homeVariant`, switch between layout components
- `src/pages/wallet/WalletLayout.tsx` — switch nav style per theme

### Migration
Existing localStorage configs without `themeId` default to `"emerald"` (current look). No breaking change for the demo.

### Out of scope this round
- Persona-specific UX overrides (W18)
- Custom workflow builder (W31)
- Branch map (W28)

Those stay in their current state; the focus is making theme selection actually transform the wallet.

## Outcome

After the bank admin completes the new wizard:
- Picks "Onyx Premium" → wallet repaints to black/gold, sharp 4px corners, serif headings, floating nav hub, minimal hero
- Picks "Coral Daily" → wallet repaints to coral/cream, 32px pillowy cards, stories row at top, bottom tabs
- Picks "Indigo Modern" → tight 16px cards, list-style home, Inter throughout
- The preview is dramatically, obviously different per theme — no more "looks the same as before"
