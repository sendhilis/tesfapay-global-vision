# ABX Seamless Platform — Module Integration Guide

> Audience: Techurate product teams (Mobile Banking, Internet Banking, Smart
> Branch, Agency Banking, Reconciliation, GL, Cards, AML, BI, Switch).
> Goal: plug your existing **React frontend + Spring Boot microservice** into
> the ABX shell with the smallest possible diff and zero re-implementation
> of auth, theme, routing, or i18n.

---

## 1. The 3 files you must read before writing code

| File                                              | Why                                             |
| ------------------------------------------------- | ----------------------------------------------- |
| `src/platform/ModuleRegistry.ts`                  | Catalogue. Add **one entry** per module.        |
| `src/platform/ModuleHost.tsx`                     | Runtime mount point. You do **not** edit this.  |
| `src/components/wizard/steps/WMOD_Modules.tsx`    | Wizard toggle UI. Auto-renders from registry.   |

Backend equivalents:

| File                                                              | Why                                  |
| ----------------------------------------------------------------- | ------------------------------------ |
| `globalpay/gp-gateway/src/main/resources/application.yml`         | Add **one route block**.             |
| `backend-templates/common/security/JwtAuthFilter.java`            | Copy as-is into your service.        |
| `backend-templates/common/security/JwtTokenProvider.java`         | Copy as-is into your service.        |
| `globalpay/gp-wallet-service/`                                    | Reference implementation to clone.   |

---

## 2. Frontend integration (React + Module Federation)

### 2.1 The contract — `AbxModuleContext`

Every Techurate module exports **one** React component that accepts this
context object. The shell injects auth, theme, i18n, routing, and a
pre-configured API client — you never re-build them.

```ts
// @abx/platform-types  (will be published as a tiny npm package; for now
// copy this interface into your repo verbatim)
export interface AbxModuleContext {
  /** Valid ABX JWT, refreshed by the shell. */
  authToken: string;

  user: {
    id: string;
    name: string;
    role: "customer" | "agent" | "teller" | "csr" | "admin" | "auditor";
    bankId: string;
  };

  /** Live theme tokens — already applied to CSS vars by the shell. */
  theme: {
    primary: string;     // hsl
    accent: string;      // hsl
    radius: string;      // e.g. "0.75rem"
  };

  /** Full BankConfig (modules enabled, branding, limits, etc.). */
  bankConfig: Record<string, unknown>;

  i18n: {
    locale: "en" | "am";
    t: (key: string, vars?: Record<string, string | number>) => string;
  };

  /** Shell router — use this instead of window.location so deep links
   *  stay inside ABX chrome. */
  navigate: (path: string) => void;

  /** Axios instance pre-pointed at gp-gateway with JWT + tracing headers. */
  api: import("axios").AxiosInstance;
}
```

### 2.2 Step-by-step

#### Step 1 — Register your module (1 PR to the ABX repo)

Edit `src/platform/ModuleRegistry.ts` and flip your entry from `stub` → `live`,
filling in the two federation fields:

```ts
{
  id: "internet-banking",
  name: "Internet Banking",
  category: "channels",
  description: "Web banking portal for retail and SME customers.",
  icon: Globe,
  status: "live",
  route: "/platform/internet-banking",
  remoteEntry:   "https://ib.techurate.com/abx/remoteEntry.js",
  exposedModule: "./InternetBankingApp",
}
```

#### Step 2 — Expose your app via Module Federation

In **your own** React repo:

```bash
npm i -D @originjs/vite-plugin-federation
```

```ts
// your-repo/vite.config.ts
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "internet_banking",
      filename: "remoteEntry.js",
      exposes: {
        "./InternetBankingApp": "./src/AbxEntry.tsx",
      },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  build: { target: "esnext", modulePreload: false, cssCodeSplit: false },
});
```

#### Step 3 — Implement `AbxEntry.tsx`

```tsx
// your-repo/src/AbxEntry.tsx
import { Routes, Route } from "react-router-dom";
import type { AbxModuleContext } from "@abx/platform-types";
import Dashboard from "./pages/Dashboard";
import Accounts  from "./pages/Accounts";
import Transfers from "./pages/Transfers";

export default function InternetBankingApp(ctx: AbxModuleContext) {
  // Pass ctx down through your own provider; do NOT create your own
  // auth/theme/i18n providers — the shell already owns them.
  return (
    <AbxCtx.Provider value={ctx}>
      <Routes>
        <Route index            element={<Dashboard />} />
        <Route path="accounts"  element={<Accounts  />} />
        <Route path="transfers" element={<Transfers />} />
      </Routes>
    </AbxCtx.Provider>
  );
}
```

#### Step 4 — Deploy `remoteEntry.js`

`npm run build` produces `dist/remoteEntry.js` + chunks. Upload to your CDN
(S3/CloudFront, Nginx, etc.). The URL goes into `ModuleRegistry.ts` (Step 1).

That is the full frontend integration. **You do not edit `ModuleHost.tsx`** —
it switches automatically from the stub to a `React.lazy(() => loadRemote(mod))`
the moment `remoteEntry` is set.

### 2.3 Rules of the road (frontend)

- **Never** hard-code colors. Use CSS vars (`hsl(var(--primary))`) so wizard
  theme changes propagate live.
- **Never** call `fetch` directly against gateway. Use `ctx.api` so JWT,
  tracing (`x-correlation-id`), and retry logic are uniform.
- **Never** create your own `BrowserRouter`. The shell owns the root router;
  you mount under `/platform/<your-id>/*`.
- **Never** ship a duplicate copy of `react` / `react-dom` — `shared:` in the
  federation config keeps the singletons.
- Localize all strings via `ctx.i18n.t()`. English **and** Amharic are
  mandatory for customer-facing modules.

