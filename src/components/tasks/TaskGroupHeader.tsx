import { ChevronDown } from "lucide-react";
import { CountBadge } from "@/components/zedu";
import { cx } from "@/components/zedu/cx";

const dots = {
  overdue: "bg-z-status-danger",
  today: "bg-z-status-warning",
  upcoming: "bg-z-chart-1",
  completed: "bg-z-status-success",
} as const;

/** Collapsible section header in the task list: urgency dot + count + chevron toggle. */
export function TaskGroupHeader({
  label,
  tone,
  count,
  collapsed,
  onToggle,
  className,
}: {
  label: string;
  tone: keyof typeof dots;
  count: number | string;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <div className={cx("flex h-10 shrink-0 items-center gap-2 border-b border-z-line bg-z-subtle py-0 pl-4 pr-3", className)}>
      <span aria-hidden className={cx("size-2 shrink-0 rounded-full", dots[tone])} />
      <span className="shrink-0 text-z-small font-medium text-z-fg">{label}</span>
      <CountBadge count={count} />
      <span className="min-w-0 flex-1" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
        className="z-focus grid size-8 shrink-0 place-items-center rounded-z-md text-z-icon transition-transform duration-150 hover:text-z-icon-strong [&_svg]:size-4"
      >
        <span className={cx("grid place-items-center transition-transform duration-150", collapsed && "-rotate-90")}>
          <ChevronDown aria-hidden />
        </span>
      </button>
    </div>
  );
}
