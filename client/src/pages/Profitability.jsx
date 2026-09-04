import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  Zap,
  Target,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { profitabilityService } from "../services/profitabilityService";
import { formatINR } from "../utils/formatCurrency";
import { showToast } from "../components/ui/Toast";

export default function Profitability() {
  const queryClient = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showHourModal, setShowHourModal] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(null);

  const [newProject, setNewProject] = useState({
    name: "",
    clientName: "",
    feeType: "fixed",
    totalBilled: "",
    targetHourlyRate: 2500,
    notes: "",
  });

  const [hourForm, setHourForm] = useState({ hours: "", description: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", category: "APIs & Tools" });

  const { data, isLoading } = useQuery({
    queryKey: ["profitability-overview"],
    queryFn: profitabilityService.getOverview,
  });

  const createMutation = useMutation({
    mutationFn: profitabilityService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profitability-overview"] });
      showToast({ type: "success", title: "Project Created", message: "New project unit economics initialized." });
      setShowNewModal(false);
      setNewProject({ name: "", clientName: "", feeType: "fixed", totalBilled: "", targetHourlyRate: 2500, notes: "" });
    },
  });

  const logHoursMutation = useMutation({
    mutationFn: ({ id, payload }) => profitabilityService.logHours(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profitability-overview"] });
      showToast({ type: "success", title: "Hours Logged", message: "Effective hourly rate updated." });
      setShowHourModal(null);
      setHourForm({ hours: "", description: "" });
    },
  });

  const logExpenseMutation = useMutation({
    mutationFn: ({ id, payload }) => profitabilityService.logExpense(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profitability-overview"] });
      showToast({ type: "success", title: "Direct Cost Logged", message: "Net profit margin updated." });
      setShowExpenseModal(null);
      setExpenseForm({ title: "", amount: "", category: "APIs & Tools" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: profitabilityService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profitability-overview"] });
      showToast({ type: "success", title: "Project Removed" });
    },
  });

  const overview = data?.data || { summary: {}, clients: [], projects: [], scopeCreepAlerts: [] };
  const { summary, clients, projects, scopeCreepAlerts } = overview;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <Target className="text-indigo-500" />
            Client & Project Profitability Sentinel
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Audit real effective hourly rates, isolate direct project costs, and prevent fixed-fee scope creep
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

      {/* Scope Creep Alert Banner if detected */}
      {scopeCreepAlerts?.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle size={18} className="text-amber-500" />
            Scope Creep / Value-Drain Detected on {scopeCreepAlerts.length} Project{scopeCreepAlerts.length > 1 ? "s" : ""}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {scopeCreepAlerts.map((p) => (
              <div key={p._id} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-amber-500/20">
                <span className="font-semibold">{p.name} ({p.clientName}): </span>
                {p.scopeCreepReason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
          <div className="text-xs uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Real Hourly Rate
          </div>
          <div className="text-2xl font-black font-display text-indigo-500">
            {formatINR(summary.overallEffectiveHourlyRate || 2500)}
            <span className="text-xs font-normal text-[var(--text-secondary)]"> / hr</span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Target: {formatINR(summary.targetHourlyRate || 2500)}/hr
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
          <div className="text-xs uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Overall Profit Margin
          </div>
          <div className="text-2xl font-black font-display text-emerald-500">
            {summary.overallMargin || 85}%
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Net Profit: {formatINR(summary.overallNetProfit || 0)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
          <div className="text-xs uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Total Hours Logged
          </div>
          <div className="text-2xl font-black font-display text-sky-500">
            {summary.totalHoursLogged || 0} hrs
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Across {projects.length} tracked projects
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
          <div className="text-xs uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Direct Project Costs
          </div>
          <div className="text-2xl font-black font-display text-rose-500">
            {formatINR(summary.totalDirectExpenses || 0)}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            APIs, subcontracts, licenses
          </div>
        </div>
      </div>

      {/* Client ROI Tier Matrix */}
      <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" size={18} />
              Client ROI Tier Matrix (Profitability & Payment Cadence)
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Classified by profit margin, payment speed, and effective rate realization
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold uppercase">
                <th className="pb-3">Client</th>
                <th className="pb-3">ROI Tier</th>
                <th className="pb-3">Billed</th>
                <th className="pb-3">Direct Costs</th>
                <th className="pb-3">Net Margin</th>
                <th className="pb-3">Effective Rate</th>
                <th className="pb-3">Avg Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {clients.map((c) => {
                const tierColor =
                  c.tier === "Tier A"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : c.tier === "Tier B"
                    ? "bg-sky-500/10 text-sky-600 border-sky-500/30"
                    : c.tier === "Tier C"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/30";

                return (
                  <tr key={c.clientName} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="py-3.5 font-bold text-[var(--text-primary)]">
                      {c.clientName}
                      <div className="text-[11px] font-normal text-[var(--text-secondary)]">
                        {c.projectsCount} project{c.projectsCount > 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${tierColor}`}>
                        {c.tierBadge}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono">{formatINR(c.totalBilled)}</td>
                    <td className="py-3.5 font-mono text-rose-500">{formatINR(c.directExpenses)}</td>
                    <td className="py-3.5 font-bold text-emerald-500">{c.profitMargin}%</td>
                    <td className="py-3.5 font-mono font-bold text-indigo-500">{formatINR(c.effectiveHourlyRate)}/hr</td>
                    <td className="py-3.5 text-[var(--text-secondary)]">
                      {c.avgPaymentDelayDays > 0 ? `${c.avgPaymentDelayDays} days late` : "On time"}
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[var(--text-secondary)]">
                    No client billing data recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects List & Unit Economics Tracker */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Layers className="text-indigo-500" size={18} />
          Project Unit Economics & Work Hour Tracker
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p._id}
              className={`p-5 rounded-3xl bg-[var(--bg-elevated)] border transition-all space-y-4 shadow-sm ${
                p.isScopeCreep ? "border-amber-500/50" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{p.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{p.clientName} · {p.feeType}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(p._id)}
                  className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {p.isScopeCreep && (
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                  <span>{p.scopeCreepReason}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg-primary)] p-3 rounded-2xl border border-[var(--border)]">
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Billed Revenue</div>
                  <div className="font-bold text-[var(--text-primary)] font-mono">{formatINR(p.totalBilled)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Direct Costs</div>
                  <div className="font-bold text-rose-500 font-mono">{formatINR(p.directExpenses)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Logged Hours</div>
                  <div className="font-bold text-sky-500 font-mono">{p.loggedHours} hrs</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)]">Effective Rate</div>
                  <div className="font-bold text-indigo-500 font-mono">{formatINR(p.realHourlyRate)}/hr</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowHourModal(p)}
                  className="flex-1 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Clock size={13} />
                  <span>Log Hours</span>
                </button>
                <button
                  onClick={() => setShowExpenseModal(p)}
                  className="flex-1 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <DollarSign size={13} />
                  <span>Log Cost</span>
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full p-8 rounded-3xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-secondary)] space-y-2">
              <Briefcase size={28} className="mx-auto text-indigo-400 opacity-60" />
              <p>No active projects yet. Click "+ New Project" to start tracking unit economics.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Add Project Unit Economics</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--text-secondary)]">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Redesign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)]">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Labs"
                  value={newProject.clientName}
                  onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-secondary)]">Total Billed (₹)</label>
                  <input
                    type="number"
                    placeholder="75000"
                    value={newProject.totalBilled}
                    onChange={(e) => setNewProject({ ...newProject, totalBilled: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-secondary)]">Target Rate (₹/hr)</label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={newProject.targetHourlyRate}
                    onChange={(e) => setNewProject({ ...newProject, targetHourlyRate: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(newProject)}
                disabled={!newProject.name || !newProject.clientName}
                className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Hours Modal */}
      {showHourModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Log Work Hours: {showHourModal.name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--text-secondary)]">Hours Spent</label>
                <input
                  type="number"
                  placeholder="e.g. 4.5"
                  value={hourForm.hours}
                  onChange={(e) => setHourForm({ ...hourForm, hours: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)]">Work Description / Milestone</label>
                <input
                  type="text"
                  placeholder="e.g. API Integration & Testing"
                  value={hourForm.description}
                  onChange={(e) => setHourForm({ ...hourForm, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowHourModal(null)}
                className="px-4 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => logHoursMutation.mutate({ id: showHourModal._id, payload: hourForm })}
                disabled={!hourForm.hours}
                className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Submit Hours
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Log Direct Project Cost: {showExpenseModal.name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--text-secondary)]">Cost Item / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Stock Illustration Pack / OpenAI API Credits"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-secondary)]">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-secondary)]">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                  >
                    <option>APIs & Tokens</option>
                    <option>Subcontractor Fee</option>
                    <option>Design Assets / Fonts</option>
                    <option>Cloud Hosting & Domain</option>
                    <option>Other Cost</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExpenseModal(null)}
                className="px-4 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => logExpenseMutation.mutate({ id: showExpenseModal._id, payload: expenseForm })}
                disabled={!expenseForm.title || !expenseForm.amount}
                className="px-4 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Record Cost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
