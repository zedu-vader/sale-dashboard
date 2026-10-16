"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Ellipsis,
  Link2,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  FieldLabel,
  IconButton,
  Input,
  SegmentedControl,
} from "@/components/zedu";
import { cx } from "@/components/zedu/cx";
import { TASK_TYPES, type TaskItem, type TaskType } from "@/data/tasks";

/** Task details slide-over (Figma 7:4185): 460px, header + form + footer. */
export function TaskEditPanel({
  task,
  mode,
  onClose,
  onSave,
  onDelete,
  onComplete,
}: {
  task: TaskItem;
  mode: "edit" | "create";
  onClose: () => void;
  onSave: (patch: { title: string; description: string; type: TaskType }) => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [type, setType] = useState<TaskType>(task.type);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={mode === "edit" ? `Edit task: ${task.title}` : "New task"}
      className="fixed inset-y-0 right-0 z-40 flex w-[460px] max-w-full flex-col border-l border-z-line bg-z-surface shadow-z-lg"
    >
      <div className="flex h-[75px] shrink-0 items-start gap-2 border-b border-z-line px-5 pb-4 pt-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="z-overline text-z-fg-muted">Task</span>
          <span className="text-z-section text-z-fg">{mode === "edit" ? "Edit task" : "New task"}</span>
        </div>
        {mode === "edit" && task.status !== "Completed" && (
          <Button variant="secondary" size="sm" icon={<Check aria-hidden />} onClick={onComplete}>
            Mark complete
          </Button>
        )}
        <IconButton label="More actions">
          <Ellipsis aria-hidden />
        </IconButton>
        <IconButton label="Close panel" onClick={onClose}>
          <X aria-hidden />
        </IconButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="z-focus h-24 w-full resize-none rounded-z-md border border-z-line-strong bg-z-surface px-3 py-2 text-z-body font-normal text-z-fg shadow-z-xs placeholder:text-z-fg-placeholder"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Type</FieldLabel>
          <SegmentedControl<TaskType>
            label="Task type"
            options={TASK_TYPES.map((t) => ({ value: t, label: t }))}
            value={type}
            onChange={setType}
            className="w-full [&>button]:flex-1"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Linked lead or contact</FieldLabel>
          <button
            type="button"
            className="z-focus flex h-9 items-center gap-2 rounded-z-md border border-z-line-strong bg-z-surface px-3 text-left shadow-z-xs"
          >
            <Link2 aria-hidden className="size-4 shrink-0 text-z-icon" />
            <span className="min-w-0 flex-1 truncate text-z-body font-normal text-z-fg">
              {task.recordName} · {task.recordKind}
            </span>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-z-icon" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Assignee</FieldLabel>
            <StaticSelect text={mode === "create" ? "Agnes Okafor (you)" : task.owner.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Status</FieldLabel>
            <StaticSelect text={task.status} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Due date</FieldLabel>
            <StaticSelect text="Fri, Oct 16, 2026" icon={<CalendarDays aria-hidden />} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Time (optional)</FieldLabel>
            <StaticSelect text="3:00 PM" icon={<Clock aria-hidden />} />
          </div>
        </div>
        {task.linkedCall && (
          <div className="flex gap-3 rounded-z-md border border-z-line bg-z-subtle p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-z-md bg-z-accent-subtle [&_svg]:size-4 [&_svg]:text-z-fg-accent">
              <Phone aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-z-small font-medium text-z-fg">Created from a call</span>
              <span className="text-z-caption font-normal text-z-fg-secondary">
                Call with {task.linkedCall.person} · {task.linkedCall.when} · {task.linkedCall.outcome} ·{" "}
                {task.linkedCall.duration}. This task stays linked to {task.recordName}&apos;s lead record.
              </span>
            </span>
            <Button variant="secondary" size="sm" className="self-start">
              View call
            </Button>
          </div>
        )}
        <p className="text-z-caption font-normal text-z-fg-muted">{task.createdBy}</p>
      </div>

      <div className="flex h-[61px] shrink-0 items-center gap-2 border-t border-z-line px-5">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDelete}
            className={cx(
              "z-focus inline-flex h-8 items-center gap-1.5 rounded-z-md px-2 text-z-small font-medium text-z-fg-danger hover:bg-z-danger-subtle [&_svg]:size-4",
            )}
          >
            <Trash2 aria-hidden />
            Delete
          </button>
        ) : (
          <span />
        )}
        <span className="flex-1" />
        <Button variant="secondary" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" onClick={() => onSave({ title, description, type })}>
          {mode === "edit" ? "Save changes" : "Create task"}
        </Button>
      </div>
    </div>
  );
}

function StaticSelect({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      className="z-focus flex h-9 items-center gap-2 rounded-z-md border border-z-line-strong bg-z-surface px-3 text-left shadow-z-xs"
    >
      {icon && <span className="shrink-0 text-z-icon [&_svg]:size-4">{icon}</span>}
      <span className="min-w-0 flex-1 truncate text-z-body font-normal text-z-fg">{text}</span>
      <ChevronDown aria-hidden className="size-4 shrink-0 text-z-icon" />
    </button>
  );
}
