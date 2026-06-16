/**
 * Renders chart + action blocks returned by mesh-chat for the Amara concierge.
 * Pure presentation, no business logic.
 */
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { ArrowRight, Building2, Smartphone, User, Target, TrendingUp, BadgeCheck, X } from "lucide-react";

const PALETTE = ["#0B1538", "#00C9B1", "#F4D06F", "#3B82F6", "#EF4444", "#7C3AED", "#1DB97D", "#FB923C", "#06B6D4", "#A855F7"];

export type ChartBlock = {
  type: "pie" | "donut" | "bar" | "line";
  title?: string;
  currency?: string | null;
  data: { name: string; value: number }[];
};

export type ActionBlock = {
  type:
    | "transfer_bank_to_bank" | "transfer_bank_to_mno" | "transfer_p2p" | "transfer"
    | "savings_deposit" | "savings_withdraw" | "tbill_purchase" | "loan_repay";
  amount?: number;
  currency?: string;
  fromAccount?: string;
  toBank?: string;
  toAccount?: string;
  toWallet?: string;
  toMsisdn?: string;
  toContact?: string;
  goalId?: string;
  loanId?: string;
  tenor?: string;
  memo?: string;
  to?: string;
};

function fmtCurrency(n: number | undefined, cur = "ETB") {
  if (n === undefined || n === null) return "";
  return `${cur} ${n.toLocaleString()}`;
}

export function ChartBlockView({ chart }: { chart: ChartBlock }) {
  const isPie = chart.type === "pie" || chart.type === "donut";
  return (
    <div className="mt-2 rounded-xl border border-[var(--line)] bg-white p-2.5">
      {chart.title && (
        <div className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)] mb-1.5 px-1">
          {chart.title}
        </div>
      )}
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          {isPie ? (
            <PieChart>
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chart.type === "donut" ? 38 : 0}
                outerRadius={70}
                paddingAngle={1}
              >
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtCurrency(v, chart.currency || "ETB")} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmtCurrency(v, chart.currency || "ETB")} />
              <Line type="monotone" dataKey="value" stroke="#00C9B1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmtCurrency(v, chart.currency || "ETB")} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function actionMeta(a: ActionBlock) {
  switch (a.type) {
    case "transfer_bank_to_bank":
      return { icon: Building2, label: "Bank → Bank Transfer", color: "#0B1538",
        to: `${a.toBank || ""}${a.toAccount ? " · " + a.toAccount : ""}` };
    case "transfer_bank_to_mno":
      return { icon: Smartphone, label: "Bank → MNO Wallet", color: "#00C9B1",
        to: `${a.toWallet || ""}${a.toMsisdn ? " · " + a.toMsisdn : ""}` };
    case "transfer_p2p":
    case "transfer":
      return { icon: User, label: "Send to Individual", color: "#3B82F6",
        to: a.toContact || a.to || "—" };
    case "savings_deposit": return { icon: Target, label: "Deposit to Goal", color: "#1DB97D", to: a.goalId || "" };
    case "savings_withdraw": return { icon: Target, label: "Withdraw from Goal", color: "#FB923C", to: a.goalId || "" };
    case "tbill_purchase": return { icon: TrendingUp, label: "T-Bill Purchase", color: "#F4D06F", to: a.tenor || "" };
    case "loan_repay": return { icon: BadgeCheck, label: "Loan Repayment", color: "#7C3AED", to: a.loanId || "" };
  }
}

export function ActionBlockView({
  action,
  onConfirm,
  onCancel,
}: {
  action: ActionBlock;
  onConfirm: (a: ActionBlock) => void;
  onCancel: (a: ActionBlock) => void;
}) {
  const meta = actionMeta(action);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="mt-2 rounded-xl border bg-white p-3" style={{ borderLeft: `3px solid ${meta.color}` }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg grid place-items-center text-white" style={{ background: meta.color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-[12px] font-semibold truncate">
            {fmtCurrency(action.amount, action.currency || "ETB")} <ArrowRight className="inline w-3 h-3 -mt-0.5" /> {meta.to}
          </div>
          {action.fromAccount && (
            <div className="text-[10px] text-[var(--ink-soft)] truncate">From {action.fromAccount}{action.memo ? ` · ${action.memo}` : ""}</div>
          )}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onConfirm(action)}
          className="flex-1 text-[11px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg text-white font-semibold"
          style={{ background: meta.color }}
        >
          Confirm
        </button>
        <button
          onClick={() => onCancel(action)}
          className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--line)] inline-flex items-center gap-1 text-[var(--ink-soft)]"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}
