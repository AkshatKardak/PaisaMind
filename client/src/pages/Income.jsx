import { Plus, Wallet2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/ui/EmptyState";
import KPICard from "../components/ui/KPICard";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../utils/formatCurrency";
import * as incomeService from "../services/incomeService";

// Factory function so every drawer open gets today's date fresh
const getInitialForm = () => ({
  source: "",
  amount: "",
  category: "Client Payment",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
});

function Income() {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(getInitialForm);

  const incomeQuery = useQuery({ queryKey: ["income-page"], queryFn: () => incomeService.getIncome({}) });
  const summaryQuery = useQuery({ queryKey: ["income-summary-page"], queryFn: incomeService.getSummary });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? incomeService.updateIncome({ id: editing._id, ...payload }) : incomeService.addIncome(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-page"] });
      queryClient.invalidateQueries({ queryKey: ["income-summary-page"] });
      setDrawerOpen(false);
      setEditing(null);
      setForm(getInitialForm());
      showToast({ type: "success", title: editing ? "Income updated" : "Income added" });
    },
    onError: (error) => showToast({ type: "error", title: "Could not save income", message: error.response?.data?.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: incomeService.deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-page"] });
      queryClient.invalidateQueries({ queryKey: ["income-summary-page"] });
      setDeleting(null);
      showToast({ type: "success", title: "Income deleted" });
    },
  });

  const incomeItems = incomeQuery.data?.data ?? [];
  const totals = useMemo(() => {
    const total = incomeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const average = incomeItems.length ? total / incomeItems.length : 0;
    return { total, average, entries: incomeItems.length };
  }, [incomeItems]);

  const handleEdit = (item) => {
    setEditing(item);
    // Fix UTC timezone offset so the date doesn't shift by one day
    const d = new Date(item.date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    setForm({
      source: item.source,
      amount: item.amount,
      category: item.category,
      date: localDate,
      notes: item.notes || "",
    });
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setEditing(null);
    setForm(getInitialForm());
  };

  const chartData = summaryQuery.data?.data ?? [];
  const tooltipStyle = {
    background: isDark ? "#111827" : "#ffffff",
    border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
    borderRadius: "12px",
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="text-sm text-[var(--text-secondary)]">Track every payment source and watch your revenue trend.</p>
        </div>
        <button className="pm-button pm-button-primary flex items-center gap-2" onClick={() => setDrawerOpen(true)}>
          <Plus size={18} />
          Add Income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KPICard title="Total Income" value={formatINR(totals.total)} icon={Wallet2} color="bg-sky-500/15 text-sky-400" />
        <KPICard title="Average Entry" value={formatINR(totals.average)} icon={Wallet2} color="bg-violet-500/15 text-violet-400" />
        <KPICard title="Entries" value={String(totals.entries)} icon={Wallet2} color="bg-emerald-500/15 text-emerald-400" />
      </div>

      {incomeItems.length === 0 ? (
        <EmptyState
          icon={Wallet2}
          title="No income records yet"
          subtitle="Add your first payment so PaisaMind can start building revenue trends and tax visibility."
          ctaText="Add Income"
          onCta={() => setDrawerOpen(true)}
        />
      ) : (
        <>
          <div className="pm-card">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Monthly Trend</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatINR(value)} contentStyle={tooltipStyle} />
                  <Area dataKey="total" stroke="#0EA5E9" fill="rgba(14,165,233,0.16)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pm-card">
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeItems.map((item) => (
                    <tr key={item._id}>
                      <td>{new Date(item.date).toLocaleDateString("en-IN")}</td>
                      <td className="font-medium">{item.source}</td>
                      <td><span className="pm-badge bg-sky-500/10 text-sky-300">{item.category}</span></td>
                      <td className="font-semibold text-sky-400">{formatINR(item.amount)}</td>
                      <td className="max-w-xs text-sm text-[var(--text-secondary)]">{item.notes || "No notes"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="pm-button pm-button-ghost !px-3 !py-2 text-xs" onClick={() => handleEdit(item)}>Edit</button>
                          <button className="pm-button pm-button-danger !px-3 !py-2 text-xs" onClick={() => setDeleting(item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {drawerOpen && (
        <div className="pm-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="pm-drawer">
            <div className="pm-drawer-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">{editing ? "Edit Income" : "Add Income"}</h3>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close drawer"
                className="pm-close-button shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate({ ...form, amount: Number(form.amount) });
              }}
            >
              <input className="pm-input" placeholder="Source" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} required />
              <input className="pm-input" placeholder="Amount ₹" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
              <select className="pm-select" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                <option>Client Payment</option>
                <option>UPI</option>
                <option>Freelance Platform</option>
                <option>Other</option>
              </select>
              <input className="pm-input" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
              <textarea className="pm-textarea" rows="4" placeholder="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Income" : "Save Income"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.source || "income entry"}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}

export default Income;
