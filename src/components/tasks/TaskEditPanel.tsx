"use client";

import { useState } from "react";
import { Check, Link2, Phone, Trash2 } from "lucide-react";
import { Button, DateField, Input, Select, SegmentedControl, Textarea } from "@/components/zedu";
import { Modal, Sheet } from "@/components/zedu/Overlay";
import {
  TASK_STATUSES,
  TASK_TYPES,
  isoToDateInput,
  isoToTimeInput,
  lagosToday,
  type TaskItem,
  type TaskStatus,
  type TaskType,
} from "@/data/tasks";

export type TaskDraft = {
  title: string;
  description: string;
  type: TaskType;
  /** User id, or null for Unassigned. */
  ownerId: string | null;
  status: TaskStatus;
  dueDate: string;
  dueTime: string;
  leadName: string;
};

type Member = { id: string; name: string };

/** Task details sheet (Figma task panel, Overlay Sheet): form + footer actions. */
export function TaskEditPanel({
  task,
  mode,
  leads,
  team,
  defaultOwnerId = null,
  onClose,
  onSave,
  onDelete,
  onComplete,
}: {
  /** Null in create mode (blank draft). */
  task: TaskItem | null;
  mode: "edit" | "create";
  leads: { id: string; name: string }[];
  team: Member[];
  defaultOwnerId?: string | null;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [type, setType] = useState<TaskType>(task?.type ?? "Follow-up");
  const [ownerId, setOwnerId] = useState<string | null>(task ? task.ownerId : defaultOwnerId);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "Pending");
  const [dueDate, setDueDate] = useState(task ? isoToDateInput(task.dueAt) : lagosToday(1));
  const [dueTime, setDueTime] = useState(task ? isoToTimeInput(task.dueAt) : "09:00");
  const [leadName, setLeadName] = useState(task?.recordKind === "Lead" ? task.recordName : "");

  const leadId = `task-lead-${mode}`;
  const save = () => onSave({ title, description, type, ownerId, status, dueDate, dueTime, leadName });

  return (
    <Sheet
      open
      onClose={onClose}
      eyebrow="Task"
      title={mode === "edit" ? "Edit task" : "New task"}
      footer={
        <>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onDelete}
              className="z-focus inline-flex h-8 shrink-0 items-center gap-1.5 rounded-z-md px-2 text-z-small font-medium text-z-fg-danger hover:bg-z-danger-subtle [&_svg]:size-4"
            >
              <Trash2 aria-hidden />
              Delete
            </button>
          ) : (
            <span />
          )}
          {mode === "edit" && task && task.status !== "Completed" && (
            <Button variant="secondary" size="sm" icon={<Check aria-hidden />} onClick={onComplete}>
              <span className="max-[400px]:hidden">Mark complete</span>
            </Button>
          )}
          <span className="min-w-2 flex-1" />
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={save}>
            {mode === "edit" ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        <div className="flex flex-col gap-1.5">
          <span className="text-z-caption font-medium text-z-fg-secondary">Type</span>
          <SegmentedControl<TaskType>
            label="Task type"
            options={TASK_TYPES.map((t) => ({ value: t, label: t }))}
            value={type}
            onChange={setType}
            className="w-full overflow-x-auto [&>button]:flex-1 [&>button]:shrink-0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-z-caption font-medium text-z-fg-secondary">Linked lead or contact</span>
          {mode === "edit" ? (
            <div className="flex h-9 items-center gap-2 rounded-z-md border border-z-line-strong bg-z-sunken px-3 text-left">
              <Link2 aria-hidden className="size-4 shrink-0 text-z-icon" />
              <span className="min-w-0 flex-1 truncate text-z-body font-normal text-z-fg-secondary">
                {task?.recordName} · {task?.recordKind}
              </span>
            </div>
          ) : (
            <>
              <input
                id={leadId}
                list={`${leadId}-options`}
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Type to find a lead"
                className="z-focus h-9 w-full rounded-z-md border border-z-line-strong bg-z-surface px-3 text-z-body font-normal text-z-fg shadow-z-xs placeholder:text-z-fg-placeholder"
              />
              <datalist id={`${leadId}-options`}>
                {leads.map((l) => (
                  <option key={l.id} value={l.name} />
                ))}
              </datalist>
            </>
          )}
        </div>
        <div className={mode === "edit" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-1.5"}>
          <Select
            label="Assignee"
            value={ownerId ?? ""}
            onChange={(e) => setOwnerId(e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          {mode === "edit" ? (
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DateField label="Due date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input label="Time (optional)" type="time" required value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
        </div>
        {task?.linkedCall && (
          <div className="flex gap-3 rounded-z-md border border-z-line bg-z-subtle p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-z-md bg-z-accent-subtle [&_svg]:size-4 [&_svg]:text-z-fg-accent">
              <Phone aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-z-small font-medium text-z-fg">Created from a call</span>
              <span className="text-z-caption font-normal text-z-fg-secondary">
                Call with {task.linkedCall.person} · {task.linkedCall.when} · {task.linkedCall.outcome}
                {task.linkedCall.duration ? ` · ${task.linkedCall.duration}` : ""}. This task stays linked to{" "}
                {task.recordName}&apos;s lead record.
              </span>
            </span>
          </div>
        )}
        {task?.createdBy && <p className="text-z-caption font-normal text-z-fg-muted">{task.createdBy}</p>}
      </div>
    </Sheet>
  );
}

/** Delete confirmation built on the shared Overlay Modal (no window.confirm). */
export function TaskDeleteDialog({
  title,
  onClose,
  onDelete,
}: {
  title: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Delete task?"
      description={`“${title}” will be permanently deleted. This can't be undone.`}
      width={440}
      footer={
        <>
          <span className="min-w-2 flex-1" />
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="md" onClick={onDelete}>
            Delete
          </Button>
        </>
      }
    >
      <span />
    </Modal>
  );
}