---

## 3. Backend integration (Spring Boot + gp-gateway)

### 3.1 The contract

1. Service registers with **Eureka** (`gp-discovery`) using a `gp-*` or
   service-specific name (e.g. `ib-account-service`).
2. Service trusts the **ABX JWT** — same `JWT_SECRET` env var as every
   other `gp-*` service.
3. All public traffic flows through **`gp-gateway`**. Your service is **not**
   exposed to the internet directly.
4. Cross-module communication uses **OpenFeign** (sync) or **Kafka** topic
   `abx.events` (async). Never reach into another module's database.
5. Your service owns its **own Postgres schema** (`ib_*`, `recon_*`, etc.).

### 3.2 Step-by-step

#### Step 1 — Register a gateway route (1 PR to ABX repo)

Edit `globalpay/gp-gateway/src/main/resources/application.yml`:

```yaml
- id: internet-banking-service
  uri: lb://ib-account-service          # Eureka name
  predicates:
    - Path=/v1/ib/**
  filters:
    - StripPrefix=1
    - JwtAuthFilter                     # already implemented in shell
```

#### Step 2 — Add Eureka + JWT to your Spring service

`pom.xml`:

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.5</version>
</dependency>
```

Copy these two files verbatim into your service:

- `backend-templates/common/security/JwtAuthFilter.java`
- `backend-templates/common/security/JwtTokenProvider.java`

`application.yml`:

```yaml
spring:
  application:
    name: ib-account-service
eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_CLIENT_SERVICEURL_DEFAULTZONE:http://gp-discovery:8761/eureka/}
jwt:
  secret: ${JWT_SECRET}                  # MUST match the shell's secret
```

#### Step 3 — Expose only `/v1/<id>/**`

Your controllers live under that prefix; the gateway strips `/v1` and
forwards. Everything else is internal.

```java
@RestController
@RequestMapping("/ib/accounts")
public class AccountController {
  @GetMapping("/{id}")
  public AccountDto get(@PathVariable UUID id, @AuthenticationPrincipal AbxUser u) { ... }
}
```

#### Step 4 — Emit events for cross-module flows

```java
kafkaTemplate.send("abx.events", new AbxEvent(
  "ib.transfer.completed",
  Map.of("userId", u.id(), "amount", amount, "currency", "ETB")
));
```

Other modules (Loyalty, Recon, AML) subscribe — no point-to-point coupling.

### 3.3 Rules of the road (backend)

- One service, one schema. Cross-schema reads = Feign client to the owner.
- All responses follow the envelope in `backend-templates/common/dto/`.
- All errors throw subclasses of the exceptions in
  `backend-templates/common/exception/` so the global handler maps them.
- Rate-limit-sensitive endpoints declare their own `RequestRateLimiter`
  filter in the gateway route.
- Audit-relevant actions publish to `abx.events` for the AML/Recon modules.

---

## 4. Day-1 checklist for a new module

```
Frontend repo
  □ npm i -D @originjs/vite-plugin-federation
  □ Add federation() to vite.config.ts, expose ./<Name>App
  □ Create src/AbxEntry.tsx implementing AbxModuleContext
  □ Build & deploy dist/remoteEntry.js to your CDN

ABX repo (one PR)
  □ Update src/platform/ModuleRegistry.ts entry:
      status: "live", remoteEntry, exposedModule
  □ Add route block to globalpay/gp-gateway/.../application.yml

Backend repo
  □ Register with gp-discovery (Eureka)
  □ Copy JwtAuthFilter + JwtTokenProvider from backend-templates/common/security
  □ Set JWT_SECRET env var to match shell
  □ Expose controllers under /v1/<your-id>/**
  □ Publish/subscribe abx.events for cross-module flows

Bank goes live
  □ Bank admin opens ABX wizard → W-MOD Platform Modules
  □ Toggles your module on → bank_configs.enabled_modules updated
  □ ModuleHost auto-loads your remoteEntry — no redeploy of the shell
```

---

## 5. What ABX owns vs what you own

| Concern         | Owned by ABX shell (built once)                   | Owned by your module                  |
| --------------- | ------------------------------------------------- | ------------------------------------- |
| Auth / JWT      | `gp-auth-service` + `JwtAuthFilter`               | Trust the token, read claims          |
| Theming         | `BankConfigContext` + CSS tokens                  | Use `ctx.theme`, no hard colors       |
| Routing chrome  | `WalletLayout` / `AdminLayout` + `ModuleHost`     | Render inside the slot                |
| i18n (EN/AM)    | Shell i18n bundle                                 | Provide keys, use `ctx.i18n.t()`      |
| API gateway     | `gp-gateway` routes + rate-limit                  | Expose `/v1/<id>/**` only             |
| Event bus       | Kafka `abx.events` topic                          | Publish/subscribe your domain events  |
| Wizard toggle   | `WMOD_Modules.tsx` + `enabled_modules` JSONB      | Register once in `ABX_MODULES`        |
| Observability   | Prometheus + correlation IDs at gateway           | Emit Micrometer metrics               |

Each team ships, deploys, and versions independently — the customer still
sees **one ABX**.

---

## 6. Need help?

- Reference frontend module:  `src/components/wizard/equb/EqubDemo.tsx`
  (shows how to consume shell context, theming, i18n).
- Reference Spring service:   `globalpay/gp-wallet-service/`
  (canonical layout — copy and rename).
- Reference gateway route:    `globalpay/gp-gateway/src/main/resources/application.yml`
  (every existing route is a working example).
- Architecture deep-dive:     `MICROSERVICES_ARCHITECTURE.md`
- API envelope & errors:      `API_CONTRACT.md`

Ship small, ship federated, ship seamless.
