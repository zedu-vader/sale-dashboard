import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}

// hover:/disabled:hover: are explicit because the app-wide `button:hover` rule would otherwise win.
const btn =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-solid p-0 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface";
const idle = "border-line bg-surface text-ink hover:bg-surface-sunken";

export function Pagination({ page, pages, total, pageSize, onPage }: Props) {
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-2.5 flex flex-col items-center gap-2.5 pt-2.5 @3xl:flex-row @3xl:justify-between">
      <small className="text-xs text-ink-muted">
        Showing {from}–{to} of {total} tasks
      </small>
      <div className="flex gap-1.5">
        <button aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)} className={`${btn} ${idle}`}>
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`${btn} text-sm ${n === page ? "border-brand bg-brand text-white hover:bg-brand-bright" : idle}`}
          >
            {n}
          </button>
        ))}
        <button aria-label="Next page" disabled={page === pages} onClick={() => onPage(page + 1)} className={`${btn} ${idle}`}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
