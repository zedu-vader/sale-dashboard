"use client";

import { Bell, Menu, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { button, iconButton } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { ProfileMenu } from "./ProfileMenu";
import { Logo } from "./Sidebar";

type Props = {
  user: { name: string; email?: string | null; image?: string | null };
  onOpenMenu: () => void;
};

// Top bar, Zedu Design System §5.2.
export function TopBar({ user, onOpenMenu }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [mobileSearch, setMobileSearch] = useState(false);

  // ⌘K / Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMobileSearch(true);
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (mobileSearch) searchRef.current?.focus();
  }, [mobileSearch]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-8 max-lg:px-6 max-sm:px-4">
        {/* Mobile: hamburger + logo */}
        <button onClick={onOpenMenu} aria-label="Open menu" className="-ml-2 grid h-11 w-11 place-items-center rounded-lg md:hidden">
          <Menu size={20} />
        </button>
        <span className="md:hidden"><Logo /></span>

        <label
          className={`${mobileSearch ? "max-md:absolute max-md:inset-x-4 max-md:top-3 max-md:z-10 max-md:flex" : "max-md:hidden"} flex h-10 w-[320px] items-center gap-2 rounded-lg border border-line bg-surface px-3 transition duration-150 focus-within:border-brand-bright focus-within:shadow-[0_0_0_3px_rgba(109,77,255,.15)] max-md:w-auto`}
        >
          <Search size={16} className="shrink-0 text-ink-muted" />
          <span className="sr-only">Search</span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search leads, contacts, calls…"
            onBlur={() => setMobileSearch(false)}
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted [&:focus-visible]:outline-none"
          />
          <kbd className="rounded-[6px] border border-line bg-surface-sunken px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink-muted max-md:hidden">⌘K</kbd>
          {mobileSearch && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setMobileSearch(false)} aria-label="Close search" className="md:hidden">
              <X size={16} className="text-ink-muted" />
            </button>
          )}
        </label>

        <div className="ml-auto flex items-center gap-2.5">
          <button onClick={() => setMobileSearch(true)} aria-label="Search" className="grid h-11 w-11 place-items-center rounded-lg md:hidden">
            <Search size={20} />
          </button>
          <div className="max-lg:hidden">
            <DateRangePicker />
          </div>
          <button className={`${iconButton} max-md:hidden`} aria-label="Notifications">
            <Bell size={16} />
          </button>
          <button className={`${button()} max-md:hidden`}>
            <Plus size={16} strokeWidth={2.5} />
            Add lead
          </button>
          <ProfileMenu {...user} />
        </div>
      </div>
    </header>
  );
}
