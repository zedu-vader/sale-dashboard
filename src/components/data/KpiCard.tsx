import { CircleCheck, Phone, Star, UserRound, type LucideIcon } from "lucide-react";
import type { Kpi, KpiIcon } from "@/lib/dashboard";
import { CountUp } from "./CountUp";

const ICONS: Record<KpiIcon, LucideIcon> = {
  leads: UserRound,
  calls: Phone,
  connected: CircleCheck,
  converted: Star,
};

/** Path for a 90×38 sparkline, 4px padding top and bottom. */
function sparkPath(points: number[]) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const dx = 90 / Math.max(points.length - 1, 1);
  return points.map((v, i) => `${i ? "L" : "M"}${(i * dx).toFixed(1)} ${(34 - ((v - min) / span) * 30).toFixed(1)}`).join(" ");
}

// KPI card, Zedu Design System §7.4. Compact on phones: no sparkline, 26px value.
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = ICONS[kpi.icon];
  const hero = !!kpi.hero;
  const up = kpi.delta !== null && kpi.delta >= 0;

  const deltaClass = hero
    ? "bg-white/20 text-white"
    : kpi.delta === null
      ? "bg-surface-sunken text-ink-muted"
      : up
        ? "bg-success/[.12] text-[#0b8a50] dark:text-success"
        : "bg-danger/[.12] text-[#d0284a] dark:text-danger";

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-[22px] shadow-card transition-transform duration-base ease-out motion-safe:hover:-translate-y-[3px] max-lg:p-[18px] max-sm:p-4 ${
        hero ? "bg-gradient-hero text-white" : "border border-line bg-surface"
      }`}
    >
      {hero && (
        <span aria-hidden className="pointer-events-none absolute -bottom-[60px] -right-[30px] h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.25),transparent_70%)]" />
      )}
      <div className="flex items-center gap-3.5 max-sm:gap-2.5">
        <span
          className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] max-sm:h-9 max-sm:w-9 max-sm:rounded-[10px] ${
            hero ? "bg-white/[.16] text-white" : "bg-brand-soft text-brand-bright"
          }`}
        >
          <Icon size={22} strokeWidth={2} className="max-sm:h-[18px] max-sm:w-[18px]" />
        </span>
        <span className={`text-small font-semibold ${hero ? "text-white/80" : "text-ink-muted"}`}>{kpi.label}</span>
      </div>

      <div className="mb-1.5 mt-3.5 flex items-end justify-between gap-3">
        <span className="text-display max-sm:text-display-sm">
          <CountUp to={kpi.value} />
        </span>
        <svg aria-hidden className={`mb-0.5 h-[38px] w-[90px] shrink-0 max-sm:hidden ${hero ? "text-white" : "text-brand-bright"}`} viewBox="0 0 90 38">
          <path d={sparkPath(kpi.spark)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className={`inline-flex items-center rounded-full px-2 py-[3px] font-bold ${hero ? "text-small" : "text-caption"} ${deltaClass}`}>
          {kpi.deltaLabel}
          <span className="sr-only">{kpi.delta === null ? "no comparison available" : up ? " increase" : " decrease"}</span>
        </span>
        <span className={hero ? "text-small text-white/80" : "text-caption text-ink-muted"}>{kpi.note}</span>
      </div>
    </div>
  );
}
