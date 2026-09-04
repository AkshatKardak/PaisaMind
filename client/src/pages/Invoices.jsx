import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Download,
  Link as LinkIcon,
  MessageCircle,
  Plus,
  Receipt,
  Send,
  X,
  BarChart2,
  List,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Percent,
  TrendingDown,
  Trash2,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import InvoiceStatusBadge from "../components/ui/InvoiceStatusBadge";
import KPICard from "../components/ui/KPICard";
import { showToast } from "../components/ui/Toast";
import { formatINR } from "../utils/formatCurrency";
import * as invoiceService from "../services/invoiceService";

const STATUS_COLORS = { Paid: "#059669", Unpaid: "#d97706", Overdue: "#dc2626", "Partially Paid": "#6366f1" };

const getInitialForm = () => ({
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  serviceDescription: "",
  amount: "",
  upiId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
  gstApplicable: false,
});

/* ── Analytics View ── */
function InvoiceAnalytics({ invoices, isDark }) {
  const tooltipStyle = {
    background: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
    borderRadius: "12px",
    color: isDark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
  };
  const axisColor = isDark ? "#64748b" : "#94a3b8";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});
  const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const paidWithDates = invoices.filter((inv) => inv.status === "Paid" && inv.paidAt && inv.createdAt);
  const avgDays =
    paidWithDates.length > 0
      ? Math.round(
          paidWithDates.reduce((sum, inv) => {
            return sum + (new Date(inv.paidAt) - new Date(inv.createdAt)) / 86400000;
          }, 0) / paidWithDates.length
        )
      : null;

  const monthlyMap = {};
  invoices.forEach((inv) => {
    const key = new Date(inv.createdAt).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, sent: 0, paid: 0, value: 0 };
    monthlyMap[key].sent += 1;
    monthlyMap[key].value += Number(inv.totalAmount || inv.amount || 0);
    if (inv.status === "Paid") monthlyMap[key].paid += 1;
  });
  const monthlyData = Object.values(monthlyMap).slice(-6);

  const totalSent = invoices.length;
  const totalPaid = invoices.filter((i) => i.status === "Paid").length;
  const totalPending = invoices.filter((i) => i.status === "Unpaid").length;
  const totalOverdue = invoices.filter((i) => i.status === "Overdue").length;
  const recoveryRate = totalSent > 0 ? Math.round((totalPaid / totalSent) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Sent", value: totalSent, color: "#0891b2" },
          { label: "Paid", value: totalPaid, color: "#059669" },
          { label: "Pending", value: totalPending, color: "#d97706" },
          { label: "Overdue", value: totalOverdue, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="mb-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Status Distribution</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPie}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={32}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusPie.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#64748b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="mb-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Monthly Volume</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid vertical={false} stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sent" fill="#0891b2" radius={[4, 4, 0, 0]} name="Sent" />
                <Bar dataKey="paid" fill="#059669" radius={[4, 4, 0, 0]} name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Recovery Rate
          </p>
          <p
            className="mt-1 text-3xl font-extrabold tabular-nums"
            style={{ color: recoveryRate >= 80 ? "#059669" : recoveryRate >= 60 ? "#d97706" : "#dc2626" }}
          >
            {recoveryRate}%
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>of invoices collected</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Avg. Payment Time
          </p>
          <p
            className="mt-1 text-3xl font-extrabold tabular-nums"
            style={{ color: avgDays !== null && avgDays <= 7 ? "#059669" : avgDays !== null && avgDays <= 30 ? "#d97706" : "#64748b" }}
          >
            {avgDays !== null ? `${avgDays}d` : "—"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {avgDays !== null ? "from invoice to payment" : "no paid invoices yet"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ INVOICES PAGE ═════════════════ */
export default function Invoices() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [view, setView] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(getInitialForm);
  const [deleting, setDeleting] = useState(null);

  // Feature 1 Modals: UPI QR, 3-Stage Recovery, TDS Settlement
  const [upiTarget, setUpiTarget] = useState(null);
  const [recoveryTarget, setRecoveryTarget] = useState(null);
  const [recoveryStageIndex, setRecoveryStageIndex] = useState(0);
  const [tdsTarget, setTdsTarget] = useState(null);
  const [tdsForm, setTdsForm] = useState({ tdsSection: "None", customTdsAmount: "" });

  const invoicesQuery = useQuery({ queryKey: ["invoices-page"], queryFn: invoiceService.getInvoices });
  const summaryQuery = useQuery({ queryKey: ["invoice-summary-page"], queryFn: invoiceService.getSummary });

  const recoveryDraftQuery = useQuery({
    queryKey: ["recovery-draft", recoveryTarget?._id],
    queryFn: () => invoiceService.getRecoveryDraft(recoveryTarget._id),
    enabled: Boolean(recoveryTarget),
  });

  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] });
      setModalOpen(false);
      setForm(getInitialForm());
      showToast({ type: "success", title: "Invoice created" });
    },
    onError: (error) =>
      showToast({
        type: "error",
        title: "Could not create invoice",
        message: error.message || error.response?.data?.message || "Please check all fields.",
      }),
  });

  const statusMutation = useMutation({
    mutationFn: invoiceService.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] });
      showToast({ type: "success", title: "Invoice marked paid" });
    },
  });

  const tdsMutation = useMutation({
    mutationFn: invoiceService.recordTDS,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] });
      queryClient.invalidateQueries({ queryKey: ["tax-overview"] });
      setTdsTarget(null);
      showToast({
        type: "success",
        title: "Invoice Settled with TDS",
        message: res.message || "TDS recorded under Form 26AS credit.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] });
      setDeleting(null);
      showToast({ type: "success", title: "Invoice deleted" });
    },
  });

  const pdfMutation = useMutation({
    mutationFn: invoiceService.downloadPDF,
    onSuccess: () => showToast({ type: "success", title: "PDF downloaded" }),
    onError: () => showToast({ type: "error", title: "Could not generate PDF" }),
  });

  const invoices = invoicesQuery.data?.data ?? [];
  const summary = summaryQuery.data?.data ?? {};
  const gstAmount = form.gstApplicable ? Number(form.amount || 0) * 0.18 : 0;
  const totalAmount = Number(form.amount || 0) + gstAmount;

  const recoveryData = recoveryDraftQuery.data;
  const currentStage = recoveryData?.stages?.[recoveryStageIndex] || recoveryData?.stages?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Invoices & Payment Recovery</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Zero-fee UPI QR codes, 3-stage WhatsApp recovery escalation, and Section 194J/194C TDS credit tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: view === "list" ? "var(--primary)" : "transparent",
                color: view === "list" ? "#fff" : "var(--text-muted)",
              }}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setView("analytics")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: view === "analytics" ? "var(--primary)" : "transparent",
                color: view === "analytics" ? "#fff" : "var(--text-muted)",
              }}
            >
              <BarChart2 size={13} /> Analytics
            </button>
          </div>
          <button className="pm-button pm-button-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KPICard title="Total Billed" value={formatINR(summary.totalBilled || 0)} icon={Receipt} color="bg-sky-500/15 text-sky-400" />
        <KPICard title="Total Received" value={formatINR(summary.totalReceived || 0)} icon={Receipt} color="bg-emerald-500/15 text-emerald-400" />
        <KPICard title="Uncollected / Pending" value={formatINR(summary.totalPending || 0)} icon={Receipt} color="bg-amber-500/15 text-amber-400" />
      </div>

      {view === "analytics" ? (
        <InvoiceAnalytics invoices={invoices} isDark={false} />
      ) : (
        <div className="pm-card">
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Total Billed</th>
                  <th>TDS Credit</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Smart Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{invoice.serviceDescription || "Service"}</div>
                    </td>
                    <td>
                      <div className="font-semibold">{invoice.clientName}</div>
                      {invoice.clientPhone && <div className="text-[11px] text-[var(--text-secondary)]">{invoice.clientPhone}</div>}
                    </td>
                    <td className="font-semibold">{formatINR(invoice.totalAmount || invoice.amount)}</td>
                    <td>
                      {invoice.tdsDeductedAmount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          {formatINR(invoice.tdsDeductedAmount)} ({invoice.tdsRate}%)
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td><InvoiceStatusBadge status={invoice.status} /></td>
                    <td>{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Settle with TDS */}
                        {invoice.status !== "Paid" && (
                          <button
                            className="pm-button pm-button-success !px-2.5 !py-1.5 text-xs font-semibold"
                            onClick={() => {
                              setTdsTarget(invoice);
                              setTdsForm({ tdsSection: "None", customTdsAmount: "" });
                            }}
                          >
                            Mark Paid
                          </button>
                        )}

                        {/* Recovery Escalation WhatsApp */}
                        {invoice.status !== "Paid" && (
                          <button
                            className="pm-button !px-2.5 !py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1"
                            onClick={() => {
                              setRecoveryTarget(invoice);
                              setRecoveryStageIndex(invoice.status === "Overdue" ? 1 : 0);
                            }}
                          >
                            <MessageCircle size={13} />
                            <span>Escalate</span>
                          </button>
                        )}

                        {/* UPI QR Code */}
                        <button
                          className="pm-button !px-2.5 !py-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center gap-1"
                          onClick={() => setUpiTarget(invoice)}
                        >
                          <QrCode size={13} />
                          <span>UPI QR</span>
                        </button>

                        {/* PDF Download */}
                        <button
                          className="pm-button pm-button-ghost !px-2.5 !py-1.5 text-xs flex items-center gap-1"
                          onClick={() => pdfMutation.mutate(invoice._id)}
                          disabled={pdfMutation.isPending}
                        >
                          <Download size={12} />
                        </button>

                        {/* Delete */}
                        <button
                          className="pm-button pm-button-danger !px-2 !py-1.5 text-xs"
                          onClick={() => setDeleting(invoice)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create Invoice Modal ── */}
      {modalOpen && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Create Invoice</h3>
              <button type="button" className="pm-close-button shrink-0" aria-label="Close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({ ...form, amount: Number(form.amount) });
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="pm-input"
                  placeholder="Client Name *"
                  value={form.clientName}
                  onChange={(e) => setForm((c) => ({ ...c, clientName: e.target.value }))}
                  required
                />
                <input
                  className="pm-input"
                  placeholder="Client Phone (for WhatsApp recovery)"
                  value={form.clientPhone}
                  onChange={(e) => setForm((c) => ({ ...c, clientPhone: e.target.value }))}
                />
              </div>

              <input
                className="pm-input"
                placeholder="Client Email"
                type="email"
                value={form.clientEmail}
                onChange={(e) => setForm((c) => ({ ...c, clientEmail: e.target.value }))}
              />

              <textarea
                className="pm-textarea"
                rows="3"
                placeholder="Service Description *"
                value={form.serviceDescription}
                onChange={(e) => setForm((c) => ({ ...c, serviceDescription: e.target.value }))}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="pm-input"
                  type="number"
                  placeholder="Billed Amount (₹) *"
                  value={form.amount}
                  onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                  required
                />
                <input
                  className="pm-input"
                  placeholder="Freelancer UPI ID (e.g. name@okhdfcbank)"
                  value={form.upiId}
                  onChange={(e) => setForm((c) => ({ ...c, upiId: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)]">Issue Date</label>
                  <input className="pm-input mt-1" type="date" value={form.issueDate} onChange={(e) => setForm((c) => ({ ...c, issueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)]">Due Date</label>
                  <input className="pm-input mt-1" type="date" value={form.dueDate} onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 cursor-pointer">
                <input type="checkbox" checked={form.gstApplicable} onChange={(e) => setForm((c) => ({ ...c, gstApplicable: e.target.checked }))} />
                <span className="text-xs">Add 18% GST to this invoice</span>
              </label>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-xs text-[var(--text-secondary)] space-y-1.5">
                <div className="flex justify-between"><span>Base Amount</span><span>{formatINR(form.amount || 0)}</span></div>
                <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(gstAmount)}</span></div>
                <div className="flex justify-between font-bold text-[var(--text-primary)] text-sm pt-1 border-t border-[var(--border)]">
                  <span>Total Payable</span><span>{formatINR(totalAmount)}</span>
                </div>
              </div>

              <button type="submit" className="pm-button pm-button-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Save Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Feature 1: Dynamic UPI QR Code Modal ── */}
      {upiTarget && (
        <div className="pm-modal-overlay flex items-center justify-center p-4">
          <div className="pm-modal-card max-w-sm text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <QrCode className="text-indigo-500" size={18} /> Zero-Fee UPI Payment
              </h3>
              <button className="text-[var(--text-secondary)]" onClick={() => setUpiTarget(null)}>✕</button>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto w-48 h-48 flex flex-col items-center justify-center shadow-inner border border-slate-200">
              {/* Dynamic QR API generator */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  `upi://pay?pa=${upiTarget.upiId || "freelancer@okhdfcbank"}&pn=PaisaMind&am=${upiTarget.totalAmount || upiTarget.amount}&cu=INR&tn=Invoice_${upiTarget.invoiceNumber}`
                )}`}
                alt="UPI QR Code"
                className="w-40 h-40"
              />
            </div>

            <div className="space-y-1">
              <div className="text-lg font-black text-[var(--text-primary)]">
                {formatINR(upiTarget.totalAmount || upiTarget.amount)}
              </div>
              <div className="text-xs font-mono text-[var(--text-secondary)]">
                UPI ID: {upiTarget.upiId || "akshat@okhdfcbank"}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                Scan with Google Pay, PhonePe, Paytm, or BHIM. Zero gateway fees.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="pm-button pm-button-primary flex-1 text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `upi://pay?pa=${upiTarget.upiId || "akshat@okhdfcbank"}&pn=PaisaMind&am=${upiTarget.totalAmount || upiTarget.amount}&cu=INR&tn=Invoice_${upiTarget.invoiceNumber}`
                  );
                  showToast({ type: "success", title: "UPI Intent Link Copied" });
                }}
              >
                <Copy size={13} /> Copy UPI Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature 1: Contextual 3-Stage Payment Recovery Modal ── */}
      {recoveryTarget && (
        <div className="pm-modal-overlay flex items-center justify-center p-4">
          <div className="pm-modal-card max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <MessageCircle className="text-amber-500" size={18} />
                  Payment Recovery Escalation ({recoveryTarget.invoiceNumber})
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {recoveryData?.daysOverdue > 0 ? `${recoveryData.daysOverdue} days overdue` : "Due soon"} · Billed {formatINR(recoveryTarget.totalAmount || recoveryTarget.amount)}
                </p>
              </div>
              <button className="text-[var(--text-secondary)]" onClick={() => setRecoveryTarget(null)}>✕</button>
            </div>

            {/* Stage Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(recoveryData?.stages || [
                { stage: 1, name: "1. Gentle" },
                { stage: 2, name: "2. Firm Overdue" },
                { stage: 3, name: "3. Formal Demand" },
              ]).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setRecoveryStageIndex(idx)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border ${
                    recoveryStageIndex === idx
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Email Preview */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
              <div className="font-bold text-[var(--text-primary)]">
                Subject: {currentStage?.emailSubject}
              </div>
              <div className="text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                {currentStage?.emailBody}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                className="pm-button pm-button-primary text-xs flex items-center justify-center gap-1.5"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${currentStage?.emailSubject}\n\n${currentStage?.emailBody}`);
                  showToast({ type: "success", title: "Email draft copied to clipboard" });
                }}
              >
                <Copy size={14} /> Copy Email Draft
              </button>

              {currentStage?.whatsappUrl ? (
                <a
                  href={currentStage.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pm-button text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} /> Open in WhatsApp
                </a>
              ) : (
                <button
                  className="pm-button text-xs bg-emerald-600 text-white flex items-center justify-center gap-1.5 opacity-60"
                  onClick={async () => {
                    await navigator.clipboard.writeText(currentStage?.whatsappText || "");
                    showToast({ type: "success", title: "WhatsApp text copied" });
                  }}
                >
                  <MessageCircle size={14} /> Copy WhatsApp Text
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Feature 1: TDS Withholding Settlement Modal ── */}
      {tdsTarget && (
        <div className="pm-modal-overlay flex items-center justify-center p-4">
          <div className="pm-modal-card max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Percent className="text-emerald-500" size={18} />
                Settle Invoice & Log Form 26AS TDS Credit
              </h3>
              <button className="text-[var(--text-secondary)]" onClick={() => setTdsTarget(null)}>✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>Invoice: {tdsTarget.invoiceNumber}</span>
                <span>{formatINR(tdsTarget.totalAmount || tdsTarget.amount)}</span>
              </div>
              <div className="text-[var(--text-secondary)]">Client: {tdsTarget.clientName}</div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-[var(--text-secondary)] font-semibold">TDS Withholding by Client</label>
              <select
                value={tdsForm.tdsSection}
                onChange={(e) => setTdsForm({ ...tdsForm, tdsSection: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                <option value="None">No TDS Deducted (Received 100%)</option>
                <option value="194J_10">Section 194J (10% Professional / Technical Services)</option>
                <option value="194J_2">Section 194J (2% Technical Call Center / Operator)</option>
                <option value="194C_1">Section 194C (1% Contractor / Freelance)</option>
                <option value="Custom">Custom TDS Amount</option>
              </select>

              {tdsForm.tdsSection === "Custom" && (
                <div>
                  <label className="text-[var(--text-secondary)]">Custom TDS Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={tdsForm.customTdsAmount}
                    onChange={(e) => setTdsForm({ ...tdsForm, customTdsAmount: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTdsTarget(null)}
                className="px-4 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  tdsMutation.mutate({
                    id: tdsTarget._id,
                    tdsSection: tdsForm.tdsSection,
                    customTdsAmount: tdsForm.customTdsAmount,
                    status: "Paid",
                  })
                }
                className="px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.invoiceNumber || "invoice"}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}
