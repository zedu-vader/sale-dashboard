export const TASK_TYPES = ["Call", "Email", "Note"] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export type TaskStatus = "Pending" | "Done" | "Overdue";
export type TaskBucket = "today" | "overdue" | "upcoming";

/** Shape persisted by /api/tasks. */
export interface Task {
  id: string;
  title: string;
  notes: string;
  lead: string;
  type: TaskType;
  /** ISO timestamp */
  dueAt: string;
  done: boolean;
  /** Key of OWNERS */
  owner: string;
}

export type NewTask = Omit<Task, "id" | "done">;

export type OwnerTone = "purple" | "teal" | "mint" | "violet";

// Placeholder until real users exist.
export const OWNERS: Record<string, { initials: string; tone: OwnerTone }> = {
  You: { initials: "AO", tone: "purple" },
  Femi: { initials: "FB", tone: "teal" },
  Sarah: { initials: "SB", tone: "mint" },
  Grace: { initials: "GC", tone: "violet" },
};

export interface TaskView {
  status: TaskStatus;
  bucket: TaskBucket | null;
  dueLabel: string;
  dueSub: string;
  hot: boolean;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Everything the UI shows that depends on "now" (status, bucket, labels). */
export function describeTask(t: Task, now: Date): TaskView {
  const due = new Date(t.dueAt);
  const dayDiff = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86_400_000);
  const overdue = !t.done && due < now;

  const status: TaskStatus = t.done ? "Done" : overdue ? "Overdue" : "Pending";
  const bucket: TaskBucket | null = overdue ? "overdue" : dayDiff === 0 ? "today" : dayDiff > 0 ? "upcoming" : null;

  let dueLabel = day(due);
  let dueSub = time(due);
  if (dayDiff === 0) dueLabel = "Today";
  else if (dayDiff === 1) {
    dueLabel = "Tomorrow";
    dueSub = day(due);
  }

  return { status, bucket, dueLabel, dueSub, hot: overdue || (dayDiff === 0 && !t.done) };
}

export function countTasks(tasks: Task[], now: Date) {
  const counts = { all: tasks.length, today: 0, overdue: 0, upcoming: 0 };
  for (const t of tasks) {
    const b = describeTask(t, now).bucket;
    if (b) counts[b]++;
  }
  return counts;
}
