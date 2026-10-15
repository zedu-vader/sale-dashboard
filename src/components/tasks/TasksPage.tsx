"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Phone, CalendarPlus } from "lucide-react";
import { OWNERS, TASK_TYPES, countTasks, describeTask, type NewTask, type Task, type TaskBucket } from "./data";
import { addTask, fetchTasks, setTaskDone } from "./api";
import { StatCards } from "./StatCards";
import { TaskFilters, type Filters } from "./TaskFilters";
import { TaskRow, TaskTableHead } from "./TaskRow";
import { Pagination } from "./Pagination";
import { AddTaskDialog } from "./AddTaskDialog";

const PAGE_SIZE = 8;
const TABS: { key: "all" | TaskBucket; label: string }[] = [
  { key: "all", label: "All Tasks" },
  { key: "today", label: "Today" },
  { key: "overdue", label: "Overdue" },
  { key: "upcoming", label: "Upcoming" },
];

const btn =
  "inline-flex h-[42px] flex-none cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-solid px-5 text-sm font-semibold no-underline";
const btnPrimary = `${btn} border-brand bg-brand text-white hover:bg-brand-hover`;
const btnGhost = `${btn} border-line bg-white text-brand hover:bg-canvas`;

/** Self-contained Tasks screen. Renders inside whatever shell wraps it; layout follows its container width. */
export function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"all" | TaskBucket>("all");
  const [filters, setFilters] = useState<Filters>({ query: "", status: "", owner: "", type: "" });
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  // Recomputed whenever tasks change so status/buckets stay current.
  const now = useMemo(() => new Date(), [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const views = useMemo(() => new Map((tasks ?? []).map((t) => [t.id, describeTask(t, now)])), [tasks, now]);
  const counts = useMemo(() => countTasks(tasks ?? [], now), [tasks, now]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return (tasks ?? [])
      .filter((t) => {
        const v = views.get(t.id)!;
        return (
          (tab === "all" || v.bucket === tab) &&
          (!filters.status || v.status === filters.status) &&
          (!filters.owner || t.owner === filters.owner) &&
          (!filters.type || t.type === filters.type) &&
          (!q || `${t.title} ${t.lead} ${t.notes}`.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));
  }, [tasks, views, tab, filters]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const create = useCallback(async (input: NewTask) => {
    const task = await addTask(input);
    setTasks((prev) => [task, ...(prev ?? [])]);
  }, []);

  const toggle = useCallback(async (task: Task) => {
    const done = !task.done;
    const apply = (value: boolean) =>
      setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, done: value } : t)) ?? prev);
    apply(done);
    try {
      await setTaskDone(task.id, done);
    } catch {
      apply(task.done);
    }
  }, []);

  return (
    <div className="@container min-h-full bg-canvas text-sm text-ink [&_button]:font-[inherit]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3.5 px-4 pb-8 pt-[18px] @3xl:gap-[18px] @3xl:px-8 @3xl:pb-10 @3xl:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-[26px] font-extrabold tracking-tight text-ink @3xl:text-3xl">Tasks</h1>
            <p className="m-0 mt-1 leading-snug text-muted">Stay on top of your follow-ups and never miss an important lead.</p>
          </div>
          <button onClick={() => setAdding(true)} className={`${btnPrimary} !h-[38px] !px-3.5 @3xl:!h-[42px] @3xl:!px-5`}>
            <Plus size={16} /> Add Task
          </button>
        </div>

        <div role="tablist" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`inline-flex h-[34px] cursor-pointer items-center whitespace-nowrap rounded-lg border border-solid px-4 py-0 text-sm ${
                tab === t.key
                  ? "border-brand bg-brand font-semibold text-white hover:bg-brand-hover"
                  : "border-line bg-white font-medium text-ink hover:bg-canvas"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <StatCards counts={counts} />

        <section className="rounded-2xl border border-solid border-line bg-white p-3 @3xl:p-4">
          <TaskFilters
            filters={filters}
            owners={Object.keys(OWNERS)}
            types={TASK_TYPES}
            onChange={(patch) => {
              setFilters((f) => ({ ...f, ...patch }));
              setPage(1);
            }}
          />
          <div>
            <TaskTableHead />
            {rows.map((t) => (
              <TaskRow key={t.id} task={t} view={views.get(t.id)!} onToggle={() => toggle(t)} />
            ))}
            {tasks === null && !loadError && <p className="m-0 py-10 text-center text-muted">Loading tasks…</p>}
            {loadError && <p role="alert" className="m-0 py-10 text-center text-red-600">Couldn’t load tasks: {loadError}</p>}
            {tasks && rows.length === 0 && (
              <p className="m-0 py-10 text-center text-muted">{tasks.length ? "No tasks match your filters." : "No tasks yet. Add your first one."}</p>
            )}
          </div>
          <Pagination page={current} pages={pages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </section>

        <div className="flex gap-3 @3xl:justify-end">
          <Link href="/calls" className={`${btnPrimary} flex-1 @3xl:min-w-[140px] @3xl:flex-none`}>
            <Phone size={16} /> Log Call
          </Link>
          <button onClick={() => setAdding(true)} className={`${btnGhost} flex-1 @3xl:min-w-[140px] @3xl:flex-none`}>
            <CalendarPlus size={16} /> Add Task
          </button>
        </div>
      </div>

      <AddTaskDialog open={adding} onClose={() => setAdding(false)} onSubmit={create} />
    </div>
  );
}
