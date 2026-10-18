"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Plus } from "lucide-react";
import { Button, PageHeader, Search, Tabs } from "@/components/zedu";
import { Dropdown, Menu, MenuItem } from "@/components/zedu/Menu";
import { FilterChip } from "@/components/zedu/Records";
import { createTask, deleteTask, listTasks, toggleTask, updateTask } from "@/app/actions";
import type { TeamMember } from "@/lib/leadTypes";
import {
  initialsOf,
  type DueTone,
  type StatusFilter,
  type TaskItem,
  type TaskOwner,
  type TaskTab,
  type TaskType,
} from "@/data/tasks";
import { FollowUpModal, type FollowUpDraft } from "./FollowUpModal";
import { OwnerFilter } from "./OwnerFilter";
import { TaskDeleteDialog, TaskEditPanel, type TaskDraft } from "./TaskEditPanel";
import { TaskGroupHeader } from "./TaskGroupHeader";
import { TaskRowItem } from "./TaskRowItem";
import { TasksEmptyState } from "./TasksEmptyState";
import { TasksToast } from "./TasksToast";

const TABS: { value: TaskTab; label: string }[] = [
  { value: "all", label: "All open" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const DUE_OPTIONS: { value: DueTone | "all"; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "upcoming", label: "Upcoming" },
];

const TYPE_OPTIONS: { value: TaskType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "Call", label: "Call" },
  { value: "Email", label: "Email" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Meeting", label: "Meeting" },
  { value: "Other", label: "Other" },
];

const STATUS_OPTIONS: StatusFilter[] = ["Pending", "Completed", "All"];
const UNASSIGNED_KEY = "unassigned";

/**
 * Tasks page content (Figma "ZEDU · Tasks screens", 7:4065). Renders inside the
 * app shell — sidebar/topbar come from the shell. Rows come from the database;
 * every mutation goes through server actions and re-reads. Filter state lives
 * in the URL so it survives reloads and can be shared.
 */
export function TasksBoard({
  initial,
  userId,
  userName,
  leads,
  team,
}: {
  initial: TaskItem[];
  userId: string;
  userName: string;
  leads: { id: string; name: string }[];
  team: TeamMember[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [tasks, setTasks] = useState<TaskItem[]>(initial);
  // Tasks created elsewhere (the top-bar New → New task) arrive as fresh server props.
  useEffect(() => setTasks(initial), [initial]);

  const ownerFromParam = useCallback(
    (raw: string | null): TaskOwner | null => {
      if (raw === null) return { key: userId, name: userName, initials: initialsOf(userName) };
      if (raw === "") return null;
      if (raw === UNASSIGNED_KEY) return { key: UNASSIGNED_KEY, name: "Unassigned", initials: "–" };
      const hit = team.find((m) => m.id === raw);
      if (!hit) return { key: userId, name: userName, initials: initialsOf(userName) };
      return { key: hit.id, name: hit.name, initials: hit.initials };
    },
    [team, userId, userName],
  );

  const validTab = (v: string | null): TaskTab =>
    (TABS as { value: TaskTab; label: string }[]).some((t) => t.value === v) ? (v as TaskTab) : "all";

  const [tab, setTabState] = useState<TaskTab>(() => validTab(params.get("tab")));
  const [query, setQueryState] = useState(() => params.get("q") ?? "");
  const [owner, setOwnerState] = useState<TaskOwner | null>(() => ownerFromParam(params.get("owner")));
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>(() =>
    (STATUS_OPTIONS as string[]).includes(params.get("status") ?? "")
      ? (params.get("status") as StatusFilter)
      : "Pending",
  );
  const [dueFilter, setDueFilterState] = useState<DueTone | "all">(() =>
    (["overdue", "today", "upcoming"] as DueTone[]).includes(params.get("due") as DueTone)
      ? (params.get("due") as DueTone)
      : "all",
  );
  const [typeFilter, setTypeFilterState] = useState<TaskType | "all">(() =>
    (["Call", "Email", "Follow-up", "Meeting", "Other"] as string[]).includes(params.get("type") ?? "")
      ? (params.get("type") as TaskType)
      : "all",
  );
  const [sortDesc, setSortDescState] = useState(() => params.get("sort") === "desc");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  /** Completed tasks stay visible in place until the next refresh, with Undo. */
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [followUp, setFollowUp] = useState<{ leadId: string | null; leadName: string; callId: string | null; callWhen: string | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskItem | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; undo?: () => void } | null>(null);

  const refresh = () => setRecent(new Set());

  const syncUrl = useCallback(
    (patch: { tab?: TaskTab; q?: string; owner?: string | null; status?: StatusFilter; due?: string; type?: string; sort?: string }) => {
      const sp = new URLSearchParams();
      const get = (k: string) => (k in patch ? patch[k as keyof typeof patch] : params.get(k));
      const tab = String(get("tab") ?? "all");
      const q = String(get("q") ?? "");
      const owner = get("owner");
      const status = String(get("status") ?? "Pending");
      const due = String(get("due") ?? "all");
      const type = String(get("type") ?? "all");
      const sort = String(get("sort") ?? "asc");
      if (tab !== "all") sp.set("tab", tab);
      if (q) sp.set("q", q);
      if (owner !== null && owner !== undefined) sp.set("owner", String(owner));
      else if (owner === null && params.has("owner")) sp.set("owner", "");
      if (status !== "Pending") sp.set("status", status);
      if (due !== "all") sp.set("due", due);
      if (type !== "all") sp.set("type", type);
      if (sort !== "asc") sp.set("sort", sort);
      const qs = sp.toString();
      router.replace(qs ? `/tasks?${qs}` : "/tasks", { scroll: false });
    },
    [params, router],
  );

  const setTab = (v: TaskTab) => { setTabState(v); syncUrl({ tab: v }); };
  /** Clears every filter chip and the search in one URL update (owner = everyone, status = any). */
  const clearAll = () => {
    setQueryState("");
    setOwnerState(null);
    setStatusFilterState("All");
    setDueFilterState("all");
    setTypeFilterState("all");
    syncUrl({ q: "", owner: "", status: "All", due: "all", type: "all" });
    refresh();
  };
  const setQuery = (v: string) => { setQueryState(v); syncUrl({ q: v }); };
  const setOwner = (o: TaskOwner | null) => {
    setOwnerState(o);
    syncUrl({ owner: o ? (o.key === userId ? null : o.key === UNASSIGNED_KEY ? UNASSIGNED_KEY : o.key) : "" });
  };
  const setStatusFilter = (v: StatusFilter) => { setStatusFilterState(v); syncUrl({ status: v }); };
  const setDueFilter = (v: DueTone | "all") => { setDueFilterState(v); syncUrl({ due: v }); };
  const setTypeFilter = (v: TaskType | "all") => { setTypeFilterState(v); syncUrl({ type: v }); };
  const setSortDesc = (v: boolean | ((d: boolean) => boolean)) => {
    setSortDescState((prev) => {
      const next = typeof v === "function" ? (v as (d: boolean) => boolean)(prev) : v;
      syncUrl({ sort: next ? "desc" : "asc" });
      return next;
    });
  };
  const toggleGroup = (key: string) => {
    setCollapsed((c) => {
      const n = new Set(c);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const ownerOptions = useMemo<TaskOwner[]>(() => {
    const me = team.find((m) => m.id === userId);
    const rest = team
      .filter((m) => m.id !== userId)
      .map((m) => ({ key: m.id, name: m.name, initials: m.initials }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { key: userId, name: me?.name ?? userName, initials: me?.initials ?? initialsOf(userName) },
      ...rest,
      { key: UNASSIGNED_KEY, name: "Unassigned", initials: "–" },
    ];
  }, [team, userId, userName]);

  function matchOwner(t: TaskItem): boolean {
    if (!owner) return true;
    if (owner.key === UNASSIGNED_KEY) return t.ownerId === null;
    return t.ownerId === owner.key;
  }

  function matchStatus(t: TaskItem, forTab: TaskTab): boolean {
    if (t.status === "Completed" && recent.has(t.id)) return true;
    // The Completed tab always shows completed tasks regardless of the chip.
    if (forTab === "completed") return t.status === "Completed";
    if (statusFilter === "All") return true;
    return t.status === statusFilter;
  }

  function matchTab(t: TaskItem, forTab: TaskTab): boolean {
    if (forTab === "overdue" && t.dueTone !== "overdue") return false;
    if (forTab === "today" && t.dueTone !== "today" && t.dueTone !== "done") return false;
    if (forTab === "upcoming" && t.dueTone !== "upcoming") return false;
    if (forTab === "completed" && t.status !== "Completed") return false;
    return true;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (!matchTab(t, tab)) return false;
      if (!matchOwner(t)) return false;
      if (!matchStatus(t, tab)) return false;
      if (dueFilter !== "all" && t.dueTone !== dueFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (q && ![t.title, t.recordName, t.owner.name].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, tab, query, owner, statusFilter, dueFilter, typeFilter, recent, userId]);

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TaskTab, number>;
    for (const { value } of TABS) {
      counts[value] = tasks.filter(
        (t) =>
          matchTab(t, value) &&
          matchOwner(t) &&
          matchStatus(t, value) &&
          (dueFilter === "all" || t.dueTone === dueFilter) &&
          (typeFilter === "all" || t.type === typeFilter) &&
          (!query.trim() ||
            [t.title, t.recordName, t.owner.name].some((s) => s.toLowerCase().includes(query.trim().toLowerCase()))),
      ).length;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, query, owner, statusFilter, dueFilter, typeFilter, recent, userId]);

  const visible = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => (sortDesc ? b.dueAt.localeCompare(a.dueAt) : a.dueAt.localeCompare(b.dueAt)));
    return list;
  }, [filtered, sortDesc]);

  const groups = useMemo(() => {
    const defs: { key: DueTone | "completed"; label: string; tone: "overdue" | "today" | "upcoming" | "completed" }[] =
      tab === "completed"
        ? [{ key: "completed", label: "Completed", tone: "completed" }]
        : [
            { key: "overdue", label: "Overdue", tone: "overdue" },
            { key: "today", label: "Due today", tone: "today" },
            { key: "upcoming", label: "Upcoming", tone: "upcoming" },
            ...(statusFilter === "Completed" || statusFilter === "All"
              ? [{ key: "completed" as const, label: "Completed", tone: "completed" as const }]
              : []),
          ];
    return defs
      .map((g) => ({
        ...g,
        rows:
          g.key === "completed"
            ? visible.filter((t) => t.status === "Completed")
            : visible.filter((t) => t.dueTone === g.key && (t.status !== "Completed" || recent.has(t.id))),
      }))
      .filter((g) => g.rows.length > 0);
  }, [visible, tab, recent, statusFilter]);

  // The Completed tab only lists completed tasks, so the status chip doesn't apply there.
  const statusApplies = tab !== "completed";
  const anyFilter = !!owner || (statusApplies && statusFilter !== "All") || dueFilter !== "all" || typeFilter !== "all" || query.trim() !== "";

  const isDefaultFilters =
    owner?.key === userId && statusFilter === "Pending" && dueFilter === "all" && typeFilter === "all" && query.trim() === "";
  const isMeEmpty = isDefaultFilters && groups.length === 0;

  function showToast(message: string, undo?: () => void) {
    setToast({ id: Date.now(), message, undo });
  }

  async function reload() {
    setTasks(await listTasks());
    router.refresh();
  }

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string } | void>, done: () => void) {
    try {
      const res = await fn();
      if (res && !res.ok) {
        showToast(res.error ? `${label} failed — ${res.error}` : `${label} failed — try again`);
        return;
      }
      await reload();
      done();
    } catch {
      showToast(`${label} failed — try again`);
    }
  }

  function toggleTaskRow(task: TaskItem) {
    const done = task.status !== "Completed";
    run(done ? "Complete" : "Reopen", () => toggleTask(task.id, done), () => {
      setRecent((r) => {
        const n = new Set(r);
        if (done) n.add(task.id);
        else n.delete(task.id);
        return n;
      });
      if (done) {
        showToast(`"${task.title}" completed`, () => {
          run("Undo", () => toggleTask(task.id, false), () => {
            setRecent((r) => {
              const n = new Set(r);
              n.delete(task.id);
              return n;
            });
          });
        });
      }
    });
  }

  function boardLeadId(leadName: string): string | null {
    const hit = leads.find((l) => l.name.toLowerCase() === leadName.trim().toLowerCase());
    return hit ? hit.id : null;
  }

  function baseInput(draft: TaskDraft, leadId: string | null) {
    return {
      title: draft.title,
      description: draft.description,
      type: draft.type,
      ownerId: draft.ownerId,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      leadId,
    };
  }

  function savePanel(draft: TaskDraft, id: string) {
    run(
      "Save",
      () => updateTask(id, { ...baseInput(draft, boardLeadId(draft.leadName)), done: draft.status === "Completed" }),
      () => {
        setPanelTaskId(null);
        showToast("Task saved");
      },
    );
  }

  function createFromPanel(draft: TaskDraft) {
    run("Create", () => createTask(baseInput(draft, boardLeadId(draft.leadName))), () => {
      setCreating(false);
      showToast("Task created");
    });
  }

  function createFromFollowUp(draft: FollowUpDraft) {
    if (!followUp) return;
    const { leadId, callId } = followUp;
    run("Create", () => createTask({ ...draft, leadId, callId }), () => {
      setFollowUp(null);
      showToast("Follow-up task created");
    });
  }

  function confirmDelete(task: TaskItem) {
    run("Delete", () => deleteTask(task.id), () => {
      setPendingDelete(null);
      if (panelTaskId === task.id) setPanelTaskId(null);
      showToast("Task deleted");
    });
  }

  const panelTask = panelTaskId ? tasks.find((t) => t.id === panelTaskId) ?? null : null;
  const ownerLabel = !owner ? "Owner" : owner.key === userId ? "Owner: Me" : owner.key === UNASSIGNED_KEY ? "Owner: Unassigned" : `Owner: ${owner.name}`;

  return (
    <div className="zedu min-w-0">
      <PageHeader
        title="Tasks"
        description="Follow-ups and activities for you and your team, by due date."
        actions={
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={() => setCreating(true)}>
            New task
          </Button>
        }
        tabs={
          <Tabs<TaskTab>
            label="Tasks"
            value={tab}
            onChange={(v) => {
              setTab(v);
              refresh();
            }}
            options={TABS.map((t) => ({ value: t.value, label: t.label, count: tabCounts[t.value] }))}
          />
        }
      />

      <div className="flex flex-col gap-3 px-6 pb-6 pt-4 max-sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Search
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-60 shrink-0 max-md:w-full"
          />
          <OwnerFilter
            options={ownerOptions}
            meId={userId}
            value={owner}
            onChange={(o) => {
              setOwner(o);
              refresh();
            }}
            trigger={({ onClick }) =>
              owner ? (
                <FilterChip label={ownerLabel} active onClick={onClick} onClear={() => { setOwner(null); refresh(); }} />
              ) : (
                <FilterChip label="Owner" onClick={onClick} />
              )
            }
          />
          {statusApplies && (
            <Dropdown
              align="start"
              trigger={(props) => (
                <FilterChip
                  label={statusFilter === "All" ? "Status" : `Status: ${statusFilter}`}
                  active={statusFilter !== "All"}
                  onClick={props.onClick}
                  onClear={() => {
                    setStatusFilter("All");
                    refresh();
                  }}
                />
              )}
            >
              <Menu label="Filter by status">
                {(["Pending", "Completed", "All"] as StatusFilter[]).map((s) => (
                  <MenuItem
                    key={s}
                    onSelect={() => {
                      setStatusFilter(s);
                      refresh();
                    }}
                  >
                    {s === "All" ? "All statuses" : s}
                  </MenuItem>
                ))}
              </Menu>
            </Dropdown>
          )}
          <Dropdown
            align="start"
            trigger={(props) => (
              <FilterChip
                label={dueFilter === "all" ? "Due date" : (DUE_OPTIONS.find((d) => d.value === dueFilter)?.label ?? "Due date")}
                active={dueFilter !== "all"}
                onClick={props.onClick}
                onClear={() => setDueFilter("all")}
              />
            )}
          >
            <Menu label="Filter by due date">
              {DUE_OPTIONS.map((d) => (
                <MenuItem key={d.value} onSelect={() => { setDueFilter(d.value); refresh(); }}>
                  {d.label}
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
          <Dropdown
            align="start"
            trigger={(props) => (
              <FilterChip
                label={typeFilter === "all" ? "Type" : typeFilter}
                active={typeFilter !== "all"}
                onClick={props.onClick}
                onClear={() => setTypeFilter("all")}
              />
            )}
          >
            <Menu label="Filter by type">
              {TYPE_OPTIONS.map((t) => (
                <MenuItem key={t.value} onSelect={() => { setTypeFilter(t.value); refresh(); }}>
                  {t.label}
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
          {anyFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="z-focus shrink-0 rounded-z-md px-3 py-1.5 text-z-small font-medium text-z-fg-secondary hover:text-z-fg"
            >
              Clear all
            </button>
          )}
          <span className="min-w-2 flex-1 max-md:hidden" />
          <button
            type="button"
            onClick={() => setSortDesc((d) => !d)}
            title={sortDesc ? "Sorted: due date, newest first" : "Sorted: due date, oldest first"}
            className="z-focus flex shrink-0 items-center gap-1.5 rounded-z-md px-3 py-1.5 text-z-small font-medium text-z-fg-secondary hover:text-z-fg [&_svg]:size-4"
          >
            <ArrowUpDown aria-hidden />
            Sort: Due date
          </button>
        </div>

        <div className="overflow-hidden rounded-z-xl border border-z-line bg-z-surface shadow-z-sm">
          {groups.length === 0 ? (
            <TasksEmptyState
              title={
                query.trim() || !isDefaultFilters
                  ? "No tasks match"
                  : isMeEmpty
                    ? "No tasks assigned to you yet"
                    : tab === "today"
                      ? "You're all caught up"
                      : "No tasks here"
              }
              description={
                query.trim() || !isDefaultFilters
                  ? "Try a different search or clear the filters."
                  : isMeEmpty
                    ? "Tasks assigned to you will appear here, grouped by due date."
                    : "No tasks are due today. New follow-ups from your calls will appear here."
              }
              secondary={
                isMeEmpty
                  ? { label: "Show team tasks", onClick: () => { setOwner(null); refresh(); } }
                  : undefined
              }
              onNewTask={() => setCreating(true)}
            />
          ) : (
            groups.map((g) => (
              <div key={g.key}>
                <TaskGroupHeader
                  label={g.label}
                  tone={g.tone}
                  count={g.rows.length}
                  collapsed={collapsed.has(g.key)}
                  onToggle={() => toggleGroup(g.key)}
                />
                {!collapsed.has(g.key) &&
                  g.rows.map((t) => (
                    <TaskRowItem
                      key={t.id}
                      task={t}
                      onToggle={() => toggleTaskRow(t)}
                      onOpen={() => setPanelTaskId(t.id)}
                      onFollowUp={() =>
                        setFollowUp({ leadId: t.leadId ?? null, leadName: t.recordName, callId: t.callId ?? null, callWhen: t.fromCall ? t.fromCall.replace(/^From call · /, "") : null })
                      }
                      onDelete={() => setPendingDelete(t)}
                    />
                  ))}
              </div>
            ))
          )}
        </div>

        <p className="text-z-caption font-normal text-z-fg-muted max-md:hidden">
          Click a row to edit · tick the box to complete with Undo
        </p>
      </div>

      {panelTask && (
        <TaskEditPanel
          task={panelTask}
          mode="edit"
          leads={leads}
          team={team.map((m) => ({ id: m.id, name: m.name }))}
          onClose={() => setPanelTaskId(null)}
          onSave={(draft) => savePanel(draft, panelTask.id)}
          onDelete={() => setPendingDelete(panelTask)}
          onComplete={() => {
            toggleTaskRow(panelTask);
            setPanelTaskId(null);
          }}
        />
      )}

      {creating && (
        <TaskEditPanel
          task={null}
          mode="create"
          leads={leads}
          team={team.map((m) => ({ id: m.id, name: m.name }))}
          defaultOwnerId={userId}
          onClose={() => setCreating(false)}
          onSave={createFromPanel}
          onDelete={() => setCreating(false)}
          onComplete={() => setCreating(false)}
        />
      )}

      {followUp && (
        <FollowUpModal
          leadName={followUp.leadName}
          callWhen={followUp.callWhen}
          team={team.map((m) => ({ id: m.id, name: m.name }))}
          defaultOwnerId={userId}
          onClose={() => setFollowUp(null)}
          onCreate={createFromFollowUp}
        />
      )}

      {pendingDelete && (
        <TaskDeleteDialog
          title={pendingDelete.title}
          onClose={() => setPendingDelete(null)}
          onDelete={() => confirmDelete(pendingDelete)}
        />
      )}

      {toast && (
        <TasksToast
          key={toast.id}
          message={toast.message}
          onAction={toast.undo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
