import { Plus, X, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import { showToast }      from "../components/ui/Toast";
import { formatINR }      from "../utils/formatCurrency";
import * as recurringService from "../services/recurringService";

const INCOME_CATEGORIES  = ["Salary", "Freelance", "Retainer", "Rental", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Software", "Travel", "Internet", "Marketing", "Other"];
const FREQUENCIES        = ["daily", "weekly", "monthly"];

const getInitialForm = () => ({
  type:      "income",
  title:     "",
  category:  "Other",
  amount:    "",
  frequency: "monthly",
  startDate: new Date().toISOString().slice(0, 10),
  notes:     "",
});

const FREQ_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

function Recurring() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(getInitialForm);
  const [deleting, setDeleting]   = useState(null);

  const query = useQuery({ queryKey: ["recurring"], queryFn: recurringService.getRecurring });

  const createMutation = useMutation({
    mutationFn: recurringService.createRecurring,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setModalOpen(false); setForm(getInitialForm());
      showToast({ type: "success", title: "Recurring transaction created" });
    },
    onError: (e) => showToast({ type: "error", title: "Could not save", message: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => recurringService.updateRecurring({ id, active }),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["recurring"] }); showToast({ type: "success", title: "Updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: recurringService.deleteRecurring,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["recurring"] }); setDeleting(null); showToast({ type: "success", title: "Deleted" }); },
  });

  const items          = query.data?.data ?? [];
  const activeItems    = items.filter((i) => i.active);
  const monthlyIncome  = activeItems.filter((i) => i.type === "income"  && i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);
  const monthlyExpense = activeItems.filter((i) => i.type === "expense" && i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);

  const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Recurring</h1>
          <p className="text-sm text-[var(--text-secondary)]">Set up automatic income and expense entries. The cron job creates them on schedule.</p>
        </div>
        <button className="pm-button pm-button-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Add Recurring
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Monthly Auto-Income</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: "#0891b2" }}>{formatINR(monthlyIncome)}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Monthly Auto-Expense</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: "#dc2626" }}>{formatINR(monthlyExpense)}</p>
        </div>
      </div>

      <div className="pm-card">
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th><th>Type</th><th>Category</th><th>Amount</th><th>Frequency</th><th>Next Run</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>No recurring transactions yet.</td></tr>
              )}
              {items.map((item) => (
                <tr key={item._id} style={{ opacity: item.active ? 1 : 0.5 }}>
                  <td className="font-medium">{item.title}</td>
                  <td>
                    <span className={`pm-badge ${item.type === "income" ? "bg-sky-500/15 text-sky-400" : "bg-red-500/15 text-red-400"}`}>
                      {item.type === "income" ? <TrendingUp size={11} className="inline mr-1" /> : <TrendingDown size={11} className="inline mr-1" />}
                      {item.type}
                    </span>
                  </td>
                  <td><span className="pm-badge bg-[var(--bg-elevated)] text-[var(--text-secondary)]">{item.category}</span></td>
                  <td className="font-semibold tabular-nums" style={{ color: item.type === "income" ? "#0891b2" : "#dc2626" }}>{formatINR(item.amount)}</td>
                  <td><span className="pm-badge bg-violet-500/15 text-violet-400">{FREQ_LABEL[item.frequency]}</span></td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {new Date(item.nextRunAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleMutation.mutate({ id: item._id, active: !item.active })}
                      className={`pm-badge cursor-pointer ${item.active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}
                    >
                      {item.active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td>
                    <button className="pm-button pm-button-danger !px-3 !py-2 text-xs" onClick={() => setDeleting(item)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Add Recurring Transaction</h3>
              <button type="button" className="pm-close-button shrink-0" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
                {["income", "expense"].map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => setForm((c) => ({ ...c, type: t, category: t === "income" ? "Other" : "Software" }))}
                    className="flex-1 py-2 text-sm font-semibold transition-colors"
                    style={{
                      background: form.type === t ? (t === "income" ? "#0891b2" : "#dc2626") : "transparent",
                      color:      form.type === t ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <input className="pm-input" placeholder={form.type === "income" ? "Source (e.g. Retainer - Acme)" : "Title (e.g. Notion subscription)"} value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Amount (₹)" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} required />
              <select className="pm-select" value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}>
                {cats.map((cat) => <option key={cat}>{cat}</option>)}
              </select>
              <select className="pm-select" value={form.frequency} onChange={(e) => setForm((c) => ({ ...c, frequency: e.target.value }))}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
              </select>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Start Date (first entry created on this date)</label>
                <input className="pm-input" type="date" value={form.startDate} onChange={(e) => setForm((c) => ({ ...c, startDate: e.target.value }))} />
              </div>
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Create Recurring"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.title || "recurring transaction"}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}

export default Recurring;
