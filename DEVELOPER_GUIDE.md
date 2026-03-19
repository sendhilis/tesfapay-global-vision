# GlobalPay — Developer Handoff Guide

> **Audience:** Java / Spring Boot developers picking up a React + TypeScript front-end.
> This guide maps every key concept in this project to its Spring Boot equivalent so you can navigate the codebase quickly.

---

## 1. Technology Stack at a Glance

| Layer | This Project | Spring Boot Equivalent |
|---|---|---|
| Language | TypeScript (`.ts` / `.tsx`) | Java |
| Build tool | **Vite** (`vite.config.ts`) | Maven / Gradle |
| Dependency mgmt | `package.json` + npm | `pom.xml` / `build.gradle` |
| UI Framework | **React 18** | Thymeleaf / JSP (server-side) or Angular/Vaadin |
| Routing | **React Router v6** (`App.tsx`) | `@RequestMapping` / `@GetMapping` in controllers |
| Component library | **shadcn/ui** (`src/components/ui/`) | N/A — pre-built UI widgets |
| Styling | **Tailwind CSS** (`tailwind.config.ts`, `index.css`) | CSS / Bootstrap |
| State / Data fetch | **TanStack React Query** | `RestTemplate` / `WebClient` + Service layer |
| Form handling | **React Hook Form + Zod** | `@Valid` + Bean Validation (JSR-380) |
| Testing | **Vitest** | JUnit 5 |
| Charts | **Recharts** | N/A |

---

## 2. Project Structure — Spring Boot Mapping

```
src/
├── main.tsx                    ← Entry point (like Application.java @SpringBootApplication)
├── App.tsx                     ← Route definitions (like your @Controller classes combined)
├── index.css                   ← Global styles / design tokens
│
├── pages/                      ← "Controllers" — each file = one screen/route
│   ├── Index.tsx               ← Landing page (GET /)
│   ├── LoginPage.tsx           ← Login screen (GET /login)
│   ├── Onboarding.tsx          ← User registration flow
│   ├── ProductShowcase.tsx     ← Product showcase (GET /showcase)
│   ├── ProposalDocument.tsx    ← Proposal doc (GET /proposal)
│   │
│   ├── wallet/                 ← Wallet module (like a @Controller group)
│   │   ├── WalletLayout.tsx    ← Shared layout wrapper (like a base template)
│   │   ├── WalletHome.tsx      ← GET /wallet
│   │   ├── SendMoney.tsx       ← GET /wallet/send
│   │   ├── PayBills.tsx        ← GET /wallet/pay
│   │   └── ...                 ← Other wallet sub-pages
│   │
│   ├── admin/                  ← Admin console module
│   │   ├── AdminLayout.tsx     ← Sidebar + top bar wrapper
│   │   ├── AdminDashboard.tsx  ← GET /admin
│   │   ├── AdminUsers.tsx      ← GET /admin/users
│   │   └── ...
│   │
│   └── agent/                  ← Agent portal module
│       ├── AgentLayout.tsx     ← Mobile layout wrapper
│       ├── AgentHome.tsx       ← GET /agent
│       └── ...
│
├── components/                 ← Reusable UI widgets (like custom Thymeleaf fragments)
│   ├── ui/                     ← shadcn component library (Button, Dialog, Table, etc.)
│   ├── NavLink.tsx             ← Navigation link component
│   └── TesfaAI.tsx             ← AI assistant floating widget
│
├── hooks/                      ← Custom React Hooks (like @Service utility classes)
│   ├── use-mobile.tsx          ← Detects mobile viewport
│   └── use-toast.ts            ← Toast notification service
│
├── lib/
│   └── utils.ts                ← Utility functions (like a Utils.java helper class)
│
└── assets/                     ← Static images / logos
```

---

## 3. Key Concepts Mapped to Spring Boot

### 3.1 Routing (App.tsx → Controllers)

```tsx
// App.tsx — Think of this as ALL your @RequestMapping definitions in one place
<Routes>
  <Route path="/" element={<Index />} />           // GET /
  <Route path="/login" element={<LoginPage />} />   // GET /login
  
  {/* Nested routes = controller group with shared layout */}
  <Route path="/wallet" element={<WalletLayout />}>
    <Route index element={<WalletHome />} />         // GET /wallet
    <Route path="send" element={<SendMoney />} />    // GET /wallet/send
  </Route>
</Routes>
```

