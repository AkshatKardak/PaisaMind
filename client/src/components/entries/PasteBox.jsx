import React, { useState } from "react";
import { Clipboard, CheckCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight, Loader2, X } from "lucide-react";
import api from "../../services/api";

/**
 * PasteBox & ConfirmCard Component
 * Implements Section 2.1 Paste parser:
 * Paste bank SMS, email, or UPI alert text -> Regex-first parse -> Editable confirm card -> Explicit tap to save.
 * Nothing auto-saves.
 */
export default function PasteBox({ onEntrySaved, className = "" }) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable fields in Confirm Card
  const [editAmount, setEditAmount] = useState("");
  const [editDirection, setEditDirection] = useState("credit");
  const [editDate, setEditDate] = useState("");
  const [editCounterparty, setEditCounterparty] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editCategory, setEditCategory] = useState("Freelance");

  const handleParse = async () => {
    if (!text.trim()) {
      setError("Please paste a transaction alert or bank SMS text.");
      return;
    }

    setParsing(true);
    setError("");
    setSavedSuccess(false);

    try {
      const res = await api.post("/entries/parse", {
        text: text.trim(),
        source: "manual"
      });

      const data = res.data;
      setParsed(data);

      // Populate editable fields
      setEditAmount(data.amount !== null && data.amount !== undefined ? String(data.amount) : "");
      setEditDirection(data.direction || "credit");
      setEditDate(data.date || new Date().toISOString().split("T")[0]);
      setEditCounterparty(data.counterparty || "");
      setEditReference(data.reference || "");
      setEditCategory(data.direction === "debit" ? "Business Expense" : "Freelance Work");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to parse text alert.");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!editAmount || isNaN(Number(editAmount)) || Number(editAmount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!editDirection) {
      setError("Please select whether this is credit or debit.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const numAmount = Number(editAmount);
      const notes = [
        editReference ? `Ref: ${editReference}` : "",
        parsed?.raw ? `Raw: ${parsed.raw}` : ""
      ].filter(Boolean).join(" | ");

      let savedData;
      if (editDirection === "credit") {
        const res = await api.post("/income", {
          source: editCounterparty || "Client Payment",
          category: editCategory || "Freelance",
          amount: numAmount,
          date: editDate || new Date().toISOString(),
          notes: notes
        });
        savedData = res.data?.income || res.data;
      } else {
        const res = await api.post("/expenses", {
          title: editCounterparty || "Expense",
          category: editCategory || "Software & Tools",
          amount: numAmount,
          date: editDate || new Date().toISOString(),
          notes: notes
        });
        savedData = res.data?.expense || res.data;
      }

      setSavedSuccess(true);
      if (onEntrySaved) {
        onEntrySaved(savedData, editDirection);
      }

      // Reset form after short delay
      setTimeout(() => {
        setParsed(null);
        setText("");
        setSavedSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setParsed(null);
    setText("");
    setError("");
  };

  return (
    <div className={`p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clipboard size={16} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Paste Log</h3>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">Zero upload • 100% private</span>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
        Paste a bank SMS, WhatsApp credit alert, or transaction text. Parsed instantly via regex on-device.
      </p>

      {/* Input box */}
      {!parsed ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="e.g. Rs.12,500.00 credited to your A/c XX4521 on 14-11-26 from RAHUL SHARMA. UPI Ref 123456789012."
            className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] transition-colors resize-none"
          />

          {error && <div className="text-xs text-red-500 font-mono">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setText("Rs.12,500.00 credited to your A/c XX4521 on 14-11-26 from RAHUL SHARMA. UPI Ref 123456789012.");
              }}
              className="px-2.5 py-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border)] rounded-md"
            >
              Sample Alert
            </button>
            <button
              onClick={handleParse}
              disabled={parsing || !text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {parsing && <Loader2 size={13} className="animate-spin" />}
              <span>{parsing ? "Parsing..." : "Parse Alert"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Confirm Card */
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                Confirm Parsed Fields
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    parsed.confidence === "high"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : parsed.confidence === "medium"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {parsed.confidence} confidence
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {parsed.matchedTemplate}
                </span>
              </div>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                  Direction
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDirection("credit")}
                    className={`flex-1 py-1.5 px-2 rounded-md border text-xs font-mono flex items-center justify-center gap-1 ${
                      editDirection === "credit"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    <ArrowDownLeft size={13} />
                    <span>Credit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDirection("debit")}
                    className={`flex-1 py-1.5 px-2 rounded-md border text-xs font-mono flex items-center justify-center gap-1 ${
                      editDirection === "debit"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-semibold"
                        : "border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    <ArrowUpRight size={13} />
                    <span>Debit</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                  Counterparty / Source
                </label>
                <input
                  type="text"
                  value={editCounterparty}
                  onChange={(e) => setEditCounterparty(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                  Reference / UTR
                </label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="w-full p-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. Freelance Work"
                  className="w-full p-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Raw Text Verbatim */}
            <div className="pt-2 border-t border-[var(--border)]">
              <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">
                Original Raw Text (Verbatim)
              </span>
              <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)] break-words">
                {parsed.raw}
              </div>
            </div>
          </div>

          {error && <div className="text-xs text-red-500 font-mono">{error}</div>}

          {savedSuccess ? (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center justify-center gap-1.5">
              <CheckCircle size={14} />
              <span>Entry saved successfully!</span>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-mono transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>{saving ? "Saving..." : "Save Entry"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
