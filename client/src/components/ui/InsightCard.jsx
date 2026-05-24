import { Lightbulb, X } from "lucide-react";

const typeStyles = {
  warning: "border-l-[var(--warning)] bg-amber-500/5",
  danger: "border-l-[var(--danger)] bg-red-500/5",
  success: "border-l-[var(--success)] bg-emerald-500/5",
};

function InsightCard({ insight, type = "warning", onDismiss }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] border-l-4 p-4 ${typeStyles[type] || typeStyles.warning}`}>
      <div className="flex items-start gap-3">
        <Lightbulb size={18} className="mt-0.5 text-[var(--purple)]" />
        <p className="flex-1 text-sm leading-6 text-[var(--text-secondary)]">{insight}</p>
        {onDismiss ? (
          <button type="button" onClick={onDismiss} className="text-[var(--text-muted)] transition hover:text-white">
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default InsightCard;
