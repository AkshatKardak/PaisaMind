import React from "react";

/**
 * CoverageMeter Component
 * Enforces Rule 3: Never show a confident number from incomplete data.
 * Every rupee figure carries { known, estimated, missing } and renders inline
 * as "based on X of ~Y transactions".
 */
export default function CoverageMeter({
  coverage = { known: 0, estimated: 0, missing: 0 },
  knownCount,
  totalCount,
  className = ""
}) {
  const known = knownCount !== undefined ? knownCount : (coverage?.known || 0);
  const estimated = coverage?.estimated || 0;
  const missing = coverage?.missing || 0;
  const total = totalCount !== undefined ? totalCount : ((coverage?.total) || (known + estimated + missing) || 1);

  const approxChar = (estimated > 0 || missing > 0) ? "~" : "";

  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block shrink-0" />
      <span>
        based on <strong className="font-semibold text-[var(--text-secondary)]">{known}</strong> of{" "}
        {approxChar}{total} transactions
      </span>
      {(estimated > 0 || missing > 0) && (
        <span className="text-[10px] px-1.5 py-0.2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          {estimated > 0 ? `${estimated} est` : ""}{estimated > 0 && missing > 0 ? " • " : ""}{missing > 0 ? `${missing} unverified` : ""}
        </span>
      )}
    </div>
  );
}
