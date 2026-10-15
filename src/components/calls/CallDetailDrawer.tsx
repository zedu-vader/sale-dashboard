"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { formatDateTime, formatDurationShort, type CallRecord } from "@/data/calls";
import { CallerChip, OutcomeBadge } from "./CallBadges";

export default function CallDetailDrawer({
  call,
  history,
  onClose,
}: {
  call: CallRecord;
  history: CallRecord[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sorted = [...history].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Call details for ${call.name}`}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-modal">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <h2 className="text-lg font-bold text-ink">{call.name}</h2>
            <p className="text-sm text-ink-muted">
              {call.phone} · {call.leadType}
            </p>
            <div className="mt-2">
              <CallerChip initials={call.caller.initials} name={call.caller.name} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl bg-surface-sunken p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Latest outcome</span>
              <OutcomeBadge outcome={call.outcome} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-muted">Duration</span>
              <span className="font-medium text-ink">{formatDurationShort(call.durationSec)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-muted">Next action</span>
              <span className="font-medium text-ink">
                {call.nextAction ? `${call.nextAction.label} ${call.nextAction.date}` : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-muted">Attempts</span>
              <span className="font-medium text-ink">{call.attempts}</span>
            </div>
          </div>

          <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-ink-muted">
            Attempt timeline ({sorted.length})
          </h3>
          <ol className="border-l-2 border-line">
            {sorted.map((h) => {
              const dt = formatDateTime(h.startedAt);
              return (
                <li key={h.id} className="relative pb-5 pl-5 last:pb-0">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand ring-4 ring-brand-soft" />
                  <p className="text-sm font-medium text-ink">
                    {dt.date} · {dt.time}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatDurationShort(h.durationSec)} · by {h.caller.name}
                  </p>
                  <div className="mt-1">
                    <OutcomeBadge outcome={h.outcome} />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{h.notes}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}
