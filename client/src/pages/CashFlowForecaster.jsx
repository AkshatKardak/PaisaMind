import { BarChart3, Brain, Loader2, TrendingUp, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../utils/formatCurrency";
import { getCashFlowForecast } from "../services/aiService";

const CONFIDENCE_STYLES = {
  High: "bg-emerald-500/15 text-emerald-400",
  Medium: "bg-amber-500/15 text-amber-400",
  Low: "bg-red-500/15 text-red-400",
};

function CashFlowForecaster() {
  const { isDark } = useTheme();

  const query = useQuery({
    queryKey: ["cash-flow-forecast"],
    queryFn: getCashFlowForecast,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });

  const { history = [], forecast = [], pendingInvoiceValue = 0, runway = "" } =
    query.data?.data || {};

  const chartData = [
    ...history.map((item) => ({ ...item, type: "Actual" })),
    ...forecast.map((item) => ({
      month: item.month,
      income: item.predictedIncome,
      type: "Forecast",
      confidence: item.confidence,
    })),
  ];

  const totalForecast = forecast.reduce(
    (sum, item) => sum + Number(item.predictedIncome || 0),
    0
  );
  const avgForecast = forecast.length > 0 ? totalForecast / forecast.length : 0;

  const gridStroke = isDark ? "#1F2937" : "#E2E8F0";
  const axisTick = { fill: isDark ? "#6B7280" : "#94A3B8", fontSize: 12 };
  const tooltipStyle = {
    background: isDark ? "#111827" : "#FFFFFF",
    border: `1px solid ${isDark ? "#374151" : "#E2E8F0"}`,
    borderRadius: "12px",
    color: isDark ? "#F9FAFB" : "#0F172A",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Cash Flow Forecaster</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            3-month income prediction based on historical patterns and pending invoice pipeline.
          </p>
        </div>
        <button
          className="pm-button pm-button-primary flex items-center gap-2"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <TrendingUp size={16} />
          )}
          {query.isFetching ? "Forecasting..." : "Refresh Forecast"}
        </button>
      </div>

      {query.isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <Brain size={40} className="animate-pulse text-sky-400" />
          <p className="text-[var(--text-secondary)]">
            Analysing 6 months of income history and invoice pipeline…
          </p>
        </div>
      )}

      {query.isError && (
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-6 text-center">
          <p className="font-semibold text-amber-400">Not enough data to forecast yet</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Add at least 2–3 months of income and expense records so the AI has enough history
            to generate a reliable 3-month prediction. Once you have data, click{" "}
            <strong>Refresh Forecast</strong> above.
          </p>
        </div>
      )}

      {!query.isLoading && !query.isError && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="pm-card">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Avg Monthly Forecast
              </div>
              <div className="mt-2 text-3xl font-bold text-sky-400">
                {formatINR(avgForecast)}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">next 3 months avg</div>
            </div>
            <div className="pm-card">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                3-Month Total
              </div>
              <div className="mt-2 text-3xl font-bold text-emerald-400">
                {formatINR(totalForecast)}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">predicted income</div>
            </div>
            <div className="pm-card">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Confirmed Pipeline
              </div>
              <div className="mt-2 text-3xl font-bold text-violet-400">
                {formatINR(pendingInvoiceValue)}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">from unpaid invoices</div>
            </div>
            <div className="pm-card">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Cash Runway
              </div>
              <div className="mt-2 text-xl font-bold text-amber-400 leading-tight">
                {runway || "—"}
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="pm-card">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-sky-400" />
                <div>
                  <h3 className="text-xl font-semibold">Income History + 3-Month Forecast</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Blue = actual, Orange = AI-predicted
                  </p>
                </div>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke={gridStroke} tick={axisTick} />
                    <YAxis
                      stroke={gridStroke}
                      tick={axisTick}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={tooltipStyle}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.type === "Forecast" ? "#F59E0B" : "#0EA5E9"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {forecast.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {forecast.map((item, idx) => (
                <div key={idx} className="pm-card">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {item.month}
                  </div>
                  <div className="mt-3 text-3xl font-bold text-amber-400">
                    {formatINR(item.predictedIncome)}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Confidence</span>
                    <span
                      className={`pm-badge ${
                        CONFIDENCE_STYLES[item.confidence] || "bg-slate-500/15 text-slate-300"
                      }`}
                    >
                      {item.confidence}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-[var(--text-muted)]">
                    {item.confidence === "High"
                      ? "Based on consistent historical patterns and confirmed invoice pipeline."
                      : item.confidence === "Medium"
                      ? "Moderate confidence — some variability detected in historical data."
                      : "Low confidence — limited history or high income variability detected."}
                  </div>
                </div>
              ))}
            </div>
          )}

          {forecast.length === 0 && !query.isLoading && (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
              <Wallet size={36} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="font-semibold text-[var(--text-primary)]">No forecast data yet</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Click <strong>Refresh Forecast</strong> to generate your 3-month prediction.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CashFlowForecaster;
