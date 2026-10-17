"use client";

import { Ellipsis, Link2, PhoneCall } from "lucide-react";
import { Avatar, Checkbox, Dropdown, IconButton, Menu, MenuItem } from "@/components/zedu";
import { DueLabel, TaskStatus, TaskTypeTag, type Due, type TaskKind } from "@/components/zedu/Records";
import { cx } from "@/components/zedu/cx";
import type { TaskItem, TaskType } from "@/data/tasks";

const KIND: Record<TaskType, TaskKind> = {
  Call: "call",
  Email: "email",
  "Follow-up": "follow-up",
  Meeting: "meeting",
  Other: "other",
};

type Props = {
  task: TaskItem;
  onToggle: () => void;
  onOpen: () => void;
  onFollowUp: () => void;
  onDelete: () => void;
};

/** Task row: 60px desktop row, compact card below lg (Figma mobile frame 7:4317). */
export function TaskRowItem({ task, onToggle, onOpen, onFollowUp, onDelete }: Props) {
  const done = task.status === "Completed";
  const due: Due = task.dueTone;
  return (
    <div className="group flex items-center gap-3 border-b border-z-line bg-z-surface py-0 pl-3 pr-2 transition-colors duration-150 last:border-b-0 hover:bg-z-subtle max-lg:items-start max-lg:px-4 max-lg:py-3 lg:h-[60px]">
      <Checkbox
        label={task.title}
        hideLabel
        checked={done}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
      />
      <button
        type="button"
        onClick={onOpen}
        className="z-focus flex min-w-0 flex-1 flex-col items-start gap-0.5 overflow-hidden rounded-z-xs py-1 text-left"
      >
        <span className={cx("w-full truncate text-z-small font-medium", done ? "text-z-fg-muted" : "text-z-fg")}>
          {task.title}
        </span>
        {/* Desktop meta: type + record + from-call */}
        <span className="flex w-full items-center gap-2 overflow-hidden max-lg:hidden">
          <TaskTypeTag type={KIND[task.type]} />
          <span className="flex min-w-0 items-center gap-1 text-z-caption font-medium text-z-fg-secondary">
            <Link2 aria-hidden className="size-3 shrink-0 text-z-icon" />
            <span className="truncate">{task.recordName}</span>
            <span className="shrink-0 font-normal text-z-fg-muted">· {task.recordKind}</span>
          </span>
          {task.fromCall && (
            <span className="flex shrink-0 items-center gap-1 text-z-caption font-normal text-z-fg-muted">
              <PhoneCall aria-hidden className="size-3 text-z-icon" />
              {task.fromCall}
            </span>
          )}
        </span>
        {/* Mobile meta: due · person */}
        <span className="flex w-full items-center gap-2 overflow-hidden lg:hidden">
          <DueLabel due={due}>{mobileDue(task)}</DueLabel>
          <span className="truncate text-z-caption font-normal text-z-fg-muted">· {task.owner.name}</span>
        </span>
      </button>
      <span className="hidden w-[180px] shrink-0 items-center overflow-hidden lg:flex">
        <DueLabel due={due}>{task.dueText}</DueLabel>
      </span>
      <span className="hidden w-[160px] shrink-0 items-center gap-2 overflow-hidden lg:flex">
        <Avatar size={24} initials={task.owner.initials} />
        <span className="truncate text-z-small font-normal text-z-fg-secondary">{task.owner.name}</span>
      </span>
      <span className="hidden w-[96px] shrink-0 items-center overflow-hidden lg:flex">
        <TaskStatus status={done ? "completed" : "pending"} />
      </span>
      <span className="shrink-0 max-lg:hidden">
        <Dropdown
          align="end"
          trigger={(props) => (
            <IconButton label={`Actions for ${task.title}`} {...props}>
              <Ellipsis aria-hidden />
            </IconButton>
          )}
        >
          <Menu label="Task actions">
            <MenuItem onSelect={onOpen}>Edit task</MenuItem>
            <MenuItem onSelect={onFollowUp}>Create follow-up task</MenuItem>
            <MenuItem tone="danger" onSelect={onDelete}>
              Delete
            </MenuItem>
          </Menu>
        </Dropdown>
      </span>
      <span className="shrink-0 lg:hidden">
        <TaskTypeTag type={KIND[task.type]} />
      </span>
    </div>
  );
}

function mobileDue(task: TaskItem): string {
  if (task.dueTone === "done") return task.dueText.replace(/^Done · /, "");
  return task.dueText;
}
