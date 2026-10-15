import { ChevronLeft, ChevronRight, EllipsisVertical } from "lucide-react";
import {
  formatDateTime,
  formatDurationShort,
  type CallRecord,
} from "@/data/calls";
import { CallerChip, OutcomeBadge } from "./CallBadges";

const PAGE_SIZE = 10;

export default function CallTable({
  calls,
  page,
  onPage,
  onSelect,
}: {
  calls: CallRecord[];
  page: number;
  onPage: (p: number) => void;
  onSelect: (call: CallRecord) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(calls.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = calls.slice(start, start + PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <h2 className="px-5 pb-1 pt-4 text-base font-bold text-ink">Call Logs</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="text-xs text-ink-muted">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="accent-brand" aria-label="Select all calls" readOnly checked={false} />
              </th>
              <th className="px-3 py-3 font-medium">Date &amp; Time ✦</th>
              <th className="px-3 py-3 font-medium">Contact / Lead</th>
              <th className="px-3 py-3 font-medium">Phone Number</th>
              <th className="px-3 py-3 font-medium">Duration</th>
              <th className="px-3 py-3 font-medium">Outcome</th>
              <th className="px-3 py-3 font-medium">Next Action</th>
              <th className="px-3 py-3 font-medium">Caller</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const dt = formatDateTime(c.startedAt);
              return (
                <tr key={c.id} className="border-t border-line hover:bg-brand-soft/40">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="accent-brand" aria-label={`Select call with ${c.name}`} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-muted">
                    {dt.date}
                    <span className="block text-xs text-ink-muted">{dt.time}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="block font-medium text-ink">{c.name}</span>
                    <span className="block text-xs text-ink-muted">{c.leadType}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-muted">{c.phone}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-muted">
                    {formatDurationShort(c.durationSec)}
                  </td>
                  <td className="px-3 py-3">
                    <OutcomeBadge outcome={c.outcome} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {c.nextAction ? (
                      <>
                        <span className="block text-ink">{c.nextAction.label}</span>
                        <span className="block text-xs font-medium text-brand">{c.nextAction.date}</span>
                      </>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <CallerChip initials={c.caller.initials} name={c.caller.name} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelect(c)}
                      className="rounded-lg bg-brand p-1.5 text-white hover:bg-brand-bright"
                      aria-label={`View details for ${c.name}`}
                    >
                      <EllipsisVertical size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center">
                  <p className="font-medium text-ink">No calls match these filters</p>
                  <p className="mt-1 text-sm text-ink-muted">Try widening the date range or clearing the search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
        <p className="text-ink-muted">
          Showing {calls.length === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, calls.length)} of{" "}
          {calls.length} calls
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPage(safePage - 1)}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              className={`h-7 w-7 rounded-lg text-sm font-medium ${
                n === safePage ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-sunken"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPage(safePage + 1)}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
