"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Phone, Plus, Search } from "lucide-react";
import { CallDetailsDialog, CallLogDialog, CallTaskDialog } from "./CallDialogs";
import { apiRequest, callOutcomeLabel, formatCallDate, formatDuration, OUTCOME_LABELS, type CallOutcome, type CallRecord, type CallerOption, type ConnectionStatus, type LeadOption } from "./types";

type Filters = { q: string; leadId: string; callerId: string; status: string; outcome: string; from: string; to: string };
type PageData = { items: CallRecord[]; nextCursor: string | null };
const defaultFilters: Filters = { q: "", leadId: "", callerId: "", status: "", outcome: "", from: "", to: "" };
const emptyPreviewData: CallRecord[] = [];
const button = "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#e1e1e5] bg-white px-3 text-[13px] font-medium text-[#18181c] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50";
const selectClass = "h-9 min-w-0 rounded-md border border-[#e1e1e5] bg-white px-2.5 text-[12px] text-[#52525c] outline-none focus-visible:ring-2 focus-visible:ring-[#b9a8ff]";

export function CallsPage({ leads, callers, callerName, previewMode = false, previewData = emptyPreviewData }: { leads: LeadOption[]; callers: CallerOption[]; callerName: string; previewMode?: boolean; previewData?: CallRecord[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(defaultFilters);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [logging, setLogging] = useState(false);
  const [logLeadId, setLogLeadId] = useState("");
  const [detail, setDetail] = useState<CallRecord | null>(null);
  const [taskCall, setTaskCall] = useState<CallRecord | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (searchParams.get("log") === "1") {
      setLogLeadId(searchParams.get("leadId") ?? "");
      setLogging(true);
      router.replace(previewMode ? "/calls/preview" : "/calls", { scroll: false });
    }
  }, [router, searchParams]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "25" });
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.leadId) params.set("leadId", filters.leadId);
    if (filters.callerId) params.set("callerId", filters.callerId);
    if (filters.status) params.set("status", filters.status);
    if (filters.outcome) params.set("outcome", filters.outcome);
    if (filters.from) params.set("from", new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) { const end = new Date(`${filters.to}T00:00:00`); end.setDate(end.getDate() + 1); params.set("to", end.toISOString()); }
    if (cursor) params.set("cursor", cursor);
    return params.toString();
  }, [filters, cursor]);

  const previewItems = useMemo(() => {
    const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
    const to = filters.to ? new Date(`${filters.to}T00:00:00`) : null;
    if (to) to.setDate(to.getDate() + 1);
    const q = filters.q.trim().toLocaleLowerCase();
    return previewData.filter((call) => {
      const haystack = [call.lead?.name, call.lead?.phone, call.caller?.name, call.callerName, call.notes, call.nextAction, callOutcomeLabel(call)].join(" ").toLocaleLowerCase();
      const calledAt = new Date(call.calledAt);
      return (!q || haystack.includes(q))
        && (!filters.leadId || call.leadId === filters.leadId)
        && (!filters.callerId || call.callerId === filters.callerId)
        && (!filters.status || call.connectionStatus === filters.status)
        && (!filters.outcome || call.outcome === filters.outcome)
        && (!from || calledAt >= from)
        && (!to || calledAt < to);
    });
  }, [filters, previewData]);

  useEffect(() => {
    if (previewMode) {
      setLoading(true); setError("");
      const offset = cursor ? Number(cursor) : 0;
      setData({
        items: previewItems.slice(offset, offset + 25),
        nextCursor: offset + 25 < previewItems.length ? String(offset + 25) : null,
      });
      setLoading(false);
      return;
    }
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      apiRequest<PageData>(`/api/calls?${query}`, { cache: "no-store", signal: abort.signal })
        .then(setData)
        .catch((err: Error) => { if (err.name !== "AbortError") { setError(err.message); setData(null); } })
        .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    }, filters.q ? 250 : 0);
    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [query, refresh, previewMode, previewItems, cursor]);

  const updateFilter = useCallback((patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setCursor(null); setCursorStack([]);
  }, []);

  const savedCall = () => { setRefresh((n) => n + 1); setNotice("Call logged successfully."); window.setTimeout(() => setNotice(""), 4500); };
  const savedTask = () => { setRefresh((n) => n + 1); setNotice("Follow-up task created and linked to this call and lead."); window.setTimeout(() => setNotice(""), 4500); };

  const hasFilters = Object.values(filters).some(Boolean);
  return <section className="calls-theme text-[#18181c]">
    {previewMode && <div role="status" className="mb-4 rounded-md border border-[#f3d38a] bg-[#fff8e6] px-3 py-2.5 text-[13px] font-medium text-[#704d00]">Preview mode — changes are not saved. This page uses sample data only.</div>}
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#ebebee] pb-4 sm:mb-6 sm:pb-5">
      <div><h1 className="m-0 text-[24px] font-semibold leading-8 tracking-[-.03em]">Calls</h1><p className="m-0 mt-1 max-w-[620px] text-[13px] leading-5 text-[#71717c]">Outbound calls logged by the team. Records are entered manually after calls are made.</p></div>
      <button type="button" onClick={() => { setLogLeadId(""); setLogging(true); }} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#18181c] px-3.5 text-[13px] font-medium text-white hover:bg-[#303036]"><Phone size={15} />Log call</button>
    </div>

    {notice && <p role="status" className="mb-4 rounded-md border border-[#a6f4c5] bg-[#ecfdf3] px-3 py-2 text-[13px] text-[#067647]">{notice}</p>}

    <div className="mb-3 rounded-lg border border-[#ebebee] bg-white p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(115px,1fr))]">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-[#e1e1e5] px-2.5 focus-within:ring-2 focus-within:ring-[#b9a8ff]"><Search size={15} className="shrink-0 text-[#71717c]" /><span className="sr-only">Search calls</span><input value={filters.q} onChange={(e) => updateFilter({ q: e.target.value })} placeholder="Search calls, leads, notes…" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#a0a0ab]" /></label>
        <label className="sr-only" htmlFor="calls-lead-filter">Filter by lead</label><select id="calls-lead-filter" value={filters.leadId} onChange={(e) => updateFilter({ leadId: e.target.value })} className={selectClass}><option value="">All leads</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select>
        <label className="sr-only" htmlFor="calls-caller-filter">Filter by caller</label><select id="calls-caller-filter" value={filters.callerId} onChange={(e) => updateFilter({ callerId: e.target.value })} className={selectClass}><option value="">All callers</option>{callers.map((caller) => <option key={caller.id} value={caller.id}>{caller.name}</option>)}</select>
        <label className="sr-only" htmlFor="calls-status-filter">Filter by connection</label><select id="calls-status-filter" value={filters.status} onChange={(e) => updateFilter({ status: e.target.value })} className={selectClass}><option value="">All connection statuses</option><option value="CONNECTED">Connected</option><option value="NOT_CONNECTED">Not connected</option></select>
        <label className="sr-only" htmlFor="calls-outcome-filter">Filter by outcome</label><select id="calls-outcome-filter" value={filters.outcome} onChange={(e) => updateFilter({ outcome: e.target.value })} className={selectClass}><option value="">All outcomes</option>{(Object.entries(OUTCOME_LABELS) as [CallOutcome, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CalendarDays size={14} aria-hidden className="text-[#71717c]" />
        <label className="sr-only" htmlFor="calls-from">From date</label><input id="calls-from" aria-label="From date" type="date" value={filters.from} onChange={(e) => updateFilter({ from: e.target.value })} className={selectClass} />
        <span className="text-[12px] text-[#71717c]">to</span>
        <label className="sr-only" htmlFor="calls-to">To date</label><input id="calls-to" aria-label="To date" type="date" value={filters.to} onChange={(e) => updateFilter({ to: e.target.value })} className={selectClass} />
        {hasFilters && <button type="button" onClick={() => updateFilter(defaultFilters)} className="ml-auto h-8 px-2 text-[12px] font-medium text-[#52525c] underline underline-offset-2">Clear filters</button>}
      </div>
    </div>

    <div className="overflow-hidden rounded-lg border border-[#ebebee] bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[940px] border-collapse text-left">
          <thead className="bg-[#fafafa]"><tr>{["Lead or contact", "Caller", "Date and time", "Connection", "Outcome", "Duration", "Next action", ""].map((title, i) => <th key={`${title}-${i}`} scope="col" className="h-10 border-b border-[#ebebee] px-3 text-[10px] font-medium uppercase tracking-[.08em] text-[#71717c]">{title}</th>)}</tr></thead>
          <tbody>{!loading && data?.items.map((call) => <tr key={call.id} className="h-[52px] border-b border-[#ebebee] last:border-0 hover:bg-[#fafafa]">
            <td className="max-w-[210px] px-3"><LeadLink call={call} previewMode={previewMode} onPreviewLead={() => updateFilter({ leadId: call.leadId ?? "" })} /></td><td className="max-w-[140px] truncate px-3 text-[12px] text-[#52525c]">{call.caller?.name ?? call.callerName ?? "—"}</td>
            <td className="whitespace-nowrap px-3 text-[12px] text-[#52525c]">{formatCallDate(call.calledAt)}</td><td className="px-3"><Status value={call.connectionStatus} /></td><td className="px-3 text-[12px] text-[#52525c]">{callOutcomeLabel(call)}</td><td className="whitespace-nowrap px-3 text-[12px] text-[#52525c]">{formatDuration(call.durationSeconds)}</td>
            <td className="max-w-[190px] px-3"><span className="block truncate text-[12px] text-[#52525c]">{call.nextAction ? `${call.nextAction}${call.followUpAt ? ` · ${new Date(call.followUpAt).toLocaleDateString("en", { month: "short", day: "numeric" })}` : ""}` : "—"}</span></td>
            <td className="px-3"><button type="button" className="text-[12px] font-medium text-[#18181c] underline underline-offset-2" onClick={() => setDetail(call)}>View</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="divide-y divide-[#ebebee] md:hidden">{!loading && data?.items.map((call) => <article key={call.id} className="p-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><LeadLink call={call} previewMode={previewMode} onPreviewLead={() => updateFilter({ leadId: call.leadId ?? "" })} /><p className="m-0 mt-1 text-[12px] text-[#71717c]">{call.caller?.name ?? call.callerName ?? "—"} · {formatCallDate(call.calledAt)}</p></div><button type="button" className="shrink-0 text-[12px] font-medium underline underline-offset-2" onClick={() => setDetail(call)}>Details</button></div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Status value={call.connectionStatus} /><span className="rounded-full bg-[#f4f4f5] px-2 py-1 text-[11px] text-[#52525c]">{callOutcomeLabel(call)}</span><span className="inline-flex items-center gap-1 text-[11px] text-[#71717c]"><Clock3 size={12} />{formatDuration(call.durationSeconds)}</span></div>
        {call.nextAction && <p className="m-0 mt-2 text-[12px] text-[#52525c]">Next: {call.nextAction}{call.followUpAt ? ` · ${new Date(call.followUpAt).toLocaleDateString()}` : ""}</p>}
      </article>)}</div>
      {loading && <div aria-live="polite" className="space-y-3 p-4"><p className="sr-only">Loading calls</p>{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-9 animate-pulse rounded bg-[#f4f4f5]" />)}</div>}
      {!loading && error && <div role="alert" className="p-8 text-center"><p className="m-0 text-[13px] text-[#b42318]">Couldn’t load calls: {error}</p><button type="button" className={`${button} mt-3`} onClick={() => setRefresh((n) => n + 1)}>Try again</button></div>}
      {!loading && !error && data?.items.length === 0 && <div className="px-5 py-12 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f4f4f5] text-[#52525c]"><Phone size={19} /></span><h2 className="mb-1 mt-3 text-[15px] font-semibold">{hasFilters ? "No calls match these filters" : "No calls logged yet"}</h2><p className="mx-auto max-w-sm text-[12px] leading-5 text-[#71717c]">{hasFilters ? "Try changing or clearing your filters." : "Calls are entered manually after they are made through your team's phone system."}</p>{!hasFilters && <button type="button" className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-[#18181c] px-3.5 text-[13px] font-medium text-white" onClick={() => { setLogLeadId(""); setLogging(true); }}><Plus size={14} />Log call</button>}</div>}
      {!loading && !error && data?.items.length !== 0 && <div className="flex items-center justify-between border-t border-[#ebebee] px-3 py-2.5 sm:px-4"><span className="text-[11px] text-[#71717c]">Showing {data?.items.length ?? 0} calls</span><div className="flex gap-2"><button type="button" className={button} disabled={!cursorStack.length || loading} onClick={() => { setCursor(cursorStack.at(-1) ?? null); setCursorStack((stack) => stack.slice(0, -1)); }}><ChevronLeft size={14} />Previous</button><button type="button" className={button} disabled={!data?.nextCursor || loading} onClick={() => { if (data?.nextCursor) { setCursorStack((stack) => [...stack, cursor]); setCursor(data.nextCursor); } }}>Next<ChevronRight size={14} /></button></div></div>}
    </div>
    <CallLogDialog open={logging} leads={leads} callerName={callerName} initialLeadId={logLeadId} previewMode={previewMode} onClose={() => setLogging(false)} onSaved={savedCall} />
    <CallTaskDialog call={taskCall} open={Boolean(taskCall)} previewMode={previewMode} onClose={() => setTaskCall(null)} onSaved={savedTask} />
    <CallDetailsDialog call={detail} onClose={() => setDetail(null)} onCreateTask={(call) => { setDetail(null); setTaskCall(call); }} />
  </section>;
}

function LeadLink({ call, previewMode = false, onPreviewLead }: { call: CallRecord; previewMode?: boolean; onPreviewLead?: () => void }) {
  if (!call.lead) return <span className="text-[12px] text-[#71717c]">Lead unavailable</span>;
  if (previewMode) return <button type="button" onClick={onPreviewLead} className="block max-w-full truncate text-left text-[13px] font-medium text-[#18181c] underline decoration-transparent underline-offset-2 hover:decoration-current">{call.lead.name}<span className="ml-1.5 text-[11px] font-normal text-[#71717c]">{call.lead.phone}</span></button>;
  return <Link href={`/leads/${encodeURIComponent(call.lead.id)}`} className="block truncate text-[13px] font-medium text-[#18181c] underline decoration-transparent underline-offset-2 hover:decoration-current">{call.lead.name}<span className="ml-1.5 text-[11px] font-normal text-[#71717c]">{call.lead.phone}</span></Link>;
}

function Status({ value }: { value: ConnectionStatus }) {
  const connected = value === "CONNECTED";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium ${connected ? "bg-[#ecfdf3] text-[#067647]" : "bg-[#f4f4f5] text-[#52525c]"}`}><i aria-hidden className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#12b76a]" : "bg-[#71717c]"}`} />{connected ? "Connected" : "Not connected"}</span>;
}
