import { Copy, Link as LinkIcon, MessageCircle, Plus, Receipt, Send, X, BarChart2, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import ConfirmDeleteModal  from "../components/ui/ConfirmDeleteModal";
import InvoiceStatusBadge  from "../components/ui/InvoiceStatusBadge";
import KPICard             from "../components/ui/KPICard";
import { showToast }       from "../components/ui/Toast";
import { formatINR }       from "../utils/formatCurrency";
import * as invoiceService from "../services/invoiceService";
import * as aiService      from "../services/aiService";

const STATUS_COLORS = { Paid: "#059669", Unpaid: "#d97706", Overdue: "#dc2626", "Partially Paid": "#6366f1" };

const getInitialForm = () => ({
  clientName: "",
  serviceDescription: "",
  amount: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate:   new Date().toISOString().slice(0, 10),
  gstApplicable: false,
});

/* ── Analytics View ───────────────────────────────────────────── */
function InvoiceAnalytics({ invoices, isDark }) {
  const tooltipStyle = {
    background:   isDark ? "#1e293b" : "#ffffff",
    border:       isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
    borderRadius: "12px",
    color:        isDark ? "#e2e8f0" : "#1e293b",
    fontSize:     12,
  };
  const axisColor = isDark ? "#64748b" : "#94a3b8";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  // ── Status distribution
  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});
  const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // ── Average days to payment (only Paid invoices with paidAt)
  const paidWithDates = invoices.filter((inv) => inv.status === "Paid" && inv.paidAt && inv.createdAt);
  const avgDays = paidWithDates.length > 0
    ? Math.round(paidWithDates.reduce((sum, inv) => {
        return sum + (new Date(inv.paidAt) - new Date(inv.createdAt)) / 86400000;
      }, 0) / paidWithDates.length)
    : null;

  // ── Monthly invoice volume (last 6 months)
  const monthlyMap = {};
  invoices.forEach((inv) => {
    const key = new Date(inv.createdAt).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, sent: 0, paid: 0, value: 0 };
    monthlyMap[key].sent  += 1;
    monthlyMap[key].value += Number(inv.totalAmount || inv.amount || 0);
    if (inv.status === "Paid") monthlyMap[key].paid += 1;
  });
  const monthlyData = Object.values(monthlyMap).slice(-6);

  // ── Summary stats
  const totalSent    = invoices.length;
  const totalPaid    = invoices.filter((i) => i.status === "Paid").length;
  const totalPending = invoices.filter((i) => i.status === "Unpaid").length;
  const totalOverdue = invoices.filter((i) => i.status === "Overdue").length;
  const recoveryRate = totalSent > 0 ? Math.round((totalPaid / totalSent) * 100) : 0;

  return (
    <div className="space-y-5">

      {/* ── Summary stat row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Sent",    value: totalSent,    color: "#0891b2" },
          { label: "Paid",          value: totalPaid,    color: "#059669" },
          { label: "Pending",       value: totalPending, color: "#d97706" },
          { label: "Overdue",       value: totalOverdue, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Status pie ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="mb-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Status Distribution</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={32} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusPie.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#64748b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Monthly volume bar ── */}
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

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Recovery Rate</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: recoveryRate >= 80 ? "#059669" : recoveryRate >= 60 ? "#d97706" : "#dc2626" }}>
            {recoveryRate}%
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>of invoices collected</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Avg. Payment Time</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: avgDays !== null && avgDays <= 7 ? "#059669" : avgDays !== null && avgDays <= 30 ? "#d97706" : "#64748b" }}>
            {avgDays !== null ? `${avgDays}d` : "—"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{avgDays !== null ? "from invoice to payment" : "no paid invoices yet"}</p>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ INVOICES PAGE ═════════════════ */
function Invoices() {
  const queryClient = useQueryClient();
  const [params]    = useSearchParams();
  const [view, setView]               = useState("list");  // "list" | "analytics"
  const [modalOpen, setModalOpen]     = useState(false);
  const [form, setForm]               = useState(getInitialForm);
  const [deleting, setDeleting]       = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [paymentTarget,  setPaymentTarget]  = useState(null);
  const [tone, setTone]               = useState("polite");

  const invoicesQuery = useQuery({ queryKey: ["invoices-page"],         queryFn: invoiceService.getInvoices });
  const summaryQuery  = useQuery({ queryKey: ["invoice-summary-page"],  queryFn: invoiceService.getSummary });
  const reminderQuery = useQuery({
    queryKey: ["invoice-reminder", reminderTarget?._id, tone],
    queryFn:  () => aiService.getInvoiceReminder({ invoiceId: reminderTarget._id, tone }),
    enabled:  Boolean(reminderTarget),
  });

  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["invoices-page"] }); queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] }); setModalOpen(false); setForm(getInitialForm()); showToast({ type: "success", title: "Invoice created" }); },
    onError:    (error) => showToast({ type: "error", title: "Could not create invoice", message: error.message || error.response?.data?.message || "Please check all fields." }),
  });

  const statusMutation = useMutation({
    mutationFn: invoiceService.updateStatus,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["invoices-page"] }); queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] }); showToast({ type: "success", title: "Invoice marked paid" }); },
    onError:    (error) => showToast({ type: "error", title: "Could not update status", message: error.message }),
  });

  const paymentMutation = useMutation({
    mutationFn: invoiceService.createPaymentLink,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["invoices-page"] }); showToast({ type: "success", title: "Payment link created" }); },
    onError:    (error) => showToast({ type: "error", title: "Could not create payment link", message: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["invoices-page"] }); queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] }); setDeleting(null); showToast({ type: "success", title: "Invoice deleted" }); },
    onError:    (error) => showToast({ type: "error", title: "Could not delete invoice", message: error.message }),
  });

  useEffect(() => {
    if (params.get("payment") === "success") {
      showToast({ type: "success", title: "Payment received!", message: "Invoice marked paid successfully." });
    }
  }, [params]);

  const invoices    = invoicesQuery.data?.data ?? [];
  const summary     = summaryQuery.data?.data  ?? {};
  const gstAmount   = form.gstApplicable ? Number(form.amount || 0) * 0.18 : 0;
  const totalAmount = Number(form.amount || 0) + gstAmount;
  const latestPaymentLink = useMemo(() => paymentMutation.data?.data?.url || paymentTarget?.stripePaymentUrl, [paymentMutation.data, paymentTarget]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-[var(--text-secondary)]">Track billed work, nudge clients, and collect payments online.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: view === "list" ? "var(--primary)" : "transparent",
                color:      view === "list" ? "#fff" : "var(--text-muted)",
              }}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setView("analytics")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: view === "analytics" ? "var(--primary)" : "transparent",
                color:      view === "analytics" ? "#fff" : "var(--text-muted)",
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

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KPICard title="Billed"   value={formatINR(summary.totalBilled   || 0)} icon={Receipt} color="bg-sky-500/15 text-sky-400" />
        <KPICard title="Received" value={formatINR(summary.totalReceived || 0)} icon={Receipt} color="bg-emerald-500/15 text-emerald-400" />
        <KPICard title="Pending"  value={formatINR(summary.totalPending  || 0)} icon={Receipt} color="bg-amber-500/15 text-amber-400" />
      </div>

      {/* ── Conditional view ── */}
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
                  <th>Total</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{invoice.serviceDescription}</div>
                    </td>
                    <td>{invoice.clientName}</td>
                    <td className="font-semibold">{formatINR(invoice.totalAmount)}</td>
                    <td><InvoiceStatusBadge status={invoice.status} /></td>
                    <td>{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button className="pm-button pm-button-success !px-3 !py-2 text-xs" onClick={() => statusMutation.mutate({ id: invoice._id, status: "paid" })}>Mark Paid</button>
                        <button className="pm-button pm-button-ghost !px-3 !py-2 text-xs"   onClick={() => setReminderTarget(invoice)}>Send Reminder</button>
                        <button className="pm-button pm-button-primary !px-3 !py-2 text-xs" onClick={() => { setPaymentTarget(invoice); paymentMutation.mutate(invoice._id); }}>Get Paid Online</button>
                        <button className="pm-button pm-button-danger !px-3 !py-2 text-xs"  onClick={() => setDeleting(invoice)}>Delete</button>
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
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Create Invoice</h3>
              <button type="button" className="pm-close-button shrink-0" aria-label="Close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createMutation.mutate({ ...form, amount: Number(form.amount) }); }}>
              <input className="pm-input" placeholder="Client Name" value={form.clientName} onChange={(e) => setForm((c) => ({ ...c, clientName: e.target.value }))} required />
              <textarea className="pm-textarea" rows="4" placeholder="Service Description" value={form.serviceDescription} onChange={(e) => setForm((c) => ({ ...c, serviceDescription: e.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} required />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="pm-input" type="date" value={form.issueDate} onChange={(e) => setForm((c) => ({ ...c, issueDate: e.target.value }))} />
                <input className="pm-input" type="date" value={form.dueDate}   onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} />
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <input type="checkbox" checked={form.gstApplicable} onChange={(e) => setForm((c) => ({ ...c, gstApplicable: e.target.checked }))} />
                <span>GST applicable</span>
              </label>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(form.amount || 0)}</span></div>
                <div className="mt-2 flex justify-between"><span>GST 18%</span><span>{formatINR(gstAmount)}</span></div>
                <div className="mt-3 flex justify-between font-semibold text-[var(--text-primary)]"><span>Total</span><span>{formatINR(totalAmount)}</span></div>
              </div>
              <button type="submit" className="pm-button pm-button-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Save Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── AI Reminder Modal ── */}
      {reminderTarget && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center">
          <div className="pm-modal-card">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">AI Reminder Draft</h3>
              <button className="text-[var(--text-secondary)]" onClick={() => setReminderTarget(null)}>Close</button>
            </div>
            <div className="mb-4 flex gap-2">
              {["polite", "firm", "final"].map((value) => (
                <button key={value} className={`pm-button !px-3 !py-2 text-sm ${tone === value ? "pm-button-primary" : "pm-button-ghost"}`} onClick={() => setTone(value)}>
                  {value === "final" ? "Final Notice" : value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
              {reminderQuery.isLoading ? "Drafting message..." : reminderQuery.data?.data?.message}
            </div>
            <button
              className="pm-button pm-button-primary mt-5 flex w-full items-center justify-center gap-2"
              onClick={async () => { await navigator.clipboard.writeText(reminderQuery.data?.data?.message || ""); showToast({ type: "success", title: "Copied to clipboard" }); }}
            >
              <Copy size={18} /> Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Link Modal ── */}
      {paymentTarget && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center">
          <div className="pm-modal-card">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Payment Link</h3>
              <button className="text-[var(--text-secondary)]" onClick={() => setPaymentTarget(null)}>Close</button>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm break-all text-[var(--text-secondary)]">
              {paymentMutation.isPending ? "Generating payment link..." : latestPaymentLink}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button className="pm-button pm-button-primary flex items-center justify-center gap-2" onClick={async () => { await navigator.clipboard.writeText(latestPaymentLink || ""); showToast({ type: "success", title: "Payment link copied" }); }}>
                <LinkIcon size={18} /> Copy Link
              </button>
              <a
                className="pm-button pm-button-success flex items-center justify-center gap-2"
                href={`https://wa.me/?text=${encodeURIComponent(`Please use this link to pay invoice ${paymentTarget.invoiceNumber}: ${latestPaymentLink || ""}`)}`}
                target="_blank" rel="noreferrer"
              >
                <MessageCircle size={18} /> Share WhatsApp
              </a>
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

export default Invoices;
