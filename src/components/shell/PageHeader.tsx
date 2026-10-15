import { DateRangePicker } from "./DateRangePicker";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Page header, Zedu Design System §5.4. The date picker moves here when the top bar is too narrow for it.
export function PageHeader({ firstName }: { firstName: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 max-sm:mb-5">
      <div className="min-w-0">
        <h1 className="text-h1 max-sm:text-h1-sm">
          {greeting(new Date().getHours())}, {firstName}{" "}
          <span className="inline-block origin-[70%_70%] motion-safe:animate-wave" aria-hidden>
            👋
          </span>
        </h1>
        <p className="mt-1 text-body text-ink-muted">Your calls, leads and follow-ups at a glance.</p>
      </div>
      <div className="lg:hidden">
        <DateRangePicker align="left" />
      </div>
    </header>
  );
}
