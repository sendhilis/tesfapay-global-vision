/**
 * BankGPTView — Tabbed shell embedding the BankGPT AI Mesh demo,
 * Configure (on/off toggles), Agent Builder (full lifecycle wizard)
 * and Analytics dashboard inside /platform/bankgpt.
 */
import { useState } from "react";
import { MessageSquare, BarChart3, SlidersHorizontal, Sparkles, ShieldCheck, Users, Database, Calculator } from "lucide-react";
import { BankGPTMesh } from "./BankGPTMesh";
import { BankGPTSettings } from "./BankGPTSettings";
import { AgentBuilder } from "./bankgpt/AgentBuilder";
import { CouncilMode } from "./bankgpt/CouncilMode";
import { CDPDashboard } from "./bankgpt/cdp/CDPDashboard";
import { CostSimulator } from "./bankgpt/CostSimulator";
import AdminBankGPTAnalytics from "@/pages/admin/AdminBankGPTAnalytics";

type Tab = "mesh" | "council" | "cdp" | "configure" | "builder" | "cost" | "analytics";

export function BankGPTView() {
  const [tab, setTab] = useState<Tab>("mesh");

  return (
    <div className="space-y-4">
      <div className="inline-flex gap-1 glass rounded-xl p-1 flex-wrap">
        <TabButton active={tab === "mesh"}      onClick={() => setTab("mesh")}      icon={MessageSquare}     label="AI Mesh" />
        <TabButton active={tab === "council"}   onClick={() => setTab("council")}   icon={Users}             label="Council Mode" />
        <TabButton active={tab === "cdp"}       onClick={() => setTab("cdp")}       icon={Database}          label="CDP" />
        <TabButton active={tab === "configure"} onClick={() => setTab("configure")} icon={SlidersHorizontal} label="Configure" />
        <TabButton active={tab === "builder"}   onClick={() => setTab("builder")}   icon={Sparkles}          label="Agent Builder" />
        <TabButton active={tab === "cost"}      onClick={() => setTab("cost")}      icon={Calculator}        label="Cost Simulator" />
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={BarChart3}         label="Analytics" />
      </div>

      {tab === "mesh" && <BankGPTMesh />}
      {tab === "council" && <CouncilMode />}
      {tab === "cdp" && <CDPDashboard />}
      {tab === "configure" && (
        <div className="space-y-4">
          <FlexibilityChecklist />
          <BankGPTSettings />
        </div>
      )}
      {tab === "builder" && <AgentBuilder />}
      {tab === "cost" && <CostSimulator />}
      {tab === "analytics" && (
        <div className="-mx-6">
          <AdminBankGPTAnalytics />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
        active ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function FlexibilityChecklist() {
  const items = [
    "Activate or pause any agent in the mesh",
    "Edit persona, tone, system prompt and brand color",
    "Ground replies in your own docs (PDF / DOCX / URL) via RAG",
    "Wire bank tools with per-action approval policies & limits",
    "Sandbox-test every agent before customers see it",
    "Deploy as bubble, inline card or full-screen widget on any host screen",
    "Trigger proactively on idle, low balance, salary credit or post-txn",
    "Bilingual EN + አማ out of the box; add custom agents at any time",
  ];
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-tesfa-gold mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">Bank flexibility — what you control</p>
          <p className="text-[11px] text-muted-foreground mb-3">
            BankGPT is built so your team owns every dimension of agent behaviour. No vendor lock-in on prompts,
            knowledge or routing.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
            {items.map((i) => (
              <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <span className="text-tesfa-gold mt-0.5">✓</span>{i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
