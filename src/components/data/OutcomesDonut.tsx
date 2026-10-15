"use client";

import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/dashboard";
import { formatNumber, formatPercent } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

const R = 54;
const C = 2 * Math.PI * R;
const GAP = 3;

// Call outcomes donut, Zedu Design System §7.9: 16px ring, 3px gaps, total in the centre.
export function OutcomesDonut({ outcomes, rangeLabel }: { outcomes: DashboardData["outcomes"]; rangeLabel: string }) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, []);

  const { total, items } = outcomes;
  const visible = items.filter((o) => o.value > 0);
  let offset = 0;
  const arcs = visible.map((o) => {
    const len = (o.value / total) * C;
    const arc = { ...o, len, offset };
    offset += len;
    return arc;
  });
  const summary = `Call outcomes, ${rangeLabel.toLowerCase()}: ` + items.map((o) => `${o.name} ${o.value}`).join(", ") + `. ${total} calls in total.`;

  return (
    <section className="card" aria-labelledby="outcomes-title">
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <h3 id="outcomes-title" className="text-h3">Call outcomes</h3>
        <span className="rounded-md border border-line px-2.5 py-1.5 text-caption text-ink-muted">{rangeLabel}</span>
      </div>

      {total === 0 ? (
        <EmptyState icon={Phone} title="No calls in this period" body="Outcomes show up here after your first call." />
      ) : (
        <div className="flex items-center gap-[18px] max-sm:flex-col">
          <div className="relative h-[140px] w-[140px] shrink-0">
            <svg viewBox="0 0 140 140" width="140" height="140" className="-rotate-90" role="img" aria-label={summary}>
              {arcs.map((a) => (
                <circle
                  key={a.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  strokeWidth="16"
                  stroke={a.color}
                  strokeDasharray={`${drawn ? Math.max(a.len - (arcs.length > 1 ? GAP : 0), 0) : 0} ${C}`}
                  strokeDashoffset={-a.offset}
                  className="transition-[stroke-dasharray] duration-data ease-out"
                />
              ))}
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <b className="text-display">{formatNumber(total)}</b>
              <small className="text-caption text-ink-muted">calls</small>
            </div>
          </div>
          <ul className="flex w-full flex-1 flex-col gap-3 text-caption">
            {items.map((o) => (
              <li key={o.key} className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o.color }} />
                <span className="flex-1 text-ink-muted">{o.name}</span>
                <b className="font-extrabold">{formatNumber(o.value)}</b>
                <em className="w-10 text-right not-italic text-ink-muted">{formatPercent((o.value / total) * 100)}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
