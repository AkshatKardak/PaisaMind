import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, BarChart3, Brain, Sparkles,
  TrendingDown, TrendingUp, Wallet, ArrowRight,
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

const CHART_COLORS = ["#F59E0B", "#8B5CF6", "#10B981", "#0EA5E9", "#6B7280", "#EF4444"];

/* ── Inline KPI Card ── */
function KPI({ title, value, change, icon: Icon, accent, glow }) {
  const up = change >= 0;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(17,24,39,0.72)",
        backdropFilter: "blur(16px)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)`,
      }}
    >
      {/* glow halo on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow}18, transparent 70%)` }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{ background: `${glow}18`, borderColor: `${glow}30`, color: accent }}
          >
            <Icon size={18} />
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{
              background: up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              color: up ? "#34d399" : "#f87171",
            }}
          >
            {up ? "+" : ""}{change}%
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Section label (matches Landing) ── */
function SectionLabel({ children }) {
  return (
    <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/8 px-3 py-1">
      <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-400">{children}</span>
    </div>
  );
}

/* ── Insight Card (inline, no dismiss bug) ── */
function AIInsightCard({ insight, type, onDismiss }) {
  const styles = {
    warning: { border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-300", bar: "bg-amber-500" },
    danger:  { border: "border-red-500/20",   bg: "bg-red-500/5",   text: "text-red-300",   bar: "bg-red-500"  },
    success: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-300", bar: "bg-emerald-500" },
  };
  const s = styles[type] || styles.success;
  return (
    <div className={`relative overflow-hidden rounded-xl border ${s.border} ${s.bg} px-4 py-3`}>
      <div className={`absolute left-0 top-0 h-full w-[3px] ${s.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs leading-5 ${s.text}`}>{insight}</p>
        <button onClick={onDismiss} className="shrink-0 text-slate-600 hover:text-slate-400 text-xs">✕</button>
      </div>
    </div>
  );
}

/* ══════════════════ DASHBOARD ══════════════════ */
function Dashboard() {
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

  /* ── safe arrays ── */
  const incomeItems   = Array.isArray(incomeQuery.data?.data)   ? incomeQuery.data.data   : [];
  const expenseItems  = Array.isArray(expenseQuery.data?.data)  ? expenseQuery.data.data  : [];
  const invoiceItems  = Array.isArray(invoiceQuery.data?.data)  ? invoiceQuery.data.data  : [];
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

  /* ✅ FIX: pass arrays not numbers */
  const health = calculateHealthScore(
    incomeItems,
    expenseItems,
    invoiceItems,
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
      totalIncome > 1800000            ? { type: "danger",  text: "GST threshold warning triggered. You are approaching ₹20,00,000 in annual income." } : null,
      overdueCount > 0                 ? { type: "warning", text: `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} overdue and needs a follow-up.` } : null,
    ].filter(Boolean);
  }, [invoiceItems, totalExpenses, totalIncome]);

  /* ── chart theme ── */
  const gridStroke   = "#1F2937";
  const axisTick     = { fill: "#4B5563", fontSize: 11 };
  const tooltipStyle = {
    background: "#0F172A", border: "1px solid #1E293B",
    borderRadius: "12px",  color: "#F1F5F9", fontSize: 12,
  };

  /* ── score ring colour ── */
  const scoreColor = health.score >= 70 ? "#10B981" : health.score >= 50 ? "#F59E0B" : "#EF4444";
  const scoreGrade = health.grade;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Alert banners ── */}
      {alertBanners.map((banner) => (
        <div
          key={banner.text}
          className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm ${
            banner.type === "danger"
              ? "border-red-500/25 bg-red-500/5 text-red-300"
              : "border-amber-500/25 bg-amber-500/5 text-amber-300"
          }`}
        >
          <AlertTriangle size={16} className="shrink-0" />
          {banner.text}
        </div>
      ))}

      {/* ── Hero welcome banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-7"
        style={{
          background: "rgba(17,24,39,0.80)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_50%,rgba(14,165,233,0.07),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_80%_80%_at_100%_50%,rgba(139,92,246,0.07),transparent)]" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <SectionLabel>Welcome back</SectionLabel>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white">
              Good to see you,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {user?.name?.split(" ")[0]}
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Keep cash flow visible, reduce subscription bleed, and stay ahead of taxes without spreadsheet sprawl.
            </p>
          </div>
          <button
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
            className="group flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
            }}
          >
            {reportMutation.isPending ? "Generating..." : (
              <><Sparkles size={15} /> Generate AI Report <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPI title="Income"   value={formatINR(totalIncome)}               change={12.4} icon={TrendingUp}   accent="#38bdf8" glow="#0ea5e9" />
        <KPI title="Expenses" value={formatINR(totalExpenses)}             change={-3.2} icon={TrendingDown} accent="#f87171" glow="#ef4444" />
        <KPI title="Profit"   value={formatINR(totalIncome - totalExpenses)} change={8.6} icon={Wallet}    accent="#34d399" glow="#10b981" />
        <KPI title="Score"    value={`${health.score} / 100`}              change={5.1}  icon={BarChart3}   accent={scoreColor} glow={scoreColor} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Bar chart */}
        <div
          className="rounded-2xl border border-white/[0.06] p-6 xl:col-span-3"
          style={{ background: "rgba(17,24,39,0.72)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
        >
          <div className="mb-5">
            <SectionLabel>Cash Flow</SectionLabel>
            <h3 className="mt-2 text-lg font-bold text-white">Income vs Expenses</h3>
            <p className="text-xs text-slate-500">Last 6 months · bar comparison</p>
          </div>
          {/* ✅ FIX: explicit pixel height prevents -1 warning */}
          <div style={{ width: "100%", minHeight: 0, height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incomeSeries} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke={gridStroke} tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis stroke={gridStroke} tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="income"  fill="#0EA5E9" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-sky-400" /><span className="text-xs text-slate-500">Income</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="text-xs text-slate-500">Expenses</span></div>
          </div>
        </div>

        {/* Donut chart */}
        <div
          className="rounded-2xl border border-white/[0.06] p-6 xl:col-span-2"
          style={{ background: "rgba(17,24,39,0.72)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
        >
          <div className="mb-5">
            <SectionLabel>Breakdown</SectionLabel>
            <h3 className="mt-2 text-lg font-bold text-white">Expense Mix</h3>
            <p className="text-xs text-slate-500">Current category spread</p>
          </div>
          {/* ✅ FIX: explicit pixel height */}
          <div style={{ width: "100%", minHeight: 0, height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseSummary.length ? expenseSummary : [{ category: "No data", total: 1 }]}
                  dataKey="total" nameKey="category"
                  innerRadius={56} outerRadius={84} paddingAngle={3}
                >
                  {(expenseSummary.length ? expenseSummary : [{ category: "No data" }]).map((entry, i) => (
                    <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={expenseSummary.length ? 1 : 0.2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
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
          <div className="mt-4 border-t border-white/5 pt-3 text-center">
            <span className="text-xs text-slate-500">Total </span>
            <span className="text-sm font-bold text-white">{formatINR(expenseSummary.reduce((s, i) => s + Number(i.total || 0), 0))}</span>
          </div>
        </div>
      </div>

      {/* ── Transactions + AI Insights ── */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Transactions table */}
        <div
          className="rounded-2xl border border-white/[0.06] p-6 xl:col-span-3"
          style={{ background: "rgba(17,24,39,0.72)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
        >
          <div className="mb-5">
            <SectionLabel>Activity</SectionLabel>
            <h3 className="mt-2 text-lg font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest inflows and outflows</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.05]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {["Date", "Title", "Category", "Amount"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-600">No transactions yet. Add income or expenses to get started.</td></tr>
                )}
                {recentTransactions.slice(0, 6).map((item) => (
                  <tr key={`${item.type}-${item._id}`} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${item.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {item.type === "income" ? "+" : "-"} {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights */}
        <div
          className="rounded-2xl border border-violet-500/20 p-6 xl:col-span-2"
          style={{
            background: "rgba(17,24,39,0.72)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(139,92,246,0.08)",
          }}
        >
          {/* header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10">
                  <Brain size={14} className="text-violet-400" />
                </div>
                <span className="text-sm font-bold text-violet-300">AI Insights</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Powered by Groq llama-3</p>
            </div>
            <button
              onClick={() => insightsQuery.refetch()}
              className="rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-1.5 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/15"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {insightsQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)
              : (insightsQuery.data?.data?.insights || []).length === 0
              ? (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center">
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

          {/* Health score mini */}
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Financial Health</span>
              <span className="text-xs font-black" style={{ color: scoreColor }}>Grade {scoreGrade}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${health.score}%`, background: scoreColor }}
              />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[10px] text-slate-600">0</span>
              <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{health.score} / 100</span>
              <span className="text-[10px] text-slate-600">100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
