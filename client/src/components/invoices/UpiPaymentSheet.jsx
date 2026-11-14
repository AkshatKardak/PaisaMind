import React, { useState, useEffect } from "react";
import { Copy, Check, Download, ExternalLink, X, QrCode } from "lucide-react";
import { buildUpiUri, generateClientQrDataUrl } from "../../utils/upiUtils";

/**
 * "How to pay" Sheet component
 * Generates UPI intent and QR entirely client-side.
 * Transition state: sets invoice to 'payment_initiated' on user interaction.
 */
export default function UpiPaymentSheet({
  isOpen,
  onClose,
  invoice,
  vpa = "user@upi",
  payeeName = "Freelancer",
  onPaymentInitiated
}) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [upiUri, setUpiUri] = useState("");
  const [error, setError] = useState("");

  const amount = invoice?.totalAmount || invoice?.amount || 0;
  const invoiceNumber = invoice?.invoiceNumber || "INV-001";
  const note = `Payment for ${invoiceNumber}`;

  useEffect(() => {
    if (!isOpen || !invoice) return;

    try {
      setError("");
      const uri = buildUpiUri({
        vpa: invoice.upiId || vpa,
        payeeName: payeeName,
        amount: amount,
        note: note,
        invoiceRef: invoiceNumber
      });
      setUpiUri(uri);

      generateClientQrDataUrl(uri).then(setQrUrl).catch((err) => {
        setError("Failed to render QR code client-side.");
      });

      // Mark payment_initiated when user opens pay sheet
      if (onPaymentInitiated && invoice.status !== "paid" && invoice.status !== "Paid") {
        onPaymentInitiated(invoice._id);
      }
    } catch (err) {
      setError(err.message || "Invalid UPI parameters");
    }
  }, [isOpen, invoice, vpa, payeeName, amount, invoiceNumber, note, onPaymentInitiated]);

  if (!isOpen || !invoice) return null;

  const handleCopyVpa = async () => {
    const targetVpa = invoice.upiId || vpa;
    await navigator.clipboard.writeText(targetVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `UPI-QR-${invoiceNumber}.png`;
    a.click();
  };

  const handleOpenUpiApp = () => {
    if (!upiUri) return;
    window.location.href = upiUri;
  };

  const targetVpa = invoice.upiId || vpa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-xl relative text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-base">Pay via UPI</h3>
            <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
              {invoiceNumber} • ₹{Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500 font-mono">{error}</div>
        ) : (
          <div className="py-4 space-y-5">
            {/* QR Code Presentation */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-[var(--border)] w-fit mx-auto">
              {qrUrl ? (
                <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400 font-mono">
                  Generating QR...
                </div>
              )}
              <span className="text-[11px] text-neutral-600 font-mono mt-1">Scan with any UPI App</span>
            </div>

            {/* VPA Details */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Payee UPI ID</span>
                <span className="font-mono font-medium">{targetVpa}</span>
              </div>
              <button
                onClick={handleCopyVpa}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:border-neutral-400 text-xs font-mono transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleOpenUpiApp}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={14} />
                <span>Open UPI App</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <Download size={14} />
                <span>Save QR Image</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 text-center text-[11px] text-[var(--text-muted)] font-mono border-t border-[var(--border)]">
          Zero merchant fee • Direct account-to-account settlement
        </div>
      </div>
    </div>
  );
}
