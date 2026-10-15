"use client";

import { Check, Clock, SquareCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toggleTask } from "@/app/actions";
import type { TaskDue, TaskRow } from "@/lib/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { button } from "@/components/ui/button";

const DUE_CLASS: Record<TaskDue, string> = {
  overdue: "text-[#d0284a] dark:text-danger",
  today: "text-accent",
  tomorrow: "text-brand-bright",
};

// Task list, Zedu Design System §7.8.
export function TaskList({ tasks: initial }: { tasks: TaskRow[] }) {
  const [tasks, setTasks] = useState(initial);
  const [, startTransition] = useTransition();

  // Pick up fresh server data after revalidation.
  useEffect(() => setTasks(initial), [initial]);

  function toggle(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const done = !task.done;
    const set = (value: boolean) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: value } : t)));
    set(done);
    startTransition(async () => {
      try {
        await toggleTask(id, done);
      } catch {
        set(!done);
      }
    });
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <section className="card" aria-labelledby="tasks-title">
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <h3 id="tasks-title" className="text-h3">My tasks</h3>
        <a href="#" className={button({ variant: "ghost", size: "sm" })}>View all</a>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={SquareCheck}
          title="You're all caught up"
          body="Nothing due today or tomorrow."
          action={<a href="#" className={button({ variant: "secondary", size: "sm" })}>View all tasks</a>}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2.5 text-caption text-ink-muted">
            <span>{doneCount} of {tasks.length} done</span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-soft"
              role="progressbar"
              aria-label="Tasks done"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={tasks.length}
            >
              <div className="h-full rounded-full bg-gradient-progress transition-[width] duration-slow ease-out" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
            </div>
          </div>
          <ul>
            {tasks.map((t) => (
              <li key={t.id} className="border-t border-line first:border-t-0">
                <button
                  role="checkbox"
                  aria-checked={t.done}
                  onClick={() => toggle(t.id)}
                  className="flex min-h-11 w-full items-start gap-3 py-3 text-left"
                >
                  <span
                    className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-[7px] border-2 transition-colors duration-base ${
                      t.done ? "border-success bg-success" : "border-indigo-300"
                    }`}
                  >
                    <Check
                      size={12}
                      strokeWidth={4}
                      className={`text-white transition duration-base ease-out ${t.done ? "scale-100 opacity-100" : "opacity-0 motion-safe:scale-50"}`}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-small font-bold ${t.done ? "text-ink-muted line-through" : ""}`}>{t.title}</span>
                    {t.subtitle && <span className="mt-0.5 block text-caption text-ink-muted">{t.subtitle}</span>}
                  </span>
                  <span className="shrink-0 text-right text-caption text-ink-muted">
                    <b className={`flex items-center justify-end gap-1 font-bold ${DUE_CLASS[t.due]}`}>
                      {t.due === "overdue" && <Clock size={12} strokeWidth={2.5} />}
                      {t.dueLabel}
                    </b>
                    {t.when}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
