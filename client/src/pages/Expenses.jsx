import { Plus, ReceiptIndianRupee, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/ui/EmptyState";
import KPICard from "../components/ui/KPICard";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import { showToast } from "../components/ui/Toast";
import { formatINR } from "../utils/formatCurrency";
import * as expenseService from "../services/expenseService";

// Factory so every drawer open gets today's date fresh
const getInitialForm = () => ({
  title: "",
  amount: "",
  category: "Software",
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
  lastUsed: new Date().toISOString().slice(0, 10),
});

/**
 * toLocalDateString — fix: dates stored as UTC midnight shift back 1 day
 * when rendered with toLocaleDateString() in IST (+05:30).
 * We compensate by reconstructing the date from its UTC components so the
 * displayed date always matches what the user entered.
 */
const toLocalDateString = (rawDate) => {
  if (!rawDate) return "—";
  const d = new Date(rawDate);
  const local = new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate()
  );
  return local.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function Expenses() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(getInitialForm);

  const expensesQuery = useQuery({ queryKey: ["expenses-page"], queryFn: () => expenseService.getExpenses({}) });
  const subscriptionsQuery = useQuery({ queryKey: ["subscriptions-page"], queryFn: expenseService.getSubscriptions });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? expenseService.updateExpense({ id: editing._id, ...payload }) : expenseService.addExpense(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-page"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions-page"] });
      setDrawerOpen(false);
      setEditing(null);
      setForm(getInitialForm());
      showToast({ type: "success", title: editing ? "Expense updated" : "Expense added" });
    },
    onError: (error) =>
      showToast({
        type: "error",
        title: "Could not save expense",
        message: error.message || error.response?.data?.message || "Please try again.",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-page"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions-page"] });
      setDeleting(null);
      showToast({ type: "success", title: "Expense deleted" });
    },
    onError: (error) =>
      showToast({
        type: "error",
        title: "Could not delete expense",
        message: error.message || "Please try again.",
      }),
  });

  const expenses = expensesQuery.data?.data ?? [];
  const totals = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const recurring = expenses.filter((item) => item.isRecurring).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { total, recurring, count: expenses.length };
  }, [expenses]);

  const leaks = subscriptionsQuery.data?.data?.flaggedItems ?? [];
  const leakMeta = subscriptionsQuery.data?.data ?? { annualBleed: 0 };

  const startEdit = (item) => {
    setEditing(item);
    // Normalise UTC date → local YYYY-MM-DD string for the date input
    const d = new Date(item.date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    let localLastUsed = new Date().toISOString().slice(0, 10);
    if (item.lastUsed) {
      const lu = new Date(item.lastUsed);
      localLastUsed = new Date(lu.getTime() - lu.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    }
    setForm({
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: localDate,
      isRecurring: item.isRecurring,
      lastUsed: localLastUsed,
    });
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setForm(getInitialForm());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-[var(--text-secondary)]">See what you spend, what repeats, and what quietly leaks cash.</p>
        </div>
        <button className="pm-button pm-button-primary flex items-center gap-2" onClick={() => setDrawerOpen(true)}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KPICard title="Total Expenses" value={formatINR(totals.total)} icon={ReceiptIndianRupee} color="bg-red-500/15 text-red-400" />
        <KPICard title="Recurring Spend" value={formatINR(totals.recurring)} icon={ReceiptIndianRupee} color="bg-amber-500/15 text-amber-400" />
        <KPICard title="Entries" value={String(totals.count)} icon={ReceiptIndianRupee} color="bg-violet-500/15 text-violet-400" />
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={ReceiptIndianRupee}
          title="No expenses logged yet"
          subtitle="Start tracking software, travel, and internet costs to surface your real profit."
          ctaText="Add Expense"
          onCta={() => setDrawerOpen(true)}
        />
      ) : (
        <div className="pm-card">
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Recurring</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={item._id}>
                    {/* Use toLocalDateString helper — fixes UTC→IST -1 day shift */}
                    <td>{toLocalDateString(item.date)}</td>
                    <td className="font-medium">{item.title}</td>
                    <td><span className="pm-badge border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">{item.category}</span></td>
                    <td className="font-semibold text-red-400">{formatINR(item.amount)}</td>
                    <td>{item.isRecurring ? <span className="pm-badge bg-amber-500/15 text-amber-400">Recurring</span> : "-"}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="pm-button pm-button-ghost !px-3 !py-2 text-xs" onClick={() => startEdit(item)}>Edit</button>
                        <button className="pm-button pm-button-danger !px-3 !py-2 text-xs" onClick={() => setDeleting(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pm-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Subscription Leak Detector</h3>
            <p className="text-sm text-[var(--text-secondary)]">Recurring expenses unused for 30+ days</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Annual Bleed</div>
            <div className="text-xl font-bold text-red-400">{formatINR(leakMeta.annualBleed || 0)}</div>
          </div>
        </div>
        <div className="space-y-3">
          {leaks.length ? (
            leaks.map((item) => (
              <div key={item._id} className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{item.daysUnused} days unused</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-[var(--text-secondary)] md:flex">
                  <span>Monthly {formatINR(item.monthlyBleed)}</span>
                  <span className="text-red-400">Yearly {formatINR(item.annualBleed)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No subscription leaks detected right now.</p>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="pm-drawer-overlay" onClick={(event) => { if (event.target === event.currentTarget) handleCloseDrawer(); }}>
          <div className="pm-drawer">
            <div className="pm-drawer-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">{editing ? "Edit Expense" : "Add Expense"}</h3>
              <button
                type="button"
                className="pm-close-button shrink-0"
                aria-label="Close drawer"
                onClick={handleCloseDrawer}
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate({
                  ...form,
                  amount: Number(form.amount),
                  lastUsed: form.isRecurring ? form.lastUsed : null,
                });
              }}
            >
              <input
                className="pm-input"
                placeholder="Title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
              <input
                className="pm-input"
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
              />
              <select
                className="pm-select"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                <option>Food</option>
                <option>Software</option>
                <option>Travel</option>
                <option>Internet</option>
                <option>Marketing</option>
                <option>Other</option>
              </select>
              {/* Date input — onChange correctly wired; value is always a local YYYY-MM-DD string */}
              <input
                className="pm-input"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(event) => setForm((current) => ({ ...current, isRecurring: event.target.checked }))}
                />
                <span>Recurring expense</span>
              </label>
              {/* lastUsed date — always rendered but hidden; avoids flicker when toggling recurring */}
              <input
                className="pm-input"
                type="date"
                value={form.lastUsed}
                onChange={(event) => setForm((current) => ({ ...current, lastUsed: event.target.value }))}
                style={{ display: form.isRecurring ? "block" : "none" }}
              />
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Expense" : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.title || "expense"}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}

export default Expenses;
