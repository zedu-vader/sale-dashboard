"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { apiRequest, callOutcomeLabel, formatCallDate, OUTCOME_LABELS, type CallOutcome, type CallRecord, type ConnectionStatus, type LeadOption, type TaskKind } from "./types";

const field = "flex flex-col gap-1.5 text-[12px] font-medium text-[#52525c]";
const control = "h-10 w-full rounded-md border border-[#e1e1e5] bg-white px-3 text-[13px] font-normal text-[#18181c] outline-none placeholder:text-[#a0a0ab] focus-visible:ring-2 focus-visible:ring-[#b9a8ff] focus-visible:ring-offset-1 disabled:bg-[#f4f4f5] disabled:text-[#71717c]";
const textarea = `${control} h-auto min-h-[94px] resize-y py-2.5`;
const secondary = "inline-flex h-9 items-center justify-center rounded-md border border-[#e1e1e5] bg-white px-3.5 text-[13px] font-medium text-[#18181c] hover:bg-[#fafafa] disabled:opacity-60";
const primary = "inline-flex h-9 items-center justify-center rounded-md bg-[#18181c] px-3.5 text-[13px] font-medium text-white hover:bg-[#303036] disabled:cursor-wait disabled:opacity-60";

function LocalDialog({ open, onClose, title, subtitle, children, footer, size = "max-w-[520px]" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; size?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose} onClick={(event) => event.target === ref.current && onClose()}
      className={`m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] ${size} overflow-hidden rounded-xl border border-[#e1e1e5] bg-white p-0 text-[#18181c] shadow-[0_16px_48px_rgba(24,24,28,.2)] backdrop:bg-[rgba(24,24,28,.4)]`}>
      <div className="flex max-h-[calc(100dvh-32px)] flex-col">
        <header className="flex min-h-[72px] items-start justify-between gap-4 border-b border-[#ebebee] px-6 py-4">
          <div><h2 id={titleId} className="m-0 text-[16px] font-semibold leading-6">{title}</h2>{subtitle && <p className="m-0 mt-1 text-[12px] leading-4 text-[#71717c]">{subtitle}</p>}</div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#71717c] hover:bg-[#f4f4f5]"><X size={17} /></button>
        </header>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-[#ebebee] bg-[#fafafa] px-6 py-4">{footer}</footer>}
      </div>
    </dialog>
  );
}

function defaultDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function localDateTime(value?: string | null) {
  if (!value) return defaultDateTime();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return defaultDateTime();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function CallLogDialog({ open, leads, callerName, initialLeadId = "", onClose, onSaved }: {
  open: boolean; leads: LeadOption[]; callerName: string; initialLeadId?: string; onClose: () => void; onSaved: () => void;
}) {
  const [leadId, setLeadId] = useState("");
  const [calledAt, setCalledAt] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTED");
  const [outcome, setOutcome] = useState<CallOutcome>("OTHER");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLeadId(initialLeadId); setCalledAt(defaultDateTime()); setDuration(""); setStatus("CONNECTED"); setOutcome("OTHER");
      setNotes(""); setNextAction(""); setFollowUpAt(""); setCreateTask(false); setError("");
    }
  }, [open, initialLeadId]);

  function changeStatus(value: ConnectionStatus) {
    setStatus(value);
    setOutcome(value === "NOT_CONNECTED" ? "NOT_APPLICABLE" : outcome === "NOT_APPLICABLE" ? "OTHER" : outcome);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!leadId) return setError("Select an existing lead.");
    if (!calledAt) return setError("Choose when the call took place.");
    if (duration && (!Number.isFinite(Number(duration)) || Number(duration) < 0 || !Number.isInteger(Number(duration)))) return setError("Duration must be a nonnegative whole number of seconds.");
    if (status === "NOT_CONNECTED" && outcome !== "NOT_APPLICABLE") return setError("A call that did not connect must use Not applicable.");
    if (status === "CONNECTED" && outcome === "NOT_APPLICABLE") return setError("Choose an outcome for a connected call.");
    if (createTask && (!nextAction.trim() || !followUpAt)) return setError("Add a next action and follow-up date to create a task.");
    setSaving(true); setError("");
    try {
      await apiRequest<CallRecord>("/api/calls", { method: "POST", body: JSON.stringify({
        leadId, calledAt: new Date(calledAt).toISOString(), durationSeconds: duration ? Number(duration) : null,
        connectionStatus: status, outcome, notes: notes.trim() || null, nextAction: nextAction.trim() || null,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null, createFollowUpTask: createTask,
      }) });
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save this call."); }
    finally { setSaving(false); }
  }

  return <LocalDialog open={open} onClose={onClose} title="Log call" subtitle="Record an outbound call already made through your phone system." footer={<><button type="button" className={secondary} onClick={onClose}>Cancel</button><button type="submit" form="call-log-form" disabled={saving} className={primary}>{saving ? "Saving…" : "Save call"}</button></>}>
    <form id="call-log-form" onSubmit={submit} className="flex flex-col gap-4">
      <label className={field}>Lead <span className="text-[#b42318]">*</span><select required value={leadId} onChange={(e) => setLeadId(e.target.value)} className={control}><option value="">Select a lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.phone}</option>)}</select></label>
      <label className={field}>Caller<div className="flex h-10 items-center rounded-md border border-[#e1e1e5] bg-[#fafafa] px-3 text-[13px] font-normal text-[#52525c]">{callerName}</div></label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={field}>Date and time <span className="text-[#b42318]">*</span><input required type="datetime-local" value={calledAt} onChange={(e) => setCalledAt(e.target.value)} className={control} /></label>
        <label className={field}>Duration <span className="font-normal text-[#71717c]">(seconds, optional)</span><input type="number" min="0" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} className={control} placeholder="e.g. 185" /></label>
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className={field}>Connection status <span className="text-[#b42318]">*</span></legend>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-[#f4f4f5] p-1">{(["CONNECTED", "NOT_CONNECTED"] as const).map((value) => <button type="button" key={value} aria-pressed={status === value} onClick={() => changeStatus(value)} className={`h-8 rounded px-2 text-[12px] ${status === value ? "bg-white font-medium text-[#18181c] shadow-sm" : "text-[#52525c]"}`}>{value === "CONNECTED" ? "Connected" : "Not connected"}</button>)}</div>
      </fieldset>
      <label className={field}>Call outcome <span className="text-[#b42318]">*</span><select value={outcome} disabled={status === "NOT_CONNECTED"} onChange={(e) => setOutcome(e.target.value as CallOutcome)} className={control}>{(Object.entries(OUTCOME_LABELS) as [CallOutcome, string][]).filter(([key]) => status === "NOT_CONNECTED" ? key === "NOT_APPLICABLE" : key !== "NOT_APPLICABLE").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className="text-[11px] font-normal text-[#71717c]">{status === "NOT_CONNECTED" ? "Not applicable is used when the call did not connect." : "Choose the result of the conversation."}</span></label>
      <label className={field}>Notes <span className="font-normal text-[#71717c]">(optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} rows={3} className={textarea} /></label>
      <div className="border-t border-[#ebebee] pt-4"><h3 className="m-0 text-[13px] font-medium text-[#18181c]">Next action <span className="font-normal text-[#71717c]">(optional)</span></h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className={field}>Action<input value={nextAction} onChange={(e) => setNextAction(e.target.value)} maxLength={500} className={control} placeholder="What needs to happen next?" /></label><label className={field}>Follow-up date<input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className={control} /></label></div>
        <label className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-[#52525c]"><input type="checkbox" checked={createTask} onChange={(e) => setCreateTask(e.target.checked)} className="mt-1 accent-[#18181c]" />Create a linked follow-up task{createTask && <span className="sr-only"> A next action and follow-up date are required.</span>}</label>
      </div>
      {error && <p role="alert" className="m-0 text-[12px] text-[#b42318]">{error}</p>}
    </form>
  </LocalDialog>;
}

export function CallTaskDialog({ call, open, onClose, onSaved }: { call: CallRecord | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<TaskKind>("Call");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setTitle(call?.nextAction ?? ""); setNotes(call?.notes ?? ""); setType("Call"); setDueAt(localDateTime(call?.followUpAt)); setError(""); } }, [open, call]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!call) return;
    if (!title.trim()) return setError("Enter a task title.");
    if (!dueAt) return setError("Choose a due date and time.");
    setSaving(true); setError("");
    try {
      await apiRequest(`/api/calls/${encodeURIComponent(call.id)}/tasks`, { method: "POST", body: JSON.stringify({ title: title.trim(), notes: notes.trim(), type, dueAt: new Date(dueAt).toISOString() }) });
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create the follow-up task."); }
    finally { setSaving(false); }
  }
  return <LocalDialog open={open} onClose={onClose} title="Create follow-up task" subtitle={call ? `From your call with ${call.lead?.name ?? "this lead"}` : undefined} footer={<><button type="button" className={secondary} onClick={onClose}>Cancel</button><button type="submit" form="call-task-form" disabled={saving} className={primary}>{saving ? "Saving…" : "Create task"}</button></>}>
    {call && <form id="call-task-form" onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-md bg-[#f0efff] px-3 py-2.5 text-[12px] leading-[18px] text-[#5048e5]">Linked to <strong>{call.lead?.name ?? "lead"}</strong>{call.lead?.name && call.lead?.phone ? ` · ${call.lead.phone}` : ""} and to the call on {formatCallDate(call.calledAt)}. This task will stay linked to the call and lead.</div>
      <label className={field}>Title <span className="text-[#b42318]">*</span><input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={control} /></label>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0"><legend className={field}>Type</legend><div className="grid grid-cols-3 gap-1 rounded-md bg-[#f4f4f5] p-1">{(["Call", "Email", "Note"] as const).map((value) => <button type="button" key={value} aria-pressed={type === value} onClick={() => setType(value)} className={`h-8 rounded text-[12px] ${type === value ? "bg-white font-medium text-[#18181c] shadow-sm" : "text-[#52525c]"}`}>{value}</button>)}</div></fieldset>
      <label className={field}>Assignee<div className="flex h-10 items-center rounded-md border border-[#e1e1e5] bg-[#fafafa] px-3 text-[13px] font-normal text-[#52525c]">Current user</div><span className="text-[11px] font-normal text-[#71717c]">Tasks created here are assigned to the signed-in user.</span></label>
      <label className={field}>Due date and time <span className="text-[#b42318">*</span><input required type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={control} /></label>
      <label className={field}>Description <span className="font-normal text-[#71717c]">(optional)</span><textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} className={textarea} /></label>
      {error && <p role="alert" className="m-0 text-[12px] text-[#b42318]">{error}</p>}
    </form>}
  </LocalDialog>;
}

export function CallDetailsDialog({ call, onClose, onCreateTask }: { call: CallRecord | null; onClose: () => void; onCreateTask: (call: CallRecord) => void }) {
  return <LocalDialog open={Boolean(call)} onClose={onClose} title="Call details" subtitle={call ? formatCallDate(call.calledAt) : undefined} footer={call ? <><button type="button" className={secondary} onClick={onClose}>Close</button><button type="button" className={primary} onClick={() => onCreateTask(call)}>Create follow-up task</button></> : undefined}>
    {call && <dl className="grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2">
      <Detail label="Lead" value={call.lead?.name ?? "Lead unavailable"} /><Detail label="Caller" value={call.caller?.name ?? call.callerName ?? "Unknown"} />
      <Detail label="Connection" value={call.connectionStatus === "CONNECTED" ? "Connected" : "Not connected"} /><Detail label="Outcome" value={callOutcomeLabel(call)} />
      <Detail label="Duration" value={call.durationSeconds === null ? "Not recorded" : `${call.durationSeconds} seconds`} /><Detail label="Follow-up date" value={call.followUpAt ? formatCallDate(call.followUpAt) : "—"} />
      <div className="sm:col-span-2"><Detail label="Next action" value={call.nextAction ?? "—"} /></div>
      <div className="sm:col-span-2"><Detail label="Notes" value={call.notes ?? "No notes"} /></div>
      <div className="sm:col-span-2"><dt className="text-[11px] text-[#71717c]">Linked tasks</dt><dd className="mt-1 space-y-1">{call.tasks.length ? call.tasks.map((task) => <p key={task.id} className="m-0">{task.title} · {task.done ? "Completed" : `Due ${formatCallDate(task.dueAt)}`}</p>) : <p className="m-0 text-[#71717c]">No tasks linked yet.</p>}</dd></div>
    </dl>}
  </LocalDialog>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-[11px] text-[#71717c]">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-[#18181c]">{value}</dd></div>; }
