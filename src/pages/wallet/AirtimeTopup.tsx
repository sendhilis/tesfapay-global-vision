import { useState } from "react";
import { CheckCircle } from "lucide-react";

const operators = [
  { name: "Ethio Telecom", icon: "📱", color: "border-blue-400/30 bg-blue-500/10" },
  { name: "Safaricom ET", icon: "🟢", color: "border-green-400/30 bg-green-500/10" },
];

const bundles = {
  "Ethio Telecom": [
    { name: "50 MB Data", price: 5, validity: "1 day" },
    { name: "1 GB Data", price: 25, validity: "7 days" },
    { name: "5 GB Data", price: 85, validity: "30 days" },
    { name: "ETB 10 Airtime", price: 10, validity: "No expiry" },
    { name: "ETB 50 Airtime", price: 50, validity: "No expiry" },
    { name: "ETB 100 Airtime", price: 100, validity: "No expiry" },
  ],
  "Safaricom ET": [
    { name: "200 MB Data", price: 10, validity: "3 days" },
    { name: "2 GB Data", price: 45, validity: "30 days" },
    { name: "ETB 20 Airtime", price: 20, validity: "No expiry" },
  ],
};

const AirtimeTopup = () => {
  const [operator, setOperator] = useState(operators[0]);
  const [phone, setPhone] = useState("");
  const [selfTopup, setSelfTopup] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [done, setDone] = useState(false);

  const currentBundles = bundles[operator.name as keyof typeof bundles] || [];

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
        <CheckCircle className="w-10 h-10 text-tesfa-dark" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Top-Up Successful! 📱</h2>
      <p className="text-muted-foreground text-sm mb-2">{selfTopup ? "Your number" : phone}</p>
      <p className="text-gold font-bold text-xl mb-6">{selectedBundle?.name} — ETB {selectedBundle?.price}</p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Operator</span>
          <span className="text-foreground font-semibold">{operator.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Validity</span>
          <span className="text-foreground font-semibold">{selectedBundle?.validity}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Points Earned</span>
          <span className="text-gold font-semibold">+{selectedBundle?.price} pts 🌟</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Ref</span>
          <span className="text-foreground font-mono">AIR-{Date.now().toString().slice(-6)}</span>
        </div>
      </div>
      <button
        onClick={() => { setDone(false); setSelectedBundle(null); }}
        className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold"
      >
        Buy Again
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Airtime & Data</h2>

      {/* Operator select */}
      <div className="flex gap-3 mb-4">
        {operators.map(op => (
          <button
            key={op.name}
            onClick={() => { setOperator(op); setSelectedBundle(null); }}
            className={`flex-1 glass border rounded-2xl p-3 flex items-center gap-2 transition-colors ${
              operator.name === op.name ? "border-tesfa-gold bg-tesfa-gold/10" : "border-border"
            }`}
          >
            <span className="text-xl">{op.icon}</span>
            <span className="text-xs font-semibold text-foreground">{op.name}</span>
          </button>
        ))}
      </div>

      {/* Self or other */}
      <div className="flex gap-3 mb-4">
        <button onClick={() => setSelfTopup(true)} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${selfTopup ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
          My Number
        </button>
        <button onClick={() => setSelfTopup(false)} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${!selfTopup ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
          Other Number
        </button>
      </div>

      {!selfTopup && (
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
          <div className="flex gap-2">
            <div className="glass border border-border rounded-xl px-3 py-3 text-sm text-muted-foreground">+251</div>
            <input
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
              placeholder="9XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      {selfTopup && (
        <div className="glass rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Topping up:</span>
          <span className="text-sm font-bold text-foreground">+251 912-345-678</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Select Bundle / Airtime</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {currentBundles.map((bundle) => (
          <button
            key={bundle.name}
            onClick={() => setSelectedBundle(bundle)}
            className={`glass rounded-2xl p-4 text-left border-2 transition-all hover-lift ${
              selectedBundle?.name === bundle.name
                ? "border-tesfa-gold bg-tesfa-gold/10"
                : "border-transparent"
            }`}
          >
            <p className="text-sm font-bold text-foreground mb-1">{bundle.name}</p>
            <p className="text-gold font-bold text-lg">ETB {bundle.price}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{bundle.validity}</p>
          </button>
        ))}
      </div>

      {selectedBundle && (
        <div className="glass rounded-2xl p-3 mb-4 space-y-1.5">
          {[
            { label: "Bundle", value: selectedBundle.name },
            { label: "Amount", value: `ETB ${selectedBundle.price}` },
            { label: "Service Fee", value: "ETB 0.00" },
            { label: "Loyalty Points", value: `+${selectedBundle.price} pts 🌟` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="text-foreground font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setDone(true)}
        disabled={!selectedBundle || (!selfTopup && !phone)}
        className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold disabled:opacity-40"
      >
        Buy Now — {selectedBundle ? `ETB ${selectedBundle.price}` : "Select a bundle"}
      </button>
    </div>
  );
};

export default AirtimeTopup;
