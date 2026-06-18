import { Plus, Target, X, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GoalProgressRing   from "../components/ui/GoalProgressRing";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import { showToast }      from "../components/ui/Toast";
import { formatINR }      from "../utils/formatCurrency";
import * as goalService   from "../services/goalService";

const getInitialForm = () => ({
  name: "",
  targetAmount: "",
  savedAmount:  "",
  deadline:     new Date().toISOString().slice(0, 10),
});

// Computes human-readable deadline stats for a single goal
function useGoalStats(goal) {
  return useMemo(() => {
    const now         = new Date();
    const deadline    = new Date(goal.deadline);
    const msLeft      = deadline - now;
    const daysLeft    = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    const monthsLeft  = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24 * 30.44)));
    const remaining   = Math.max(0, goal.targetAmount - goal.savedAmount);
    const requiredPerMonth = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;
    const isOverdue   = daysLeft < 0;
    const isCompleted = goal.savedAmount >= goal.targetAmount;
    const progress    = Math.min(100, Math.round((goal.savedAmount / Math.max(goal.targetAmount, 1)) * 100));

    return { daysLeft, monthsLeft, remaining, requiredPerMonth, isOverdue, isCompleted, progress };
  }, [goal]);
}

// Individual goal card — extracted so stats hook runs per-goal cleanly
function GoalCard({ goal, onAddFunds, onEdit, onDelete }) {
  const { daysLeft, monthsLeft, remaining, requiredPerMonth, isOverdue, isCompleted, progress } = useGoalStats(goal);

  const deadlineColor  = isCompleted ? "#059669" : isOverdue ? "#dc2626" : daysLeft <= 30 ? "#d97706" : "#64748b";
  const deadlineLabel  = isCompleted
    ? "Goal completed! 🎉"
    : isOverdue
    ? `${Math.abs(daysLeft)} days overdue`
    : daysLeft === 0
    ? "Due today!"
    : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;

  return (
    <div className={`pm-card ${isCompleted ? "ring-2 ring-emerald-500/30" : ""}`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <GoalProgressRing progress={progress} />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{goal.name}</h3>
            {isCompleted && <CheckCircle2 size={20} color="#059669" className="shrink-0 mt-1" />}
          </div>

          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Saved {formatINR(goal.savedAmount)} of {formatINR(goal.targetAmount)}
          </p>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Deadline */}
            <div className="rounded-xl p-3" style={{ background: `${deadlineColor}10`, border: `1px solid ${deadlineColor}20` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} style={{ color: deadlineColor }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: deadlineColor }}>Deadline</span>
              </div>
              <p className="text-sm font-bold" style={{ color: deadlineColor }}>{deadlineLabel}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>

            {/* Required per month */}
            {!isCompleted && (
              <div className="rounded-xl p-3" style={{ background: "#0891b210", border: "1px solid #0891b220" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} color="#0891b2" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#0891b2" }}>Required/Month</span>
                </div>
                <p className="text-sm font-bold" style={{ color: "#0891b2" }}>{formatINR(requiredPerMonth)}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {monthsLeft} month{monthsLeft !== 1 ? "s" : ""} remaining
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isCompleted && (
              <button className="pm-button pm-button-primary !px-3 !py-2 text-sm" onClick={() => onAddFunds(goal)}>+ Add Funds</button>
            )}
            <button className="pm-button pm-button-ghost !px-3 !py-2 text-sm" onClick={() => onEdit(goal)}>Edit</button>
            <button className="pm-button pm-button-danger !px-3 !py-2 text-sm" onClick={() => onDelete(goal)}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Goals() {
  const queryClient  = useQueryClient();
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);  // goal being edited
  const [progressTarget, setProgressTarget] = useState(null);
  const [deleting, setDeleting]         = useState(null);
  const [form, setForm]                 = useState(getInitialForm);

  const goalsQuery = useQuery({ queryKey: ["goals-page"], queryFn: goalService.getGoals });

  const createMutation = useMutation({
    mutationFn: goalService.createGoal,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["goals-page"] }); setModalOpen(false); setForm(getInitialForm()); showToast({ type: "success", title: "Goal created" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => goalService.updateGoal(id, data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["goals-page"] }); setEditTarget(null); showToast({ type: "success", title: "Goal updated" }); },
  });

  const progressMutation = useMutation({
    mutationFn: goalService.updateProgress,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["goals-page"] }); setProgressTarget(null); showToast({ type: "success", title: "Funds added to goal" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: goalService.deleteGoal,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["goals-page"] }); setDeleting(null); showToast({ type: "success", title: "Goal deleted" }); },
  });

  const goals = goalsQuery.data?.data ?? [];

  const handleOpenAdd = () => { setEditTarget(null); setForm(getInitialForm()); setModalOpen(true); };
  const handleOpenEdit = (goal) => {
    setEditTarget(goal);
    setForm({
      name:         goal.name,
      targetAmount: String(goal.targetAmount),
      savedAmount:  String(goal.savedAmount),
      deadline:     new Date(goal.deadline).toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="text-sm text-[var(--text-secondary)]">Plan savings targets and keep every milestone visible.</p>
        </div>
        <button className="pm-button pm-button-primary flex items-center gap-2" onClick={handleOpenAdd}>
          <Plus size={18} /> Add Goal
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal._id}
            goal={goal}
            onAddFunds={setProgressTarget}
            onEdit={handleOpenEdit}
            onDelete={setDeleting}
          />
        ))}
        {goals.length === 0 && !goalsQuery.isLoading && (
          <p className="col-span-2 text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>No goals yet. Create one to start tracking your savings.</p>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">{editTarget ? "Edit Goal" : "Add Goal"}</h3>
              <button type="button" className="pm-close-button shrink-0" aria-label="Close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const payload = { ...form, targetAmount: Number(form.targetAmount), savedAmount: Number(form.savedAmount || 0) };
                if (editTarget) {
                  updateMutation.mutate({ id: editTarget._id, ...payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
            >
              <input className="pm-input" placeholder="Goal Name (e.g. MacBook, Emergency Fund)" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Target Amount (₹)" value={form.targetAmount} onChange={(e) => setForm((c) => ({ ...c, targetAmount: e.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Current Savings (₹) — optional" value={form.savedAmount} onChange={(e) => setForm((c) => ({ ...c, savedAmount: e.target.value }))} />
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Target Date</label>
                <input className="pm-input" type="date" value={form.deadline} onChange={(e) => setForm((c) => ({ ...c, deadline: e.target.value }))} required />
              </div>
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editTarget ? "Update Goal" : "Create Goal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Funds Modal ── */}
      {progressTarget && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(e) => { if (e.target === e.currentTarget) setProgressTarget(null); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Add Funds — {progressTarget.name}</h3>
              <button type="button" className="pm-close-button shrink-0" aria-label="Close" onClick={() => setProgressTarget(null)}><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); progressMutation.mutate({ id: progressTarget._id, savedAmount: Number(e.target.savedAmount.value) }); }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Enter the new total saved amount (not the increment).</p>
              <input className="pm-input" name="savedAmount" type="number" defaultValue={progressTarget.savedAmount} required />
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={progressMutation.isPending}>
                {progressMutation.isPending ? "Saving..." : "Update Progress"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.name || "goal"}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}

export default Goals;
