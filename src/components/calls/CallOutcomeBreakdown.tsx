export interface DonutSlice {
  label: string;
  count: number;
  color: string;
}

export type DonutScope = "period" | "all";

const R = 54;
const C = 2 * Math.PI * R;

export default function CallOutcomeBreakdown({
  total,
  slices,
  scope,
  onScope,
}: {
  total: number;
  slices: DonutSlice[];
  scope: DonutScope;
  onScope: (s: DonutScope) => void;
}) {
  let acc = 0;
  const segs = slices.map((s) => {
    const frac = total === 0 ? 0 : s.count / total;
    const seg = { ...s, frac, offset: acc };
    acc += frac;
    return seg;
  });

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">Call Outcome Breakdown</h2>
        <select
          value={scope}
          onChange={(e) => onScope(e.target.value as DonutScope)}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink-muted outline-none focus:border-brand"
          aria-label="Breakdown scope"
        >
          <option value="period">This period</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="132" height="132" viewBox="0 0 140 140" role="img" aria-label={`${total} calls breakdown`}>
            <circle cx="70" cy="70" r={R} fill="none" strokeWidth="22" style={{ stroke: "var(--surface-sunken)" }} />
            {segs.map((s) =>
              s.frac === 0 ? null : (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  strokeWidth="22"
                  strokeDasharray={`${(s.frac * C).toFixed(1)} ${C.toFixed(1)}`}
                  strokeDashoffset={(-s.offset * C + C * 0.25).toFixed(1)}
                  strokeLinecap="butt"
                  transform="rotate(-90 70 70)"
                  style={{ stroke: s.color }}
                />
              )
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-ink">{total}</span>
            <span className="text-xs text-ink-muted">Calls</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {segs.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[13px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 leading-tight text-ink-muted">{s.label}</span>
              <span className="font-bold text-ink">{s.count}</span>
              <span className="w-8 shrink-0 text-right text-xs text-ink-muted">
                {total === 0 ? 0 : Math.round(s.frac * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
