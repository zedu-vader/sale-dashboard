import { cx } from "@/components/zedu/cx";
import type { TaskStatus } from "@/data/tasks";

/** Task status pill (Figma 3:3271): 22px, fully rounded, soft tint + darker text. */
export function TaskStatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const done = status === "Completed";
  return (
    <span
      className={cx(
        "inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full px-2 text-z-caption font-medium",
        done ? "bg-z-task-completed text-z-task-completed-fg" : "bg-z-task-pending text-z-task-pending-fg",
        className,
      )}
    >
      {status}
    </span>
  );
}
