"use client";

// Top-bar search (⌘K, or "/" from anywhere): results from leads, contacts, tasks and teammates as you type.
// ↑/↓ move, Enter opens the highlighted (or first) result, Esc closes.

import { CircleCheck, Contact, SquareCheck, UserRound, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { globalSearch } from "@/app/actions";
import type { SearchGroup, SearchKind, SearchResult } from "@/lib/search";
import { Search, cx } from "@/components/zedu";

const ICONS: Record<SearchKind, LucideIcon> = { lead: UserRound, contact: Contact, task: SquareCheck, person: Users };

export type GlobalSearchHandle = { focus: () => void };

export const GlobalSearch = forwardRef<GlobalSearchHandle, { className?: string; inputClassName?: string; autoFocus?: boolean }>(function GlobalSearch(
  { className, inputClassName = "w-80", autoFocus },
  ref,
) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<SearchGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), []);

  // ⌘K / Ctrl+K anywhere, and "/" when not typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable=true]");
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Debounced search.
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setGroups(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let live = true;
    const t = setTimeout(() => {
      globalSearch(text)
        .then((g) => {
          if (!live) return;
          setGroups(g);
          setActive(0);
        })
        .catch(() => live && setGroups([]))
        .finally(() => live && setLoading(false));
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  const flat: SearchResult[] = groups?.flatMap((g) => g.results) ?? [];

  const go = (r: SearchResult | undefined) => {
    if (!r) return;
    setOpen(false);
    setQ("");
    input.current?.blur();
    router.push(r.href);
  };

  const showPanel = open && q.trim().length >= 2;

  return (
    <div ref={box} className={cx("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(flat[active] ?? flat[0]);
        }}
      >
        <Search
          ref={input}
          name="q"
          variant="outline"
          placeholder="Search leads, contacts, tasks…"
          shortcut="⌘K"
          autoComplete="off"
          className={inputClassName}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={showPanel && flat[active] ? `${listId}-${active}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              input.current?.blur();
            } else if (e.key === "ArrowDown" && flat.length) {
              e.preventDefault();
              setOpen(true);
              setActive((i) => (i + 1) % flat.length);
            } else if (e.key === "ArrowUp" && flat.length) {
              e.preventDefault();
              setActive((i) => (i - 1 + flat.length) % flat.length);
            }
          }}
        />
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 top-[calc(100%+6px)] z-50 flex max-h-[min(480px,70dvh)] w-[min(480px,calc(100vw-32px))] flex-col overflow-y-auto rounded-z-lg border border-z-line bg-z-surface p-1 shadow-z-md"
        >
          {groups === null || (loading && !flat.length) ? (
            <p className="px-3 py-6 text-center text-z-small text-z-fg-muted">Searching…</p>
          ) : flat.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
              <p className="text-z-small font-medium text-z-fg">No matches for &ldquo;{q.trim()}&rdquo;</p>
              <p className="text-z-caption text-z-fg-muted">Try a name, phone number, email, company, LD or CT code, or task title.</p>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.kind} role="group" aria-label={g.label} className="flex flex-col py-1">
                <p className="px-2 pb-1 pt-1.5 z-overline text-z-fg-muted">{g.label}</p>
                {g.results.map((r) => {
                  const i = flat.indexOf(r);
                  const Icon = r.kind === "task" && r.subtitle.startsWith("Completed") ? CircleCheck : ICONS[r.kind];
                  return (
                    <button
                      key={`${r.kind}-${r.id}`}
                      id={`${listId}-${i}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cx(
                        "flex min-h-11 items-center gap-2.5 rounded-z-sm px-2 py-1.5 text-left",
                        i === active ? "bg-z-sunken" : "hover:bg-z-sunken",
                      )}
                    >
                      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-z-sm bg-z-subtle text-z-icon [&_svg]:size-4">
                        <Icon />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-z-small font-medium text-z-fg">{r.title}</span>
                        <span className="truncate text-z-caption text-z-fg-muted">{r.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
