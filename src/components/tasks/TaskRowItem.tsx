"use client";

import { Ellipsis, Link2, PhoneCall } from "lucide-react";
import { Avatar, Checkbox, Dropdown, IconButton, Menu, MenuItem } from "@/components/zedu";
import { cx } from "@/components/zedu/cx";
import type { TaskItem } from "@/data/tasks";
import { DueLabel } from "./DueLabel";
import { TaskStatusPill } from "./TaskStatusPill";
import { TaskTypeTag } from "./TaskTypeTag";

type Props = {
  task: TaskItem;
  onToggle: () => void;
  onOpen: () => void;
  onFollowUp: () => void;
  onDelete: () => void;
};

/** Task row (Figma 3:3278): 60px desktop row, compact card under 768px (Figma 7:4317). */
export function TaskRowItem({ task, onToggle, onOpen, onFollowUp, onDelete }: Props) {
  const done = task.status === "Completed";
  return (
    <div className="group flex items-center gap-3 border-b border-z-line bg-z-surface py-0 pl-3 pr-2 transition-colors duration-150 last:border-b-0 hover:bg-z-subtle max-md:items-start max-md:px-4 max-md:py-3 md:h-[60px]">
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
        <span
          className={cx(
            "w-full truncate text-z-small font-medium",
            done ? "text-z-fg-muted" : "text-z-fg",
          )}
        >
          {task.title}
        </span>
        {/* Desktop meta: type + record + from-call */}
        <span className="flex w-full items-center gap-2 overflow-hidden max-md:hidden">
          <TaskTypeTag type={task.type} />
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
        <span className="flex w-full items-center gap-2 overflow-hidden md:hidden">
          <DueLabel tone={task.dueTone} text={mobileDue(task)} />
          <span className="truncate text-z-caption font-normal text-z-fg-muted">· {task.owner.name}</span>
        </span>
      </button>
      <span className="hidden w-[180px] shrink-0 items-center overflow-hidden md:flex">
        <DueLabel tone={task.dueTone} text={task.dueText} />
      </span>
      <span className="hidden w-[160px] shrink-0 items-center gap-2 overflow-hidden md:flex">
        {task.owner.key === "unassigned" ? (
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-z-sunken text-z-caption text-z-fg-muted">
            –
          </span>
        ) : (
          <Avatar size={24} initials={task.owner.initials} />
        )}
        <span className="truncate text-z-small font-normal text-z-fg-secondary">{task.owner.name}</span>
      </span>
      <span className="hidden w-[96px] shrink-0 items-center overflow-hidden md:flex">
        <TaskStatusPill status={task.status} />
      </span>
      <span className="shrink-0 max-md:hidden">
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
      <span className="shrink-0 md:hidden">
        <TaskTypeTag type={task.type} />
      </span>
    </div>
  );
}

function mobileDue(task: TaskItem): string {
  if (task.dueTone === "done") return task.dueText.replace(/^Done · /, "");
  return task.dueText;
}
