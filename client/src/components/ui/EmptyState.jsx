function EmptyState({ icon: Icon, title, subtitle, ctaText, onCta }) {
  return (
    <div className="pm-card flex flex-col items-center justify-center gap-4 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
        {Icon ? <Icon size={28} /> : null}
      </div>
      <div>
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      {ctaText ? (
        <button type="button" className="pm-button pm-button-primary" onClick={onCta}>
          {ctaText}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
