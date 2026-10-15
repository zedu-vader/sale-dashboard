import { ChevronDown } from "lucide-react";
import { CountBadge } from "@/components/zedu";
import { cx } from "@/components/zedu/cx";

const dots = {
  overdue: "bg-z-status-danger",
  today: "bg-z-status-warning",
  upcoming: "bg-z-chart-1",
  completed: "bg-z-status-success",
} as const;

/** Section header in the task list (Figma 3:3195): 40px, subtle bg, urgency dot + count. */
export function TaskGroupHeader({
  label,
  tone,
  count,
  className,
}: {
  label: string;
  tone: keyof typeof dots;
  count: number | string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex h-10 shrink-0 items-center gap-2 border-b border-z-line bg-z-subtle py-0 pl-4 pr-3",
        className,
      )}
    >
      <span aria-hidden className={cx("size-2 shrink-0 rounded-full", dots[tone])} />
      <span className="shrink-0 text-z-small font-medium text-z-fg">{label}</span>
      <CountBadge count={count} />
      <span className="min-w-0 flex-1" />
      <ChevronDown aria-hidden className="size-4 shrink-0 text-z-icon" />
    </div>
  );
}
