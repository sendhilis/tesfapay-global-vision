/**
 * AdminUsers — User management table with search and filters.
 *
 * @route /admin/users
 * @module Admin Console
 *
 * @description Paginated data table of all registered users with columns:
 * Wallet ID, Name, Phone, KYC Level, Status, Type, Balance, Region, AI Risk.
 * Searchable and filterable. Actions: view detail, suspend/activate user.
 *
 * @api_endpoints
 * - GET /v1/admin/users?search=...&kycLevel=...&status=...&page=0&size=20  → paginated users
 * - PUT /v1/admin/users/{userId}/status  → { status, reason } → suspend/activate
 *
 * @tables users, wallets, loyalty_accounts
 *
 * @mock_data 7 users hardcoded. Replace with paginated useQuery.
 */
import { useState } from "react";
import { Search, Filter, MoreVertical, ChevronDown } from "lucide-react";

const users = [
  { id: "TPY-001234", name: "Abebe Girma", phone: "+251911234567", kyc: "Level 2", status: "Active", type: "Customer", balance: 12450, joined: "Jan 15, 2024", region: "Addis Ababa", aiRisk: "Low" },
  { id: "TPY-001235", name: "Tigist Alemu", phone: "+251922345678", kyc: "Level 1", status: "Active", type: "Customer", balance: 3800, joined: "Jan 22, 2024", region: "Dire Dawa", aiRisk: "Low" },
  { id: "TPY-001236", name: "Dawit Haile", phone: "+251933456789", kyc: "Level 2", status: "Active", type: "Agent", balance: 85200, joined: "Dec 10, 2023", region: "Hawassa", aiRisk: "Medium" },
  { id: "TPY-001237", name: "Selam Bekele", phone: "+251944567890", kyc: "Pending", status: "Suspended", type: "Customer", balance: 0, joined: "Feb 1, 2024", region: "Mekelle", aiRisk: "High" },
  { id: "TPY-001238", name: "Yonas Tesfaye", phone: "+251955678901", kyc: "Level 1", status: "Active", type: "Merchant", balance: 42100, joined: "Nov 30, 2023", region: "Bahir Dar", aiRisk: "Low" },
  { id: "TPY-001239", name: "Hiwot Girma", phone: "+251966789012", kyc: "Level 2", status: "Active", type: "Customer", balance: 8750, joined: "Feb 5, 2024", region: "Addis Ababa", aiRisk: "Low" },
  { id: "TPY-001240", name: "Fekadu Worku", phone: "+251977890123", kyc: "Level 1", status: "Blocked", type: "Customer", balance: 0, joined: "Jan 8, 2024", region: "Jimma", aiRisk: "High" },
];

const statusColor: Record<string, string> = {
  Active: "text-green-400 bg-green-500/10",
  Suspended: "text-yellow-400 bg-yellow-500/10",
  Blocked: "text-red-400 bg-red-500/10",
  Pending: "text-blue-400 bg-blue-500/10",
};

const riskColor: Record<string, string> = {
  Low: "text-green-400",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<typeof users[0] | null>(null);

  const filtered = users.filter(u =>
    (filter === "All" || u.type === filter || u.status === filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search) || u.id.includes(search))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">67,750 registered users · 3 pending actions</p>
        </div>
        <button className="bg-gradient-gold text-tesfa-dark px-4 py-2 rounded-xl text-sm font-bold">+ Add User</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["All", "Customer", "Agent", "Merchant", "Blocked"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["User ID", "Name", "Type", "KYC Level", "Status", "Balance (ETB)", "AI Risk", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(user)}>
                  <td className="px-4 py-3 font-mono text-xs text-gold">{user.id}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="glass px-2 py-0.5 rounded-lg text-xs">{user.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${user.kyc === "Pending" ? "text-blue-400 bg-blue-500/10" : "text-gold bg-tesfa-gold/10"}`}>
                      {user.kyc}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${statusColor[user.status]}`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{user.balance.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${riskColor[user.aiRisk]}`}>● {user.aiRisk}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 glass rounded-lg hover:bg-muted" onClick={e => { e.stopPropagation(); setSelected(user); }}>
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex justify-between items-center text-xs text-muted-foreground">
          <span>Showing {filtered.length} of 67,750 users</span>
          <div className="flex gap-2">
            <button className="glass px-3 py-1 rounded-lg">Previous</button>
            <button className="bg-gradient-gold text-tesfa-dark px-3 py-1 rounded-lg font-bold">1</button>
            <button className="glass px-3 py-1 rounded-lg">Next</button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass w-full max-w-lg rounded-3xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center text-xl font-bold">
                {selected.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">{selected.phone} · {selected.region}</p>
                <p className="text-xs font-mono text-gold">{selected.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "User Type", value: selected.type },
                { label: "KYC Level", value: selected.kyc },
                { label: "Status", value: selected.status },
                { label: "AI Risk Score", value: selected.aiRisk },
                { label: "Balance", value: `ETB ${selected.balance.toLocaleString()}` },
                { label: "Joined", value: selected.joined },
              ].map(row => (
                <div key={row.label} className="glass rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl glass text-sm font-semibold text-muted-foreground">View Transactions</button>
              {selected.status === "Active" ? (
                <button className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold">Suspend</button>
              ) : (
                <button className="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold">Activate</button>
              )}
              <button onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-xl glass text-sm">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
