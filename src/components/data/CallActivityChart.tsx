"use client";

import { PhoneMissed } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/dashboard";
import { formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { button } from "@/components/ui/button";
import { InsightChips } from "./InsightChips";

const SERIES = [
  { key: "made", label: "Calls made", className: "bg-indigo-700 dark:bg-brand" },
  { key: "connected", label: "Connected", className: "bg-indigo-300" },
  { key: "unanswered", label: "Unanswered", className: "bg-indigo-100 dark:bg-brand-soft dark:ring-1 dark:ring-inset dark:ring-indigo-300/40" },
] as const;

// Call activity grouped bars, Zedu Design System §7.9. Bars grow once on load, staggered 25ms left to right.
export function CallActivityChart({ chart }: { chart: DashboardData["chart"] }) {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 100);
    return () => clearTimeout(t);
  }, []);

  const empty = chart.days.every((d) => d.made === 0);
  const ticks = [4, 3, 2, 1, 0].map((i) => (chart.max / 4) * i);

  return (
    <section className="card" aria-labelledby="call-activity-title">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h3 id="call-activity-title" className="text-h3">Call activity</h3>
        <ul className="flex flex-wrap gap-4 text-caption text-ink-muted">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <i className={`h-2.5 w-2.5 rounded-[3px] ${s.className} ${s.key === "unanswered" ? "ring-1 ring-inset ring-indigo-300" : ""}`} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      {empty ? (
        <EmptyState
          icon={PhoneMissed}
          title="No calls yet this week"
          body="Your first call is one tap away."
          action={<a href="#" className={button({ size: "sm" })}>Start calling</a>}
        />
      ) : (
        <>
          <div className="grid h-[250px] grid-cols-[32px_minmax(0,1fr)]">
            <div aria-hidden className="flex flex-col justify-between pb-[26px] text-[11px] text-ink-muted">
              {ticks.map((t) => <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{formatNumber(t)}</span>)}
            </div>
            <div
              role="img"
              aria-label={chart.summary}
              className="relative mb-[26px] grid grid-cols-7 border-b border-line bg-[repeating-linear-gradient(to_bottom,var(--border)_0_1px,transparent_1px_25%)]"
            >
              {chart.days.map((d, di) => (
                <div key={d.label} tabIndex={0} className="group relative flex items-end justify-center gap-[5px] rounded-t-lg outline-offset-0 max-sm:gap-[3px]">
                  <span
                    aria-hidden
                    className={`absolute inset-0 rounded-t-lg bg-brand-soft transition-opacity duration-fast ${d.today ? "opacity-70" : "opacity-0 group-hover:opacity-40"}`}
                  />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-2 text-[11px] leading-[1.5] text-surface opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    <b>{d.label}</b>
                    <br />
                    {d.made} made · {d.connected} connected · {d.unanswered} unanswered
                  </span>
                  {SERIES.map((s, si) => (
                    <i
                      key={s.key}
                      className={`relative w-3.5 rounded-t-sm transition-[height] duration-data ease-out max-sm:w-2 ${s.className}`}
                      style={{
                        height: grown ? `${(d[s.key] / chart.max) * 100}%` : 0,
                        transitionDelay: grown ? `${(di * SERIES.length + si) * 25}ms` : undefined,
                      }}
                    />
                  ))}
                  <span className={`absolute -bottom-6 text-[11px] font-semibold ${d.today ? "text-brand-bright" : "text-ink-muted"}`}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <InsightChips insights={chart.insights} />
        </>
      )}
    </section>
  );
}
