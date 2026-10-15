// ZEDU/Status pill, ZEDU/Delta, ZEDU/Count badge (Figma 16800:18243).

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cx } from "./cx";

/** Pipeline order. Lost is an exit from any stage and always records a reason. */
export const STAGES = [
  "New",
  "Contacted",
  "Connected",
  "Interested",
  "Follow up",
  "Qualified",
  "Proposal",
  "Won",
  "Lost",
] as const;

export type Stage = (typeof STAGES)[number];

const pill: Record<Stage, string> = {
  New: "bg-z-pill-new text-z-pill-new-fg",
  Contacted: "bg-z-pill-contacted text-z-pill-contacted-fg",
  Connected: "bg-z-pill-connected text-z-pill-connected-fg",
  Interested: "bg-z-pill-interested text-z-pill-interested-fg",
  "Follow up": "bg-z-pill-follow-up text-z-pill-follow-up-fg",
  Qualified: "bg-z-pill-qualified text-z-pill-qualified-fg",
  Proposal: "bg-z-pill-proposal text-z-pill-proposal-fg",
  Won: "bg-z-pill-won text-z-pill-won-fg",
  Lost: "bg-z-pill-lost text-z-pill-lost-fg",
};

/**
 * Lead stage pill. The colour is fixed per stage so it always matches meaning. `label` renames a stage
 * for a screen's wording (Won → "Converted", Lost → "Not interested", Follow up → "Follow-up").
 */
export function StatusPill({ stage, label, className }: { stage: Stage; label?: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2 text-z-caption font-medium",
        pill[stage],
        className,
      )}
    >
      {label ?? stage}
    </span>
  );
}

const delta = {
  up: { Icon: TrendingUp, tone: "text-z-fg-success", sr: "Up" },
  down: { Icon: TrendingDown, tone: "text-z-fg-danger", sr: "Down" },
  flat: { Icon: Minus, tone: "text-z-fg-muted", sr: "No change" },
};

/**
 * Period change beside a KPI value: trend icon + value, no background. Never colour alone.
 * No decimals unless under 10 (4.2%).
 */
export function Delta({
  direction,
  value,
  className,
}: {
  direction: "up" | "down" | "flat";
  value: string;
  className?: string;
}) {
  const { Icon, tone, sr } = delta[direction];
  return (
    <span className={cx("inline-flex items-center gap-1 text-z-caption font-medium", tone, className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">{sr} </span>
      {value}
    </span>
  );
}

const countTone = {
  neutral: "rounded-z-xs border border-z-line-strong bg-z-surface text-z-fg-secondary",
  accent: "rounded-full bg-z-accent-subtle text-z-fg-accent",
  danger: "rounded-full bg-z-status-danger text-z-fg-on-primary",
};

/** 18px numeric badge. Neutral for nav/tab counts, Accent beside an active tab, Danger only for unread notifications. */
export function CountBadge({
  count,
  tone = "neutral",
  className,
}: {
  count: number | string;
  tone?: keyof typeof countTone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center px-1 text-[11px] font-medium leading-4",
        countTone[tone],
        className,
      )}
    >
      {count}
    </span>
  );
}
