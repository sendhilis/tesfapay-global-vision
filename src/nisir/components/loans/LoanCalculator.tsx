import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, PiggyBank, CalendarDays } from 'lucide-react';
import { loanProducts, type LoanProduct } from './LoanProductCards';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

interface LoanCalculatorProps {
  initialProduct?: LoanProduct;
  onApply?: (product: LoanProduct, amount: number, tenor: number) => void;
}

const LoanCalculator = ({ initialProduct, onApply }: LoanCalculatorProps) => {
  const [product, setProduct] = useState(initialProduct || loanProducts[0]);
  const [amount, setAmount] = useState(Math.round(product.maxAmount * 0.3));
  const [tenor, setTenor] = useState(Math.min(6, product.maxTenor));

  const monthlyRate = product.rate / 100 / 12;
  const monthlyInstallment = useMemo(() => {
    if (monthlyRate === 0) return amount / tenor;
    return (amount * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
      (Math.pow(1 + monthlyRate, tenor) - 1);
  }, [amount, tenor, monthlyRate]);
  const totalPayable = monthlyInstallment * tenor;
  const totalInterest = totalPayable - amount;

  const pieData = [
    { name: 'Principal', value: amount },
    { name: 'Interest', value: totalInterest },
  ];

  // Amortization schedule (first 3 + last)
  const schedule = useMemo(() => {
    const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = amount;
    for (let m = 1; m <= tenor; m++) {
      const interestPart = balance * monthlyRate;
      const principalPart = monthlyInstallment - interestPart;
      balance -= principalPart;
      rows.push({ month: m, payment: monthlyInstallment, principal: principalPart, interest: interestPart, balance: Math.max(0, balance) });
    }
    return rows;
  }, [amount, tenor, monthlyRate, monthlyInstallment]);

  const displaySchedule = tenor <= 4 ? schedule : [...schedule.slice(0, 3), schedule[schedule.length - 1]];

  return (
    <div className="space-y-4">
      {/* Product select */}
      <select
        value={product.type}
        onChange={(e) => {
          const p = loanProducts.find((lp) => lp.type === e.target.value)!;
          setProduct(p);
          setAmount(Math.min(amount, p.maxAmount));
          setTenor(Math.min(tenor, p.maxTenor));
        }}
        className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium"
      >
        {loanProducts.map((p) => (
          <option key={p.type} value={p.type}>{p.name} ({p.rate}% p.a.)</option>
        ))}
      </select>

      {/* Amount slider */}
      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
          <PiggyBank className="h-3.5 w-3.5 text-primary" /> Loan Amount
        </label>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-lg font-extrabold text-foreground mb-2">{fmt(amount)} <span className="text-xs font-medium text-muted-foreground">ETB</span></p>
          <input type="range" min={1000} max={product.maxAmount} step={1000} value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full accent-primary h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>1,000</span><span>{fmt(product.maxAmount)}</span></div>
        </div>
      </div>

      {/* Tenor slider */}
      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-primary" /> Repayment Period
        </label>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-lg font-extrabold text-foreground mb-2">{tenor} <span className="text-xs font-medium text-muted-foreground">months</span></p>
          <input type="range" min={1} max={product.maxTenor} value={tenor}
            onChange={(e) => setTenor(parseInt(e.target.value))} className="w-full accent-primary h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>1 month</span><span>{product.maxTenor} months</span></div>
        </div>
      </div>

      {/* Results */}
      <motion.div layout className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground">Payment Summary</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/60 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Monthly Payment</p>
            <p className="text-base font-extrabold text-primary">{fmt(monthlyInstallment)}</p>
            <p className="text-[10px] text-muted-foreground">ETB</p>
          </div>
          <div className="bg-card/60 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Payable</p>
            <p className="text-base font-extrabold text-foreground">{fmt(totalPayable)}</p>
            <p className="text-[10px] text-muted-foreground">ETB</p>
          </div>
        </div>

        {/* Pie chart */}
        <div className="flex items-center gap-3">
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={35} dataKey="value" strokeWidth={0}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--accent))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Principal</span>
              <span className="ml-auto font-bold text-foreground">{fmt(amount)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-muted-foreground">Interest</span>
              <span className="ml-auto font-bold text-foreground">{fmt(totalInterest)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mini amortization */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Repayment Schedule
        </p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-5 gap-1 px-3 py-2 bg-muted text-[9px] font-bold text-muted-foreground">
            <span>#</span><span>Payment</span><span>Principal</span><span>Interest</span><span>Balance</span>
          </div>
          {displaySchedule.map((row, i) => (
            <motion.div
              key={row.month}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-5 gap-1 px-3 py-2 text-[10px] text-foreground border-t border-border/50"
            >
              <span className="font-bold">{row.month}</span>
              <span>{fmt(row.payment)}</span>
              <span>{fmt(row.principal)}</span>
              <span className="text-muted-foreground">{fmt(row.interest)}</span>
              <span>{fmt(row.balance)}</span>
            </motion.div>
          ))}
          {tenor > 4 && (
            <div className="text-center py-1.5 text-[10px] text-muted-foreground bg-muted/50">
              ... {tenor - 4} more months ...
            </div>
          )}
        </div>
      </div>

      {onApply && (
        <button
          onClick={() => onApply(product, amount, tenor)}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-transform"
        >
          Apply for This Loan →
        </button>
      )}
    </div>
  );
};

export default LoanCalculator;
