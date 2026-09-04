import { useState, useEffect } from "react";
import {
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Building,
  DollarSign,
  Calendar,
} from "lucide-react";
import { netWorthService } from "../services/netWorthService";

export default function NetWorth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);

  const [assetForm, setAssetForm] = useState({
    name: "",
    type: "bank_account",
    amount: "",
    institution: "",
    isLiquid: true,
  });

  const [liabilityForm, setLiabilityForm] = useState({
    name: "",
    type: "emi",
    currentBalance: "",
    monthlyEmi: "",
    interestRate: "",
    lender: "",
    nextPaymentDate: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await netWorthService.getOverview();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load net worth:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await netWorthService.createAsset({
        ...assetForm,
        amount: Number(assetForm.amount),
      });
      setShowAssetModal(false);
      setAssetForm({ name: "", type: "bank_account", amount: "", institution: "", isLiquid: true });
      loadData();
    } catch (err) {
      alert("Failed to add asset: " + err.message);
    }
  };

  const handleCreateLiability = async (e) => {
    e.preventDefault();
    try {
      await netWorthService.createLiability({
        ...liabilityForm,
        currentBalance: Number(liabilityForm.currentBalance),
        monthlyEmi: Number(liabilityForm.monthlyEmi || 0),
        interestRate: Number(liabilityForm.interestRate || 0),
        nextPaymentDate: liabilityForm.nextPaymentDate || undefined,
      });
      setShowLiabilityModal(false);
      setLiabilityForm({ name: "", type: "emi", currentBalance: "", monthlyEmi: "", interestRate: "", lender: "", nextPaymentDate: "" });
      loadData();
    } catch (err) {
      alert("Failed to add liability: " + err.message);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Remove this asset?")) return;
    try {
      await netWorthService.deleteAsset(id);
      loadData();
    } catch (err) {
      alert("Failed to delete asset: " + err.message);
    }
  };

  const handleDeleteLiability = async (id) => {
    if (!window.confirm("Remove this liability?")) return;
    try {
      await netWorthService.deleteLiability(id);
      loadData();
    } catch (err) {
      alert("Failed to delete liability: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-secondary)]">
        Aggregating assets, liabilities, and debt ratios...
      </div>
    );
  }

  const netWorth = data?.netWorth || 0;
  const totalAssets = data?.totalAssets || 0;
  const totalLiabilities = data?.totalLiabilities || 0;
  const upcomingEmis = data?.upcomingEmis || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <PieChart className="text-indigo-500" />
            Net Worth & Debt Intelligence
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Total asset valuation, liquid liquidity, and EMI debt management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssetModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={14} /> Add Asset
          </button>
          <button
            onClick={() => setShowLiabilityModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Add Debt / EMI
          </button>
        </div>
      </div>

      {/* Hero Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-2 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Total Net Worth
          </div>
          <div className="text-3xl font-black font-display text-[var(--text-primary)]">
            ₹{netWorth.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-emerald-500 font-medium">Assets minus Liabilities</div>
        </div>

        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-2 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Total Assets
          </div>
          <div className="text-3xl font-black font-display text-emerald-600">
            ₹{totalAssets.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Includes ₹{data?.totalReceivables?.toLocaleString("en-IN")} unpaid invoice receivables
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-2 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Debt-to-Income (DTI)
          </div>
          <div className="text-3xl font-black font-display text-[var(--text-primary)]">
            {data?.dtiPercentage}%
          </div>
          <div className={`text-xs font-semibold ${data?.dtiRisk === "HEALTHY" ? "text-emerald-500" : "text-amber-500"}`}>
            Status: {data?.dtiRisk} (₹{data?.totalMonthlyEmi?.toLocaleString("en-IN")}/mo total EMIs)
          </div>
        </div>
      </div>

      {/* Upcoming EMI Pressure Alert */}
      {upcomingEmis.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-sm">Upcoming EMI Alert (Next 7 Days)</div>
            {upcomingEmis.map((emi) => (
              <div key={emi._id}>
                <strong>{emi.name}</strong> of ₹{emi.monthlyEmi?.toLocaleString("en-IN")} due in{" "}
                {emi.daysUntilDue} days ({new Date(emi.nextPaymentDate).toLocaleDateString("en-IN")}).
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets & Liabilities Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building size={18} className="text-emerald-500" />
            Assets & Accounts ({data?.assets?.length || 0})
          </h2>
          <div className="space-y-2.5">
            {data?.assets?.map((asset) => (
              <div
                key={asset._id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">{asset.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {asset.institution || asset.type} • {asset.isLiquid ? "Liquid" : "Illiquid"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    ₹{asset.amount?.toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleDeleteAsset(asset._id)}
                    className="text-[var(--text-secondary)] hover:text-rose-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard size={18} className="text-rose-500" />
            Debts & EMIs ({data?.liabilities?.length || 0})
          </h2>
          <div className="space-y-2.5">
            {data?.liabilities?.map((l) => (
              <div
                key={l._id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">{l.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {l.lender || l.type} {l.monthlyEmi > 0 ? `• ₹${l.monthlyEmi}/mo EMI` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-rose-500">
                    ₹{l.currentBalance?.toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleDeleteLiability(l._id)}
                    className="text-[var(--text-secondary)] hover:text-rose-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-3xl p-6 bg-[var(--bg-elevated)] border border-[var(--border)] w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Asset / Account</h3>
            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g. HDFC Savings, Zerodha Stocks"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Asset Type</label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                  >
                    <option value="bank_account">Bank Account</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="mutual_fund">Mutual Fund</option>
                    <option value="stocks">Stocks / Equity</option>
                    <option value="fixed_deposit">Fixed Deposit</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={assetForm.amount}
                    onChange={(e) => setAssetForm({ ...assetForm, amount: e.target.value })}
                    placeholder="50000"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Institution / Broker</label>
                <input
                  type="text"
                  value={assetForm.institution}
                  onChange={(e) => setAssetForm({ ...assetForm, institution: e.target.value })}
                  placeholder="e.g. HDFC Bank, Zerodha"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="liquidCheck"
                  checked={assetForm.isLiquid}
                  onChange={(e) => setAssetForm({ ...assetForm, isLiquid: e.target.checked })}
                  className="rounded accent-indigo-600"
                />
                <label htmlFor="liquidCheck" className="text-xs text-[var(--text-primary)]">
                  Liquid (accessible immediately for emergencies)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liability Modal */}
      {showLiabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-3xl p-6 bg-[var(--bg-elevated)] border border-[var(--border)] w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Debt / EMI</h3>
            <form onSubmit={handleCreateLiability} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Liability / Loan Name</label>
                <input
                  type="text"
                  required
                  value={liabilityForm.name}
                  onChange={(e) => setLiabilityForm({ ...liabilityForm, name: e.target.value })}
                  placeholder="e.g. MacBook EMI, Credit Card"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Type</label>
                  <select
                    value={liabilityForm.type}
                    onChange={(e) => setLiabilityForm({ ...liabilityForm, type: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                  >
                    <option value="emi">No-Cost / Product EMI</option>
                    <option value="credit_card">Credit Card Balance</option>
                    <option value="personal_loan">Personal Loan</option>
                    <option value="business_loan">Business Loan</option>
                    <option value="home_loan">Home Loan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    required
                    value={liabilityForm.currentBalance}
                    onChange={(e) => setLiabilityForm({ ...liabilityForm, currentBalance: e.target.value })}
                    placeholder="40000"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={liabilityForm.monthlyEmi}
                    onChange={(e) => setLiabilityForm({ ...liabilityForm, monthlyEmi: e.target.value })}
                    placeholder="5000"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Next Due Date</label>
                  <input
                    type="date"
                    value={liabilityForm.nextPaymentDate}
                    onChange={(e) => setLiabilityForm({ ...liabilityForm, nextPaymentDate: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLiabilityModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
