import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PieChart,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { analyticsService } from "../services/analyticsService";
import { formatINR } from "../utils/formatCurrency";

export default function FinancialHealth() {
  const [healthData, setHealthData] = useState(null);
  const [volatilityData, setVolatilityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("overall");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [healthRes, volRes] = await Promise.all([
          analyticsService.getFinancialHealth(),
          analyticsService.getVolatility(6),
        ]);
        if (healthRes.success) setHealthData(healthRes.data);
        if (volRes.success) setVolatilityData(volRes.data);
      } catch (err) {
        console.error("Failed to load financial health:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-secondary)]">
        Calculating 8-dimension health scorecard & monthly history...
      </div>
    );
  }

  const monthlyList = healthData?.monthlyHistory || [];
  const isOverall = selectedMonth === "overall";
  const activeMonthData = isOverall
    ? null
    : monthlyList.find((m) => m.monthKey === selectedMonth || m.month === selectedMonth) || monthlyList[0];

  const score = isOverall ? healthData?.totalScore || 0 : activeMonthData?.score || 0;
  const grade = isOverall ? healthData?.grade || "GOOD" : activeMonthData?.grade || "GOOD";
  const breakdown = isOverall
    ? healthData?.breakdown || {}
    : activeMonthData?.breakdown || healthData?.breakdown || {};
  const improvements = isOverall ? healthData?.improvements || [] : [];

  const gradeColor =
    grade === "EXCELLENT"
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : grade === "GOOD"
      ? "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
      : grade === "FAIR"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="text-indigo-500" />
            Financial Health Scorecard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Deterministic 8-pillar health evaluation with month-over-month trajectory
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/net-worth"
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5"
          >
            <PieChart size={14} className="text-purple-500" />
            <span>Net Worth & Debt Details</span>
          </Link>
          <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide ${gradeColor}`}>
            GRADE: {grade}
          </div>
        </div>
      </div>

      {/* Mode Selector / Month Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <Calendar size={15} className="text-indigo-500" />
          <span>Select Health Period:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedMonth("overall")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isOverall
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Overall (6-Mo Weighted)
          </button>
          {monthlyList.map((m) => (
            <button
              key={m.monthKey || m.month}
              onClick={() => setSelectedMonth(m.monthKey || m.month)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedMonth === (m.monthKey || m.month)
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {m.month}
            </button>
          ))}
        </div>
      </div>

      {/* Main Score Hero & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm min-w-0">
          <div className="text-6xl font-black font-display text-[var(--text-primary)] tracking-tight">
            {score}
            <span className="text-2xl text-[var(--text-secondary)] font-normal">/100</span>
          </div>
          <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-indigo-500">
            {isOverall ? "Overall Financial Health" : `${activeMonthData?.month} Health Score`}
          </div>
          <p className="mt-4 text-xs text-[var(--text-secondary)] max-w-xs">
            {isOverall
              ? "Calculated across cash flow stability, runway, debt burden, savings, and invoice risk."
              : `Monthly performance evaluated from ${formatINR(activeMonthData?.income || 0)} income and ${formatINR(activeMonthData?.expenses || 0)} spend.`}
          </p>
        </div>

        {/* Monthly Trend Chart / Volatility Card */}
        <div className="md:col-span-2 rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col justify-between shadow-sm space-y-4 min-w-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                6-Month Health Score Trajectory
              </div>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">
                {monthlyList.length > 0 ? `Latest: ${monthlyList[monthlyList.length - 1].score}/100` : ""}
              </span>
            </div>
            {monthlyList.length > 0 && (
              <div className="h-36 w-full min-w-0" style={{ minHeight: 144 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={144}>
                  <BarChart data={monthlyList} barGap={4}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--bg-elevated)", borderColor: "var(--border)", borderRadius: 12 }}
                      formatter={(v) => [`${v}/100`, "Health Score"]}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {monthlyList.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            selectedMonth === (entry.monthKey || entry.month)
                              ? "#6366f1"
                              : entry.score >= 80
                              ? "#10b981"
                              : entry.score >= 65
                              ? "#6366f1"
                              : "#f59e0b"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {volatilityData && isOverall && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[var(--border)]">
              <div>
                <div className="text-[11px] text-[var(--text-secondary)]">Avg Monthly Income</div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                  {formatINR(volatilityData.avgMonthlyIncome || 0)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-secondary)]">Income Stability</div>
                <div className="text-sm font-bold text-emerald-500">
                  {volatilityData.stabilityLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-secondary)]">Top Client Share</div>
                <div className={`text-sm font-bold ${volatilityData.topClientDependency > 40 ? "text-amber-500" : "text-[var(--text-primary)]"}`}>
                  {volatilityData.topClientDependency}% ({volatilityData.topClientName})
                </div>
              </div>
            </div>
          )}

          {!isOverall && activeMonthData && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[var(--border)]">
              <div>
                <div className="text-[11px] text-[var(--text-secondary)]">Month Income</div>
                <div className="text-sm font-bold text-emerald-500 font-mono">
                  {formatINR(activeMonthData.income)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-secondary)]">Month Expenses</div>
                <div className="text-sm font-bold text-rose-500 font-mono">
                  {formatINR(activeMonthData.expenses)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-secondary)]">Savings Rate</div>
                <div className="text-sm font-bold text-indigo-500 font-mono">
                  {activeMonthData.savingsRatePct}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Pillars Breakdown */}
      <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Layers size={20} className="text-indigo-500" />
          {isOverall
            ? "Transparent 8-Pillar Scorecard Breakdown (100 Points Max)"
            : `${activeMonthData?.month} Pillar Health Breakdown`}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {Object.entries(breakdown).map(([key, item]) => {
            const pct = Math.round((item.score / item.max) * 100);
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
                  <span className="font-mono font-bold text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] text-sm">{item.score}</span> / {item.max} pts
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{item.details}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Improvement Roadmap */}
      {isOverall && improvements.length > 0 && (
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            Recommended Action Items to Reach 90+ Score
          </h2>
          <div className="space-y-2.5">
            {improvements.map((imp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-xs">
                  {idx + 1}
                </div>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
