// ZEDU/Card and ZEDU/KPI card (Figma 16802:18249).

import type { ReactNode } from "react";
import { Delta } from "./Badges";
import { cx } from "./cx";

type CardProps = {
  title?: string;
  /** Optional 16px icon before the title. */
  icon?: ReactNode;
  /** Header action, usually <Button variant="secondary" size="sm">See all</Button>. */
  action?: ReactNode;
  /** Let the content (e.g. a table) bleed to the card edges. */
  bleed?: boolean;
  className?: string;
  children?: ReactNode;
};

/** White surface, radius 12, 1px border/default, Shadow/SM, 20px padding. */
export function Card({ title, icon, action, bleed, className, children }: CardProps) {
  const header = (title || action) && (
    <div className={cx("flex items-center gap-2", bleed && "p-5 pb-4")}>
      {icon && <span className="flex shrink-0 text-z-icon [&_svg]:size-4">{icon}</span>}
      {title && <h3 className="min-w-0 flex-1 text-z-card text-z-fg">{title}</h3>}
      {action}
    </div>
  );
  return (
    <section
      className={cx(
        "relative flex flex-col rounded-z-xl border border-z-line bg-z-surface shadow-z-sm",
        bleed ? "overflow-hidden" : "gap-4 p-5",
        className,
      )}
    >
      {header}
      {children}
    </section>
  );
}

/** Small line chart for KPI cards (88×36, indigo). Pass at least two points. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const points = data
    .map((v, i) => `${((i / (data.length - 1)) * 88).toFixed(2)},${(34 - ((v - min) / range) * 32).toFixed(2)}`)
    .join(" ");
  return (
    <svg aria-hidden viewBox="0 0 88 36" preserveAspectRatio="none" className={cx("h-9 w-[88px] shrink-0", className)}>
      <polyline
        points={points}
        fill="none"
        stroke="var(--z-chart-1)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type KpiCardProps = {
  label: string;
  value: ReactNode;
  delta?: { direction: "up" | "down" | "flat"; value: string };
  /** Icon variant (dashboards): tinted icon tile. */
  icon?: ReactNode;
  /** Inline variant (page headers): sparkline on the right. */
  sparkline?: number[];
  /** Drop the border and shadow to sit KPIs edge to edge in a row. */
  plain?: boolean;
  className?: string;
};

/**
 * Metric card. Inline (label, value + delta, sparkline) for page headers like Leads;
 * Icon (tinted icon tile, label, value) for dashboards. Values use ZEDU/Display with tabular figures.
 */
export function KpiCard({ label, value, delta, icon, sparkline, plain, className }: KpiCardProps) {
  return (
    <div
      className={cx(
        "flex min-h-20 gap-3 bg-z-surface px-5 py-2.5",
        icon ? "items-center" : "items-end",
        !plain && "rounded-z-xl border border-z-line shadow-z-sm",
        className,
      )}
    >
      {icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-z-accent-subtle text-z-fg-accent [&_svg]:size-[18px]">
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-z-small font-normal text-z-fg-muted">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-z-display tabular-nums text-z-fg">{value}</p>
          {delta && <Delta {...delta} />}
        </div>
      </div>
      {!icon && sparkline && <Sparkline data={sparkline} className="mb-2.5" />}
    </div>
  );
}
