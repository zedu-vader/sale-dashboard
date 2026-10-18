"use client";

// New task from the top-bar "New" menu, on any page. Same fields and server action as the Tasks board's
// create panel; owners and leads load when the dialog opens.

import { useEffect, useState, useTransition } from "react";
import { createTask, getTaskFormOptions } from "@/app/actions";
import { TASK_TYPES, lagosToday, type TaskType } from "@/data/tasks";
import type { TeamMember } from "@/lib/leadTypes";
import { Alert, Button, DateField, Input, Modal, Select, Textarea } from "@/components/zedu";

type Options = { team: TeamMember[]; leads: { id: string; name: string }[] };

const blank = () => ({ title: "", description: "", type: "Follow-up" as TaskType, dueDate: lagosToday(1), dueTime: "09:00", ownerId: "", leadId: "" });

export function NewTaskModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (title: string) => void }) {
  const [options, setOptions] = useState<Options | null>(null);
  const [values, setValues] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setValues(blank());
    setError(null);
    let live = true;
    getTaskFormOptions()
      .then((o) => {
        if (!live) return;
        setOptions(o);
        // Assigned to me by default.
        setValues((v) => (v.ownerId ? v : { ...v, ownerId: o.team.find((m) => m.me)?.id ?? "" }));
      })
      .catch(() => live && setError("Couldn't load owners and leads. You can still create the task."));
    return () => {
      live = false;
    };
  }, [open]);

  const set = (patch: Partial<ReturnType<typeof blank>>) => setValues((v) => ({ ...v, ...patch }));

  const save = () => {
    if (!values.title.trim()) return setError("Enter what needs doing.");
    if (!values.dueDate) return setError("Pick a due date.");
    startTransition(async () => {
      try {
        const res = await createTask({ ...values, ownerId: values.ownerId || null, leadId: values.leadId || null, dueTime: values.dueTime || "09:00" });
        if (!res.ok) return setError(res.error);
        onClose();
        onCreated(values.title.trim());
      } catch {
        setError("Couldn't create the task. Check your connection and try again.");
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      title="New task"
      description="Add a follow-up or to-do for you or a teammate."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending} aria-busy={pending}>
            Create task
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {error && <Alert tone="danger" title={error} />}
        <Input
          label="Task"
          required
          placeholder="e.g. Send proposal to Lagoon Foods"
          value={values.title}
          maxLength={200}
          onChange={(e) => set({ title: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Select label="Type" value={values.type} onChange={(e) => set({ type: e.target.value as TaskType })}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="Owner" value={values.ownerId} onChange={(e) => set({ ownerId: e.target.value })}>
            <option value="">Unassigned</option>
            {options?.team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.me ? `${m.name} (you)` : m.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <DateField label="Due date" required value={values.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          <Input label="Time" type="time" value={values.dueTime} onChange={(e) => set({ dueTime: e.target.value })} />
        </div>
        <Select label="Linked lead (optional)" value={values.leadId} onChange={(e) => set({ leadId: e.target.value })}>
          <option value="">No linked lead</option>
          {options?.leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Textarea
          label="Notes (optional)"
          placeholder="Anything the owner should know."
          value={values.description}
          maxLength={2000}
          onChange={(e) => set({ description: e.target.value })}
        />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
