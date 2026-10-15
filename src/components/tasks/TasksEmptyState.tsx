import { CircleCheck, Plus } from "lucide-react";
import { Button } from "@/components/zedu";

/** Centered empty state (Figma 7:3959 → "You're all caught up"). */
export function TasksEmptyState({
  title = "You're all caught up",
  description = "No tasks are due today. New follow-ups from your calls will appear here.",
  onNewTask,
}: {
  title?: string;
  description?: string;
  onNewTask?: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2 px-6 py-8">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-z-sunken [&_svg]:size-5 [&_svg]:text-z-icon">
        <CircleCheck aria-hidden />
      </span>
      <span className="h-1" aria-hidden />
      <p className="text-[14px] font-semibold leading-5 text-z-fg">{title}</p>
      <p className="w-[312px] max-w-full text-center text-z-small font-normal text-z-fg-muted">{description}</p>
      <span className="h-2" aria-hidden />
      {onNewTask && (
        <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
          New task
        </Button>
      )}
    </div>
  );
}
