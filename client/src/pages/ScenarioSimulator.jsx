import { useState, useEffect } from "react";
import {
  Sliders,
  Play,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { scenarioService } from "../services/scenarioService";

export default function ScenarioSimulator() {
  const [scenarioType, setScenarioType] = useState("large_purchase");
  const [amount, setAmount] = useState(70000);
  const [percentage, setPercentage] = useState(25);
  const [itemDescription, setItemDescription] = useState("MacBook Pro M3");
  const [delayDays, setDelayDays] = useState(30);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await scenarioService.simulate({
        scenarioType,
        amount: Number(amount),
        percentage: Number(percentage),
        monthlyRecurring: Number(amount),
        delayDays: Number(delayDays),
        itemDescription,
      });
      if (res.success) {
        setSimResult(res.data);
      }
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [scenarioType]);

  const verdict = simResult?.results;
  const isAffordable = verdict?.isAffordable;
  const risk = verdict?.riskAssessment;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <Sliders className="text-indigo-500" />
          What-If Scenario Simulator
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Stress-test major purchases, revenue fluctuations, and delayed receivables across 3 cases
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-5 shadow-sm">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Scenario Parameters</h2>

          {/* Scenario Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Scenario Type
            </label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="large_purchase">Major One-Time Purchase</option>
              <option value="income_decrease">Revenue Drop / Loss of Client</option>
              <option value="income_increase">Revenue Growth / New Retainer</option>
              <option value="new_recurring_expense">New Monthly Hire / Fixed Expense</option>
              <option value="delayed_invoice">Delayed Client Invoice</option>
              <option value="new_emi">New Loan EMI Obligation</option>
            </select>
          </div>

          {/* Item / Scenario Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="e.g. MacBook Upgrade, Client A Loss"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dynamic Controls based on scenario type */}
          {(scenarioType === "large_purchase" || scenarioType === "new_recurring_expense" || scenarioType === "new_emi" || scenarioType === "delayed_invoice") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Amount (₹)
                </span>
                <span className="font-bold font-mono text-sm text-[var(--text-primary)]">
                  ₹{Number(amount).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="500000"
                step="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full accent-indigo-600"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>
          )}

          {(scenarioType === "income_decrease" || scenarioType === "income_increase") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Percentage Change
                </span>
                <span className="font-bold font-mono text-sm text-[var(--text-primary)]">
                  {percentage}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full accent-indigo-600"
              />
            </div>
          )}

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            <Play size={16} />
            {loading ? "Simulating..." : "Run Stress Test"}
          </button>
        </div>

        {/* Results & Projections Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decision Verdict Card */}
          {verdict && (
            <div
              className={`rounded-3xl p-6 border ${
                risk === "LOW"
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : risk === "MODERATE"
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-rose-500/5 border-rose-500/30"
              } space-y-3 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    risk === "LOW"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : risk === "MODERATE"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}
                >
                  RISK ASSESSMENT: {risk}
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  Current Liquid Cash: ₹{simResult.baseline?.currentCashBalance?.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                {verdict.recommendation}
              </p>
            </div>
          )}

          {/* 3-Track Scenario Outcomes */}
          {verdict && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  Base Case
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {verdict.baseCase?.runwayMonths ?? "—"} mo
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  6-Mo Balance: ₹{(verdict.baseCase?.endingBalance ?? 0).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                  Optimistic Track
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {verdict.optimisticCase?.runwayMonths ?? "—"} mo
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  6-Mo Balance: ₹{(verdict.optimisticCase?.endingBalance ?? 0).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                  Stress Case
                </div>
                <div className="text-2xl font-bold text-rose-600">
                  {verdict.stressCase?.runwayMonths ?? "—"} mo
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  6-Mo Balance: ₹{(verdict.stressCase?.endingBalance ?? 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          )}

          {/* 6-Month Trajectory Table */}
          {verdict && (
            <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                6-Month Projected Cash Trajectory
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                      <th className="pb-3 font-semibold">Month</th>
                      <th className="pb-3 font-semibold">Base Ending Cash</th>
                      <th className="pb-3 font-semibold">Optimistic</th>
                      <th className="pb-3 font-semibold">Stress Case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(verdict.baseCase?.monthlyBalances || []).map((m, idx) => (
                      <tr key={idx} className="py-2.5">
                        <td className="py-2.5 font-medium text-[var(--text-primary)]">{m.month}</td>
                        <td className="py-2.5 font-mono text-[var(--text-primary)]">
                          ₹{(m.balance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 font-mono text-emerald-500">
                          ₹{(verdict.optimisticCase?.monthlyBalances?.[idx]?.balance ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 font-mono text-rose-500">
                          ₹{(verdict.stressCase?.monthlyBalances?.[idx]?.balance ?? 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
