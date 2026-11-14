import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import { formatINR } from "../../utils/formatCurrency";
import CoverageMeter from "../ui/CoverageMeter";
import { showToast } from "../ui/Toast";

export default function TdsReconciliationSection() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);

  // Fetch 3-bucket reconciliation data
  const { data: bucketData, isLoading, refetch } = useQuery({
    queryKey: ["tds-buckets"],
    queryFn: async () => {
      const res = await api.get("/tds/buckets");
      return res.data?.data || {
        matched: [],
        credit_without_invoice: [],
        invoice_without_credit: [],
        summary: { totalClaimableTds: 0, totalMatchedTds: 0, totalUnmatchedTds: 0 },
      };
    },
  });

  // Delete all records mutation (One-tap delete)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete("/tds/records");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tds-buckets"] });
      showToast({ type: "success", title: "Records deleted", message: "All TDS records and derived rows removed permanently." });
    },
    onError: (err) => {
      showToast({ type: "error", title: "Delete failed", message: err.response?.data?.message || err.message });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are supported for Form 26AS / AIS uploads.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10 MB limit.");
      return;
    }

    setSelectedFile(file);
    setShowConsent(true);
  };

  const handleUploadWithConsent = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setShowConsent(false);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("consentGranted", "true");

    try {
      const res = await api.post("/tds/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        showToast({
          type: "success",
          title: "Form 26AS/AIS Processed",
          message: `${res.data.data?.recordsCount || 0} TDS tax credit entries reconciled.`,
        });
        queryClient.invalidateQueries({ queryKey: ["tds-buckets"] });
        setSelectedFile(null);
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Upload failed",
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const matched = bucketData?.matched || [];
  const creditWithoutInvoice = bucketData?.credit_without_invoice || [];
  const invoiceWithoutCredit = bucketData?.invoice_without_credit || [];
  const summary = bucketData?.summary || { totalClaimableTds: 0, totalMatchedTds: 0, totalUnmatchedTds: 0 };
  const totalRows = matched.length + creditWithoutInvoice.length + invoiceWithoutCredit.length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Tax Credit Matching
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Form 26AS / AIS TDS Reconciliation
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Reconcile client TDS deductions (Section 194J, 194C) against your logged invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalRows > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Permanently delete all uploaded 26AS/AIS records and derived rows? This cannot be undone.")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="px-3 py-1.5 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} />
              <span>{deleteMutation.isPending ? "Deleting..." : "One-Tap Delete"}</span>
            </button>
          )}

          <label className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
            {uploading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Processing PDF...</span>
              </>
            ) : (
              <>
                <Upload size={13} />
                <span>Upload Form 26AS / AIS (PDF)</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Retention Notice */}
      <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
        <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[var(--text-primary)]">
            Data Retention & Encryption Policy
          </div>
          <p className="leading-relaxed">
            PAN values are masked to the last 4 characters in all views and encrypted at rest with AES-256-GCM. Statement files and derived deduction records can be removed at any moment with the One-Tap Delete button.
          </p>
        </div>
      </div>

      {/* Consent Modal for Server Processing */}
      {showConsent && selectedFile && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
            <AlertCircle size={15} />
            <span>Upload Consent: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            You are opting to process this statement to extract deductor names, TAN, Sections 194J/194C/194H withholding rows, and credit amounts. Raw files are processed in-memory and not stored permanently.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleUploadWithConsent}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              Confirm and Extract Credits
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setShowConsent(false);
              }}
              className="px-3 py-1.5 rounded-md border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Overview Metric Tiles with Coverage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Total Claimable TDS
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
            {formatINR(summary.totalClaimableTds || 0)}
          </div>
          <CoverageMeter knownCount={matched.length + creditWithoutInvoice.length} totalCount={totalRows || 1} />
        </div>

        <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Matched Invoices
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            {formatINR(summary.totalMatchedTds || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {matched.length} invoice{matched.length === 1 ? "" : "s"} confirmed by 26AS
          </div>
        </div>

        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Unclaimed / Forgot TDS
          </div>
          <div className="text-xl font-bold font-mono text-amber-600">
            {formatINR(summary.totalUnmatchedTds || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {creditWithoutInvoice.length} credit row{creditWithoutInvoice.length === 1 ? "" : "s"} ready to claim
          </div>
        </div>
      </div>

      {/* ── Bucket 2: Money You Forgot (credit_without_invoice) Prominent ── */}
      {creditWithoutInvoice.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Money you forgot (Claimable TDS with no invoice logged)
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-600">
              {creditWithoutInvoice.length} unclaimed record{creditWithoutInvoice.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            These withholding tax credits appear in your Form 26AS/AIS from clients, but do not correspond to any logged invoice in your account. You are legally entitled to claim these credits in your ITR.
          </p>

          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-md bg-[var(--bg-card)] overflow-hidden">
            {creditWithoutInvoice.map((rec, i) => (
              <div key={i} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{rec.deductorName}</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    TAN: {rec.deductorTAN} • PAN: {rec.deductorPAN} • Section {rec.section}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-500">{formatINR(rec.tdsDeducted)} TDS</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Gross: {formatINR(rec.amountPaid)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bucket 1: Matched Invoices ── */}
      {matched.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Matched Invoices (Credits Confirmed)
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {matched.length} matched
            </span>
          </div>

          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-md bg-[var(--bg-card)] overflow-hidden">
            {matched.map((item, i) => (
              <div key={i} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {item.invoice?.clientName || item.tdsRecord?.deductorName}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    Invoice {item.invoice?.invoiceNumber} • TAN: {item.tdsRecord?.deductorTAN} • PAN: {item.tdsRecord?.deductorPAN}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-500">
                    {formatINR(item.tdsRecord?.tdsDeducted || item.invoice?.tdsAmount || 0)} TDS
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">Reconciled</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bucket 3: Invoices Without Credit ── */}
      {invoiceWithoutCredit.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-red-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Invoices Missing 26AS Credit (Chase client for Form 16A)
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {invoiceWithoutCredit.length} invoice{invoiceWithoutCredit.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            These invoices have not had corresponding TDS deposited or reflected in your 26AS statement yet. Prompt the client to file their quarterly TDS return.
          </p>

          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-md bg-[var(--bg-card)] overflow-hidden">
            {invoiceWithoutCredit.map((inv, i) => (
              <div key={i} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{inv.clientName}</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    Invoice {inv.invoiceNumber} • Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-[var(--text-primary)]">
                    {formatINR(inv.totalAmount || inv.amount)}
                  </div>
                  <div className="text-[10px] text-red-400 font-medium">TDS not yet deposited</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalRows === 0 && !isLoading && (
        <div className="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-lg">
          No Form 26AS / AIS records uploaded yet. Click "Upload Form 26AS / AIS (PDF)" to seed your TDS tax ledger.
        </div>
      )}
    </div>
  );
}
