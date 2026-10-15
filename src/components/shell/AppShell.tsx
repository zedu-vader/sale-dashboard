"use client";

import { Plus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { RangeKey } from "@/lib/range";
import { BottomTabs } from "./BottomTabs";
import { RangeContext } from "./RangeContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type Props = {
  user: { name: string; email?: string | null; image?: string | null };
  range: { key: RangeKey; period: string };
  newLeadCount: number;
  target: { done: number; goal: number };
  /** Nav item to highlight. Defaults to "/" (Dashboard). */
  activeHref?: string;
  children: ReactNode;
};

// App shell, Zedu Design System §5: sidebar (248px / 72px rail / drawer) + sticky top bar + mobile tab bar.
export function AppShell({ user, range, newLeadCount, target, activeHref, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  function changeRange(key: RangeKey) {
    startTransition(() => router.push(`${pathname}?range=${key}`, { scroll: false }));
  }

  return (
    <RangeContext.Provider value={{ ...range, change: changeRange }}>
    <div className="min-h-screen md:grid md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-line md:block">
        <Sidebar newLeadCount={newLeadCount} target={target} activeHref={activeHref} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <TopBar user={user} onOpenMenu={() => setDrawer(true)} />
        {/* Values crossfade while a new range loads (§8: data animations don't replay). */}
        <main
          aria-busy={pending}
          className={`px-8 pb-10 pt-7 transition-opacity duration-200 max-lg:px-6 max-sm:px-4 max-sm:pt-5 max-md:pb-[calc(64px+env(safe-area-inset-bottom)+88px)] ${pending ? "opacity-60" : ""}`}
        >
          <div className="mx-auto max-w-content">{children}</div>
        </main>
      </div>

      {/* Mobile: floating Add lead button + bottom tabs */}
      <button
        aria-label="Add lead"
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-brand md:hidden"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
      <BottomTabs onMore={() => setDrawer(true)} />

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${drawer ? "" : "pointer-events-none"}`} aria-hidden={!drawer}>
        <div
          onClick={() => setDrawer(false)}
          className={`absolute inset-0 bg-[rgba(13,11,31,.5)] backdrop-blur-[4px] transition-opacity duration-400 ${drawer ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-modal transition-transform duration-400 ease-out ${drawer ? "translate-x-0" : "-translate-x-full"}`}
        >
          {drawer && (
            <>
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-5 z-10 grid h-11 w-11 place-items-center rounded-lg text-ink-muted">
                <X size={20} />
              </button>
              <Sidebar newLeadCount={newLeadCount} target={target} mode="drawer" onNavigate={() => setDrawer(false)} activeHref={activeHref} />
            </>
          )}
        </div>
      </div>
    </div>
    </RangeContext.Provider>
  );
}
