import { CalendarDays, Mail, Phone, Reply, Users } from "lucide-react";
import { cx } from "@/components/zedu/cx";
import type { TaskType } from "@/data/tasks";

const icons = {
  Call: Phone,
  Email: Mail,
  "Follow-up": Reply,
  Meeting: Users,
  Other: CalendarDays,
} as const;

/** Task type tag (Figma 3:3226): 22px sunken chip, 14px icon + label. */
export function TaskTypeTag({ type, className }: { type: TaskType; className?: string }) {
  const Icon = icons[type];
  return (
    <span
      className={cx(
        "inline-flex h-[22px] shrink-0 items-center gap-1 rounded-z-xs bg-z-sunken py-0.5 pl-1.5 pr-2 text-z-caption font-medium text-z-fg-secondary [&_svg]:size-3.5",
        className,
      )}
    >
      <Icon aria-hidden />
      {type}
    </span>
  );
}
