"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Clock, Link2, UserRound, X } from "lucide-react";
import { Button, Checkbox, FieldLabel, IconButton, Input, SegmentedControl } from "@/components/zedu";
import { TASK_TYPES, type TaskType } from "@/data/tasks";

/** Create-follow-up modal (Figma 7:4272): 520px centred, prefilled + locked to the call's lead. */
export function FollowUpModal({
  leadName,
  callWhen,
  onClose,
  onCreate,
}: {
  leadName: string;
  callWhen: string;
  onClose: () => void;
  onCreate: (draft: { title: string; description: string; type: TaskType }) => void;
}) {
  const [title, setTitle] = useState("Send pricing proposal");
  const [type, setType] = useState<TaskType>("Follow-up");
  const [description, setDescription] = useState("Asked for pricing for 3 outlets. Include the onboarding timeline.");
  const [showAsNext, setShowAsNext] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="Create follow-up task">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default bg-[rgba(12,12,15,0.4)]" />
      <div className="relative flex w-[520px] max-w-full flex-col overflow-hidden rounded-2xl bg-z-surface shadow-z-lg">
        <div className="flex items-start gap-2 px-6 pb-1 pt-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-z-section text-z-fg">Create follow-up task</h2>
            <p className="text-z-small font-normal text-z-fg-muted">From your call with {leadName}</p>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X aria-hidden />
          </IconButton>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
          <p className="flex items-start gap-2 rounded-z-md bg-z-accent-subtle p-3 text-z-caption font-normal text-z-fg-accent">
            <Link2 aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              Linked to {leadName} (Lead · Lagoon Foods) and to the call on {callWhen}. The link stays if you
              edit or reassign the task.
            </span>
          </p>
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
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
            <FieldLabel>Assignee</FieldLabel>
            <button
              type="button"
              className="z-focus flex h-9 items-center gap-2 rounded-z-md border border-z-line-strong bg-z-surface px-3 text-left shadow-z-xs"
            >
              <UserRound aria-hidden className="size-4 shrink-0 text-z-icon" />
              <span className="min-w-0 flex-1 truncate text-z-body font-normal text-z-fg">Agnes Okafor (you)</span>
              <ChevronDown aria-hidden className="size-4 shrink-0 text-z-icon" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Due date</FieldLabel>
              <button
                type="button"
                className="z-focus flex h-9 items-center gap-2 rounded-z-md border border-z-line-strong bg-z-surface px-3 text-left shadow-z-xs"
              >
                <CalendarDays aria-hidden className="size-4 shrink-0 text-z-icon" />
                <span className="min-w-0 flex-1 truncate text-z-body font-normal text-z-fg">Fri, Oct 16, 2026</span>
                <ChevronDown aria-hidden className="size-4 shrink-0 text-z-icon" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Time (optional)</FieldLabel>
              <button
                type="button"
                className="z-focus flex h-9 items-center gap-2 rounded-z-md border border-z-line-strong bg-z-surface px-3 text-left shadow-z-xs"
              >
                <Clock aria-hidden className="size-4 shrink-0 text-z-icon" />
                <span className="min-w-0 flex-1 truncate text-z-body font-normal text-z-fg">3:00 PM</span>
                <ChevronDown aria-hidden className="size-4 shrink-0 text-z-icon" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Description (optional)</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="z-focus h-24 w-full resize-none rounded-z-md border border-z-line-strong bg-z-surface px-3 py-2 text-z-body font-normal text-z-fg shadow-z-xs placeholder:text-z-fg-placeholder"
            />
          </div>
          <Checkbox
            label="Show as the lead's next action"
            checked={showAsNext}
            onChange={(e) => setShowAsNext(e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-z-line bg-z-surface px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => onCreate({ title, description, type })}>
            Create task
          </Button>
        </div>
      </div>
    </div>
  );
}
