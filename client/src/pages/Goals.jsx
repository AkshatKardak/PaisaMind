import { Plus, Target, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GoalProgressRing from "../components/ui/GoalProgressRing";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import { showToast } from "../components/ui/Toast";
import { formatINR } from "../utils/formatCurrency";
import * as goalService from "../services/goalService";

const getInitialForm = () => ({
  name: "",
  targetAmount: "",
  savedAmount: "",
  deadline: new Date().toISOString().slice(0, 10),
});

function Goals() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(getInitialForm);

  const goalsQuery = useQuery({ queryKey: ["goals-page"], queryFn: goalService.getGoals });

  const createMutation = useMutation({
    mutationFn: goalService.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals-page"] });
      setModalOpen(false);
      setForm(getInitialForm());
      showToast({ type: "success", title: "Goal created" });
    },
  });

  const progressMutation = useMutation({
    mutationFn: goalService.updateProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals-page"] });
      setProgressTarget(null);
      showToast({ type: "success", title: "Funds added to goal" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: goalService.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals-page"] });
      setDeleting(null);
      showToast({ type: "success", title: "Goal deleted" });
    },
  });

  const goals = goalsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="text-sm text-[var(--text-secondary)]">Plan savings targets and keep every milestone visible.</p>
        </div>
        <button className="pm-button pm-button-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          Add Goal
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {goals.map((goal) => {
          const progress = (Number(goal.savedAmount || 0) / Number(goal.targetAmount || 1)) * 100;
          const monthsLeft = Math.max(1, Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
          const monthlyNeeded = Math.max(0, (goal.targetAmount - goal.savedAmount) / monthsLeft);

          return (
            <div key={goal._id} className={`pm-card ${progress >= 100 ? "animate-pulse" : ""}`}>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <GoalProgressRing progress={progress} />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{goal.name}</h3>
                  <div className="mt-3 text-sm text-[var(--text-secondary)]">
                    Saved {formatINR(goal.savedAmount)} of {formatINR(goal.targetAmount)}
                  </div>
                  <div className="mt-3 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    💡 Save {formatINR(monthlyNeeded)}/month to hit goal
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="pm-button pm-button-primary !px-3 !py-2 text-sm" onClick={() => setProgressTarget(goal)}>+ Add Funds</button>
                    <button className="pm-button pm-button-ghost !px-3 !py-2 text-sm" onClick={() => setModalOpen(true)}>Edit</button>
                    <button className="pm-button pm-button-danger !px-3 !py-2 text-sm" onClick={() => setDeleting(goal)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Add Goal</h3>
              <button
                type="button"
                className="pm-close-button shrink-0"
                aria-label="Close modal"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate({
                  ...form,
                  targetAmount: Number(form.targetAmount),
                  savedAmount: Number(form.savedAmount || 0),
                });
              }}
            >
              <input className="pm-input" placeholder="Goal Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Target Amount (₹)" value={form.targetAmount} onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Current Savings (₹) — optional" value={form.savedAmount} onChange={(event) => setForm((current) => ({ ...current, savedAmount: event.target.value }))} />
              <input className="pm-input" type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} required />
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Create Goal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {progressTarget && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(event) => { if (event.target === event.currentTarget) setProgressTarget(null); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Add Funds</h3>
              <button
                type="button"
                className="pm-close-button shrink-0"
                aria-label="Close modal"
                onClick={() => setProgressTarget(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const savedAmount = Number(event.target.savedAmount.value);
                progressMutation.mutate({ id: progressTarget._id, savedAmount });
              }}
            >
              <input className="pm-input" name="savedAmount" type="number" defaultValue={progressTarget.savedAmount} />
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={progressMutation.isPending}>
                Update Progress
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
