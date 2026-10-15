"use client";

// ZEDU/Sidebar, ZEDU/Nav item, ZEDU/Nav section label, ZEDU/Bulk action bar (Figma 16805:18517, 16814:18894).

import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { CountBadge } from "./Badges";
import { cx } from "./cx";

const SidebarContext = createContext({ collapsed: false });

type SidebarProps = {
  /** Collapsed 64px icon rail (768–1279px). Expanded is 248px (≥1280px); below 768px show it as a drawer. */
  collapsed?: boolean;
  /** Workspace switcher and search. */
  header?: ReactNode;
  /** Help center item, divider and user trigger, pinned to the bottom. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** App sidebar on color/bg/app. Nav items inside read `collapsed` from it. */
export function Sidebar({ collapsed = false, header, footer, className, children }: SidebarProps) {
  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <nav
        aria-label="Main"
        className={cx(
          "relative flex h-full shrink-0 flex-col gap-4 overflow-y-auto overflow-x-hidden border-r border-z-line bg-z-app p-3",
          collapsed ? "w-16 items-center" : "w-[248px]",
          className,
        )}
      >
        {header}
        {children}
        {footer && (
          <div className={cx("mt-auto flex flex-col gap-2", collapsed ? "items-center" : "w-full")}>{footer}</div>
        )}
      </nav>
    </SidebarContext.Provider>
  );
}

/** Hairline between sidebar groups (24px wide when collapsed). */
export function SidebarDivider() {
  const { collapsed } = useContext(SidebarContext);
  return <div role="separator" className={cx("h-px shrink-0 bg-z-line", collapsed ? "w-6" : "w-full")} />;
}

type NavItemProps = {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  count?: number | string;
};

/** 32px sidebar item. Active is a white chip with Shadow/XS. Collapsed shows the icon only, label as a tooltip. */
export function NavItem({ icon, label, href, onClick, active, count }: NavItemProps) {
  const { collapsed } = useContext(SidebarContext);
  const className = cx(
    "z-focus flex h-8 shrink-0 items-center gap-2.5 rounded-z-md text-z-small transition-colors duration-150 [&_svg]:size-4 [&_svg]:shrink-0",
    collapsed ? "w-10 justify-center" : "w-full pl-2.5 pr-2",
    active
      ? "bg-z-surface font-medium text-z-fg shadow-z-xs [&_svg]:text-z-icon-strong"
      : "font-normal text-z-fg-secondary hover:bg-z-sunken hover:text-z-fg [&_svg]:text-z-icon hover:[&_svg]:text-z-icon-strong",
  );
  const content = (
    <>
      {icon}
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate text-left"}>{label}</span>
      {!collapsed && count !== undefined && <CountBadge count={count} />}
    </>
  );
  const shared = { className, title: collapsed ? label : undefined, "aria-current": active ? ("page" as const) : undefined };
  return href ? (
    <Link href={href} onClick={onClick} {...shared}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} {...shared}>
      {content}
    </button>
  );
}

type NavSectionProps = {
  /** Group heading (Overline). Omit for an unlabelled group. Hidden when the sidebar is collapsed. */
  label?: string;
  /** Shows a + button on the heading (groups like Workspaces). */
  onAdd?: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Collapsible group of nav items under a ZEDU/Nav section label. */
export function NavSection({ label, onAdd, defaultOpen = true, children }: NavSectionProps) {
  const { collapsed } = useContext(SidebarContext);
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const showLabel = label && !collapsed;
  return (
    <div className={cx("flex shrink-0 flex-col gap-0.5", collapsed ? "items-center" : "w-full")}>
      {showLabel && (
        <div className="flex h-7 items-center gap-2 pl-2.5 pr-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((o) => !o)}
            className="z-focus -ml-1 flex min-w-0 flex-1 items-center gap-2 rounded-z-xs pl-1 text-left z-overline text-z-fg-muted"
          >
            <ChevronDown
              aria-hidden
              className={cx("size-3.5 shrink-0 text-z-icon-subtle transition-transform duration-150", !open && "-rotate-90")}
            />
            <span className="truncate">{label}</span>
          </button>
          {onAdd && (
            <button
              type="button"
              aria-label={`Add to ${label}`}
              onClick={onAdd}
              className="z-focus rounded-z-xs text-z-icon-subtle hover:text-z-icon-strong"
            >
              <Plus aria-hidden className="size-3.5" />
            </button>
          )}
        </div>
      )}
      <div id={id} hidden={showLabel ? !open : false} className={cx("flex flex-col gap-0.5", collapsed ? "items-center" : "w-full")}>
        {children}
      </div>
    </div>
  );
}

type BulkAction = { label: string; icon?: ReactNode; onClick: () => void };

type BulkActionBarProps = {
  /** e.g. 3 → "3 selected". */
  count: number;
  actions: BulkAction[];
  /** Clears the selection. */
  onDiscard: () => void;
  /** Fixed bottom-centre, 24px above the viewport edge. */
  floating?: boolean;
  className?: string;
};

/** Inverse bar shown when table rows are selected: count, actions, and Discard. */
export function BulkActionBar({ count, actions, onDiscard, floating = true, className }: BulkActionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cx(
        "inline-flex items-center gap-0.5 rounded-z-lg bg-z-inverse py-1 pl-3 pr-1 shadow-z-lg",
        floating && "fixed bottom-6 left-1/2 z-40 -translate-x-1/2",
        className,
      )}
    >
      <span aria-live="polite" className="whitespace-nowrap text-z-small font-normal text-z-fg-on-inverse-muted">
        {count} selected
      </span>
      <span aria-hidden className="ml-1.5 h-4 w-px bg-z-line-inverse" />
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="z-focus flex h-8 items-center gap-1.5 whitespace-nowrap rounded-z-md px-2.5 text-z-small font-medium text-z-fg-on-primary transition-colors duration-150 hover:bg-white/10 [&_svg]:size-4"
        >
          {a.icon}
          {a.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onDiscard}
        className="z-focus h-8 whitespace-nowrap rounded-z-md bg-z-surface px-3 text-z-small font-medium text-z-fg-danger transition-colors duration-150 hover:bg-z-danger-subtle"
      >
        Discard
      </button>
    </div>
  );
}
