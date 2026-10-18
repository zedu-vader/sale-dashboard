// Record building blocks from the Leads frames (Figma 16842:21692 – 16847:23538):
// ZEDU/Alert, ZEDU/Filter chip, ZEDU/Due label, ZEDU/Task type, ZEDU/Task status, ZEDU/Lead type,
// ZEDU/Detail row and ZEDU/Activity item.

import {
  ArrowUpDown,
  CircleAlert,
  CircleCheck,
  Info,
  Clock,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Reply,
  SquareCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cx } from "./cx";

/* ---------------------------------------------------------------------------------------------- */

const alertTone = {
  danger: { box: "bg-z-danger-subtle", title: "text-z-fg-danger", icon: CircleAlert },
  warning: { box: "bg-z-warning-subtle", title: "text-z-fg-warning", icon: CircleAlert },
  info: { box: "bg-z-info-subtle", title: "text-z-fg-info", icon: Info },
};

type AlertProps = {
  tone?: keyof typeof alertTone;
  title: string;
  children?: ReactNode;
  /** Text actions under the body, e.g. "Open LD-1042" · "Save as new lead". */
  actions?: ReactNode;
  className?: string;
};

/** Inline alert: Warning, Danger or Info. Danger is announced immediately. */
export function Alert({ tone = "warning", title, children, actions, className }: AlertProps) {
  const t = alertTone[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("flex items-start gap-2.5 rounded-z-md p-3", t.box, className)}
    >
      <t.icon aria-hidden className={cx("mt-0.5 size-4 shrink-0", t.title)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-z-small">
        <p className={cx("font-medium", t.title)}>{title}</p>
        {children && <div className="font-normal text-z-fg-secondary">{children}</div>}
        {actions && <div className="flex flex-wrap gap-3 pt-1.5 font-medium text-z-fg">{actions}</div>}
      </div>
    </div>
  );
}

/** Text action inside an Alert. */
export function AlertAction({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cx("z-focus rounded-z-xs hover:underline", className)} {...rest} />;
}

/* ---------------------------------------------------------------------------------------------- */

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Default label is the field ("Status"); active label is "Field: value". */
  label: string;
  active?: boolean;
  /** Shown on active chips: clears the filter. */
  onClear?: () => void;
};

/** Filter chip. Default = dashed "+ Field" that opens a popover; Active = "Field: value" with clear. */
export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(function FilterChip(
  { label, active, onClear, className, ...rest },
  ref,
) {
  if (!active) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx(
          "z-focus inline-flex h-7 shrink-0 items-center gap-1.5 rounded-z-md border border-dashed border-z-line-strong bg-z-surface pl-2.5 pr-2 text-z-small font-normal text-z-fg-secondary transition-colors duration-150 hover:border-z-line-hover hover:text-z-fg",
          className,
        )}
        {...rest}
      >
        <Plus aria-hidden className="size-3.5 text-z-icon" />
        {label}
      </button>
    );
  }
  return (
    <span className={cx("inline-flex h-7 shrink-0 items-center rounded-z-md border border-z-line-focus bg-z-selected", className)}>
      <button
        ref={ref}
        type="button"
        className="z-focus h-full max-w-[260px] truncate rounded-l-z-md pl-2.5 pr-1.5 text-z-small font-medium text-z-fg-accent"
        {...rest}
      >
        {label}
      </button>
      {onClear && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={onClear}
          className="z-focus grid h-full place-items-center rounded-r-z-md pl-0.5 pr-2 text-z-fg-accent hover:opacity-70"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </span>
  );
});

/* ---------------------------------------------------------------------------------------------- */

export type Due = "overdue" | "today" | "upcoming" | "done" | "none";

const dueStyle: Record<Due, { Icon: LucideIcon; tone: string }> = {
  overdue: { Icon: Clock, tone: "font-medium text-z-fg-danger" },
  today: { Icon: Clock, tone: "font-medium text-z-fg-warning" },
  upcoming: { Icon: Clock, tone: "font-normal text-z-fg-secondary" },
  done: { Icon: CircleCheck, tone: "font-normal text-z-fg-success" },
  none: { Icon: Clock, tone: "font-normal text-z-fg-muted" },
};

