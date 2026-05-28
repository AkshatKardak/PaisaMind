import { Brain, ChevronDown, ChevronUp, IndianRupee, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "../utils/formatCurrency";
import { getTaxSavingSuggestions } from "../services/aiService";

const PRIORITY_STYLES = {
  High: "bg-red-500/15 text-red-400",
  Medium: "bg-amber-500/15 text-amber-400",
  Low: "bg-sky-500/15 text-sky-400",
};

const SECTION_STYLES = {
  "80C": "bg-violet-500/15 text-violet-300",
  "80D": "bg-emerald-500/15 text-emerald-300",
  "80CCD": "bg-sky-500/15 text-sky-300",
  Other: "bg-slate-500/15 text-slate-300",
};

function ProgressBar({ current, recommended }) {
  const pct = recommended > 0 ? Math.min((current / recommended) * 100, 100) : 0;
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
        <span>Invested {formatINR(current)}</span>
        <span>Target {formatINR(recommended)}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-[var(--text-muted)]">
        {Math.round(pct)}% done
      </div>
    </div>
  );
}

function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pm-card flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 font-bold">
            {index + 1}
          </div>
          <div>
            <h3 className="text-lg font-bold">{rec.instrument}</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`pm-badge ${SECTION_STYLES[rec.section] || SECTION_STYLES.Other}`}>
                Section {rec.section}
              </span>
              <span className={`pm-badge ${PRIORITY_STYLES[rec.priority] || "bg-slate-500/15 text-slate-300"}`}>
                {rec.priority} Priority
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Tax Saving</div>
          <div className="text-2xl font-bold text-emerald-400">{formatINR(rec.taxSaving)}</div>
          <div className="text-xs text-[var(--text-secondary)]">Deadline: {rec.deadline}</div>
        </div>
      </div>

      <ProgressBar current={Number(rec.current || 0)} recommended={Number(rec.recommended || 0)} />

      <button
        className="flex items-center gap-1 self-start text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {expanded ? "Hide" : "Show"} reasoning
      </button>

      {expanded && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)] leading-7">
          {rec.reason}
        </div>
      )}
    </div>
  );
}

function TaxAssistant() {
  const query = useQuery({
    queryKey: ["tax-saving-suggestions"],
    queryFn: getTaxSavingSuggestions,
    staleTime: 1000 * 60 * 5,
  });

  const recommendations = query.data?.data ?? [];
  const totalSaving = recommendations.reduce((sum, r) => sum + Number(r.taxSaving || 0), 0);
  const highPriority = recommendations.filter((r) => r.priority === "High").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">AI Tax-Saving Assistant</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Personalized investment recommendations based on your income and current tax regime.
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
            <Sparkles size={16} />
          )}
          {query.isFetching ? "Analysing..." : "Refresh Advice"}
        </button>
      </div>

      {!query.isLoading && recommendations.length > 0 && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <div className="pm-card">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Total Potential Saving
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-400">
              {formatINR(totalSaving)}
            </div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">if all recommendations followed</div>
          </div>
          <div className="pm-card">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              High Priority Actions
            </div>
            <div className="mt-2 text-3xl font-bold text-red-400">{highPriority}</div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">need immediate attention</div>
          </div>
          <div className="pm-card">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Instruments Suggested
            </div>
            <div className="mt-2 text-3xl font-bold text-violet-400">
              {recommendations.length}
            </div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">ranked by impact</div>
          </div>
        </div>
      )}

      {query.isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <Brain size={40} className="animate-pulse text-violet-400" />
          <p className="text-[var(--text-secondary)]">
            Groq AI is analysing your income, investments, and tax regime…
          </p>
        </div>
      )}

      {query.isError && (
        <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-6 text-center text-sm text-red-400">
          Could not fetch suggestions. Please check your connection and try again.
        </div>
      )}

      {!query.isLoading && recommendations.length === 0 && !query.isError && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <IndianRupee size={40} className="text-emerald-400" />
          <p className="font-semibold">No suggestions yet</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Make sure you have income entries logged this month, then click Refresh Advice.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <RecommendationCard key={`${rec.instrument}-${idx}`} rec={rec} index={idx} />
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 leading-6">
          ⚠️ These are AI-generated suggestions based on your logged data. Consult a CA before making investment decisions.
          All amounts are indicative and based on current Indian tax laws (FY 2025–26).
        </div>
      )}
    </div>
  );
}

export default TaxAssistant;