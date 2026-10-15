"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  CALL_OUTCOMES,
  initialsFromName,
  type CallOutcome,
  type CallRecord,
} from "@/data/calls";

export interface LogCallInput {
  leadName: string;
  outcome: CallOutcome;
  durationMin: number;
  durationSec: number;
  notes: string;
  nextAction: string;
  followUpDate: string;
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand";

export function buildCallRecord(input: LogCallInput): CallRecord {
  const name = input.leadName.trim();
  return {
    id: `log-${Date.now()}`,
    name,
    initials: initialsFromName(name),
    phone: "+234 —",
    leadType: "Individual",
    startedAt: new Date().toISOString(),
    durationSec: input.durationMin * 60 + input.durationSec,
    outcome: input.outcome,
    caller: { initials: "AO", name: "Agnes" },
    nextAction: input.nextAction
      ? {
          label: input.nextAction,
          date: input.followUpDate
            ? new Date(`${input.followUpDate}T09:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "",
        }
      : null,
    notes: input.notes.trim() || "—",
    attempts: 1,
  };
}

const LEAD_OPTIONS = [
  "Tunde Adebayo",
  "Flourish Ltd",
  "Kemi Ibrahim",
  "Ben Okafor",
  "Amaka Akintola",
  "Daniel Osei",
];

const NEXT_ACTIONS = ["Call again", "Call back", "Send details", "Follow up"];

export default function LogCallPanel({ onSave }: { onSave: (input: LogCallInput) => void }) {
  const [leadName, setLeadName] = useState("");
  const [outcome, setOutcome] = useState<CallOutcome | "">("");
  const [durationMin, setDurationMin] = useState("");
  const [durationSec, setDurationSec] = useState("");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setLeadName("");
    setOutcome("");
    setDurationMin("");
    setDurationSec("");
    setNotes("");
    setNextAction("");
    setFollowUpDate("");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) return setError("Please select a lead.");
    if (!outcome) return setError("Please select a call outcome.");
    onSave({
      leadName,
      outcome,
      durationMin: Number(durationMin) || 0,
      durationSec: Number(durationSec) || 0,
      notes,
      nextAction,
      followUpDate,
    });
    reset();
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-label="Log a call">
      <h2 className="mb-4 text-base font-bold text-ink">Log a Call</h2>
      <form onSubmit={submit} className="space-y-3.5">
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <label className="block text-[13px] font-semibold text-ink">
          Select Lead *
          <span className="relative mt-1 block">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              list="log-lead-options"
              placeholder="Search or select a lead"
              className={`${inputCls} pl-9`}
            />
            <datalist id="log-lead-options">
              {LEAD_OPTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </span>
        </label>

        <label className="block text-[13px] font-semibold text-ink">
          Call Outcome *
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as CallOutcome)}
            className={`${inputCls} mt-1`}
          >
            <option value="">Select outcome</option>
            {CALL_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <div className="text-[13px] font-semibold text-ink">
          Call Duration
          <div className="mt-1 flex items-center gap-2">
            <input
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value.replace(/\D/g, ""))}
              placeholder="00"
              inputMode="numeric"
              className={`${inputCls} w-20 text-center`}
              aria-label="Duration minutes"
            />
            <span className="text-xs font-normal text-ink-muted">min</span>
            <input
              value={durationSec}
              onChange={(e) => setDurationSec(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="00"
              inputMode="numeric"
              className={`${inputCls} w-20 text-center`}
              aria-label="Duration seconds"
            />
            <span className="text-xs font-normal text-ink-muted">sec</span>
          </div>
        </div>

        <label className="block text-[13px] font-semibold text-ink">
          Call Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add a brief note about the conversation…"
            className={`${inputCls} mt-1 resize-none`}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[13px] font-semibold text-ink">
            Next Action
            <select
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              <option value="">Select next action</option>
              {NEXT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-semibold text-ink">
            Follow-up Date
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-brand hover:bg-surface-sunken"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-bright"
          >
            Save Call
          </button>
        </div>
      </form>
    </section>
  );
}
