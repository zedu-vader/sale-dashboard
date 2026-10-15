"use client";

// Leads list (Figma 16842:21692): tabs, search, filter chips, sort, table, bulk actions, Add lead.
// Filter by status: 16843:22008 · Bulk assign: 16843:22319 · Add lead: 16845:23151.

import { ArrowUpDown, Ellipsis, Plus, Trash, UserRound, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { LeadStatus } from "@prisma/client";
import { assignLeads, deleteLeads, setLeadStatus } from "@/app/leads/actions";
import { PAGE_SIZE, SORTS, type LeadListData, type LeadListParams, type LeadSort, type TeamMember } from "@/lib/leadTypes";
import { LEAD_TYPES, STAGES, STATUS_ORDER } from "@/lib/status";
import {
  Avatar,
  BulkActionBar,
  BulkActionButton,
  Button,
  Checkbox,
  Dropdown,
  IconButton,
  Menu,
  MenuDivider,
  MenuItem,
  MenuLabel,
  Modal,
  PageHeader,
  Search,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  cx,
} from "@/components/zedu";
import { AddLeadModal } from "./AddLeadModal";
import { FilterPopover } from "./FilterPopover";
import { useLeadParams } from "./useLeadParams";

type Props = { params: LeadListParams; data: LeadListData; team: TeamMember[] };

export function LeadsView({ params, data, team }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const { set, pending } = useLeadParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, startTransition] = useTransition();
  const [q, setQ] = useState(params.q);
  const addOpen = search.get("new") === "1";

  // Selection only applies to the rows on screen.
  useEffect(() => setSelected(new Set()), [data]);

  // Debounced search.
  useEffect(() => {
    if (q === params.q) return;
    const t = setTimeout(() => set({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
  }, [q, params.q, set]);

  const ids = data.rows.map((r) => r.id);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));
  const selection = [...selected];
  const me = team.find((m) => m.me);

  const filtersActive = params.statuses.length + params.types.length + params.owners.length > 0 || !!params.q;
  const statusOptions = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({
        value: s,
        label: STAGES[s].label,
        render: <StatusPill stage={STAGES[s].stage} label={STAGES[s].label} />,
        count: data.statusCounts[s] ?? 0,
      })),
    [data.statusCounts],
  );

  const first = (data.page - 1) * PAGE_SIZE + 1;
  const last = first + data.rows.length - 1;

  return (
    <>
      <PageHeader
        title="Leads"
        count={data.tabCounts.all.toLocaleString("en-US")}
        description="Everyone you're working to convert. Search, filter, assign and open a lead to see its calls, notes and tasks."
        actions={
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={() => set({ new: "1" })}>
            Add lead
          </Button>
        }
        tabs={
          <Tabs
            label="Lead views"
            value={params.tab}
            onChange={(tab) => set({ tab: tab === "all" ? null : tab })}
            options={[
              { value: "all", label: "All", count: data.tabCounts.all },
              { value: "mine", label: "Assigned to me", count: data.tabCounts.mine },
              { value: "unassigned", label: "Unassigned", count: data.tabCounts.unassigned },
            ]}
          />
        }
      />

      <div className={cx("flex flex-col gap-3 px-6 pb-24 pt-4 transition-opacity duration-150 max-sm:px-4", pending && "opacity-60")} aria-busy={pending}>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Search
            size="sm"
            placeholder="Search name, phone or company"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[300px] max-sm:w-full"
          />
          <FilterPopover
            field="Status"
            heading="Lead status"
            options={statusOptions}
            selected={params.statuses}
            onChange={(v) => set({ status: v })}
          />
          <FilterPopover
            field="Lead type"
            heading="Lead type"
            options={(Object.keys(LEAD_TYPES) as (keyof typeof LEAD_TYPES)[]).map((t) => ({ value: t, label: LEAD_TYPES[t].label }))}
            selected={params.types}
            onChange={(v) => set({ type: v })}
          />
          <FilterPopover
            field="Owner"
            heading="Owner"
            options={[
              ...team.map((m) => ({ value: m.id, label: m.me ? `${m.name} (you)` : m.name })),
              { value: "none", label: "Unassigned" },
            ]}
            selected={params.owners}
            onChange={(v) => set({ owner: v })}
          />
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                set({ q: null, status: null, type: null, owner: null });
              }}
            >
              Clear all
            </Button>
          )}
          <div className="flex-1" />
          <Dropdown
            align="end"
            trigger={(p) => (
              <Button variant="ghost" size="sm" icon={<ArrowUpDown aria-hidden />} {...p}>
                Sort: {SORTS[params.sort]}
              </Button>
            )}
          >
            <Menu label="Sort leads" className="w-52">
              {(Object.keys(SORTS) as LeadSort[]).map((s) => (
                <MenuItem key={s} onSelect={() => set({ sort: s === "last" ? null : s })}>
                  <span className={params.sort === s ? "font-medium" : undefined}>{SORTS[s]}</span>
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-z-xl border border-z-line bg-z-surface shadow-z-sm">
          {data.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-6 py-16 text-center">
              <p className="text-z-small font-medium text-z-fg">{filtersActive ? "No leads match these filters" : "No leads yet"}</p>
              <p className="text-z-caption text-z-fg-muted">
                {filtersActive ? "Try a different search or clear the filters." : "Add your first lead to start tracking calls and follow-ups."}
              </p>
            </div>
          ) : (
            <Table className="min-w-[1080px] table-fixed">
              <colgroup>
                <col className="w-11" />
                <col className="w-[200px]" />
                <col className="w-[150px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col />
                <col className="w-[50px]" />
              </colgroup>
              <thead>
                <tr>
                  <TableHead checkbox>
                    <Checkbox
                      label="Select all leads on this page"
                      hideLabel
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(ids))}
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead sort={params.sort === "last" ? "desc" : "none"} onSort={() => set({ sort: null })}>
                    Last interaction
                  </TableHead>
                  <TableHead>Next action</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((l) => (
                  <TableRow
                    key={l.id}
                    selected={selected.has(l.id)}
                    className="cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a, button, input, label, [role=menu]")) return;
                      router.push(`/leads/${l.id}`);
                    }}
                  >
                    <TableCell type="checkbox">
                      <Checkbox label={`Select ${l.name}`} hideLabel checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/leads/${l.id}`} className="z-focus block truncate rounded-z-xs text-z-small font-medium text-z-fg hover:underline">
                        {l.name}
                      </Link>
                      <p className="truncate text-z-caption text-z-fg-muted">
                        {l.code} · {LEAD_TYPES[l.type].label}
                      </p>
                    </TableCell>
                    <TableCell className="truncate">{l.phone}</TableCell>
                    <TableCell className="truncate" title={l.company ?? undefined}>
                      {l.company ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusPill stage={STAGES[l.status].stage} label={STAGES[l.status].label} />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Avatar size={24} initials={l.owner?.initials ?? "–"} />
                        <span className="truncate font-medium text-z-fg">{l.owner?.name ?? "Unassigned"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="truncate">{l.lastInteraction ?? "—"}</TableCell>
                    <TableCell className={cx("truncate", l.nextAction?.overdue && "text-z-fg-danger")}>
                      {l.nextAction?.text ?? "—"}
                    </TableCell>
                    <TableCell type="actions" className="!px-2">
                      <Dropdown
                        align="end"
                        trigger={(p) => (
                          <IconButton label={`Actions for ${l.name}`} {...p}>
                            <Ellipsis aria-hidden />
                          </IconButton>
                        )}
                      >
                        <Menu label={`Actions for ${l.name}`} className="w-48 text-left">
                          <MenuItem onSelect={() => router.push(`/leads/${l.id}`)}>Open lead</MenuItem>
                          {me && l.owner?.id !== me.id && (
                            <MenuItem icon={<UserRoundPlus />} onSelect={() => run(() => assignLeads([l.id], me.id))}>
                              Assign to me
                            </MenuItem>
                          )}
                          <MenuDivider />
                          <MenuItem
                            tone="danger"
                            icon={<Trash />}
                            onSelect={() => {
                              setSelected(new Set([l.id]));
                              setConfirmDelete(true);
                            }}
                          >
                            Delete
                          </MenuItem>
                        </Menu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {data.pageCount > 1 && (
          <div className="flex items-center justify-between gap-3 text-z-caption text-z-fg-muted">
            <span>
              Showing {first}–{last} of {data.total.toLocaleString("en-US")}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => set({ page: String(data.page - 1) })}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={data.page >= data.pageCount} onClick={() => set({ page: String(data.page + 1) })}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {selected.size > 0 && !confirmDelete && (
        <BulkActionBar count={selected.size} onDiscard={() => setSelected(new Set())} className={busy ? "opacity-70" : undefined}>
          <Dropdown
            side="top"
            align="start"
            trigger={(p) => (
              <BulkActionButton icon={<UserRoundPlus aria-hidden />} active={p["aria-expanded"]} {...p}>
                Assign to
              </BulkActionButton>
            )}
          >
            <Menu label="Assign to" className="w-60">
              <MenuLabel>
                Assign {selected.size} {selected.size === 1 ? "lead" : "leads"} to
              </MenuLabel>
              {team.map((m) => (
                <MenuItem key={m.id} icon={<Avatar size={24} initials={m.initials} />} onSelect={() => run(() => assignLeads(selection, m.id))}>
                  {m.me ? `${m.name} (you)` : m.name}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem icon={<UserRound />} onSelect={() => run(() => assignLeads(selection, null))}>
                <span className="text-z-fg-secondary">Remove owner</span>
              </MenuItem>
            </Menu>
          </Dropdown>
          <Dropdown
            side="top"
            align="start"
            trigger={(p) => (
              <BulkActionButton icon={<ArrowUpDown aria-hidden />} active={p["aria-expanded"]} {...p}>
                Change status
              </BulkActionButton>
            )}
          >
            <Menu label="Change status" className="w-56">
              <MenuLabel>Set status</MenuLabel>
              {STATUS_ORDER.map((s: LeadStatus) => (
                <MenuItem key={s} onSelect={() => run(() => setLeadStatus(selection, s))}>
                  <StatusPill stage={STAGES[s].stage} label={STAGES[s].label} />
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
          <BulkActionButton icon={<Trash aria-hidden />} onClick={() => setConfirmDelete(true)}>
            Delete
          </BulkActionButton>
        </BulkActionBar>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        width={440}
        title={`Delete ${selected.size} ${selected.size === 1 ? "lead" : "leads"}?`}
        description="Their calls stay in your reports, but notes, tasks and the timeline are removed. This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await deleteLeads(selection);
                  setConfirmDelete(false);
                })
              }
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-z-small text-z-fg-secondary">
          {data.rows
            .filter((r) => selected.has(r.id))
            .map((r) => `${r.name} (${r.code})`)
            .join(", ")}
        </p>
      </Modal>

      <AddLeadModal open={addOpen} onClose={() => set({ new: null })} team={team} />
    </>
  );
}
