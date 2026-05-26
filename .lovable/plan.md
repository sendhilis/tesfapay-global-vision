# BankGPT Configure + Agent Builder

The current BankGPT module screen only shows the AI Mesh demo + Analytics. The "Configure" panel (`BankGPTSettings.tsx`) with on/off toggles only opens from the W-MOD Configure drawer, so admins inside `/platform/bankgpt` cannot see it. We'll fix that and add a full Agent Builder so the bank has end-to-end flexibility.

## 1. Surface Configure inside BankGPT view

Add a third tab **Configure** to `BankGPTView.tsx`:
- AI Mesh roster — embed `BankGPTSettings` (on/off + locked + tone preview)
- Quick links to deeper editors (persona, KB, sandbox)

Tabs become: **AI Mesh | Configure | Agent Builder | Analytics**

## 2. Agent Builder (new) — `BankGPTAgentBuilder.tsx`

A wizard-style, 6-step flow per agent (existing OR new):

1. **Identity & Persona**
   - Name, tagline, emoji/initial, brand color
   - Role description, system prompt (with template suggestions)
   - Tone sliders (formal↔casual, terse↔verbose, reserved↔expressive)
   - Language coverage (EN / አማ / both)
   - Use-emoji toggle, handoff message, greeting on handoff

2. **Intent & Routing**
   - Keywords / trigger phrases (chips)
   - Sample utterances (5–10 examples)
   - Confidence threshold slider
   - Handoff rules (when to escalate to which agent / human)

3. **Knowledge Base (RAG)**
   - Upload docs (PDF, DOCX, TXT, URL) — list view with status
   - Chunk size / overlap controls (sensible defaults)
   - "Index now" button → simulated embedding progress, doc count, token count, last indexed timestamp
   - Per-doc enable/disable, re-index, delete
   - Retrieval settings: top-K, similarity threshold, hybrid (BM25 + vector) toggle

4. **Tools & Actions**
   - Toggleable capabilities: read balance, move money, open savings goal, buy T-Bill, repay loan, raise complaint, send notification, fetch transactions, generate chart
   - Per-tool approval policy: auto / require confirmation / admin-only
   - Daily/transaction limits per tool

5. **Sandbox Testing**
   - Split view: chat window on left, "what the agent sees" inspector on right (matched KB chunks, routed intent, tool calls, latency)
   - Preset test scenarios (e.g. "Customer asks for loan eligibility", "Customer wants to move 1000 ETB to goal")
   - Pass/fail tagging, save test runs as regression cases
   - "Promote to production" button (gated)

6. **Widget & Deployment**
   - Widget preview (floating bubble, inline card, full-screen)
   - Placement picker: which screens in host app (Home, Wallet, Loans, Cards, Investments)
   - Trigger rules (idle 5s, low balance event, post-transaction, salary credit)
   - Embed snippet (copy-paste JS for host bank app) + Capacitor deep-link
   - Activation toggle + go-live checklist (persona ✓, KB indexed ✓, sandbox passed ✓, widget placed ✓)

## 3. Data model (client-side, persisted via BankConfigContext)

Extend `config.ai.mesh.agents[id]` with:
```
knowledgeBase: { docs: [{ id, name, type, size, status, indexedAt, enabled }], chunkSize, overlap, topK, similarityThreshold, hybrid }
intents: { keywords[], sampleUtterances[], confidenceThreshold, handoffRules[] }
tools: { [toolId]: { enabled, approvalPolicy, dailyLimit } }
sandbox: { testRuns: [{ id, prompt, expected, actual, passed, timestamp }] }
widget: { surfaces[], triggers[], style, enabled }
goLive: { personaComplete, kbIndexed, sandboxPassed, widgetPlaced }
```

For brand-new agents, push into `agents` map with a generated id and same shape (no `locked: true`).

## 4. UX

- Agent Builder opens with **agent picker** (existing roster + "+ New agent" card)
- Each step is a left-rail with progress dots; right panel is the editor
- Footer always shows: Save Draft / Test in Sandbox / Activate
- All persisted to BankConfigContext → flows through to live `mesh-chat` edge function (which already reads agent config from payload)

## 5. Critical analysis note shown in Configure tab

A small "Bank Flexibility Checklist" callout listing what the bank CAN configure (persona, KB, tools, routing, widgets, limits, languages, branding) — so admins immediately see BankGPT's full surface area.

## Files

- **edit** `src/components/wizard/modules/BankGPTView.tsx` — add Configure + Agent Builder tabs
- **new** `src/components/wizard/modules/bankgpt/AgentBuilder.tsx` — wizard shell + agent picker
- **new** `src/components/wizard/modules/bankgpt/steps/StepPersona.tsx`
- **new** `src/components/wizard/modules/bankgpt/steps/StepIntents.tsx`
- **new** `src/components/wizard/modules/bankgpt/steps/StepKnowledgeBase.tsx`
- **new** `src/components/wizard/modules/bankgpt/steps/StepTools.tsx`
- **new** `src/components/wizard/modules/bankgpt/steps/StepSandbox.tsx`
- **new** `src/components/wizard/modules/bankgpt/steps/StepWidget.tsx`
- **edit** `src/contexts/BankConfigContext.tsx` — extend agent schema with KB/intents/tools/widget/goLive (optional fields, backward-compatible)

No backend changes required — RAG/embedding is simulated in the prototype (matches the rest of the app's localStorage-based demo state). The hooks are designed so the future Spring Boot backend can plug straight in.

Approve to build.
