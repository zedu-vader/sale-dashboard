"use client";

// Status / Lead type / Owner filter: a ZEDU/Filter chip that opens a checkbox list (Figma 16843:22257).

import type { ReactNode } from "react";
import { Button, Checkbox, Dropdown, FilterChip, MenuDivider, MenuLabel } from "@/components/zedu";

export type FilterOption = { value: string; label: string; render?: ReactNode; count?: number };

type Props = {
  /** "Status", "Lead type", "Owner". */
  field: string;
  /** Heading inside the popover, e.g. "Lead status". */
  heading: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
};

export function FilterPopover({ field, heading, options, selected, onChange }: Props) {
  const labels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const active = labels.length > 0;
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <Dropdown
      trigger={(p) => (
        <FilterChip
          label={active ? `${field}: ${labels.length > 2 ? `${labels.length} selected` : labels.join(", ")}` : field}
          active={active}
          onClear={() => onChange([])}
          {...p}
        />
      )}
    >
      <div
        role="menu"
        aria-label={heading}
        className="flex w-62 flex-col rounded-z-lg border border-z-line bg-z-surface p-1 shadow-z-md"
      >
        <MenuLabel>{heading}</MenuLabel>
        <div className="max-h-80 overflow-y-auto">
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <div
                key={o.value}
                role="menuitemcheckbox"
                aria-checked={on}
                tabIndex={-1}
                className="flex h-[34px] items-center gap-2.5 rounded-z-sm px-2 hover:bg-z-sunken"
              >
                <Checkbox label={o.label} hideLabel checked={on} onChange={() => toggle(o.value)} />
                <button type="button" tabIndex={-1} onClick={() => toggle(o.value)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <span className="min-w-0 flex-1 truncate text-z-small text-z-fg">{o.render ?? o.label}</span>
                  {o.count !== undefined && <span className="text-z-caption text-z-fg-muted">{o.count}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <MenuDivider />
        <div>
          <Button variant="ghost" size="sm" role="menuitem" disabled={!active} onClick={() => onChange([])}>
            Clear {field.toLowerCase()}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
}
