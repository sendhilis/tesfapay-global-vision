/**
 * BankGPTView — Tabbed shell embedding the BankGPT AI Mesh demo and
 * the admin Analytics dashboard inside the /platform/bankgpt screen.
 */
import { useState } from "react";
import { MessageSquare, BarChart3 } from "lucide-react";
import { BankGPTMesh } from "./BankGPTMesh";
import AdminBankGPTAnalytics from "@/pages/admin/AdminBankGPTAnalytics";

type Tab = "mesh" | "analytics";

export function BankGPTView() {
  const [tab, setTab] = useState<Tab>("mesh");

  return (
    <div className="space-y-4">
      <div className="inline-flex gap-1 glass rounded-xl p-1">
        <TabButton active={tab === "mesh"} onClick={() => setTab("mesh")} icon={MessageSquare} label="AI Mesh" />
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={BarChart3} label="Analytics" />
      </div>

      {tab === "mesh" ? (
        <BankGPTMesh />
      ) : (
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
