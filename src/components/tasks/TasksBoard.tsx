"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Plus } from "lucide-react";
import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  PageHeader,
  Search,
  Tabs,
} from "@/components/zedu";
import {
  INITIAL_TASKS,
  ME,
  TASK_TAB_COUNTS,
  type DueTone,
  type TaskItem,
  type TaskOwner,
  type TaskTab,
  type TaskType,
} from "@/data/tasks";
import { DueLabel } from "./DueLabel";
import { FollowUpModal } from "./FollowUpModal";
import { OwnerFilter } from "./OwnerFilter";
import { TaskEditPanel } from "./TaskEditPanel";
import { TaskFilterChip } from "./TaskFilterChip";
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

/**
 * Tasks page content (Figma "ZEDU · Tasks screens", 7:4065). Renders inside the
 * app shell — sidebar/topbar come from the shell. UI-only: mock data, in-memory.
 */
export function TasksBoard({ callTasks = [], callTasksUnavailable = false }: { callTasks?: TaskItem[]; callTasksUnavailable?: boolean }) {
  const [tasks, setTasks] = useState<TaskItem[]>(() => [...callTasks, ...INITIAL_TASKS]);
  const [tab, setTab] = useState<TaskTab>("all");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<TaskOwner | null>(ME);
  const [statusPendingOnly, setStatusPendingOnly] = useState(true);
  const [dueFilter, setDueFilter] = useState<DueTone | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [sortDesc, setSortDesc] = useState(false);
  /** Completed tasks stay visible in place until the next refresh, with Undo. */
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [followUp, setFollowUp] = useState<{ leadName: string; callWhen: string } | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; undo?: () => void } | null>(null);

  const refresh = () => setRecent(new Set());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tasks.filter((t) => {
      if (statusPendingOnly && t.status === "Completed" && !recent.has(t.id)) return false;
      if (tab === "overdue" && t.dueTone !== "overdue") return false;
      if (tab === "today" && t.dueTone !== "today" && t.dueTone !== "done") return false;
      if (tab === "upcoming" && t.dueTone !== "upcoming") return false;
      if (tab === "completed" && t.status !== "Completed") return false;
      if (owner && t.owner.key !== owner.key) return false;
      if (dueFilter !== "all" && t.dueTone !== dueFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (q && ![t.title, t.recordName, t.owner.name].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
    list = [...list].sort((a, b) =>
      sortDesc ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id),
    );
    return list;
  }, [tasks, tab, query, owner, statusPendingOnly, dueFilter, typeFilter, recent, sortDesc]);

  const groups = useMemo(() => {
    const defs: { key: DueTone | "completed"; label: string; tone: "overdue" | "today" | "upcoming" | "completed" }[] =
      tab === "completed"
        ? [{ key: "completed", label: "Completed", tone: "completed" }]
        : [
            { key: "overdue", label: "Overdue", tone: "overdue" },
            { key: "today", label: "Due today", tone: "today" },
            { key: "upcoming", label: "Upcoming", tone: "upcoming" },
          ];
    return defs
      .map((g) => ({
        ...g,
        rows:
          g.key === "completed"
            ? visible.filter((t) => t.status === "Completed")
            : visible.filter((t) => t.dueTone === g.key && t.status !== "Completed"),
      }))
      .filter((g) => g.rows.length > 0);
  }, [visible, tab]);

  const isDefaultFilters =
    owner?.key === "me" && statusPendingOnly && dueFilter === "all" && typeFilter === "all" && query.trim() === "";

  function showToast(message: string, undo?: () => void) {
    setToast({ id: Date.now(), message, undo });
  }

  async function toggleTask(task: TaskItem) {
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    if (task.persisted) {
      try {
        const response = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: nextStatus === "Completed" }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Could not update the follow-up task.");
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not update the follow-up task.");
        return;
      }
    }
    if (task.status === "Completed") {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: "Pending" as const } : t)));
      setRecent((r) => {
        const n = new Set(r);
        n.delete(task.id);
        return n;
      });
      return;
    }
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: "Completed" as const } : t)));
    setRecent((r) => new Set(r).add(task.id));
    showToast(`"${task.title}" completed`, () => {
      void toggleTask({ ...task, status: "Completed" });
    });
  }

  function deleteTask(task: TaskItem) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    if (panelTaskId === task.id) setPanelTaskId(null);
    showToast("Task deleted");
  }

  const panelTask = panelTaskId ? tasks.find((t) => t.id === panelTaskId) ?? null : null;

  return (
    <div className="zedu">
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
            options={TABS.map((t) => ({
              value: t.value,
              label: t.label,
              count: TASK_TAB_COUNTS[t.value] ?? undefined,
            }))}
          />
        }
      />

      {callTasksUnavailable && <div role="alert" className="mx-6 mt-4 rounded-z-md border border-z-line bg-z-subtle px-4 py-3 text-z-small text-z-fg-danger max-sm:mx-4">Call follow-up tasks couldn’t be loaded. Refresh this page to try again.</div>}

      <div className="flex flex-col gap-3 px-6 pb-6 pt-4 max-sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Search
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-60 shrink-0"
          />
          <OwnerFilter
            value={owner}
            onChange={(o) => {
              setOwner(o);
              refresh();
            }}
            trigger={({ onClick }) =>
              owner ? (
                <TaskFilterChip
                  label={`Owner: ${owner.key === "me" ? "Me" : owner.name}`}
                  active
                  onClick={onClick}
                  onClear={() => {
                    setOwner(null);
                    refresh();
                  }}
                />
              ) : (
                <TaskFilterChip label="Owner" onClick={onClick} />
              )
            }
          />
          {statusPendingOnly ? (
            <TaskFilterChip label="Status: Pending" active onClick={() => setStatusPendingOnly(false)} onClear={() => setStatusPendingOnly(false)} />
          ) : (
            <TaskFilterChip label="Status" onClick={() => { setStatusPendingOnly(true); refresh(); }} />
          )}
          <Dropdown
            align="start"
            trigger={(props) => (
              <TaskFilterChip
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
              <TaskFilterChip
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
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOwner(ME);
              setStatusPendingOnly(true);
              setDueFilter("all");
              setTypeFilter("all");
              refresh();
            }}
            className="z-focus shrink-0 rounded-z-md px-3 py-1.5 text-z-small font-medium text-z-fg-secondary hover:text-z-fg"
          >
            Clear all
          </button>
          <span className="min-w-2 flex-1" />
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
              title={query.trim() || !isDefaultFilters ? "No tasks match" : tab === "today" ? "You're all caught up" : "No tasks here"}
              description={
                query.trim() || !isDefaultFilters
                  ? "Try a different search or clear the filters."
                  : "No tasks are due today. New follow-ups from your calls will appear here."
              }
              onNewTask={() => setCreating(true)}
            />
          ) : (
            groups.map((g) => (
              <div key={g.key}>
                <TaskGroupHeader label={g.label} tone={g.tone} count={g.rows.length} />
                {g.rows.map((t) => (
                  <TaskRowItem
                    key={t.id}
                    task={t}
                    onToggle={() => void toggleTask(t)}
                    onOpen={() => setPanelTaskId(t.id)}
                    readOnly={t.persisted}
                    onFollowUp={() =>
                      setFollowUp({ leadName: t.recordName, callWhen: "Oct 14, 10:12 AM" })
                    }
                    onDelete={() => deleteTask(t)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <p className="flex items-center gap-1.5 text-z-caption font-normal text-z-fg-muted max-md:hidden">
          <DueLabel tone="overdue" text="Overdue" className="[&_svg]:hidden" />
          <span aria-hidden>·</span> Click a row to edit · tick the box to complete with Undo
        </p>
      </div>

      {panelTask && (
        <TaskEditPanel
          task={panelTask}
          mode="edit"
          onClose={() => setPanelTaskId(null)}
          onSave={(patch) => {
            setTasks((ts) => ts.map((t) => (t.id === panelTask.id ? { ...t, ...patch } : t)));
            setPanelTaskId(null);
            showToast("Task saved");
          }}
          onDelete={() => deleteTask(panelTask)}
          onComplete={() => {
            void toggleTask(panelTask);
            setPanelTaskId(null);
          }}
        />
      )}

      {creating && (
        <TaskEditPanel
          task={{
            id: "draft",
            title: "",
            description: "",
            type: "Follow-up",
            recordName: "Select a record",
            recordKind: "Lead",
            dueText: "Fri, Oct 16",
            dueTone: "upcoming",
            owner: ME,
            status: "Pending",
            createdBy: "",
          }}
          mode="create"
          onClose={() => setCreating(false)}
          onSave={(patch) => {
            setTasks((ts) => [
              {
                id: `t-${Date.now()}`,
                title: patch.title || "Untitled task",
                description: patch.description,
                type: patch.type,
                recordName: "Amaka Obi",
                recordKind: "Lead",
                dueText: "Fri, Oct 16",
                dueTone: "upcoming",
                owner: ME,
                status: "Pending",
                createdBy: "Created by Agnes Okafor just now",
              },
              ...ts,
            ]);
            setCreating(false);
            showToast("Task created");
          }}
          onDelete={() => setCreating(false)}
          onComplete={() => setCreating(false)}
        />
      )}

      {followUp && (
        <FollowUpModal
          leadName={followUp.leadName}
          callWhen={followUp.callWhen}
          onClose={() => setFollowUp(null)}
          onCreate={(draft) => {
            setTasks((ts) => [
              {
                id: `t-${Date.now()}`,
                title: draft.title || "Untitled follow-up",
                description: draft.description,
                type: draft.type,
                recordName: followUp.leadName,
                recordKind: "Lead",
                fromCall: "From call · Oct 14",
                dueText: "Fri, Oct 16",
                dueTone: "upcoming",
                owner: ME,
                status: "Pending",
                linkedCall: { person: followUp.leadName, when: followUp.callWhen, outcome: "Connected", duration: "4 min" },
                createdBy: "Created by Agnes Okafor just now",
              },
              ...ts,
            ]);
            setFollowUp(null);
            showToast("Follow-up task created");
          }}
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
