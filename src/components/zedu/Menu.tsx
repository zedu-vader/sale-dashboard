"use client";

// ZEDU/Menu item, ZEDU/Menu divider, ZEDU/Menu label, plus a dropdown wrapper (Figma 16811:18616–18619).

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";

/** Menu panel: white, radius 10, 4px inset, Shadow/MD. */
export function Menu({ className, children, label }: { className?: string; children: ReactNode; label?: string }) {
  return (
    <div
      role="menu"
      aria-label={label}
      className={cx(
        "flex w-60 flex-col rounded-z-lg border border-z-line bg-z-surface p-1 shadow-z-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

type MenuItemProps = {
  icon?: ReactNode;
  /** Single-key shortcut shown on the right, e.g. "C". */
  shortcut?: string;
  /** Danger for destructive rows (Log out, Delete). */
  tone?: "default" | "danger";
  onSelect?: () => void;
  disabled?: boolean;
  children: ReactNode;
};

/** 32px menu row. */
export function MenuItem({ icon, shortcut, tone = "default", onSelect, disabled, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cx(
        "flex h-8 w-full shrink-0 items-center gap-2 rounded-z-sm px-2 text-left text-z-small font-normal outline-none transition-colors duration-100 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
        tone === "danger"
          ? "text-z-fg-danger hover:bg-z-danger-subtle focus-visible:bg-z-danger-subtle"
          : "text-z-fg hover:bg-z-sunken focus-visible:bg-z-sunken [&_svg]:text-z-icon",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <kbd className="font-mono text-z-mono text-z-fg-muted">{shortcut}</kbd>}
    </button>
  );
}

export function MenuDivider() {
  return <div role="separator" className="my-1 h-px shrink-0 bg-z-line" />;
}

/** Group heading inside a menu (Overline). */
export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="flex h-6 shrink-0 items-center px-2 z-overline text-z-fg-muted">{children}</div>;
}

/** Name + secondary line at the top of a menu (user menu). */
export function MenuHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col px-2 py-1.5">
      <span className="truncate text-z-small font-medium text-z-fg">{title}</span>
      {subtitle && <span className="truncate text-z-caption font-normal text-z-fg-muted">{subtitle}</span>}
    </div>
  );
}

type TriggerProps = {
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  onClick: () => void;
};

type DropdownProps = {
  /** Render the trigger and spread `props` on it. */
  trigger: (props: TriggerProps) => ReactNode;
  /** The menu, usually a <Menu>. Selecting an item closes it. */
  children: ReactNode;
  align?: "start" | "end";
  side?: "bottom" | "top";
  className?: string;
};

/**
 * Click-to-open menu. Closes on outside click, Escape or selecting an item; arrow keys move between items.
 * The menu is portalled to document.body and fixed-positioned so it is never
 * clipped by — nor scrolls — an overflow ancestor (e.g. the tasks filter bar).
 */
export function Dropdown({ trigger, children, align = "start", side = "bottom", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const gap = 4;
    let left = align === "end" ? r.right - mw : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
    let top = side === "bottom" ? r.bottom + gap : r.top - mh - gap;
    if (top + mh > window.innerHeight - 8) top = r.top - mh - gap;
    top = Math.max(8, Math.min(top, window.innerHeight - mh - 8));
    setPos({ top, left });
  }, [align, side]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, close, place]);

  const onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) close();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next].focus();
  };

  return (
    <div ref={anchorRef} className={cx("relative inline-block", className)}>
      {trigger({ "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((o) => !o) })}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            onClick={onClick}
            onKeyDown={onKeyDown}
            style={{ position: "fixed", top: pos ? pos.top : -9999, left: pos ? pos.left : -9999, zIndex: 50 }}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
