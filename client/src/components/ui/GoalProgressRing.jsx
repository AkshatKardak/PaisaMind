function GoalProgressRing({ progress = 0 }) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeProgress / 100) * circumference;
  const color = safeProgress < 30 ? "#EF4444" : safeProgress <= 70 ? "#F59E0B" : "#10B981";

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="#1F2937" strokeWidth="10" fill="none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 800ms ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">{Math.round(safeProgress)}%</div>
        <div className="text-xs text-[var(--text-secondary)]">funded</div>
      </div>
    </div>
  );
}

export default GoalProgressRing;
