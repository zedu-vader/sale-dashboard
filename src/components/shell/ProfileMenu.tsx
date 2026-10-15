"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useDismiss } from "@/components/ui/useDismiss";

export const THEME_KEY = "zedu-theme";

type Props = { name: string; email?: string | null; image?: string | null };

export function ProfileMenu({ name, email, image }: Props) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setDark(!dark);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  const itemClass = "flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-small font-semibold text-ink hover:bg-surface-sunken";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        className="grid h-10 w-10 place-items-center rounded-full"
      >
        <Avatar name={name} image={image} size={36} self />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-60 rounded-[14px] border border-line bg-surface p-1.5 shadow-raised">
          <div className="border-b border-line px-3 pb-2.5 pt-1.5">
            <b className="block truncate text-small">{name}</b>
            {email && <small className="block truncate text-caption text-ink-muted">{email}</small>}
          </div>
          <div className="pt-1.5">
            <button role="menuitemcheckbox" aria-checked={dark} onClick={toggleTheme} className={itemClass}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              {dark ? "Light mode" : "Dark mode"}
            </button>
            <button role="menuitem" onClick={() => signOut()} className={itemClass}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
