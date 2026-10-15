"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Phone, PhoneMissed } from "lucide-react";
import type { CallOutcome, CallRecord, FollowUp } from "@/data/calls";
import CallStats, { type StatDef } from "./CallStats";
import CallFilters, { type LeadTypeFilter } from "./CallFilters";
import CallTable from "./CallTable";
import CallDetailDrawer from "./CallDetailDrawer";
import LogCallPanel, { type LogCallInput } from "./LogCallPanel";
import { buildCallRecord } from "./LogCallPanel";
import CallOutcomeBreakdown, { type DonutScope, type DonutSlice } from "./CallOutcomeBreakdown";

export type Period = "7d" | "15d" | "all";

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "15d": 15, all: 3650 };

const REACHED: CallOutcome[] = ["Connected", "Interested", "Converted", "Requested callback"];

function periodLabel(period: Period): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const end = new Date();
  if (period === "all") return `All time – ${fmt(end)}`;
  const start = new Date(Date.now() - (PERIOD_DAYS[period] - 1) * 86400000);
  return `${fmt(start)} – ${fmt(end)}`;
}

function pctChange(curr: number, prev: number): { text: string; up: boolean } {
  if (prev === 0) return { text: curr > 0 ? "new" : "0%", up: curr > 0 };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { text: `${Math.abs(pct)}%`, up: pct >= 0 };
}

const DONUT_COLORS = [
  "var(--brand)",
  "var(--brand-bright)",
  "var(--color-indigo-300)",
  "var(--color-coral-500)",
  "var(--color-indigo-100)",
  "rgb(var(--success-rgb))",
];

