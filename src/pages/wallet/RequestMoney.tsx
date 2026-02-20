import { useState } from "react";
import { Search, Copy, Share2, CheckCircle } from "lucide-react";

const contacts = [
  { name: "Tigist Alemu", phone: "0912-345-678", avatar: "TA" },
  { name: "Yonas Tesfaye", phone: "0921-456-789", avatar: "YT" },
  { name: "Selam Bekele", phone: "0934-567-890", avatar: "SB" },
  { name: "Dawit Haile", phone: "0911-678-901", avatar: "DH" },
];

const RequestMoney = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof contacts[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
        <CheckCircle className="w-10 h-10 text-tesfa-dark" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Request Sent! 🎉</h2>
      <p className="text-muted-foreground text-sm mb-2">{selected?.name} will be notified</p>
      <p className="text-gold font-bold text-xl mb-6">ETB {parseFloat(amount || "0").toLocaleString()}</p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Request to</span>
          <span className="text-foreground font-semibold">{selected?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Reference</span>
          <span className="text-foreground font-mono">REQ-{Date.now().toString().slice(-6)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="text-gold font-semibold">Pending</span>
        </div>
      </div>
      <div className="flex gap-3 w-full">
        <button className="flex-1 py-3 glass rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold">
          <Copy className="w-4 h-4" /> Copy Link
        </button>
        <button className="flex-1 py-3 glass rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
      <button
        onClick={() => { setDone(false); setSelected(null); setAmount(""); setNote(""); }}
        className="w-full mt-3 py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold"
      >
        New Request
      </button>
    </div>
  );

  if (selected) return (
    <div className="px-4 py-4 animate-slide-up">
      <button onClick={() => setSelected(null)} className="text-gold text-sm mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-green flex items-center justify-center font-bold text-foreground">
          {selected.avatar}
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">{selected.name}</h2>
          <p className="text-xs text-muted-foreground">{selected.phone}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amount to Request (ETB) *</label>
          <input
            type="number"
            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Note (optional)</label>
          <input
            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
            placeholder="What's it for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Quick amounts */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Quick amounts</p>
        <div className="flex gap-2 flex-wrap">
          {["100", "250", "500", "1000", "2000"].map(a => (
            <button key={a} onClick={() => setAmount(a)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${amount === a ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
              ETB {a}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-gold rounded-2xl p-3 mb-4">
        <p className="text-xs text-gold">🤖 Global AI: A request will be sent to {selected.name} via SMS and app notification.</p>
      </div>

      <button
        onClick={() => setDone(true)}
        disabled={!amount}
        className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold disabled:opacity-40"
      >
        Send Request
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Request Money</h2>

      {/* Payment Link */}
      <div className="glass-gold rounded-2xl p-4 mb-4">
        <p className="text-xs text-gold font-semibold mb-1">Your Payment Link</p>
        <p className="text-xs text-muted-foreground mb-3">Share this link to receive money from anyone</p>
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <span className="text-xs text-foreground flex-1 font-mono truncate">globalpay.app/pay/abebe001</span>
          <button className="text-gold"><Copy className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-gold text-tesfa-dark">Share Link</button>
          <button className="flex-1 py-2 rounded-xl text-xs font-semibold glass text-muted-foreground">QR Code</button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">GlobalPay Contacts</p>
      <div className="space-y-2">
        {filtered.map((c) => (
          <button key={c.phone} onClick={() => setSelected(c)} className="w-full glass rounded-2xl p-3.5 flex items-center gap-3 hover-lift text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-green flex items-center justify-center font-bold text-foreground text-xs flex-shrink-0">
              {c.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            </div>
            <span className="text-xs text-gold font-semibold">Request →</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RequestMoney;
