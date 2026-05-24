function KPICard({ title, value, change, icon: Icon, color = "bg-sky-500/15 text-sky-400" }) {
  const positive = Number(change) >= 0;

  return (
    <div className="pm-card">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          {Icon ? <Icon size={22} /> : null}
        </div>
        {typeof change !== "undefined" && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {Number(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mb-2 text-sm text-[var(--text-secondary)]">{title}</p>
      <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default KPICard;
