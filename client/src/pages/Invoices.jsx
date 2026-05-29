import { Copy, Link as LinkIcon, MessageCircle, Plus, Receipt, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import InvoiceStatusBadge from "../components/ui/InvoiceStatusBadge";
import KPICard from "../components/ui/KPICard";
import { showToast } from "../components/ui/Toast";
import { formatINR } from "../utils/formatCurrency";
import * as invoiceService from "../services/invoiceService";
import * as aiService from "../services/aiService";

const initialForm = {
  clientName: "",
  serviceDescription: "",
  amount: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
  gstApplicable: false,
};

function Invoices() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [deleting, setDeleting] = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [tone, setTone] = useState("polite");

  const invoicesQuery = useQuery({ queryKey: ["invoices-page"], queryFn: invoiceService.getInvoices });
  const summaryQuery = useQuery({ queryKey: ["invoice-summary-page"], queryFn: invoiceService.getSummary });
  const reminderQuery = useQuery({
    queryKey: ["invoice-reminder", reminderTarget?._id, tone],
    queryFn: () => aiService.getInvoiceReminder({ invoiceId: reminderTarget._id, tone }),
    enabled: Boolean(reminderTarget),
  });

  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] });
      setModalOpen(false);
      setForm(initialForm);
      showToast({ type: "success", title: "Invoice created" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: invoiceService.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-summary-page"] });
      showToast({ type: "success", title: "Invoice marked paid" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: invoiceService.createPaymentLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
      showToast({ type: "success", title: "Payment link created" });
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

  useEffect(() => {
    if (params.get("payment") === "success") {
      showToast({ type: "success", title: "Payment received!", message: "Invoice marked paid successfully." });
    }
  }, [params]);

  const invoices = invoicesQuery.data?.data ?? [];
  const summary = summaryQuery.data?.data ?? {};
  const gstAmount = form.gstApplicable ? Number(form.amount || 0) * 0.18 : 0;
  const totalAmount = Number(form.amount || 0) + gstAmount;

  const latestPaymentLink = useMemo(() => paymentMutation.data?.data?.url || paymentTarget?.stripePaymentUrl, [paymentMutation.data, paymentTarget]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-[var(--text-secondary)]">Track billed work, nudge clients, and collect payments online.</p>
        </div>
        <button className="pm-button pm-button-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KPICard title="Billed" value={formatINR(summary.totalBilled || 0)} icon={Receipt} color="bg-sky-500/15 text-sky-400" />
        <KPICard title="Received" value={formatINR(summary.totalReceived || 0)} icon={Receipt} color="bg-emerald-500/15 text-emerald-400" />
        <KPICard title="Pending" value={formatINR(summary.totalPending || 0)} icon={Receipt} color="bg-amber-500/15 text-amber-400" />
      </div>

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
                      <button className="pm-button pm-button-success !px-3 !py-2 text-xs" onClick={() => statusMutation.mutate({ id: invoice._id, status: "paid" })}>
                        Mark Paid
                      </button>
                      <button className="pm-button pm-button-ghost !px-3 !py-2 text-xs" onClick={() => setReminderTarget(invoice)}>
                        Send Reminder
                      </button>
                      <button className="pm-button pm-button-primary !px-3 !py-2 text-xs" onClick={() => { setPaymentTarget(invoice); paymentMutation.mutate(invoice._id); }}>
                        Get Paid Online
                      </button>
                      <button className="pm-button pm-button-danger !px-3 !py-2 text-xs" onClick={() => setDeleting(invoice)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center" onClick={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div className="pm-modal-card">
            <div className="pm-modal-header flex items-center justify-between">
              <h3 className="text-2xl font-bold">Create Invoice</h3>
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
                  amount: Number(form.amount),
                });
              }}
            >
              <input className="pm-input" placeholder="Client Name" value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} required />
              <textarea className="pm-textarea" rows="4" placeholder="Service Description" value={form.serviceDescription} onChange={(event) => setForm((current) => ({ ...current, serviceDescription: event.target.value }))} required />
              <input className="pm-input" type="number" placeholder="Amount" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="pm-input" type="date" value={form.issueDate} onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))} />
                <input className="pm-input" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <input type="checkbox" checked={form.gstApplicable} onChange={(event) => setForm((current) => ({ ...current, gstApplicable: event.target.checked }))} />
                <span>GST applicable</span>
              </label>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(form.amount || 0)}</span></div>
                <div className="mt-2 flex justify-between"><span>GST 18%</span><span>{formatINR(gstAmount)}</span></div>
                <div className="mt-3 flex justify-between font-semibold text-[var(--text-primary)]"><span>Total</span><span>{formatINR(totalAmount)}</span></div>
              </div>
              <button className="pm-button pm-button-primary w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Save Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {reminderTarget && (
        <div className="pm-modal-overlay flex items-end justify-center md:items-center">
          <div className="pm-modal-card">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">AI Reminder Draft</h3>
              <button className="text-[var(--text-secondary)]" onClick={() => setReminderTarget(null)}>Close</button>
            </div>
            <div className="mb-4 flex gap-2">
              {["polite", "firm", "final"].map((value) => (
                <button
                  key={value}
                  className={`pm-button !px-3 !py-2 text-sm ${tone === value ? "pm-button-primary" : "pm-button-ghost"}`}
                  onClick={() => setTone(value)}
                >
                  {value === "final" ? "Final Notice" : value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
              {reminderQuery.isLoading ? "Drafting message..." : reminderQuery.data?.data?.message}
            </div>
            <button
              className="pm-button pm-button-primary mt-5 flex w-full items-center justify-center gap-2"
              onClick={async () => {
                await navigator.clipboard.writeText(reminderQuery.data?.data?.message || "");
                showToast({ type: "success", title: "Copied to clipboard" });
              }}
            >
              <Copy size={18} />
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

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
              <button
                className="pm-button pm-button-primary flex items-center justify-center gap-2"
                onClick={async () => {
                  await navigator.clipboard.writeText(latestPaymentLink || "");
                  showToast({ type: "success", title: "Payment link copied" });
                }}
              >
                <LinkIcon size={18} />
                Copy Link
              </button>
              <a
                className="pm-button pm-button-success flex items-center justify-center gap-2"
                href={`https://wa.me/?text=${encodeURIComponent(`Please use this link to pay invoice ${paymentTarget.invoiceNumber}: ${latestPaymentLink || ""}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} />
                Share WhatsApp
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
