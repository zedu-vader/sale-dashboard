"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { apiRequest, callOutcomeLabel, formatCallDate, formatDuration, type CallRecord, type ConnectionStatus } from "./types";

type Result = { items: CallRecord[]; nextCursor: string | null };

export function LeadCallHistory({ leadId }: { leadId: string }) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (next: string | null, append: boolean) => {
    append ? setMoreLoading(true) : setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (next) params.set("cursor", next);
      const result = await apiRequest<Result>(`/api/leads/${encodeURIComponent(leadId)}/calls?${params}`, { cache: "no-store" });
      setCalls((current) => append ? [...current, ...result.items] : result.items);
      setNextCursor(result.nextCursor);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load call history."); }
    finally { setLoading(false); setMoreLoading(false); }
  }, [leadId]);

  useEffect(() => { void load(null, false); }, [load]);

  return <section className="calls-theme rounded-lg border border-[#ebebee] bg-white text-[#18181c]">
    <header className="flex items-center justify-between gap-3 border-b border-[#ebebee] px-4 py-3 sm:px-5">
      <div><h2 className="m-0 text-[15px] font-semibold">Call history</h2><p className="m-0 mt-0.5 text-[12px] text-[#71717c]">Manually logged outbound calls</p></div>
      <Link href={`/calls?log=1&leadId=${encodeURIComponent(leadId)}`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#18181c] px-2.5 text-[12px] font-medium text-white"><Phone size={13} />Log call</Link>
    </header>
    {loading && <div aria-live="polite" className="space-y-3 p-4"><span className="sr-only">Loading call history</span>{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded bg-[#f4f4f5]" />)}</div>}
    {!loading && error && <div className="p-5 text-center"><p role="alert" className="m-0 text-[13px] text-[#b42318]">{error}</p><button type="button" onClick={() => void load(null, false)} className="mt-2 text-[12px] underline">Try again</button></div>}
    {!loading && !error && calls.length === 0 && <div className="px-5 py-9 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f4f4f5] text-[#52525c]"><Phone size={18} /></span><p className="mb-0 mt-3 text-[13px] font-medium">No calls logged for this lead</p><p className="mb-0 mt-1 text-[12px] text-[#71717c]">Calls are recorded manually after they are made.</p></div>}
    {calls.length > 0 && <div className="divide-y divide-[#ebebee]">{calls.map((call) => <article key={call.id} className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="m-0 text-[12px] font-medium text-[#18181c]">{formatCallDate(call.calledAt)}</p><Status value={call.connectionStatus} /></div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#52525c]"><span>Caller: {call.caller?.name ?? call.callerName ?? "Unknown"}</span><span>Outcome: {callOutcomeLabel(call)}</span><span>Duration: {formatDuration(call.durationSeconds)}</span></div>
      {call.notes && <p className="mb-0 mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[#52525c]">{call.notes}</p>}
      {(call.nextAction || call.followUpAt) && <p className="mb-0 mt-2 text-[12px] text-[#52525c]">Next action: {call.nextAction ?? "Follow up"}{call.followUpAt ? ` · ${formatCallDate(call.followUpAt)}` : ""}</p>}
      {call.tasks.length > 0 && <p className="mb-0 mt-2 text-[11px] text-[#71717c]">{call.tasks.length} linked {call.tasks.length === 1 ? "task" : "tasks"}: {call.tasks.map((task) => task.title).join(", ")}</p>}
    </article>)}</div>}
    {nextCursor && <div className="border-t border-[#ebebee] p-3 text-center"><button disabled={moreLoading} type="button" onClick={() => void load(nextCursor, true)} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#e1e1e5] px-3 text-[12px] font-medium disabled:opacity-50">{moreLoading ? "Loading…" : "Show older calls"}<ChevronDown size={13} /></button></div>}
  </section>;
}

function Status({ value }: { value: ConnectionStatus }) {
  const connected = value === "CONNECTED";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${connected ? "bg-[#ecfdf3] text-[#067647]" : "bg-[#f4f4f5] text-[#52525c]"}`}><i aria-hidden className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#12b76a]" : "bg-[#71717c]"}`} />{connected ? "Connected" : "Not connected"}</span>;
}
