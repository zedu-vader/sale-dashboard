export default function Sparkline({
  points,
  tone = "brand",
}: {
  points: number[];
  tone?: "brand" | "danger";
}) {
  const w = 96;
  const h = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 4 - ((p - min) / span) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline
        points={coords}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: tone === "danger" ? "rgb(var(--danger-rgb))" : "var(--brand-bright)" }}
      />
    </svg>
  );
}
