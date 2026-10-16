"use client";

// Shared timeline (activity, calls, notes) used by the lead and contact profiles.

import { ChevronRight } from "lucide-react";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toggleTask } from "@/app/actions";
import type { ProfileTask, TimelineEntry } from "@/lib/leadTypes";
import { STAGES } from "@/lib/status";
import { ActivityBody, ActivityItem, Checkbox, DueLabel, StatusPill, cx } from "@/components/zedu";

/** Local "done" state that reverts when the server call fails. */
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

export function TimelineBody({ entry }: { entry: TimelineEntry }): ReactNode {
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
