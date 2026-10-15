import { Search, SlidersHorizontal } from "lucide-react";
import { CALL_OUTCOMES, type CallOutcome } from "@/data/calls";

export type LeadTypeFilter = "All" | "Individual" | "Business";

interface Props {
  query: string;
  onQuery: (v: string) => void;
  outcome: CallOutcome | "All";
  onOutcome: (v: CallOutcome | "All") => void;
  caller: string;
  onCaller: (v: string) => void;
  callers: string[];
  leadType: LeadTypeFilter;
  onLeadType: (v: LeadTypeFilter) => void;
  canReset: boolean;
  onReset: () => void;
}

const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted outline-none focus:border-brand";

export default function CallFilters(p: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-card lg:flex-row lg:items-center">
      <div className="relative lg:flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder="Search by name, phone number or lead…"
          className={`${inputCls} w-full pl-9`}
          aria-label="Search calls by name, phone number or lead"
        />
      </div>
      <select
        value={p.outcome}
        onChange={(e) => p.onOutcome(e.target.value as CallOutcome | "All")}
        className={inputCls}
        aria-label="Filter by outcome"
      >
        <option value="All">All Outcomes</option>
        {CALL_OUTCOMES.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <select
        value={p.caller}
        onChange={(e) => p.onCaller(e.target.value)}
        className={inputCls}
        aria-label="Filter by caller"
      >
        <option value="All">All Callers</option>
        {p.callers.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={p.leadType}
        onChange={(e) => p.onLeadType(e.target.value as LeadTypeFilter)}
        className={inputCls}
        aria-label="Filter by lead type"
      >
        <option value="All">All Lead Types</option>
        <option value="Individual">Individual</option>
        <option value="Business">Business</option>
      </select>
      <button
        type="button"
        onClick={p.onReset}
        disabled={!p.canReset}
        title="Reset all filters"
        className="flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-bright disabled:opacity-40"
        aria-label="Reset all filters"
      >
        <SlidersHorizontal size={15} />
      </button>
    </div>
  );
}
