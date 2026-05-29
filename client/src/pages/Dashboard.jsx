import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, BarChart3, Brain, Sparkles,
  TrendingDown, TrendingUp, Wallet, ArrowRight,
  IndianRupee, Activity, RefreshCw,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import useAuth from "../hooks/useAuth";
import useFinancialData from "../hooks/useFinancialData";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../utils/formatCurrency";
import { calculateHealthScore } from "../utils/healthScore";
import * as aiService from "../services/aiService";
import * as incomeService from "../services/incomeService";
import * as expenseService from "../services/expenseService";
import * as invoiceService from "../services/invoiceService";

const CHART_COLORS = ["#22d3ee", "#818cf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6"];

/* ── KPI Card ── */
function KPI({ title, value, change, icon: Icon, color, bg }) {
  const up = change >= 0;
  return (
    <div
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${bg}14 0%, ${bg}06 100%)`,
        border: `1px solid ${bg}22`,
        boxShadow: `0 4px 24px ${bg}10`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${bg}18`, color }}
        >
          <Icon size={18} />
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-bold"
          style={{
            background: up ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
            color: up ? "#34d399" : "#f87171",
          }}
        >
          {up ? "+" : ""}{change}%
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Pill label ── */
function Pill({ children, color = "#22d3ee" }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
      style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}
    >
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: color }} />
      {children}
    </span>
  );
}

/* ── Panel wrapper ── */
function Panel({ children, className = "", glow }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "rgba(15,23,42,0.70)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        boxShadow: glow
          ? `0 8px 40px ${glow}12, 0 2px 8px rgba(0,0,0,0.3)`
          : "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </div>
  );
}

/* ── AI Insight Card ── */
function AIInsightCard({ insight, type, onDismiss }) {
  const map = {
    warning: { border: "#fbbf24", bg: "rgba(251,191,36,0.06)",  text: "#fcd34d" },
    danger:  { border: "#f87171", bg: "rgba(248,113,113,0.06)", text: "#fca5a5" },
    success: { border: "#34d399", bg: "rgba(52,211,153,0.06)",  text: "#6ee7b7" },
  };
  const s = map[type] || map.success;
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-3 text-xs leading-5"
      style={{ background: s.bg, border: `1px solid ${s.border}30` }}
    >
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl" style={{ background: s.border }} />
      <div className="flex items-start justify-between gap-3">
        <p style={{ color: s.text }}>{insight}</p>
        <button onClick={onDismiss} className="shrink-0 text-slate-600 hover:text-slate-300 transition">✕</button>
      </div>
    </div>
  );
}

