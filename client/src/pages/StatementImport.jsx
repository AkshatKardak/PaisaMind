import { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Filter,
  Check,
} from "lucide-react";
import { statementService } from "../services/statementService";

const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Software Subscriptions",
  "Business",
  "Marketing",
  "Office",
  "Salary",
  "Freelance Income",
  "Investment",
  "Loan/EMI",
  "Insurance",
  "Taxes",
  "Other",
];

export default function StatementImport() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [stagedData, setStagedData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);
    setSuccessMessage("");

    try {
      const res = await statementService.uploadStatement(selectedFile);
      if (res.success && res.data) {
        setStagedData(res.data);
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      alert("Statement upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelectAll = (checkAll) => {
    setTransactions((prev) =>
      prev.map((t) => ({ ...t, selected: checkAll ? !t.isDuplicate : false }))
    );
  };

  const toggleSelectRow = (index) => {
    setTransactions((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleCategoryChange = (index, newCat) => {
    setTransactions((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, categoryOverride: newCat } : t))
    );
  };

  const handleCommit = async () => {
    if (!stagedData?.importId) return;

    const selectedIndices = transactions
      .map((t, idx) => (t.selected ? idx : null))
      .filter((idx) => idx !== null);

    if (selectedIndices.length === 0) {
      alert("Please select at least 1 transaction to import.");
      return;
    }

    setCommitting(true);
    try {
      const res = await statementService.commitTransactions(
        stagedData.importId,
        selectedIndices
      );
      if (res.success) {
        setSuccessMessage(res.data.message);
        setStagedData(null);
        setTransactions([]);
        setFile(null);
      }
    } catch (err) {
      alert("Commit failed: " + err.message);
    } finally {
      setCommitting(false);
    }
  };

  const selectedCount = transactions.filter((t) => t.selected).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <FileSpreadsheet className="text-indigo-500" />
          Bank Statement Ingestion Engine
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Auto-parse CSV, Excel (.xlsx), and PDF bank statements with intelligent merchant categorization and duplicate detection
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {/* Upload Box */}
      {!stagedData && (
        <div className="rounded-3xl p-10 border-2 border-dashed border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-500/50 transition-all">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600">
            <UploadCloud size={32} />
          </div>
          <div className="space-y-1">
            <div className="text-base font-bold text-[var(--text-primary)]">
              Drop bank statement here or browse
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Supports CSV, Excel (.xlsx / .xls), PDF, or passbook photos (PNG/JPG with Vision OCR)
            </div>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/20 transition-all">
            {uploading ? "Parsing Statement..." : "Select Statement File"}
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Staged Transactions Table */}
      {stagedData && (
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <span>{stagedData.filename}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-mono">
                  {transactions.length} rows parsed
                </span>
                {stagedData.duplicateCount > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-mono">
                    {stagedData.duplicateCount} duplicate warnings
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Review and modify auto-assigned categories before final import into your ledger.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSelectAll(true)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Select Non-Duplicates
              </button>
              <button
                onClick={handleCommit}
                disabled={committing || selectedCount === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check size={14} />
                {committing ? "Importing..." : `Commit Selected (${selectedCount})`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                <tr className="text-[var(--text-secondary)]">
                  <th className="pb-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedCount === transactions.length && transactions.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                  </th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Narration</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Assigned Category</th>
                  <th className="pb-3 font-semibold">Status / Warnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {transactions.map((tx, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[var(--bg-hover)] transition-all ${
                      tx.isDuplicate ? "bg-rose-500/5 opacity-80" : ""
                    }`}
                  >
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={tx.selected}
                        onChange={() => toggleSelectRow(idx)}
                        className="rounded accent-indigo-600"
                      />
                    </td>
                    <td className="py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(tx.parsedDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 font-medium text-[var(--text-primary)] max-w-xs truncate">
                      {tx.rawDescription}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          tx.type === "income"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                      ₹{tx.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      <select
                        value={tx.categoryOverride || tx.suggestedCategory}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        className="rounded-lg px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-indigo-500"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-[11px]">
                      {tx.isDuplicate ? (
                        <span className="text-rose-500 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Possible Duplicate
                        </span>
                      ) : (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {Math.round((tx.confidence || 0.9) * 100)}% Confidence
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