/** Due date with urgency colour: "2 days overdue · Oct 13", "Today · 3:00 PM", "Done · Oct 12". */
export function DueLabel({ due, children, className }: { due: Due; children: ReactNode; className?: string }) {
  const { Icon, tone } = dueStyle[due];
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap text-z-caption", tone, className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------- */

export type TaskKind = "call" | "email" | "follow-up" | "meeting" | "other";

const taskKinds: Record<TaskKind, { Icon: LucideIcon; label: string }> = {
  call: { Icon: Phone, label: "Call" },
  email: { Icon: Mail, label: "Email" },
  "follow-up": { Icon: Reply, label: "Follow-up" },
  meeting: { Icon: Users, label: "Meeting" },
  other: { Icon: MoreHorizontal, label: "Other" },
};

/** Task type tag: Call, Email, Follow-up, Meeting, Other. */
export function TaskTypeTag({ type, className }: { type: TaskKind; className?: string }) {
  const { Icon, label } = taskKinds[type];
  return (
    <span
      className={cx(
        "inline-flex h-[22px] shrink-0 items-center gap-1 rounded-z-xs bg-z-sunken pl-1.5 pr-2 text-z-caption font-medium text-z-fg-secondary",
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 text-z-icon" />
      {label}
    </span>
  );
}

/** Stored task status pill. Overdue is derived and shown with DueLabel instead. */
export function TaskStatus({ status, className }: { status: "pending" | "completed"; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center rounded-full px-2 text-z-caption font-medium",
        status === "completed" ? "bg-z-task-completed text-z-task-completed-fg" : "bg-z-task-pending text-z-task-pending-fg",
        className,
      )}
    >
      {status === "completed" ? "Completed" : "Pending"}
    </span>
  );
}

/** Lead type: Individual (indigo dot) or Business (orange dot). */
export function LeadTypeLabel({ type, className }: { type: "individual" | "business"; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-z-small font-normal text-z-fg-secondary", className)}>
      <span aria-hidden className={cx("size-[7px] rounded-full", type === "business" ? "bg-z-lead-business" : "bg-z-lead-individual")} />
      {type === "business" ? "Business" : "Individual"}
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------- */

/** Label/value pair for record details. */
export function DetailRow({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-z-small font-normal text-z-fg-muted">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1.5 text-z-small font-normal text-z-fg [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-z-icon">
        {icon}
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </dd>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

export type ActivityKind = "call" | "note" | "status" | "task" | "created" | "other";

const activityIcons: Record<ActivityKind, LucideIcon> = {
  call: Phone,
  note: MessageSquare,
  status: ArrowUpDown,
  task: SquareCheck,
  created: Plus,
  other: Plus,
};

type ActivityItemProps = {
  kind: ActivityKind;
  actor: string;
  /** "logged a call", "added a note", "changed the status"… */
  action: string;
  time: ReactNode;
  /** Hide the rail line on the last item. */
  last?: boolean;
  children?: ReactNode;
};

/** Timeline entry, newest first. Body content (call box, note box, status change, task) goes in children. */
export function ActivityItem({ kind, actor, action, time, last, children }: ActivityItemProps) {
  const Icon = activityIcons[kind];
  return (
    <li className="flex gap-3">
      <div className="flex shrink-0 flex-col items-center gap-1 self-stretch">
        <span
          className={cx(
            "grid size-7 shrink-0 place-items-center rounded-full",
            kind === "call" ? "bg-z-accent-subtle text-z-fg-accent" : "bg-z-sunken text-z-icon",
          )}
        >
          <Icon aria-hidden className="size-3.5" />
        </span>
        {!last && <span aria-hidden className="w-px flex-1 bg-z-line" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pb-5 pt-1">
        <div className="flex items-center gap-1 text-z-small">
          <span className="whitespace-nowrap font-medium text-z-fg">{actor}</span>
          <span className="min-w-0 flex-1 truncate font-normal text-z-fg-secondary">{action}</span>
          <span className="whitespace-nowrap text-z-caption font-normal text-z-fg-muted">{time}</span>
        </div>
        {children}
      </div>
    </li>
  );
}

/** Grey bordered box for call and note bodies inside an ActivityItem. */
export function ActivityBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-z-md border border-z-line bg-z-subtle px-3 py-2.5 text-z-small font-normal text-z-fg-secondary">
      {children}
    </div>
  );
}
