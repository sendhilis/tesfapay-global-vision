import { useState } from "react";
import { QrCode, Search, CheckCircle, ScanLine } from "lucide-react";

const merchants = [
  { name: "Sheger Café", category: "Restaurant", id: "MERCH-001", icon: "☕" },
  { name: "Bole Supermarket", category: "Grocery", id: "MERCH-002", icon: "🛒" },
  { name: "Eden Mall", category: "Shopping", id: "MERCH-003", icon: "🏬" },
  { name: "Addis Pharmacy", category: "Health", id: "MERCH-004", icon: "💊" },
  { name: "Dashen Hotel", category: "Hospitality", id: "MERCH-005", icon: "🏨" },
  { name: "GBE Parking", category: "Transport", id: "MERCH-006", icon: "🅿️" },
];

const MerchantPay = () => {
  const [mode, setMode] = useState<"qr" | "search">("qr");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof merchants[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  const [scanning, setScanning] = useState(false);

  const filtered = merchants.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
        <CheckCircle className="w-10 h-10 text-tesfa-dark" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Payment Successful! 🏪</h2>
      <p className="text-muted-foreground text-sm mb-2">{selected?.name}</p>
      <p className="text-gold font-bold text-2xl mb-6">ETB {parseFloat(amount || "0").toLocaleString()}</p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2 text-left">
        {[
          { label: "Merchant", value: selected?.name },
          { label: "Category", value: selected?.category },
          { label: "Ref", value: `MRX-${Date.now().toString().slice(-6)}` },
          { label: "Loyalty Points", value: `+${Math.floor(parseFloat(amount || "0") / 10)} pts 🌟` },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setDone(false); setSelected(null); setAmount(""); }} className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold">
        Pay Again
      </button>
    </div>
  );

  if (selected) return (
    <div className="px-4 py-4 animate-slide-up">
      <button onClick={() => setSelected(null)} className="text-gold text-sm mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-3xl">{selected.icon}</div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">{selected.name}</h2>
          <p className="text-xs text-muted-foreground">{selected.category} · {selected.id}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amount (ETB) *</label>
          <input
            type="number"
            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      {amount && (
        <div className="glass rounded-2xl p-3 mb-4 space-y-1.5">
          {[
            { label: "Merchant", value: selected.name },
            { label: "Amount", value: `ETB ${parseFloat(amount).toLocaleString()}` },
            { label: "Fee", value: "ETB 0.00" },
            { label: "Points", value: `+${Math.floor(parseFloat(amount) / 10)} pts 🌟` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="text-foreground font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setDone(true)} disabled={!amount} className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold disabled:opacity-40">
        Pay ETB {amount ? parseFloat(amount).toLocaleString() : "0.00"}
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Merchant Payment</h2>

      <div className="flex gap-3 mb-4">
        <button onClick={() => setMode("qr")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${mode === "qr" ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
          <QrCode className="w-4 h-4" /> Scan QR
        </button>
        <button onClick={() => setMode("search")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${mode === "search" ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {mode === "qr" ? (
        <div className="text-center">
          <div className="glass rounded-3xl p-6 mb-4">
            {scanning ? (
              <div className="relative">
                <div className="w-full h-56 bg-muted rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-4 border-2 border-tesfa-gold/50 rounded-xl" />
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-tesfa-gold rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-tesfa-gold rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-tesfa-gold rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-tesfa-gold rounded-br-lg" />
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-tesfa-gold/70 animate-pulse" />
                  <ScanLine className="w-12 h-12 text-gold animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground mt-3">Point camera at merchant QR code</p>
                <button
                  onClick={() => { setScanning(false); setSelected(merchants[0]); }}
                  className="mt-3 text-xs text-gold underline"
                >
                  Simulate scan (demo)
                </button>
              </div>
            ) : (
              <>
                <QrCode className="w-24 h-24 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-sm text-muted-foreground mb-4">Tap to activate camera and scan merchant QR code</p>
                <button
                  onClick={() => setScanning(true)}
                  className="w-full py-3 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold"
                >
                  Open Camera Scanner
                </button>
              </>
            )}
          </div>

          <div className="glass rounded-2xl p-3 text-left">
            <p className="text-xs text-gold font-semibold mb-1">💡 Did you know?</p>
            <p className="text-xs text-muted-foreground">All GlobalPay merchants display a standard QR code. Scan once to pay in seconds and earn Global Points automatically.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
              placeholder="Search merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filtered.map((m) => (
              <button key={m.id} onClick={() => setSelected(m)} className="w-full glass rounded-2xl p-3.5 flex items-center gap-3 hover-lift text-left">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-xl flex-shrink-0">{m.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.category} · {m.id}</p>
                </div>
                <span className="text-xs text-gold font-semibold">Pay →</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MerchantPay;
