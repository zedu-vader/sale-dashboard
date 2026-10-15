"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis, Phone, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { LeadRow } from "@/lib/dashboard";
import { STAGES } from "@/lib/status";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { button, callButton } from "@/components/ui/button";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "Individual", label: "Individual" },
  { value: "Business", label: "Business" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

type SortKey = "name" | "phone" | "type" | "lastCallAt" | "status" | "owner" | "nextActionAt";
// `wide` columns only show from 2xl. Below that the phone folds under the name so
// "Next action" stays visible without horizontal scrolling.
const COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone", wide: true },
  { key: "type", label: "Type", wide: true },
  { key: "lastCallAt", label: "Last call" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner", wide: true },
  { key: "nextActionAt", label: "Next action" },
];
const wideCell = "hidden 2xl:table-cell";

function sortValue(l: LeadRow, key: SortKey): string | number {
  if (key === "status") return STAGES[l.status].order;
  return l[key] ?? "";
}

const tel = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;

const Dash = () => <span className="text-ink-muted">—</span>;

function TypeLabel({ type }: { type: LeadRow["type"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-ink-muted">
      <i className={`h-[7px] w-[7px] rounded-full ${type === "Business" ? "bg-coral-500" : "bg-indigo-300"}`} />
      {type}
    </span>
  );
}

function NextAction({ lead }: { lead: LeadRow }) {
  if (!lead.nextAction) return <Dash />;
  return (
    <span className="block">
      <b className="block font-semibold">{lead.nextAction}</b>
      <small className="text-caption text-ink-muted">{lead.nextActionLabel}</small>
    </span>
  );
}

// Data table, Zedu Design System §7.5. Collapses to stacked cards below 768px.
export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);

  const rows = useMemo(() => {
    const filtered = leads.filter((l) => filter === "all" || l.type === filter);
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      // Empty values always sort last.
      if (x === "" || y === "") return x === y ? 0 : x === "" ? 1 : -1;
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [leads, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));
  }

  return (
    <section className="card" aria-labelledby="leads-title">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h3 id="leads-title" className="text-h3">Recent leads</h3>
        <div className="flex items-center gap-2">
          <SegmentedTabs label="Filter leads by type" options={FILTERS} value={filter} onChange={setFilter} />
          <a href="#" className={button({ variant: "ghost", size: "sm" })}>View all</a>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={leads.length ? "No leads match this filter" : "No leads yet"}
          body={leads.length ? "Try another type, or view all leads." : "Add your first lead to start calling."}
          action={
            leads.length ? (
              <button onClick={() => setFilter("all")} className={button({ variant: "secondary", size: "sm" })}>Show all</button>
            ) : (
              <button className={button({ size: "sm" })}>Add lead</button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop / tablet table, bleeding to the card edges */}
          <div className="-mx-[22px] -mb-[22px] overflow-x-auto max-lg:-mx-[18px] max-lg:-mb-[18px] max-md:hidden">
            <table className="w-full border-collapse text-small">
              <thead>
                <tr className="bg-surface-sunken">
                  {COLUMNS.map((c) => {
                    const active = sort?.key === c.key;
                    const Arrow = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                        className={`px-3 py-2.5 text-left first:pl-[22px] max-lg:first:pl-[18px] ${c.wide ? wideCell : ""}`}
                      >
                        <button onClick={() => toggleSort(c.key)} className="group inline-flex items-center gap-1 text-overline uppercase text-ink-muted hover:text-ink">
                          {c.label}
                          <Arrow size={12} className={active ? "text-brand-bright" : "opacity-0 group-hover:opacity-100"} />
                        </button>
                      </th>
                    );
                  })}
                  <th scope="col" className="pr-[22px] max-lg:pr-[18px]"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="h-[60px] border-t border-line transition-colors duration-150 hover:bg-[rgba(109,77,255,.05)]">
                    <td className="whitespace-nowrap px-3 pl-[22px] max-lg:pl-[18px]">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={l.name} size={34} />
                        <span>
                          <b className="block text-body font-bold">{l.name}</b>
                          <small className="block font-mono text-caption font-medium text-ink-muted 2xl:hidden">{l.phone}</small>
                        </span>
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-3 font-mono text-ink-muted ${wideCell}`}>{l.phone}</td>
                    <td className={`whitespace-nowrap px-3 ${wideCell}`}><TypeLabel type={l.type} /></td>
                    <td className="whitespace-nowrap px-3">{l.lastCallLabel ?? <Dash />}</td>
                    <td className="whitespace-nowrap px-3">
                      <StatusPill status={l.status} />
                      {l.lostReason && <small className="mt-1 block text-caption text-ink-muted">{l.lostReason}</small>}
                    </td>
                    <td className={`whitespace-nowrap px-3 ${wideCell}`}>{l.owner}</td>
                    <td className="whitespace-nowrap px-3"><NextAction lead={l} /></td>
                    <td className="whitespace-nowrap pl-3 pr-[22px] text-right max-lg:pr-[18px]">
                      <span className="inline-flex items-center gap-1">
                        <a href={tel(l.phone)} className={callButton} aria-label={`Call ${l.name}`}>
                          <Phone size={16} />
                        </a>
                        <button className="inline-grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink" aria-label={`More actions for ${l.name}`}>
                          <Ellipsis size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <ul className="-mx-4 -mb-4 md:hidden">
            {rows.map((l) => (
              <li key={l.id} className="flex items-start gap-3 border-t border-line px-4 py-3 first:border-t-0">
                <Avatar name={l.name} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <b className="truncate text-body font-bold">{l.name}</b>
                    <StatusPill status={l.status} />
                  </div>
                  <p className="mt-1 text-caption text-ink-muted">
                    {l.lastCallLabel ? `Last call ${l.lastCallLabel}` : "Not called yet"}
                    {l.nextAction && <> · {l.nextAction}, {l.nextActionLabel}</>}
                    {l.lostReason && <> · {l.lostReason}</>}
                  </p>
                </div>
                <a href={tel(l.phone)} className={`${callButton} h-11 w-11 rounded-lg`} aria-label={`Call ${l.name}`}>
                  <Phone size={18} />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
