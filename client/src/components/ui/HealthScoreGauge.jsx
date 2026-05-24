const polarToCartesian = (cx, cy, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [`M`, start.x, start.y, `A`, radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
};

const getColor = (score) => {
  if (score <= 40) return "#EF4444";
  if (score <= 60) return "#F59E0B";
  if (score <= 80) return "#0EA5E9";
  return "#10B981";
};

function HealthScoreGauge({ score = 0, grade = "C" }) {
  const safeScore = Math.min(100, Math.max(0, score));
  const endAngle = (safeScore / 100) * 180;

  return (
    <div className="pm-card flex h-full flex-col items-center justify-center">
      <div className="relative h-52 w-full">
        <svg viewBox="0 0 220 140" className="h-full w-full">
          <path d={describeArc(110, 110, 72, 0, 180)} stroke="#1F2937" strokeWidth="14" fill="none" />
          <path
            d={describeArc(110, 110, 72, 0, endAngle)}
            stroke={getColor(safeScore)}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            style={{ transition: "all 800ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
          <div className="text-4xl font-bold">{safeScore}</div>
          <div className="text-sm font-semibold text-[var(--text-secondary)]">Grade {grade}</div>
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">Financial health score</p>
    </div>
  );
}

export default HealthScoreGauge;
