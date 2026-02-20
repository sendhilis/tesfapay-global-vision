import { useState } from "react";
import { Search, ArrowRight, Star, Clock } from "lucide-react";

const contacts = [
  { name: "Tigist Alemu", phone: "+251911234567", avatar: "TA", favorite: true },
  { name: "Dawit Haile", phone: "+251922345678", avatar: "DH", favorite: true },
  { name: "Selam Bekele", phone: "+251933456789", avatar: "SB", favorite: false },
  { name: "Yonas Tesfaye", phone: "+251944567890", avatar: "YT", favorite: false },
  { name: "Hiwot Girma", phone: "+251955678901", avatar: "HG", favorite: false },
];

const SendMoney = () => {
  const [step, setStep] = useState<"select" | "amount" | "confirm" | "success">("select");
  const [selected, setSelected] = useState<typeof contacts[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (step === "success") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-gradient-green flex items-center justify-center mb-4 animate-glow-gold">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Sent! 🎉</h2>
      <p className="text-muted-foreground text-sm mb-2">
        ETB {parseFloat(amount || "0").toLocaleString()} sent to {selected?.name}
      </p>
      <p className="text-xs text-gold mb-6">+15 Global Points earned!</p>
      <div className="glass rounded-2xl p-4 w-full max-w-xs mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Reference</span>
          <span className="font-mono text-gold">TXN2024110001</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fee</span>
          <span>ETB 2.50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="text-green-400 font-semibold">Completed</span>
        </div>
      </div>
      <button
        onClick={() => { setStep("select"); setSelected(null); setAmount(""); }}
        className="w-full max-w-xs py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold"
      >
        Send Another
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      {step === "select" && (
        <div className="animate-slide-up">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Send Money</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
              placeholder="Search name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Or enter phone manually */}
          <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-tesfa-dark font-bold text-sm">+</div>
            <div>
              <p className="text-sm font-semibold">New Recipient</p>
              <p className="text-xs text-muted-foreground">Enter phone number manually</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Star className="w-3 h-3 text-gold" />
            <p className="text-xs text-muted-foreground font-semibold">FAVORITES & RECENT</p>
          </div>

          <div className="space-y-2">
            {filtered.map((c) => (
              <button
                key={c.phone}
                onClick={() => { setSelected(c); setStep("amount"); }}
                className="w-full glass rounded-2xl p-3 flex items-center gap-3 hover:border-tesfa-gold/30 hover:bg-tesfa-gold/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
                {c.favorite && <Star className="w-3.5 h-3.5 text-gold fill-gold" />}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "amount" && selected && (
        <div className="animate-slide-up">
          <button onClick={() => setStep("select")} className="text-gold text-sm mb-4">← Back</button>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Enter Amount</h2>
          <p className="text-muted-foreground text-sm mb-6">Sending to <span className="text-gold font-semibold">{selected.name}</span></p>

          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Amount (ETB)</p>
            <div className="text-5xl font-display font-bold text-foreground">
              {amount ? `${parseFloat(amount).toLocaleString()}` : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available: ETB 12,450.00</p>
          </div>

          {/* Amount numpad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === "⌫") setAmount(amount.slice(0, -1));
                  else if (k === "." && amount.includes(".")) return;
                  else setAmount(amount + k);
                }}
                className="h-14 glass rounded-2xl text-lg font-bold hover:bg-tesfa-gold/10 hover:text-gold transition-colors"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-4">
            {[100, 250, 500, 1000].map((a) => (
              <button key={a} onClick={() => setAmount(String(a))} className="flex-1 glass rounded-xl py-2 text-xs font-semibold text-gold hover:bg-tesfa-gold/10">
                {a}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <input
              className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            onClick={() => setStep("confirm")}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === "confirm" && selected && (
        <div className="animate-slide-up">
          <button onClick={() => setStep("amount")} className="text-gold text-sm mb-4">← Back</button>
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Confirm Transfer</h2>

          <div className="glass rounded-3xl p-5 mb-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center text-sm font-bold">{selected.avatar}</div>
              <div>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.phone}</p>
              </div>
            </div>
            {[
              { label: "Amount", value: `ETB ${parseFloat(amount).toLocaleString()}`, highlight: true },
              { label: "Transfer Fee", value: "ETB 2.50", highlight: false },
              { label: "Total Deducted", value: `ETB ${(parseFloat(amount) + 2.5).toLocaleString()}`, highlight: true },
              { label: "Global Points Earned", value: "+15 pts 🌟", highlight: false },
              ...(note ? [{ label: "Note", value: note, highlight: false }] : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={row.highlight ? "font-bold text-gold" : "text-foreground"}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="glass-gold rounded-2xl p-3 mb-4">
            <p className="text-xs text-muted-foreground">
              🔒 This transaction is protected by 256-bit encryption and GlobalPay fraud monitoring.
            </p>
          </div>

          <button
            onClick={() => setStep("success")}
            className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold"
          >
            Confirm & Send ETB {parseFloat(amount).toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
};

export default SendMoney;
