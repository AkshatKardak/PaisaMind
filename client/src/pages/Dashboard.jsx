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

const CHART_COLORS = ["#0891b2", "#6366f1", "#059669", "#ea580c", "#7c3aed", "#db2777"];

/* ── KPI Card ── */
function KPI({ title, value, icon: Icon, accent }) {
  return (
    <div
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon size={17} />
        </div>
      </div>
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums"
          style={{ color: accent }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ children, color }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}25`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

/* ── Card wrapper ── */
function Card({ children, className = "", accentGlow }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: accentGlow
          ? `0 0 0 1px var(--border-default), 0 8px 32px ${accentGlow}14`
          : "var(--shadow-card)",
      }}
    >
      {children}
    </div>
  );
}

/* ── AI Insight Card ── */
function AIInsightCard({ insight, type, onDismiss }) {
  const map = {
    warning: { color: "#d97706" },
    danger: { color: "#dc2626" },
    success: { color: "#059669" },
  };
  const { color } = map[type] || map.success;
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-3 text-xs leading-relaxed"
      style={{
        background: `${color}0c`,
        border: `1px solid ${color}22`,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-3 pl-1">
        <p style={{ color: "var(--text-primary)" }}>{insight}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          x
        </button>
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
    onError: (e) => showToast({ type: "error", title: "Could not generate", message: e.response?.data?.message || "Please try again." }),
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

  const totalIncome   = incomeItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const netProfit     = totalIncome - totalExpenses;

  const health = calculateHealthScore(
    incomeItems, expenseItems, invoiceItems,
    incomeSeries.map((item) => ({ income: item.income }))
  );

  const recentTransactions = [
    ...incomeItems.map((i)  => ({ ...i, type: "income",  title: i.source })),
    ...expenseItems.map((i) => ({ ...i, type: "expense", title: i.title })),
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

  const scoreColor = health.score >= 70 ? "#059669" : health.score >= 50 ? "#d97706" : "#dc2626";

  // Derive user's first name — prefer the name field from backend, fallback to email prefix
  const firstName = useMemo(() => {
    const name = user?.name || user?.displayName || "";
    if (name && name !== "PaisaMind User") return name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  }, [user]);

  // Chart tooltip style — adapts to theme
  const tooltipStyle = {
    background: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
    borderRadius: "12px",
    color: isDark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };
  const axisTickColor = isDark ? "#64748b" : "#94a3b8";
  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  return (
    <div className="space-y-5 pb-12">

      {/* ── Alert banners ── */}
      {alertBanners.map((b) => (
        <div
          key={b.text}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            background: b.type === "danger" ? "var(--danger-soft)" : "var(--warning-soft)",
            border: b.type === "danger" ? "1px solid var(--danger-border)" : "1px solid var(--warning-border)",
            color: b.type === "danger" ? "var(--danger)" : "var(--warning)",
          }}
        >
          <AlertTriangle size={15} className="shrink-0" />
          {b.text}
        </div>
      ))}

      {/* ── Hero banner ── */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--primary)", letterSpacing: "0.14em" }}
            >
              Welcome back
            </p>
            <h1
              className="mt-2 text-2xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Hey, <span style={{ color: "var(--primary)" }}>{firstName}</span>
            </h1>
            <p
              className="mt-1.5 max-w-lg text-sm leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Your financial overview is ready. Stay on top of cash flow, expenses, and tax in one place.
            </p>
          </div>
          <button
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
            className="pm-button pm-button-primary group flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60"
          >
            {reportMutation.isPending
              ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
              : <><Sparkles size={14} /> Generate AI Report <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></>}
          </button>
        </div>
      </Card>

      {/* ── KPI row — no fake change badges, show real data only ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPI title="Total Income"   value={formatINR(totalIncome)}   icon={TrendingUp}   accent="#0891b2" />
        <KPI title="Total Expenses" value={formatINR(totalExpenses)} icon={TrendingDown} accent="#dc2626" />
        <KPI title="Net Profit"     value={formatINR(netProfit)}     icon={IndianRupee}  accent={netProfit >= 0 ? "#059669" : "#dc2626"} />
        <KPI title="Health Score"   value={`${health.score} / 100`} icon={Activity}     accent={scoreColor} />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-5 xl:grid-cols-5">

        {/* Bar chart */}
        <Card className="xl:col-span-3">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <SectionLabel color="#0891b2">Cash Flow</SectionLabel>
              <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Income vs Expenses
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Monthly comparison — last 6 months
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeSeries} barGap={4}>
                <CartesianGrid vertical={false} stroke={gridStroke} />
                <XAxis dataKey="month" tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
                <Bar dataKey="income"  fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie chart */}
        <Card className="xl:col-span-2">
          <div className="mb-5">
            <SectionLabel color="#6366f1">Breakdown</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>Expense Mix</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseSummary.map((item) => ({ name: item._id || item.category, value: item.total }))} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={36}>
                  {expenseSummary.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {expenseSummary.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span style={{ color: "var(--text-muted)" }}>{item._id || item.category}</span>
                </div>
                <span style={{ color: "var(--text-primary)" }} className="font-medium tabular-nums">{formatINR(item.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Transactions ── */}
      <Card>
        <div className="mb-5">
          <SectionLabel color="#059669">Activity</SectionLabel>
          <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>Recent Transactions</h3>
        </div>
        <div className="space-y-3">
          {recentTransactions.slice(0, 8).map((item) => (
            <div key={item._id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: item.type === "income" ? "#0891b220" : "#dc262620" }}>
                  {item.type === "income" ? <TrendingUp size={14} color="#0891b2" /> : <TrendingDown size={14} color="#dc2626" />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(item.date).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: item.type === "income" ? "#0891b2" : "#dc2626" }}>
                {item.type === "income" ? "+" : "-"}{formatINR(item.amount)}
              </span>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>No transactions yet. Add income or expenses to get started.</p>
          )}
        </div>
      </Card>

      {/* ── AI Insights ── */}
      <Card accentGlow="#8B5CF6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <SectionLabel color="#8B5CF6">AI</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>Smart Insights</h3>
          </div>
          <button
            onClick={() => insightsQuery.refetch()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: "#8B5CF615", color: "#8B5CF6" }}
          >
            <RefreshCw size={13} className={insightsQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {insightsQuery.isLoading && <SkeletonLoader lines={3} />}
          {insightsQuery.isError && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>AI insights unavailable — check your API key configuration.</p>
          )}
          {(insightsQuery.data?.data?.insights || []).filter((item) => !dismissed.includes(item.insight)).map((item) => (
            <AIInsightCard
              key={item.insight}
              insight={item.insight}
              type={item.type}
              onDismiss={() => setDismissed((prev) => [...prev, item.insight])}
            />
          ))}
        </div>
      </Card>

    </div>
  );
}