export default function CallsClient({ initialCalls }: { initialCalls: CallRecord[]; initialFollowUps: FollowUp[] }) {
  const [calls, setCalls] = useState<CallRecord[]>(initialCalls);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<CallOutcome | "All">("All");
  const [caller, setCaller] = useState("All");
  const [leadType, setLeadType] = useState<LeadTypeFilter>("All");
  const [period, setPeriod] = useState<Period>("15d");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [donutScope, setDonutScope] = useState<DonutScope>("period");

  useEffect(() => {
    setPage(1);
  }, [query, outcome, caller, leadType, period]);

  const callers = useMemo(() => Array.from(new Set(calls.map((c) => c.caller.name))), [calls]);

  const filtersActive = query.trim() !== "" || outcome !== "All" || caller !== "All" || leadType !== "All";
  const resetFilters = () => {
    setQuery("");
    setOutcome("All");
    setCaller("All");
    setLeadType("All");
  };

  const inPeriod = useMemo(() => {
    const from = Date.now() - PERIOD_DAYS[period] * 86400000;
    return calls.filter((c) => +new Date(c.startedAt) >= from);
  }, [calls, period]);

  const prevPeriod = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const end = Date.now() - days * 86400000;
    const start = end - days * 86400000;
    return calls.filter((c) => {
      const t = +new Date(c.startedAt);
      return t >= start && t < end;
    });
  }, [calls, period]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inPeriod
      .filter((c) => {
        if (outcome !== "All" && c.outcome !== outcome) return false;
        if (caller !== "All" && c.caller.name !== caller) return false;
        if (leadType !== "All" && c.leadType !== leadType) return false;
        if (q && !`${c.name} ${c.phone}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  }, [inPeriod, query, outcome, caller, leadType]);

  const summarize = (list: CallRecord[]) => {
    const reached = list.filter((c) => REACHED.includes(c.outcome));
    const unanswered = list.filter((c) => c.outcome === "No answer");
    const withDur = reached.filter((c) => c.durationSec !== null);
    return {
      total: list.length,
      reached: reached.length,
      unanswered: unanswered.length,
      avg: withDur.length === 0 ? 0 : withDur.reduce((s, c) => s + (c.durationSec as number), 0) / withDur.length,
    };
  };

  const curr = summarize(filtered);
  const prev = summarize(prevPeriod);

  const trend = (pick: (c: CallRecord) => number): number[] => {
    const days = Math.min(PERIOD_DAYS[period], 15);
    const buckets = new Array(days).fill(0);
    const today = new Date();
    filtered.forEach((c) => {
      const d = new Date(c.startedAt);
      const diff = Math.round(
        (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
          new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
          86400000
      );
      if (diff >= 0 && diff < days) buckets[days - 1 - diff] += pick(c);
    });
    return buckets;
  };

  const fmtAvg = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const totalDelta = pctChange(curr.total, prev.total);
  const reachedDelta = pctChange(curr.reached, prev.reached);
  const unansweredDelta = pctChange(curr.unanswered, prev.unanswered);
  const avgDelta = pctChange(Math.round(curr.avg), Math.round(prev.avg));

  const stats: StatDef[] = [
    {
      label: "Total Calls",
      value: String(curr.total),
      delta: totalDelta.text,
      deltaUp: totalDelta.up,
      deltaGood: totalDelta.up,
      iconBg: "bg-brand-soft text-brand",
      icon: <Phone size={20} />,
      trend: trend(() => 1),
    },
    {
      label: "Connected Calls",
      value: String(curr.reached),
      delta: reachedDelta.text,
      deltaUp: reachedDelta.up,
      deltaGood: reachedDelta.up,
      iconBg: "bg-brand-soft text-brand",
      icon: <Phone size={20} />,
      trend: trend((c) => (REACHED.includes(c.outcome) ? 1 : 0)),
    },
    {
      label: "Unanswered",
      value: String(curr.unanswered),
      delta: unansweredDelta.text,
      deltaUp: !unansweredDelta.up,
      deltaGood: false,
      iconBg: "bg-danger/15 text-danger",
      icon: <PhoneMissed size={20} />,
      trend: trend((c) => (c.outcome === "No answer" ? 1 : 0)),
    },
    {
      label: "Avg. Call Duration",
      value: fmtAvg(curr.avg),
      delta: avgDelta.text,
      deltaUp: avgDelta.up,
      deltaGood: avgDelta.up,
      iconBg: "bg-brand-soft text-brand",
      icon: <Clock size={20} />,
      trend: trend((c) => c.durationSec ?? 0),
    },
  ];

  const donut = useMemo((): { total: number; slices: DonutSlice[] } => {
    const source = donutScope === "all" ? calls : filtered;
    const counts = new Map<string, number>();
    source.forEach((c) => counts.set(c.outcome, (counts.get(c.outcome) ?? 0) + 1));
    const order = ["Connected", "Interested", "No answer", "Not interested", "Requested callback", "Converted"];
    const slices: DonutSlice[] = order
      .filter((o) => counts.has(o))
      .map((o, i) => ({ label: o, count: counts.get(o) as number, color: DONUT_COLORS[i % DONUT_COLORS.length] }));
    return { total: source.length, slices };
  }, [calls, filtered, donutScope]);

  const history = useMemo(() => {
    if (!selected) return [];
    return calls.filter((c) => c.phone === selected.phone || c.name === selected.name);
  }, [calls, selected]);

  const handleSave = (input: LogCallInput) => {
    setCalls((prevCalls) => [buildCallRecord(input), ...prevCalls]);
    document.getElementById("call-logs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToLogger = () => {
    document.getElementById("log-a-call")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Calls</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Track and manage all outbound calls. Log outcomes, add notes and set follow-up tasks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink-muted shadow-card">
              <CalendarDays size={15} />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="bg-transparent outline-none"
                aria-label="Date range"
              >
                <option value="7d">Last 7 days</option>
                <option value="15d">Last 15 days</option>
                <option value="all">All time</option>
              </select>
              <span className="hidden text-ink-muted xl:inline">{periodLabel(period)}</span>
            </label>
            <button
              type="button"
              onClick={scrollToLogger}
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-brand hover:bg-brand-bright"
            >
              <Phone size={15} />
              Log Call
            </button>
          </div>
        </header>

        <CallStats stats={stats} />

        <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            <CallFilters
              query={query}
              onQuery={setQuery}
              outcome={outcome}
              onOutcome={setOutcome}
              caller={caller}
              onCaller={setCaller}
              callers={callers}
              leadType={leadType}
              onLeadType={setLeadType}
              canReset={filtersActive}
              onReset={resetFilters}
            />
            <div id="call-logs" className="scroll-mt-4">
              <CallTable calls={filtered} page={page} onPage={setPage} onSelect={setSelected} />
            </div>
          </div>
          <div className="space-y-4">
            <div id="log-a-call" className="scroll-mt-4">
              <LogCallPanel onSave={handleSave} />
            </div>
            <CallOutcomeBreakdown total={donut.total} slices={donut.slices} scope={donutScope} onScope={setDonutScope} />
          </div>
        </div>

        {selected && (
          <CallDetailDrawer call={selected} history={history} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
