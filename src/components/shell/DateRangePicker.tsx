"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { RANGE_PRESETS } from "@/lib/range";
import { useDismiss } from "@/components/ui/useDismiss";
import { useRange } from "./RangeContext";

// Date range trigger chip + presets popover (§7.3).
export function DateRangePicker({ align = "right" }: { align?: "left" | "right" }) {
  const { key: value, period, change: onChange } = useRange();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-small font-semibold text-ink transition duration-fast hover:bg-surface-sunken"
      >
        <Calendar size={16} className="text-ink-muted" />
        {period}
        <ChevronDown size={16} className="text-ink-muted" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Date range"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-40 mt-2 w-52 rounded-[14px] border border-line bg-surface p-1.5 shadow-raised`}
        >
          {RANGE_PRESETS.map((p) => {
            const selected = p.key === value;
            return (
              <li key={p.key}>
                <button
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setOpen(false);
                    if (!selected) onChange(p.key);
                  }}
                  className={`flex h-9 w-full items-center justify-between rounded-[8px] px-3 text-left text-small font-semibold ${
                    selected ? "bg-brand-soft text-ink" : "text-ink hover:bg-surface-sunken"
                  }`}
                >
                  {p.label}
                  {selected && <Check size={16} className="text-brand-bright" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