/* ═════════════════ DASHBOARD ═════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [dismissed, setDismissed] = useState([]);
  const financialData = useFinancialData();

  const incomeQuery   = useQuery({ queryKey: ["dashboard-income"],   queryFn: () => incomeService.getIncome({}) });
  const expenseQuery  = useQuery({ queryKey: ["dashboard-expenses"], queryFn: () => expenseService.getExpenses({}) });
  const invoiceQuery  = useQuery({ queryKey: ["dashboard-invoices"], queryFn: invoiceService.getInvoices });
  const insightsQuery = useQuery({ queryKey: ["dashboard-insights"], queryFn: () => aiService.getInsights({}) });

  const reportMutation = useMutation({
    mutationFn: () => aiService.getMonthlyReport({}),
    onSuccess: () => showToast({ type: "success", title: "AI report generated", message: "Fresh insights are ready in Reports." }),
    onError:   (e) => showToast({ type: "error",   title: "Could not generate",  message: e.response?.data?.message || "Please try again." }),
  });

  const incomeItems    = Array.isArray(incomeQuery.data?.data)  ? incomeQuery.data.data  : [];
  const expenseItems   = Array.isArray(expenseQuery.data?.data) ? expenseQuery.data.data : [];
  const invoiceItems   = Array.isArray(invoiceQuery.data?.data) ? invoiceQuery.data.data : [];
  const expenseSummary = Array.isArray(financialData.expenseSummary) ? financialData.expenseSummary : [];

  const monthlyExpenseMap = expenseItems.reduce((map, item) => {
    const key = new Date(item.date).toLocaleString("en-IN", { month: "short" });
    map[key] = (map[key] || 0) + Number(item.amount || 0);
    return map;
  }, {});

  const incomeSeries = (Array.isArray(financialData.incomeSummary) ? financialData.incomeSummary : []).map((item) => ({
    month:   item.month,
    income:  item.total || 0,
    expense: monthlyExpenseMap[item.month] || 0,
  }));

  const totalIncome   = incomeItems.reduce((s, i)  => s + Number(i.amount || 0), 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const netProfit     = totalIncome - totalExpenses;

  const health = calculateHealthScore(
    incomeItems, expenseItems, invoiceItems,
    incomeSeries.map((item) => ({ income: item.income }))
  );

  const recentTransactions = [
    ...incomeItems.map((i)  => ({ ...i, type: "income",  title: i.source })),
    ...expenseItems.map((i) => ({ ...i, type: "expense", title: i.title  })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const alertBanners = useMemo(() => {
    const overdueCount = invoiceItems.filter((inv) => inv.status === "overdue").length;
    const cashRunway   = totalExpenses > 0 ? totalIncome / totalExpenses : 0;
    return [
      cashRunway > 0 && cashRunway < 1 ? { type: "warning", text: "Cash runway is under one month. Tighten expenses or accelerate collections." } : null,
      totalIncome > 1800000            ? { type: "danger",  text: "GST threshold warning: approaching ₹20,00,000 in annual income." } : null,
      overdueCount > 0                 ? { type: "warning", text: `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} overdue and needs follow-up.` } : null,
    ].filter(Boolean);
  }, [invoiceItems, totalExpenses, totalIncome]);

  const scoreColor = health.score >= 70 ? "#34d399" : health.score >= 50 ? "#fbbf24" : "#f87171";

  const tooltipStyle = {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#e2e8f0",
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Alert banners ── */}
      {alertBanners.map((b) => (
        <div
          key={b.text}
          className="flex items-center gap-3 rounded-2xl px-5 py-3 text-sm"
          style={{
            background: b.type === "danger" ? "rgba(248,113,113,0.07)" : "rgba(251,191,36,0.07)",
            border: b.type === "danger" ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(251,191,36,0.25)",
            color: b.type === "danger" ? "#fca5a5" : "#fcd34d",
          }}
        >
          <AlertTriangle size={15} className="shrink-0" />
          {b.text}
        </div>
      ))}

      {/* ── Hero banner ── */}
      <Panel glow="#22d3ee">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: "radial-gradient(ellipse 70% 60% at 0% 50%, rgba(34,211,238,0.07), transparent)" }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/3 rounded-2xl"
          style={{ background: "radial-gradient(ellipse 80% 80% at 100% 50%, rgba(129,140,248,0.06), transparent)" }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Pill color="#22d3ee">Welcome back</Pill>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white">
              Hey,{" "}
              <span style={{ background: "linear-gradient(135deg,#22d3ee,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {user?.name?.split(" ")[0]}
              </span>{" "}👋
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
              Your financial overview is ready. Stay on top of cash flow, expenses, and tax in one place.
            </p>
          </div>
          <button
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
            className="group flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#22d3ee,#818cf8)",
              boxShadow: "0 4px 20px rgba(34,211,238,0.25)",
            }}
          >
            {reportMutation.isPending
              ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
              : <><Sparkles size={14} /> Generate AI Report <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></>}
          </button>
        </div>
      </Panel>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPI title="Total Income"   value={formatINR(totalIncome)}   change={12.4}  icon={TrendingUp}   color="#22d3ee" bg="#22d3ee" />
        <KPI title="Total Expenses" value={formatINR(totalExpenses)} change={-3.2}  icon={TrendingDown} color="#f87171" bg="#ef4444" />
        <KPI title="Net Profit"     value={formatINR(netProfit)}     change={8.6}   icon={IndianRupee}  color={netProfit >= 0 ? "#34d399" : "#f87171"} bg={netProfit >= 0 ? "#34d399" : "#ef4444"} />
        <KPI title="Health Score"   value={`${health.score} / 100`} change={5.1}   icon={Activity}     color={scoreColor} bg={scoreColor} />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Bar chart */}
        <Panel className="xl:col-span-3">
          <div className="mb-5">
            <Pill color="#22d3ee">Cash Flow</Pill>
            <h3 className="mt-2 text-lg font-bold text-white">Income vs Expenses</h3>
            <p className="text-xs text-slate-500">Monthly comparison — last 6 months</p>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incomeSeries} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="transparent" tick={{ fill: "#4b5563", fontSize: 11 }} tickLine={false} />
                <YAxis stroke="transparent" tick={{ fill: "#4b5563", fontSize: 11 }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="income"  fill="#22d3ee" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="expense" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-5">
            {[["#22d3ee","Income"],["#f87171","Expenses"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: c }} />
                <span className="text-xs text-slate-500">{l}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Donut chart */}
        <Panel className="xl:col-span-2">
          <div className="mb-5">
            <Pill color="#818cf8">Breakdown</Pill>
            <h3 className="mt-2 text-lg font-bold text-white">Expense Mix</h3>
            <p className="text-xs text-slate-500">Current category spread</p>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseSummary.length ? expenseSummary : [{ category: "No data", total: 1 }]}
                  dataKey="total" nameKey="category"
                  innerRadius={56} outerRadius={84} paddingAngle={3}
                >
                  {(expenseSummary.length ? expenseSummary : [{ category: "No data" }]).map((entry, i) => (
                    <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={expenseSummary.length ? 1 : 0.15} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {expenseSummary.slice(0, 4).map((item, i) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs text-slate-400">{item.category}</span>
                </div>
                <span className="text-xs font-semibold text-slate-300">{formatINR(item.total)}</span>
              </div>
            ))}
            {!expenseSummary.length && <p className="text-center text-xs text-slate-600">No expense data yet</p>}
          </div>
          <div className="mt-3 border-t border-white/[0.05] pt-3 text-center">
            <span className="text-xs text-slate-500">Total expenses · </span>
            <span className="text-sm font-bold text-white">{formatINR(expenseSummary.reduce((s, i) => s + Number(i.total || 0), 0))}</span>
          </div>
        </Panel>
      </div>

      {/* ── Transactions + AI Insights ── */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Transactions */}
        <Panel className="xl:col-span-3">
          <div className="mb-5">
            <Pill color="#34d399">Activity</Pill>
            <h3 className="mt-2 text-lg font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest inflows and outflows</p>
          </div>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Date", "Title", "Category", "Amount"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-600">No transactions yet. Add income or expenses to get started.</td></tr>
                )}
                {recentTransactions.slice(0, 6).map((item) => (
                  <tr
                    key={`${item.type}-${item._id}`}
                    className="transition"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{item.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${item.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {item.type === "income" ? "+" : "−"} {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* AI Insights */}
        <Panel className="xl:col-span-2" glow="#818cf8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.25)" }}
                >
                  <Brain size={14} style={{ color: "#818cf8" }} />
                </div>
                <span className="text-sm font-bold text-indigo-300">AI Insights</span>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Powered by Groq llama-3</p>
            </div>
            <button
              onClick={() => insightsQuery.refetch()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:brightness-125"
              style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#a5b4fc" }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>

          <div className="space-y-3">
            {insightsQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)
              : (insightsQuery.data?.data?.insights || []).length === 0
              ? (
                <div
                  className="rounded-xl px-4 py-6 text-center"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Sparkles size={20} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs text-slate-600">Add income and expenses to unlock AI insights.</p>
                </div>
              )
              : (insightsQuery.data?.data?.insights || [])
                  .filter((_, i) => !dismissed.includes(i))
                  .slice(0, 3)
                  .map((insight, i) => (
                    <AIInsightCard
                      key={insight}
                      insight={insight}
                      type={i === 0 ? "warning" : i === 1 ? "danger" : "success"}
                      onDismiss={() => setDismissed((curr) => [...curr, i])}
                    />
                  ))
            }
          </div>

          {/* Health score bar */}
          <div
            className="mt-5 rounded-xl px-4 py-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Financial Health</span>
              <span className="text-xs font-black" style={{ color: scoreColor }}>Grade {health.grade}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${health.score}%`, background: `linear-gradient(90deg, ${scoreColor}cc, ${scoreColor})` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[10px] text-slate-600">0</span>
              <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{health.score} / 100</span>
              <span className="text-[10px] text-slate-600">100</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
