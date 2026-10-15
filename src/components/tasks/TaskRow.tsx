import { MoreVertical, Phone, Mail, StickyNote, type LucideIcon } from "lucide-react";
import { OWNERS, type OwnerTone, type Task, type TaskStatus, type TaskType, type TaskView } from "./data";

const TYPE_ICON: Record<TaskType, LucideIcon> = { Call: Phone, Email: Mail, Note: StickyNote };
const TYPE_STYLE: Record<TaskType, string> = {
  Call: "bg-brand-soft text-brand-bright",
  Email: "bg-info/15 text-info",
  Note: "bg-success/15 text-success",
};
const STATUS_STYLE: Record<TaskStatus, string> = {
  Pending: "bg-warning/15 text-warning",
  Done: "bg-success/15 text-success",
  Overdue: "bg-danger/15 text-danger",
};
const TONE_STYLE: Record<OwnerTone, string> = {
  purple: "bg-[#5b21b6] text-white",
  teal: "bg-[#b8e6e0] text-[#0f5e57]",
  mint: "bg-[#c8ecd9] text-[#14623a]",
  violet: "bg-[#b9a4ee] text-[#3b1a8c]",
};

/**
 * Narrow containers stack each task into a card (named grid areas);
 * from @3xl up it becomes a regular table row.
 */
const ROW_GRID =
  "grid items-start gap-x-2.5 gap-y-2 px-1 " +
  "grid-cols-[24px_1fr_auto_28px] " +
  "@3xl:grid-cols-[28px_minmax(180px,2.2fr)_1.3fr_0.9fr_1fr_0.9fr_1fr_32px] @3xl:items-center @3xl:gap-3";

const AUTO = "@3xl:col-auto @3xl:row-auto @3xl:col-span-1 @3xl:row-span-1";
const AREA = {
  check: `col-start-1 row-start-1 row-span-3 ${AUTO}`,
  task: `col-start-2 row-start-1 ${AUTO}`,
  due: `col-start-3 row-start-1 ${AUTO}`,
  more: `col-start-4 row-start-1 ${AUTO}`,
  lead: `col-start-2 row-start-2 ${AUTO}`,
  status: `col-start-3 col-span-2 row-start-2 ${AUTO}`,
  type: `col-start-2 row-start-3 ${AUTO}`,
  owner: `col-start-3 col-span-2 row-start-3 ${AUTO}`,
};

const checkbox = "m-0 h-4 w-4 cursor-pointer accent-brand";

export function TaskTableHead() {
  return (
    <div className={`${ROW_GRID} hidden py-2.5 text-xs font-semibold text-ink-muted @3xl:grid`}>
      <span><input type="checkbox" aria-label="Select all" className={checkbox} /></span>
      <span>Task</span>
      <span>Related Lead</span>
      <span>Type</span>
      <span>Due Date</span>
      <span>Status</span>
      <span>Owner</span>
      <span />
    </div>
  );
}

export function TaskRow({ task: t, view, onToggle }: { task: Task; view: TaskView; onToggle: () => void }) {
  const TypeIcon = TYPE_ICON[t.type];
  const owner = OWNERS[t.owner] ?? { initials: t.owner.slice(0, 2).toUpperCase(), tone: "purple" as const };
  const chip = "inline-flex items-center gap-[5px] rounded-lg px-3 py-[5px] text-xs font-semibold not-italic";

  return (
    <div className={`${ROW_GRID} border-0 border-b border-solid border-line py-3.5 last:border-b-0`}>
      <span className={`${AREA.check} pt-0.5 @3xl:pt-0`}>
        <input type="checkbox" checked={t.done} onChange={onToggle} aria-label={`Complete ${t.title}`} className={checkbox} />
      </span>

      <span className={`${AREA.task} flex min-w-0 flex-col gap-0.5`}>
        <strong className={`text-[13px] font-semibold ${t.done ? "text-ink-muted line-through" : ""}`}>{t.title}</strong>
        {t.notes && <small className="truncate text-xs text-ink-muted">{t.notes}</small>}
      </span>

      <span className={`${AREA.lead} self-center text-xs text-ink-muted @3xl:text-sm @3xl:text-ink`}>{t.lead || "—"}</span>

      <span className={AREA.type}>
        <em className={`${chip} ${TYPE_STYLE[t.type]}`}>
          <TypeIcon size={12} /> {t.type}
        </em>
      </span>

      <span className={`${AREA.due} flex flex-col gap-0.5 text-right @3xl:text-left`}>
        <strong className={`text-[13px] font-semibold ${view.hot ? "text-danger" : ""}`}>{view.dueLabel}</strong>
        <small className="text-xs text-ink-muted">{view.dueSub}</small>
      </span>

      <span className={`${AREA.status} justify-self-end @3xl:justify-self-auto`}>
        <em className={`${chip} ${STATUS_STYLE[view.status]}`}>{view.status}</em>
      </span>

      <span className={`${AREA.owner} flex items-center gap-2 justify-self-end text-xs font-medium @3xl:justify-self-auto @3xl:text-sm`}>
        <i className={`inline-grid h-7 w-7 flex-none place-items-center rounded-full text-[10px] font-bold not-italic ${TONE_STYLE[owner.tone]}`}>
          {owner.initials}
        </i>
        {t.owner}
      </span>

      <button
        aria-label="Task actions"
        className={`${AREA.more} grid h-7 w-7 cursor-pointer place-items-center rounded-lg bg-transparent p-0 text-ink hover:bg-surface-sunken @3xl:h-8 @3xl:w-8`}
      >
        <MoreVertical size={16} />
      </button>
    </div>
  );
}
