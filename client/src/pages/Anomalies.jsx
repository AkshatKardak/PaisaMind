import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Copy,
  TrendingUp,
  Trash2,
  Check,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { analyticsService } from "../services/analyticsService";

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [anomRes, dupRes, subRes] = await Promise.all([
        analyticsService.getAnomalies(6),
        analyticsService.getDuplicates(3),
        analyticsService.getRecurring(),
      ]);

      if (anomRes.success) setAnomalies(anomRes.data.anomalies || []);
      if (dupRes.success) setDuplicates(dupRes.data || []);
      if (subRes.success) setSubscriptionsData(subRes.data);
    } catch (err) {
      console.error("Failed to load anomalies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveDuplicate = async (pairId, deleteTxId, keepTxId) => {
    setResolvingId(pairId);
    try {
      await analyticsService.resolveDuplicate("delete_duplicate", keepTxId, deleteTxId);
      setDuplicates((prev) => prev.filter((d) => d.id !== pairId));
    } catch (err) {
      alert("Failed to resolve duplicate: " + err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const handleDismissDuplicate = (pairId) => {
    setDuplicates((prev) => prev.filter((d) => d.id !== pairId));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-secondary)]">
        Scanning transactions for spending spikes and duplicates...
      </div>
    );
  }

  const priceIncreases = subscriptionsData?.priceIncreases || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="text-amber-500" />
            Anomalies & Duplicate Detection
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Statistical Z-score spikes, potential double-billings, and subscription price hikes
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-1.5"
        >
          <Zap size={14} className="text-indigo-500" />
          Re-scan Transactions
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-5 border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-[var(--text-primary)]">
              {anomalies.length}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Spending Spikes</div>
          </div>
        </div>

        <div className="rounded-3xl p-5 border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <Copy size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-[var(--text-primary)]">
              {duplicates.length}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Duplicate Candidates</div>
          </div>
        </div>

        <div className="rounded-3xl p-5 border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-[var(--text-primary)]">
              {priceIncreases.length}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">SaaS Price Hikes</div>
          </div>
        </div>
      </div>

      {/* Duplicate Candidates Section */}
      <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Copy size={20} className="text-rose-500" />
          Duplicate Candidate Reviewer
        </h2>

        {duplicates.length === 0 ? (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-sm">
            <ShieldCheck size={18} />
            No duplicate transactions detected across your recent bank and expense records.
          </div>
        ) : (
          <div className="space-y-3">
            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-primary)] border border-rose-500/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {dup.similarityScore}% Match
                    </span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      ₹{dup.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{dup.reason}</p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleResolveDuplicate(dup.id, dup.transactionB._id, dup.transactionA._id)}
                    disabled={resolvingId === dup.id}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                  >
                    <Trash2 size={13} />
                    Delete Duplicate
                  </button>
                  <button
                    onClick={() => handleDismissDuplicate(dup.id)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-all"
                  >
                    Keep Both
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Spikes Section */}
      <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp size={20} className="text-amber-500" />
          Statistical Spending Spikes & Outliers
        </h2>

        {anomalies.length === 0 ? (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-sm">
            <ShieldCheck size={18} />
            All categories are operating within standard historical baselines (Z-score &lt; 2.0).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((anom, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    +{anom.percentageDeviation}% vs Avg
                  </span>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    Z-Score: {anom.zScore}
                  </span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {anom.category}
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {anom.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Price Hikes */}
      {priceIncreases.length > 0 && (
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            Detected SaaS Subscription Price Increases
          </h2>
          <div className="space-y-2.5">
            {priceIncreases.map((pi, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--text-primary)]">{pi.merchant}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{pi.description}</div>
                </div>
                <div className="text-xs font-bold text-rose-500">+{pi.percentageIncrease}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