**Spring Boot equivalent:**
```java
@Controller
@RequestMapping("/wallet")
public class WalletController {
    @GetMapping
    public String home() { return "wallet/home"; }
    
    @GetMapping("/send")
    public String send() { return "wallet/send"; }
}
```

### 3.2 Layouts (WalletLayout, AdminLayout, AgentLayout)

These are **wrapper components** that provide shared UI (nav bars, sidebars). In Spring Boot, this is like a Thymeleaf layout template that all child pages inherit.

- `WalletLayout.tsx` — Mobile app shell with bottom navigation
- `AdminLayout.tsx` — Desktop dashboard with sidebar + top bar
- `AgentLayout.tsx` — Agent mobile app shell

The `<Outlet />` inside each layout is where child route content renders (like Thymeleaf's `th:replace` / `layout:fragment`).

### 3.3 Components (src/components/ → Reusable fragments)

Each `.tsx` file in `components/ui/` is a self-contained UI widget:

| Component | What It Does | Spring Equivalent |
|---|---|---|
| `Button` | Styled button with variants | `<button>` with CSS classes |
| `Dialog` | Modal popup | JavaScript modal |
| `Table` | Data table | `<table>` in Thymeleaf |
| `Card` | Container with shadow/border | `<div>` with Bootstrap card |
| `Toast/Sonner` | Notification popups | Flash messages |
| `Form` | Form with validation | `<form>` + `@Valid` |

### 3.4 State Management — No Backend Yet

> **IMPORTANT:** This project currently has **NO backend**. All data is hardcoded/mock. There is no database, no REST API, no authentication server.

When your team adds a Spring Boot backend, you will:

1. Create REST APIs (`@RestController`)
2. Replace mock data in React components with API calls using **React Query**:

```tsx
// Current: hardcoded data
const transactions = [{ id: 1, amount: 500 }, ...];

// Future: fetch from Spring Boot API
const { data: transactions } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => fetch('/api/transactions').then(r => r.json())
});
```

### 3.5 Hooks (src/hooks/ → Service/Utility classes)

React "hooks" are reusable logic functions (like `@Service` beans):

- `use-mobile.tsx` — Returns `true` if viewport is mobile (like a device detection service)
- `use-toast.ts` — Triggers toast notifications (like a notification service)

### 3.6 Styling (Tailwind CSS → CSS classes)

Instead of writing CSS files, Tailwind uses utility classes directly in HTML:

```tsx
// Tailwind (this project)
<div className="flex items-center gap-2 p-4 bg-primary text-primary-foreground rounded-xl">

// Equivalent CSS
// display: flex; align-items: center; gap: 0.5rem; padding: 1rem;
// background: var(--primary); color: var(--primary-foreground); border-radius: 0.75rem;
```

Design tokens are defined in `src/index.css` (CSS variables) and `tailwind.config.ts`.

---

## 4. How to Run the Project

```bash
# 1. Install Node.js 18+ (like installing JDK)
# 2. Install dependencies (like mvn install)
npm install

# 3. Start dev server (like mvn spring-boot:run)
npm run dev
# → Opens at http://localhost:5173

# 4. Run tests (like mvn test)
npm test

# 5. Build for production (like mvn package)
npm run build
# → Output in dist/ folder (like target/*.jar)
```

---

## 5. Module Overview

### 5.1 Wallet App (`/wallet/*`)
Mobile-first digital wallet with: Home dashboard, Send/Receive money, Bill payments, Airtime top-up, Merchant payments, Savings goals, Micro-loans, Cash in/out, Loyalty rewards, KYC upgrade, Transaction history, User profile.

### 5.2 Admin Console (`/admin/*`)
Desktop dashboard with: System overview, User & KYC management, Transaction monitoring, Agent/Merchant management, E-money management, Reports, Analytics.

### 5.3 Agent Portal (`/agent/*`)
Mobile agent interface with: Dashboard, Cash-in/Cash-out processing, Customer management, Commission tracking, Float management, Agent profile.

### 5.4 Supporting Pages
- `/` — Landing page
- `/login` — Login screen (mock, no real auth)
- `/onboarding` — User registration flow
- `/showcase` — Product showcase with PDF export
- `/proposal` — Functional specifications document
- `/install` — PWA install instructions

---

## 6. What Your Team Needs to Build (Backend)

This front-end is a **UI prototype**. To make it production-ready, your Spring Boot backend needs:

| Backend Service | Spring Boot Implementation | Connected Front-end Pages |
|---|---|---|
| Auth & Login | Spring Security + JWT | `LoginPage.tsx`, `Onboarding.tsx` |
| User Management | `UserController` + JPA | `AdminUsers.tsx`, `UserProfile.tsx` |
| Wallet/Accounts | `AccountController` + JPA | `WalletHome.tsx`, `SendMoney.tsx` |
| Transactions | `TransactionController` | `TransactionHistory.tsx`, `AdminTransactions.tsx` |
| KYC | `KycController` + file upload | `KYCUpgrade.tsx`, `AdminKYC.tsx` |
| Bill Payments | `BillPaymentController` | `PayBills.tsx` |
| Agent Operations | `AgentController` | `AgentCashIn.tsx`, `AgentCashOut.tsx` |
| Savings | `SavingsController` | `SavingsGoals.tsx` |
| Loans | `LoanController` | `MicroLoan.tsx` |
| Analytics | `AnalyticsController` | `AdminAnalytics.tsx`, `AdminReports.tsx` |

### API Integration Pattern

Replace mock data with `fetch()` or `axios` calls to your Spring Boot APIs:

```tsx
// In any page component, replace hardcoded data:
const stats = { balance: 15000, transactions: 47 }; // ← REMOVE

// With API calls:
import { useQuery } from '@tanstack/react-query';

const { data: stats, isLoading } = useQuery({
  queryKey: ['wallet-stats'],
  queryFn: async () => {
    const res = await fetch('http://your-api:8080/api/wallet/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
});
```

---

## 7. File-by-File Quick Reference

| File | Purpose | Lines | Complexity |
|---|---|---|---|
| `App.tsx` | All route definitions | ~110 | Low — just routing |
| `index.css` | Design system tokens | — | Low — CSS variables |
| `tailwind.config.ts` | Tailwind theme config | — | Low — config only |
| `WalletLayout.tsx` | Wallet app shell | ~70 | Low — nav + outlet |
| `AdminLayout.tsx` | Admin dashboard shell | ~115 | Medium — sidebar state |
| `AgentLayout.tsx` | Agent app shell | ~65 | Low — nav + outlet |
| `LoginPage.tsx` | Login UI with MPIN | ~90 | Medium — multi-step form |
| `ProductShowcase.tsx` | Showcase + PDF export | — | High — PDF generation |
| `ProposalDocument.tsx` | Full spec document | — | High — large document |
| `WalletHome.tsx` | Wallet dashboard | — | Medium — charts + cards |
| `AdminDashboard.tsx` | Admin overview | — | Medium — charts + stats |

---

## 8. Glossary for Java Developers

| React/JS Term | Java/Spring Equivalent |
|---|---|
| `component` | A class/bean that renders UI |
| `props` | Constructor arguments / method parameters |
| `state` (`useState`) | Instance fields that trigger re-render on change |
| `useEffect` | `@PostConstruct` / lifecycle callback |
| `useQuery` | `@Autowired` service call with caching |
| `hook` | Reusable service method |
| `JSX` / `TSX` | Template (Thymeleaf/JSP) embedded in code |
| `npm install` | `mvn install` |
| `npm run dev` | `mvn spring-boot:run` |
| `npm run build` | `mvn package` |
| `package.json` | `pom.xml` |
| `node_modules/` | `.m2/repository/` |
| `import` | `import` (same concept!) |
| `interface` (TS) | `interface` (Java — same concept!) |
| `async/await` | `CompletableFuture` / `@Async` |
| `fetch()` | `RestTemplate` / `WebClient` |
| `localStorage` | Client-side cookie/session |

---

## 9. Getting Help

- **React docs:** https://react.dev
- **TypeScript docs:** https://www.typescriptlang.org/docs
- **React Router:** https://reactrouter.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui components:** https://ui.shadcn.com
- **TanStack React Query:** https://tanstack.com/query
- **Vite:** https://vitejs.dev

---

*Document generated for the GlobalPay development team handoff.*
