import { useState } from "react";
import { Search, MapPin, Plus, Filter, TrendingUp, TrendingDown } from "lucide-react";

const agents = [
  { id: "AGT-001", name: "Dawit Haile", type: "Super-Agent", zone: "Addis - Bole", sub: 12, float: 485000, txnsToday: 142, commission: 12400, status: "active", kyc: "Level 2", rating: 4.8 },
  { id: "AGT-002", name: "Selamawit Girma", type: "Sub-Agent", zone: "Addis - Merkato", sub: 0, float: 120000, txnsToday: 89, commission: 5600, status: "active", kyc: "Level 2", rating: 4.6 },
  { id: "AGT-003", name: "Henok Tadesse", type: "Direct-Agent", zone: "Oromia - Adama", sub: 0, float: 95000, txnsToday: 64, commission: 3200, status: "active", kyc: "Level 2", rating: 4.5 },
  { id: "AGT-004", name: "Tigist Assefa", type: "Super-Agent", zone: "Amhara - Bahir Dar", sub: 8, float: 310000, txnsToday: 0, commission: 9100, status: "suspended", kyc: "Level 2", rating: 4.2 },
  { id: "AGT-005", name: "Yared Bekele", type: "Merchant", zone: "Addis - Piassa", sub: 0, float: 55000, txnsToday: 38, commission: 1800, status: "active", kyc: "Level 1", rating: 4.0 },
];

const statusColor: Record<string, string> = {
  active: "text-green-400 bg-green-500/10",
  suspended: "text-red-400 bg-red-500/10",
  pending: "text-gold bg-tesfa-gold/10",
};

const typeColor: Record<string, string> = {
  "Super-Agent": "text-gold bg-tesfa-gold/15",
  "Sub-Agent": "text-blue-400 bg-blue-500/15",
  "Direct-Agent": "text-green-400 bg-green-500/15",
  "Merchant": "text-purple-400 bg-purple-500/15",
};

const AdminAgents = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<typeof agents[0] | null>(null);

  const filtered = agents.filter(a =>
    (filter === "All" || a.type === filter || (filter === "Active" && a.status === "active") || (filter === "Suspended" && a.status === "suspended")) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.zone.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search))
  );

  if (selected) return (
    <div className="p-6 animate-slide-up">
      <button onClick={() => setSelected(null)} className="text-gold text-sm mb-4">← Back to Agents</button>
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-green flex items-center justify-center font-bold text-foreground">
              {selected.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <p className="font-display font-bold text-foreground">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.id}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusColor[selected.status]}`}>{selected.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Agent Type", value: selected.type },
            { label: "Zone", value: selected.zone },
            { label: "KYC Level", value: selected.kyc },
            { label: "Sub-Agents", value: selected.sub.toString() },
            { label: "Float Balance", value: `ETB ${selected.float.toLocaleString()}` },
            { label: "Commission (MTD)", value: `ETB ${selected.commission.toLocaleString()}` },
            { label: "Today's Txns", value: selected.txnsToday.toString() },
            { label: "Rating", value: `⭐ ${selected.rating}` },
          ].map(item => (
            <div key={item.label} className="glass rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="text-sm font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-gold rounded-2xl p-4 mb-4">
        <p className="text-xs text-gold font-bold mb-1">🤖 Global AI Agent Analysis</p>
        <p className="text-xs text-muted-foreground">This agent shows consistent performance. Float management is healthy. Consider offering float top-up credit to expand transaction capacity.</p>
      </div>

      <div className="flex gap-3">
        {selected.status === "active"
          ? <button className="flex-1 py-3 rounded-2xl text-xs font-bold glass text-red-400 border border-red-500/20">Suspend Agent</button>
          : <button className="flex-1 py-3 rounded-2xl text-xs font-bold glass text-green-400 border border-green-500/20">Activate Agent</button>
        }
        <button className="flex-1 py-3 rounded-2xl text-xs font-bold bg-gradient-gold text-tesfa-dark">View Transactions</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Agent & Merchant Management</h2>
          <p className="text-xs text-muted-foreground">3,842 active across 11 zones</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-gold text-tesfa-dark px-3 py-2 rounded-xl text-xs font-bold">
          <Plus className="w-3 h-3" /> Onboard
        </button>
      </div>

      {/* Zone summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { zone: "Addis Ababa", agents: 1842, trend: "+42 this week" },
          { zone: "Oromia", agents: 892, trend: "+18 this week" },
          { zone: "Amhara", agents: 420, trend: "+8 this week" },
        ].map(z => (
          <div key={z.zone} className="glass rounded-2xl p-3 text-center">
            <MapPin className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{z.agents}</p>
            <p className="text-[10px] text-muted-foreground">{z.zone}</p>
            <p className="text-[10px] text-green-400">{z.trend}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
          placeholder="Search agent name, ID, zone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {["All", "Active", "Suspended", "Super-Agent", "Sub-Agent", "Merchant"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(agent => (
          <button key={agent.id} onClick={() => setSelected(agent)} className="w-full glass rounded-2xl p-4 text-left hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-green flex items-center justify-center font-bold text-foreground text-xs flex-shrink-0">
                {agent.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{agent.name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColor[agent.type]}`}>{agent.type}</span>
                </div>
                <p className="text-xs text-muted-foreground">{agent.id} · {agent.zone}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColor[agent.status]}`}>{agent.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-bold text-gold">{agent.txnsToday}</p>
                <p className="text-[10px] text-muted-foreground">Txns Today</p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">ETB {(agent.float / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-muted-foreground">Float</p>
              </div>
              <div>
                <p className="text-xs font-bold text-green-400">ETB {(agent.commission / 1000).toFixed(1)}K</p>
                <p className="text-[10px] text-muted-foreground">Commission</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminAgents;
