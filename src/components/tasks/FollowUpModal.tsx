"use client";

import { useState } from "react";
import { ChevronDown, Clock, Link2 } from "lucide-react";
import { Button, DateField, FieldLabel, Input, SegmentedControl, Select, Textarea } from "@/components/zedu";
import { Modal } from "@/components/zedu/Overlay";
import { TASK_TYPES, lagosToday, type TaskType } from "@/data/tasks";

export type FollowUpDraft = {
  title: string;
  description: string;
  type: TaskType;
  /** User id, or null for Unassigned. */
  ownerId: string | null;
  dueDate: string;
  dueTime: string;
};

/** Create-follow-up modal (Figma task modal, Overlay Modal at 520px). */
export function FollowUpModal({
  leadName,
  callWhen,
  team,
  defaultOwnerId = null,
  onClose,
  onCreate,
}: {
  leadName: string;
  /** Null when created from a row with no call. */
  callWhen: string | null;
  team: { id: string; name: string }[];
  defaultOwnerId?: string | null;
  onClose: () => void;
  onCreate: (draft: FollowUpDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("Follow-up");
  const [ownerId, setOwnerId] = useState<string | null>(defaultOwnerId);
  const [dueDate, setDueDate] = useState(lagosToday(1));
  const [dueTime, setDueTime] = useState("09:00");
  const [description, setDescription] = useState("");

  return (
    <Modal
      open
      onClose={onClose}
      title="Create follow-up task"
      description={callWhen ? `From your call with ${leadName}` : `For ${leadName}`}
      width={520}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => onCreate({ title, description, type, ownerId, dueDate, dueTime })}>
            Create task
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="flex items-start gap-2 rounded-z-md bg-z-accent-subtle p-3 text-z-caption font-normal text-z-fg-accent">
          <Link2 aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Linked to {leadName} (Lead)
            {callWhen ? ` and to the call on ${callWhen}` : ""}. The link stays if you edit or reassign the task.
          </span>
        </p>
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Send pricing proposal" />
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Type</FieldLabel>
          <SegmentedControl<TaskType>
            label="Task type"
            options={TASK_TYPES.map((t) => ({ value: t, label: t }))}
            value={type}
            onChange={setType}
            className="w-full overflow-x-auto [&>button]:flex-1 [&>button]:shrink-0"
          />
        </div>
        <Select label="Assignee" value={ownerId ?? ""} onChange={(e) => setOwnerId(e.target.value || null)}>
          <option value="">Unassigned</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <DateField label="Due date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Time (optional)</FieldLabel>
            <span className="relative block">
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                aria-label="Due time"
                className="z-focus h-9 w-full rounded-z-md border border-z-line-strong bg-z-surface py-0 pl-9 pr-8 text-z-body font-normal text-z-fg shadow-z-xs"
              />
              <Clock aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-z-icon" />
              <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-z-icon" />
            </span>
          </div>
        </div>
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Asked for pricing for 3 outlets. Include the onboarding timeline."
        />
      </div>
    </Modal>
  );
}
