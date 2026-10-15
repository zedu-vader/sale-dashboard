// Skeleton that mirrors the dashboard shell: sidebar, top bar, header, six KPI cards and two panels.
export default function Loading() {
  const block = "animate-pulse rounded-z-md bg-z-sunken";
  const card = "rounded-z-xl border border-z-line bg-z-surface shadow-z-sm";
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="zedu flex h-dvh overflow-hidden bg-z-surface">
      <div className="hidden w-16 shrink-0 border-r border-z-line bg-z-app md:block xl:w-[248px]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 shrink-0 border-b border-z-line" />
        <div className="flex flex-col gap-4 p-6 max-sm:px-4">
          <div className={`${block} h-7 w-40`} />
          <div className={`${block} mb-3 h-5 w-80 max-w-full`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`${card} flex h-20 items-center gap-3 px-5`}>
                <div className={`${block} size-10 rounded-full`} />
                <div className="flex flex-col gap-2">
                  <div className={`${block} h-3.5 w-24`} />
                  <div className={`${block} h-6 w-16`} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className={`${card} flex h-[360px] flex-col gap-4 p-5`}>
                <div className={`${block} h-5 w-44`} />
                {Array.from({ length: 5 }, (_, j) => (
                  <div key={j} className={`${block} h-9`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
