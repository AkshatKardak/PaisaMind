import { AlertTriangle, Calculator } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "../utils/formatCurrency";
import { getTaxComparison } from "../utils/taxCalculator";
import api from "../services/api";

const getGSTStatus = async () => (await api.get("/tax/gst-status")).data;
const getAdvanceTax = async () => (await api.get("/tax/advance-tax")).data;

function TaxPlanner() {
  const [inputs, setInputs] = useState({ income: 1200000, section80C: 150000, section80D: 25000, hra: 0 });
  const gstQuery = useQuery({ queryKey: ["gst-status"], queryFn: getGSTStatus });
  const advanceTaxQuery = useQuery({ queryKey: ["advance-tax"], queryFn: getAdvanceTax });

  const comparison = useMemo(() => getTaxComparison(inputs.income, inputs), [inputs]);
  const gst = gstQuery.data?.data || { ytdIncome: 0, threshold: 2000000, percentage: 0 };
  const quarters = advanceTaxQuery.data?.data?.quarters || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Tax Planner</h1>
        <p className="text-sm text-[var(--text-secondary)]">Stay ahead of GST thresholds and pick the most efficient regime.</p>
      </div>

      <section className="pm-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">GST Threshold Monitor</h3>
            <p className="text-sm text-[var(--text-secondary)]">{formatINR(gst.ytdIncome)} used of {formatINR(gst.threshold)}</p>
          </div>
          {gst.percentage > 90 ? (
            <div className="pm-badge bg-red-500/15 text-red-400 animate-pulse">
              <AlertTriangle size={14} />
              Critical
            </div>
          ) : null}
        </div>
        <div className="h-4 rounded-full bg-[var(--bg-elevated)]">
          <div
            className={`h-4 rounded-full ${gst.percentage > 90 ? "bg-red-500" : gst.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(gst.percentage, 100)}%` }}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="pm-card">
          <h3 className="mb-4 text-xl font-semibold">Regime Comparator</h3>
          <div className="grid gap-4">
            <input className="pm-input" type="number" value={inputs.income} onChange={(event) => setInputs((current) => ({ ...current, income: Number(event.target.value) }))} placeholder="Income" />
            <input className="pm-input" type="number" value={inputs.section80C} onChange={(event) => setInputs((current) => ({ ...current, section80C: Number(event.target.value) }))} placeholder="80C" />
            <input className="pm-input" type="number" value={inputs.section80D} onChange={(event) => setInputs((current) => ({ ...current, section80D: Number(event.target.value) }))} placeholder="80D" />
            <input className="pm-input" type="number" value={inputs.hra} onChange={(event) => setInputs((current) => ({ ...current, hra: Number(event.target.value) }))} placeholder="HRA" />
            <button className="pm-button pm-button-primary">Compare Now</button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="pm-card">
            <div className="text-sm text-[var(--text-secondary)]">Old Regime</div>
            <div className="mt-2 text-3xl font-bold">{formatINR(comparison.oldRegime.totalTax)}</div>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">Taxable income {formatINR(comparison.oldRegime.taxableIncome)}</div>
          </div>
          <div className="pm-card">
            <div className="text-sm text-[var(--text-secondary)]">New Regime</div>
            <div className="mt-2 text-3xl font-bold">{formatINR(comparison.newRegime.totalTax)}</div>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">Taxable income {formatINR(comparison.newRegime.taxableIncome)}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            Recommendation: choose the <strong>{comparison.better}</strong> regime and save {formatINR(comparison.savings)}.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quarters.map((quarter) => (
          <div key={quarter.quarter} className="pm-card">
            <div className="mb-2 text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">{quarter.quarter}</div>
            <div className="text-2xl font-bold">{formatINR(quarter.amount)}</div>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">{new Date(quarter.deadline).toLocaleDateString("en-IN")}</div>
            <div className={`mt-4 pm-badge ${quarter.status === "due-soon" ? "bg-amber-500/15 text-amber-400" : quarter.status === "overdue" ? "bg-red-500/15 text-red-400" : "bg-sky-500/15 text-sky-400"}`}>
              {quarter.countdownDays >= 0 ? `${quarter.countdownDays} days left` : "Overdue"}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default TaxPlanner;
