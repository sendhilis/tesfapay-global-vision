## ABX Platform Console — Module Integration Guide

The ABX Platform Console mounts external/federated apps inside the shell
through `src/platform/ModuleRegistry.ts` and `src/platform/ModuleHost.tsx`.

Three integration routes are supported, in priority order:

1. **`iframeUrl`** — module registry entry sets `iframeUrl` to a fully-qualified
   URL. `ModuleHost` mounts it in a sandboxed iframe. **Preferred** for live
   Techurate apps hosted at their own origin (own React build, own Spring Boot
   backend). No code change needed in the shell to swap targets — set the env
   var and rebuild.
2. **Bundled Nisir portal** — `id` is in `NISIR_PORTAL_MAP` in `ModuleHost.tsx`
   and `iframeUrl` is unset. Renders the in-repo Nisir portal under `/_nisir/*`.
3. **Module Federation stub** — neither `iframeUrl` nor a Nisir mapping. Shows a
   "Coming soon" stub until `remoteEntry` + `exposedModule` are wired.

---

### Route 1 — Replace Mobile Banking with the live Techurate ABX Core app

The `mobile-banking` module reads its iframe URL from `VITE_ABX_MB_URL`:

```ts
// src/platform/ModuleRegistry.ts (mobile-banking entry)
iframeUrl: import.meta.env.VITE_ABX_MB_URL as string | undefined,
```

#### Steps for the Techurate team

1. **Host the ABX Core Mobile Banking React app** at a stable HTTPS URL.
   Example: `https://abx-mb.techurate.example/` (UAT) and a separate URL for
   prod. App must be reachable from the user's browser (not just the shell).
2. **Send back the URL** to the ABX shell team.
3. **Set the env var** in the shell's deployment environment:

   ```bash
   # .env (UAT)
   VITE_ABX_MB_URL=https://abx-mb.techurate.example/
   ```

   Rebuild the shell. When unset, the module falls back to the bundled Nisir
   retail portal automatically — safe default.

#### Server-side requirements on the Techurate app

For the iframe to load successfully, the Techurate app's web server must:

- **Allow framing from the shell origin.** Either omit `X-Frame-Options` or set
  `Content-Security-Policy: frame-ancestors https://abxwallet.techurate.world https://*.lovable.app;`
  Without this, browsers will refuse to render the iframe.
- **Serve HTTPS** with a valid cert (no mixed content).
- **CORS** is not required for iframe rendering itself, but is required for any
  `fetch`/XHR the embedded app makes back to its own backend from inside the
  iframe (same-origin to its own backend is simplest).
- **Cookies** used for session/SSO should be `SameSite=None; Secure` so they
  survive cross-site iframe context.

#### Smoke test

1. Open the shell, sign in, go to **Launchpad → Mobile Banking**.
2. The Techurate app should render inside the card area instead of the Nisir
   retail portal.
3. DevTools → Network: confirm the iframe request to `VITE_ABX_MB_URL` returns
   `200` with no `X-Frame-Options: DENY` / `SAMEORIGIN` blocking.
4. DevTools → Console: confirm no "Refused to display … in a frame" errors.

#### Feedback template (for the Techurate team to fill in)

| Item | Value / Result |
|---|---|
| Hosted URL (UAT) | `https://________________________________` |
| Hosted URL (PROD) | `https://________________________________` |
| HTTPS valid cert | ☐ Yes ☐ No |
| `X-Frame-Options` header | ☐ Not set ☐ Other: ________ |
| `frame-ancestors` CSP | `________________________________` |
| Cookies `SameSite=None; Secure` | ☐ Yes ☐ No |
| Login works inside iframe | ☐ Yes ☐ No — notes: ________ |
| Logout / session expiry works | ☐ Yes ☐ No |
| Money transfer end-to-end | ☐ Yes ☐ No |
| Mobile viewport (375×812) usable | ☐ Yes ☐ No |
| Console errors | ________________________________ |
| Sign-off (Techurate lead) | ________________________________ |
| Sign-off (ABX shell lead) | ________________________________ |

---

### Route 2 — Use a bundled in-repo portal

Add the module `id` to `NISIR_PORTAL_MAP` in `ModuleHost.tsx`. Used only for
the legacy Nisir portals shipped inside this repo.

### Route 3 — Module Federation (future)

Set `remoteEntry` and `exposedModule` on the registry entry. `ModuleHost` will
load it with `React.lazy` once federation wiring is added. Preferred long-term
route for deep theming + shared auth context.
