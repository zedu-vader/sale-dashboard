import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { cx } from "@/components/zedu/cx";
import type { DueTone } from "@/data/tasks";

/**
 * Due date with urgency (Figma 3:3248): red/medium for overdue, amber/medium for
 * today, secondary/regular for upcoming, green/regular for done — always icon + words.
 */
export function DueLabel({ tone, text, className }: { tone: DueTone; text: string; className?: string }) {
  return (
    <span className={cx("inline-flex min-w-0 items-center gap-1", className)}>
      {tone === "overdue" && <CircleAlert aria-hidden className="size-3.5 shrink-0 text-z-fg-danger" />}
      {tone === "today" && <Clock aria-hidden className="size-3.5 shrink-0 text-z-fg-warning" />}
      {tone === "done" && <CircleCheck aria-hidden className="size-3.5 shrink-0 text-z-fg-success" />}
      {tone === "upcoming" && <Clock aria-hidden className="size-3.5 shrink-0 text-z-icon" />}
      <span
        className={cx(
          "truncate text-z-caption",
          tone === "overdue" && "font-medium text-z-fg-danger",
          tone === "today" && "font-medium text-z-fg-warning",
          tone === "upcoming" && "font-normal text-z-fg-secondary",
          tone === "done" && "font-normal text-z-fg-success",
        )}
      >
        {text}
      </span>
    </span>
  );
}
