"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Avatar, Dropdown, Menu, MenuDivider, MenuItem, MenuLabel, Search } from "@/components/zedu";
import { cx } from "@/components/zedu/cx";
import type { TaskOwner } from "@/data/tasks";

/** Owner filter popover (Figma 7:4119): search + owner options + "Clear owner filter". */
export function OwnerFilter({
  options,
  meId,
  value,
  onChange,
  trigger,
}: {
  options: TaskOwner[];
  /** Key of the signed-in user's option, labelled "Me · name". */
  meId?: string;
  /** Null = everyone. */
  value: TaskOwner | null;
  onChange: (owner: TaskOwner | null) => void;
  trigger: (props: { onClick: () => void; open: boolean }) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const list = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dropdown
      trigger={(tp) => trigger({ onClick: tp.onClick, open: tp["aria-expanded"] })}
      align="start"
    >
      <Menu label="Filter by owner" className="w-66">
        <div className="p-1">
          <Search
            size="sm"
            placeholder="Search people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <MenuLabel>Owner</MenuLabel>
        {list.map((o) => {
          const selected = value?.key === o.key;
          return (
            <MenuItem
              key={o.key}
              icon={
                o.key === "unassigned" ? (
                  <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-z-sunken text-z-caption text-z-fg-muted">
                    –
                  </span>
                ) : (
                  <Avatar size={24} initials={o.initials} />
                )
              }
              onSelect={() => onChange(o)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  aria-hidden
                  className={cx(
                    "grid size-4 shrink-0 place-items-center rounded-z-xs border transition-colors duration-150 [&_svg]:size-3",
                    selected ? "border-z-accent bg-z-accent text-white" : "border-z-line-strong bg-z-surface",
                  )}
                >
                  {selected && <Check strokeWidth={2.5} />}
                </span>
                <span className="truncate">{o.key === meId ? `Me · ${o.name}` : o.name}</span>
              </span>
            </MenuItem>
          );
        })}
        <MenuDivider />
        <MenuItem onSelect={() => onChange(null)}>Clear owner filter</MenuItem>
      </Menu>
    </Dropdown>
  );
}
