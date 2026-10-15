import {
  ChartColumn, ChevronsUpDown, CircleHelp, LayoutDashboard, Phone, Settings, SquareCheck, UserRound, Users,
  type LucideIcon,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

type NavItem = { label: string; href: string; icon: LucideIcon; active?: boolean; count?: number };

type Props = {
  newLeadCount: number;
  target: { done: number; goal: number };
  /** "responsive": 72px rail at md, full at lg. "drawer": always full (mobile drawer). */
  mode?: "responsive" | "drawer";
  onNavigate?: () => void;
  /** Highlights the matching nav item. Defaults to "/" (Dashboard) when omitted. */
  activeHref?: string;
};

// In rail mode (md only) labels hide and show as hover tooltips.
const railHide = "md:max-lg:hidden";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 text-[24px] font-extrabold tracking-[-.04em]">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md bg-gradient-brand text-[18px] text-white shadow-[0_6px_18px_-4px_rgba(109,77,255,.6)]">
        Z
      </span>
      {!compact && <span>Zedu</span>}
    </span>
  );
}

export function Sidebar({ newLeadCount, target, mode = "responsive", onNavigate, activeHref = "/" }: Props) {
  const rail = mode === "responsive";
  const hide = rail ? railHide : "";

  const primary: NavItem[] = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, active: activeHref === "/" },
    { label: "Leads", href: "#", icon: UserRound, count: newLeadCount, active: activeHref === "/leads" },
    { label: "Calls", href: "#", icon: Phone, active: activeHref === "/calls" },
    { label: "Tasks", href: "/tasks", icon: SquareCheck, active: activeHref === "/tasks" },
    { label: "Contacts", href: "/contacts", icon: Users, active: activeHref === "/contacts" },
    { label: "Reports", href: "#", icon: ChartColumn, active: activeHref === "/reports" },
  ];
  const secondary: NavItem[] = [
    { label: "Settings", href: "#", icon: Settings },
    { label: "Help", href: "#", icon: CircleHelp },
  ];

  const pct = Math.min(target.done / target.goal, 1);
  const left = Math.max(target.goal - target.done, 0);

  const item = (n: NavItem) => (
    <li key={n.label}>
      <a
        href={n.href}
        onClick={onNavigate}
        aria-current={n.active ? "page" : undefined}
        aria-label={rail ? `${n.label}${n.count ? `, ${n.count} new` : ""}` : undefined}
        className={`group relative flex h-11 items-center gap-3 rounded-lg px-3 text-body font-bold transition duration-150 ease-out ${
          rail ? "md:max-lg:justify-center md:max-lg:px-0" : ""
        } ${
          n.active
            ? "bg-gradient-brand text-white shadow-brand"
            : "text-ink-muted hover:bg-brand-soft hover:text-ink"
        }`}
      >
        <n.icon size={20} strokeWidth={2} className="shrink-0" />
        <span className={hide}>{n.label}</span>
        {!!n.count && (
          <em className={`ml-auto rounded-full bg-accent px-[7px] py-0.5 text-[11px] font-bold not-italic text-white ${hide}`}>
            {formatNumber(n.count)}
          </em>
        )}
        {/* Rail mode: the count collapses to a coral dot; the number moves into the tooltip. */}
        {rail && !!n.count && (
          <i aria-hidden className="absolute right-2.5 top-2.5 hidden h-2 w-2 rounded-full bg-accent ring-2 ring-surface md:max-lg:block" />
        )}
        {rail && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-ink px-2.5 py-2 text-caption text-surface opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 md:max-lg:block"
          >
            {n.label}
            {!!n.count && ` · ${formatNumber(n.count)} new`}
          </span>
        )}
      </a>
    </li>
  );

  return (
    <div className="flex h-full flex-col bg-surface px-4 py-6 md:max-lg:px-3">
      <div className={`px-2.5 pb-7 ${rail ? "md:max-lg:flex md:max-lg:justify-center md:max-lg:px-0" : ""}`}>
        <span className={rail ? "md:max-lg:hidden" : ""}><Logo /></span>
        {rail && <span className="hidden md:max-lg:inline"><Logo compact /></span>}
      </div>

      <nav aria-label="Main" className="flex flex-col">
        <ul className="flex flex-col gap-1">{primary.map(item)}</ul>
        <hr className="my-3 border-line" />
        <ul className="flex flex-col gap-1">{secondary.map(item)}</ul>
      </nav>

      <div className="mt-auto pt-6">
        {/* Goal card; collapses to a progress ring in rail mode. */}
        <div
          className={`relative overflow-hidden rounded-[16px] bg-[linear-gradient(150deg,#2a1484,#6d4dff)] p-4 text-white ${hide}`}
        >
          <span aria-hidden className="absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-white/[.12]" />
          <b className="block text-[15px]">Monthly target</b>
          <p className="mb-2.5 mt-1 text-small text-white/85">
            {left ? `${target.done} of ${target.goal} conversions · ${left} to go` : "🎉 Target hit, nice work!"}
          </p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-label="Monthly target"
            aria-valuenow={target.done}
            aria-valuemin={0}
            aria-valuemax={target.goal}
          >
            <i className="block h-full rounded-full bg-white transition-[width] duration-400 ease-out" style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
        {rail && <GoalRing pct={pct} label={`${target.done} of ${target.goal} conversions`} />}

        <hr className="my-4 border-line" />
        <button
          className={`flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-surface-sunken ${
            rail ? "md:max-lg:justify-center md:max-lg:px-0" : ""
          }`}
          aria-label="Switch workspace"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft text-caption font-bold text-brand-bright">ZS</span>
          <span className={`min-w-0 flex-1 ${hide}`}>
            <b className="block truncate text-small">Zedu Sales</b>
            <small className="block text-caption text-ink-muted">Workspace</small>
          </span>
          <ChevronsUpDown size={16} className={`shrink-0 text-ink-muted ${hide}`} />
        </button>
      </div>
    </div>
  );
}

function GoalRing({ pct, label }: { pct: number; label: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="hidden justify-center md:max-lg:flex" title={`Monthly target: ${label}`}>
      <svg width="46" height="46" viewBox="0 0 46 46" role="img" aria-label={`Monthly target: ${label}`} className="-rotate-90">
        <circle cx="23" cy="23" r={r} fill="none" stroke="var(--brand-soft)" strokeWidth="5" />
        <circle cx="23" cy="23" r={r} fill="none" stroke="#6d4dff" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
      </svg>
    </div>
  );
}
