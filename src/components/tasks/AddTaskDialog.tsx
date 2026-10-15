"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { OWNERS, TASK_TYPES, type NewTask, type TaskType } from "./data";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: NewTask) => Promise<void>;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Next full hour, formatted for <input type="datetime-local">. */
function defaultDue() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

const label = "flex flex-col gap-1.5 text-xs font-semibold text-ink";
const input =
  "h-10 w-full rounded-[10px] border border-solid border-line bg-white px-3 font-[inherit] text-sm font-normal text-ink outline-none focus:border-brand";

export function AddTaskDialog({ open, onClose, onSubmit }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [lead, setLead] = useState("");
  const [type, setType] = useState<TaskType>("Call");
  const [owner, setOwner] = useState("You");
  const [dueAt, setDueAt] = useState(""); // set on open, so SSR and client markup match
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTitle("");
      setNotes("");
      setLead("");
      setType("Call");
      setOwner("You");
      setDueAt(defaultDue());
      setError("");
      dialog.showModal();
      dialog.querySelector("input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Give the task a title.");
    if (!dueAt) return setError("Pick a due date and time.");
    setSaving(true);
    setError("");
    try {
      await onSubmit({ title, notes, lead, type, owner, dueAt: new Date(dueAt).toISOString() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-32px)] max-w-md rounded-2xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-extrabold">Add Task</h2>
            <p className="m-0 mt-0.5 text-sm text-muted">Schedule a follow-up for a lead.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 flex-none cursor-pointer place-items-center rounded-lg bg-transparent p-0 text-muted hover:bg-canvas">
            <X size={18} />
          </button>
        </div>

        <label className={label}>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call Tunde Adebayo" maxLength={200} className={input} />
        </label>

        <label className={label}>
          <span>Notes <span className="font-normal text-muted">(optional)</span></span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What should happen?" maxLength={500} className={input} />
        </label>

        <label className={label}>
          <span>Related lead <span className="font-normal text-muted">(optional)</span></span>
          <input value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Lead or company name" maxLength={200} className={input} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as TaskType)} className={input}>
              {TASK_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Owner
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className={input}>
              {Object.keys(OWNERS).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>

        <label className={label}>
          Due
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={input} />
        </label>

        {error && (
          <p role="alert" className="m-0 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="inline-flex h-10 cursor-pointer items-center py-0 rounded-[10px] border border-solid border-line bg-white px-5 text-sm font-semibold text-brand hover:bg-canvas">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex h-10 cursor-pointer items-center py-0 rounded-[10px] border border-solid border-brand bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
            {saving ? "Saving…" : "Add Task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
