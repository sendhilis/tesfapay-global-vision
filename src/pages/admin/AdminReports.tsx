import { useState } from "react";
import { Download, Filter, FileText, TrendingUp, Users, Zap, ShoppingBag } from "lucide-react";

const reportCategories = [
  {
    id: "customer",
    label: "Customer Reports",
    icon: Users,
    color: "bg-blue-500/15 text-blue-400",
    reports: [
      { name: "Customer Transaction Summary", period: "Daily/Weekly/Monthly" },
      { name: "Customer Balance Report", period: "Real-time" },
      { name: "KYC Status Report", period: "On-demand" },
      { name: "Customer 360 Profile", period: "On-demand" },
      { name: "Loyalty Points Statement", period: "Monthly" },
    ],
  },
  {
    id: "agent",
    label: "Agent/Merchant Reports",
    icon: Zap,
    color: "bg-gold/15 text-gold",
    reports: [
      { name: "Agent Transaction Volume", period: "Daily" },
      { name: "Agent Commission Statement", period: "Monthly" },
      { name: "Agent Float Balance", period: "Real-time" },
      { name: "Merchant Payment Report", period: "Daily" },
      { name: "Sub-Agent Performance", period: "Weekly" },
    ],
  },
  {
    id: "general",
    label: "General Reports",
    icon: FileText,
    color: "bg-green-500/15 text-green-400",
    reports: [
      { name: "Transaction Volume by Product", period: "Daily/Monthly" },
      { name: "Service Usage Statistics", period: "Monthly" },
      { name: "Onboarding Performance", period: "Weekly" },
      { name: "Fraud & Risk Report", period: "Daily" },
      { name: "Regulatory Compliance Report", period: "Monthly" },
    ],
  },
  {
    id: "financial",
    label: "Fee & Commission Reports",
    icon: TrendingUp,
    color: "bg-purple-500/15 text-purple-400",
    reports: [
      { name: "System Wallet Fees", period: "Daily" },
      { name: "Commission Payable to Agents", period: "Monthly" },
      { name: "UCP Policy Performance", period: "Monthly" },
      { name: "Tax Report", period: "Monthly" },
    ],
  },
  {
    id: "emoney",
    label: "EMoney Summary",
    icon: ShoppingBag,
    color: "bg-orange-500/15 text-orange-400",
    reports: [
      { name: "EMoney Issuance Report", period: "Daily" },
      { name: "Trust Account Reconciliation", period: "Daily" },
      { name: "Cash In / Cash Out Summary", period: "Daily" },
      { name: "EMoney Float by Zone", period: "Weekly" },
    ],
  },
];

const recentReports = [
  { name: "Customer Transaction Summary", generated: "Today 08:00", size: "2.4 MB", format: "Excel" },
  { name: "Agent Commission Statement — Jan 2026", generated: "Feb 1, 08:00", size: "1.1 MB", format: "PDF" },
  { name: "EMoney Reconciliation — Feb 18", generated: "Yesterday 06:00", size: "512 KB", format: "PDF" },
  { name: "Fraud Risk Report", generated: "Today 06:00", size: "890 KB", format: "Excel" },
];

const AdminReports = () => {
  const [activeCategory, setActiveCategory] = useState("customer");
  const [generating, setGenerating] = useState<string | null>(null);

  const active = reportCategories.find(r => r.id === activeCategory)!;

  const handleGenerate = (name: string) => {
    setGenerating(name);
    setTimeout(() => setGenerating(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Reports</h2>
          <p className="text-xs text-muted-foreground">All 6 report categories · Scheduled & on-demand</p>
        </div>
        <button className="flex items-center gap-2 glass px-3 py-2 rounded-xl text-xs text-muted-foreground">
          <Filter className="w-3 h-3" /> Filters
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {reportCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeCategory === cat.id ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Active category */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active.color}`}>
            <active.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{active.label}</p>
            <p className="text-xs text-muted-foreground">{active.reports.length} report types</p>
          </div>
        </div>

        <div className="space-y-2">
          {active.reports.map(report => (
            <div key={report.name} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{report.name}</p>
                <p className="text-xs text-muted-foreground">{report.period}</p>
              </div>
              <button
                onClick={() => handleGenerate(report.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  generating === report.name
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gradient-gold text-tesfa-dark"
                }`}
              >
                {generating === report.name ? "✓ Done" : <><Download className="w-3 h-3" /> Generate</>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analytics */}
      <div className="glass-gold rounded-2xl p-4">
        <p className="text-xs text-gold font-bold mb-2">🤖 Tesfa AI — Smart Reports</p>
        <p className="text-xs text-muted-foreground mb-3">AI-driven dashboards with Customer 360, profitability analysis, and agent performance scores. Powered by real-time data.</p>
        <div className="grid grid-cols-2 gap-2">
          {["Customer 360", "AI Risk Score Dashboard", "Agent Performance AI", "Onboarding Funnel"].map(d => (
            <button key={d} className="glass rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground text-left hover:border-tesfa-gold/30 border border-border transition-colors">
              📊 {d}
            </button>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div className="glass rounded-2xl p-5">
        <p className="font-display font-bold text-sm text-foreground mb-4">Recently Generated</p>
        <div className="space-y-3">
          {recentReports.map(r => (
            <div key={r.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.format === "PDF" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                  {r.format}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.generated} · {r.size}</p>
                </div>
              </div>
              <button className="p-1.5 glass rounded-lg">
                <Download className="w-3.5 h-3.5 text-gold" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
