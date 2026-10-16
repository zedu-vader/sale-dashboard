"use client";

// Edit details panel (Figma 16847:23538), plus Log call and New task dialogs for the lead header buttons.
// The last two aren't in the Figma frames, so they reuse the Add lead modal's patterns.

import { useEffect, useState, useTransition } from "react";
import { createTask, logCall, updateLead } from "@/app/leads/actions";
import { validateLead, type LeadFormErrors, type LeadFormValues } from "@/lib/leadForm";
import type { LeadProfile, TeamMember } from "@/lib/leadTypes";
import { CALL_OUTCOMES, STAGES, STATUS_ORDER, TASK_TYPES } from "@/lib/status";
import { Alert, Button, Input, Modal, Select, Sheet, Textarea } from "@/components/zedu";
import { LeadFormFields, OwnerSelect } from "./LeadFormFields";

const toValues = (lead: LeadProfile): LeadFormValues => ({
  name: lead.name,
  phone: lead.phone,
  email: lead.email ?? "",
  company: lead.company ?? "",
  type: lead.type,
  status: lead.status,
  ownerId: lead.owner?.id ?? "",
});

export function EditLeadSheet({ lead, team, open, onClose }: { lead: LeadProfile; team: TeamMember[]; open: boolean; onClose: () => void }) {
  const [values, setValues] = useState(() => toValues(lead));
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setValues(toValues(lead));
    setErrors({});
    setFailed(false);
  }, [open, lead]);

  // After a failed save, re-check as the user fixes things.
  const hasErrors = Object.keys(errors).length > 0;
  useEffect(() => {
    if (hasErrors) setErrors(validateLead(values));
  }, [values, hasErrors]);

  const save = () => {
    const found = validateLead(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    startTransition(async () => {
      try {
        const res = await updateLead(lead.id, values);
        if (res.ok) onClose();
        else setErrors(res.errors);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow={`Lead · ${lead.code}`}
      title="Edit details"
      footer={
        <>
          <p className="min-w-0 flex-1 text-z-caption text-z-fg-muted">Changes show everywhere this lead appears.</p>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending} aria-busy={pending}>
            Save
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
        {failed && (
          <Alert tone="danger" title="Couldn't save your changes">
            Check your connection and try again.
          </Alert>
        )}
        <LeadFormFields
          layout="panel"
          values={values}
          errors={errors}
          team={team}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/** datetime-local value for "now + days" at the given hour. */
function localDateTime(days: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The lead fields Log call needs; a contact's linked lead can supply the same shape. */
export type CallLead = Pick<LeadProfile, "id" | "name" | "phone" | "status">;

export function LogCallModal({ lead, open, onClose }: { lead: CallLead; open: boolean; onClose: () => void }) {
  const [values, setValues] = useState({ outcome: "CONNECTED", minutes: "", notes: "", status: lead.status as string, followUp: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setValues({ outcome: "CONNECTED", minutes: "", notes: "", status: lead.status, followUp: "" });
      setError(null);
    }
  }, [open, lead.status]);

  const save = () =>
    startTransition(async () => {
      try {
        const res = await logCall(lead.id, values);
        if (res.ok) onClose();
        else setError(res.error);
      } catch {
        setError("Couldn't log the call. Check your connection and try again.");
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      title="Log call"
      description={`${lead.name} · ${lead.phone}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending} aria-busy={pending}>
            Log call
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="danger" title={error} />}
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Select label="Outcome" value={values.outcome} onChange={(e) => setValues({ ...values, outcome: e.target.value })}>
            {Object.entries(CALL_OUTCOMES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Input
            label="Duration (minutes)"
            type="number"
            min={0}
            max={600}
            inputMode="numeric"
            placeholder="e.g. 4"
            value={values.minutes}
            onChange={(e) => setValues({ ...values, minutes: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Select label="Status after the call" value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGES[s].label}
              </option>
            ))}
          </Select>
          <Input
            label="Follow up (optional)"
            type="datetime-local"
            value={values.followUp}
            onChange={(e) => setValues({ ...values, followUp: e.target.value })}
          />
        </div>
        <Textarea
          label="Call notes (optional)"
          placeholder="What did they say? What happens next?"
          value={values.notes}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
        />
      </div>
    </Modal>
  );
}

/** The lead fields New task needs; a contact's linked lead can supply the same shape. */
export type TaskLead = Pick<LeadProfile, "id" | "code" | "name" | "owner">;

export function NewTaskModal({ lead, team, open, onClose }: { lead: TaskLead; team: TeamMember[]; open: boolean; onClose: () => void }) {
  const me = team.find((m) => m.me)?.id ?? "";
  const [values, setValues] = useState({ title: "", type: "FOLLOW_UP", due: localDateTime(1, 10), ownerId: lead.owner?.id ?? me });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setValues({ title: "", type: "FOLLOW_UP", due: localDateTime(1, 10), ownerId: lead.owner?.id ?? me });
      setError(null);
    }
  }, [open, lead.owner?.id, me]);

  const save = () =>
    startTransition(async () => {
      try {
        const res = await createTask(lead.id, { ...values, due: new Date(values.due).toISOString() });
        if (res.ok) onClose();
        else setError(res.error);
      } catch {
        setError("Couldn't create the task. Check your connection and try again.");
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      title="New task"
      description={`Linked to ${lead.name} (${lead.code})`}
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
        <Input
          label="Task"
          required
          placeholder="e.g. Send proposal to Lagoon Foods"
          value={values.title}
          error={error?.startsWith("Enter") ? error : undefined}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Select label="Type" value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value })}>
            {Object.entries(TASK_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <Input
            label="Due"
            required
            type="datetime-local"
            value={values.due}
            error={error?.startsWith("Pick") ? error : undefined}
            onChange={(e) => setValues({ ...values, due: e.target.value })}
          />
        </div>
        <OwnerSelect team={team} value={values.ownerId} onChange={(ownerId) => setValues({ ...values, ownerId })} />
        {error && !error.startsWith("Enter") && !error.startsWith("Pick") && <Alert tone="danger" title={error} />}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
