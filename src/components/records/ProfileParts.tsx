"use client";

// Pieces shared by the lead and contact profiles: the history tab bar, Next action card, note composer,
// timeline and tasks list (Figma 16844:22607, 16844:22965, 16856:25414).

import { Check, ChevronRight, Ellipsis, Phone, Plus } from "lucide-react";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toggleTask } from "@/app/actions";
import type { ProfileTask, TimelineEntry } from "@/lib/leadTypes";
import { STAGES, TASK_TYPES, initialsOf } from "@/lib/status";
import {
  ActivityBody,
  ActivityItem,
  Avatar,
  Button,
  Checkbox,
  CountBadge,
  Dropdown,
  DueLabel,
  IconButton,
  Menu,
  MenuItem,
  StatusPill,
  TaskStatus,
  TaskTypeTag,
  cx,
} from "@/components/zedu";

export const card = "rounded-z-xl border border-z-line bg-z-surface shadow-z-sm";

export type HistoryTab = "activity" | "calls" | "tasks" | "notes";

export function HistoryTabs({
  label,
  value,
  onChange,
  counts,
}: {
  label: string;
  value: HistoryTab;
  onChange: (tab: HistoryTab) => void;
  counts: { calls: number; openTasks: number; notes: number };
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-5 overflow-x-auto border-b border-z-line px-4">
      {(
        [
          ["activity", "Activity", undefined],
          ["calls", "Calls", counts.calls],
          ["tasks", "Tasks", counts.openTasks],
          ["notes", "Notes", counts.notes],
        ] as const
      ).map(([key, text, count]) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(key)}
            className="group z-focus flex shrink-0 flex-col rounded-t-z-xs"
          >
            <span
              className={cx(
                "flex items-center gap-1.5 whitespace-nowrap px-1 py-2.5 text-z-small",
                on ? "font-medium text-z-fg-accent" : "font-normal text-z-fg-secondary group-hover:text-z-fg",
              )}
            >
              {text}
              {count !== undefined && <CountBadge count={count} tone={on ? "accent" : "neutral"} />}
            </span>
            <span aria-hidden className={cx("h-0.5 w-full rounded-t-[2px]", on ? "bg-z-accent" : "group-hover:bg-z-line-hover")} />
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

export function useOptimisticDone(task: { id: string; done: boolean } | null) {
  const [done, setDone] = useState(task?.done ?? false);
  const [, startTransition] = useTransition();
  useEffect(() => setDone(task?.done ?? false), [task?.id, task?.done]);
  const toggle = (value: boolean) => {
    if (!task) return;
    setDone(value);
    startTransition(async () => {
      try {
        await toggleTask(task.id, value);
      } catch {
        setDone(!value);
      }
    });
  };
  return [done, toggle] as const;
}

export function NextActionCard({ task, onNewTask, emptyText }: { task: ProfileTask | null; onNewTask: () => void; emptyText: string }) {
  const [done, toggle] = useOptimisticDone(task);
  return (
    <section aria-label="Next action" className={cx(card, "flex items-center gap-3 py-3 pl-4 pr-3")}>
      {task ? (
        <>
          <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => toggle(e.target.checked)} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className={cx("truncate text-z-small font-medium", done ? "text-z-fg-muted line-through" : "text-z-fg")}>{task.title}</p>
          </div>
          <DueLabel due={done ? "done" : task.due.due}>{done ? "Done" : task.due.text}</DueLabel>
          <Button variant="secondary" size="sm" icon={<Check aria-hidden />} disabled={done} onClick={() => toggle(true)}>
            Mark complete
          </Button>
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className="text-z-small text-z-fg-secondary">{emptyText}</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
            New task
          </Button>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------------------------------- */

export function NoteComposer({ id, firstName, me, onSave }: { id: string; firstName: string; me: string; onSave: (text: string) => Promise<unknown> }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const save = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      await onSave(text);
      setText("");
    });
  };
  return (
    <form
      className="flex items-center gap-2.5 rounded-z-md border border-z-line-strong bg-z-surface py-2 pl-3 pr-2 shadow-z-xs focus-within:border-z-line-focus focus-within:shadow-z-focus-input"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Avatar size={24} initials={initialsOf(me)} />
      <label htmlFor={`note-${id}`} className="sr-only">
        Add a note
      </label>
      <input
        id={`note-${id}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Add a note about ${firstName}…`}
        className="min-w-0 flex-1 bg-transparent text-z-small text-z-fg outline-none placeholder:text-z-fg-placeholder focus-visible:outline-none"
      />
      <Button type="submit" variant="secondary" size="sm" disabled={pending || !text.trim()}>
        Add note
      </Button>
    </form>
  );
}

export function Timeline({ entries, empty }: { entries: TimelineEntry[]; empty: string }) {
  if (!entries.length) return <p className="px-1 py-8 text-center text-z-small text-z-fg-muted">{empty}</p>;
  return (
    <ul className="flex flex-col">
      {entries.map((e, i) => (
        <ActivityItem key={e.id} kind={e.kind} actor={e.actor} action={e.action} time={e.time} last={i === entries.length - 1}>
          <TimelineBody entry={e} />
        </ActivityItem>
      ))}
    </ul>
  );
}

function TimelineBody({ entry }: { entry: TimelineEntry }): ReactNode {
  if (entry.call) {
    const c = entry.call;
    return (
      <ActivityBody>
        <p className="flex flex-wrap items-center gap-2 text-z-caption">
          <span className={cx("font-medium", c.connected ? "text-z-fg-success" : "text-z-fg-secondary")}>{c.outcome}</span>
          {c.duration && (
            <>
              <span aria-hidden className="text-z-fg-muted">
                ·
              </span>
              <span className="text-z-fg-muted">{c.duration}</span>
            </>
          )}
        </p>
        {c.notes && <p>{c.notes}</p>}
      </ActivityBody>
    );
  }
  if (entry.note) return <ActivityBody>{entry.note}</ActivityBody>;
  if (entry.status) {
    const { from, to } = entry.status;
    return (
      <div className="flex items-center gap-2">
        {from && <StatusPill stage={STAGES[from].stage} label={STAGES[from].label} />}
        <ChevronRight aria-hidden className="size-3.5 text-z-icon-subtle" />
        {to && <StatusPill stage={STAGES[to].stage} label={STAGES[to].label} />}
      </div>
    );
  }
  if (entry.task) return <TimelineTask task={entry.task} />;
  if (entry.detail) return <p className="text-z-caption text-z-fg-muted">{entry.detail}</p>;
  return null;
}

function TimelineTask({ task }: { task: ProfileTask }) {
  const [done, toggle] = useOptimisticDone(task);
  return (
    <div className="flex items-center gap-2.5 rounded-z-md border border-z-line px-3 py-2">
      <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => toggle(e.target.checked)} />
      <p className={cx("min-w-0 flex-1 truncate text-z-small font-medium", done ? "text-z-fg-muted line-through" : "text-z-fg")}>{task.title}</p>
      <DueLabel due={done ? "done" : task.due.due}>{done ? "Done" : task.due.text}</DueLabel>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

export function TasksTab({ tasks, linkedTo, onNewTask }: { tasks: ProfileTask[]; linkedTo: string; onNewTask: () => void }) {
  const open = tasks.filter((t) => !t.done).length;
  const completed = tasks.length - open;
  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center gap-3 py-2.5 pl-4 pr-3">
        <p className="min-w-0 flex-1 text-z-small text-z-fg-muted">
          {open} open · {completed} completed · linked to {linkedTo}
        </p>
        <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
          New task
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="px-4 py-8 text-center text-z-small text-z-fg-muted">No tasks yet.</p>
      ) : (
        <ul className="border-t border-z-line">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: ProfileTask }) {
  const [done, toggle] = useOptimisticDone(task);
  return (
    <li className="flex min-h-[60px] flex-wrap items-center gap-3 border-b border-z-line py-2 pl-3 pr-2 hover:bg-z-subtle">
      <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => toggle(e.target.checked)} />
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <p className={cx("truncate text-z-small font-medium", done ? "text-z-fg-muted" : "text-z-fg")}>{task.title}</p>
        <div className="flex items-center gap-2">
          <TaskTypeTag type={TASK_TYPES[task.type].kind} />
          {task.fromCall && (
            <span className="flex items-center gap-1 whitespace-nowrap text-z-caption text-z-fg-muted">
              <Phone aria-hidden className="size-3" />
              {task.fromCall}
            </span>
          )}
        </div>
      </div>
      <div className="w-[180px] max-md:w-auto">
        <DueLabel due={done ? "done" : task.due.due}>{done && !task.done ? "Done · just now" : task.due.text}</DueLabel>
      </div>
      <div className="flex w-40 items-center gap-2 max-md:hidden">
        <Avatar size={24} initials={task.owner?.initials ?? "–"} />
        <span className="truncate text-z-small text-z-fg-secondary">{task.owner?.name ?? "Unassigned"}</span>
      </div>
      <div className="w-24">
        <TaskStatus status={done ? "completed" : "pending"} />
      </div>
      <Dropdown
        align="end"
        trigger={(p) => (
          <IconButton label={`Actions for ${task.title}`} {...p}>
            <Ellipsis aria-hidden />
          </IconButton>
        )}
      >
        <Menu label={`Actions for ${task.title}`} className="w-48">
          <MenuItem icon={<Check />} onSelect={() => toggle(!done)}>
            {done ? "Mark as pending" : "Mark complete"}
          </MenuItem>
        </Menu>
      </Dropdown>
    </li>
  );
}
