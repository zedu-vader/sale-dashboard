// Skeleton that mirrors the dashboard layout (§7.10: never a spinner for whole cards).
export default function Loading() {
  const card = "rounded-xl border border-line bg-surface p-[22px] shadow-card max-lg:p-[18px] max-sm:p-4";
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="min-h-screen px-8 py-7 max-lg:px-6 max-sm:px-4 md:ml-[72px] lg:ml-[248px]">
      <div className="mx-auto max-w-content">
        <div className="skeleton mb-2 h-8 w-72 max-w-full" />
        <div className="skeleton mb-6 h-5 w-96 max-w-full" />
        <div className="mb-5 grid grid-cols-2 gap-5 max-lg:gap-4 max-sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={card}>
              <div className="flex items-center gap-3.5">
                <div className="skeleton h-[46px] w-[46px] rounded-[13px] max-sm:h-9 max-sm:w-9" />
                <div className="skeleton h-4 w-24" />
              </div>
              <div className="skeleton mb-1.5 mt-3.5 h-9 w-20" />
              <div className="skeleton h-5 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-5 max-lg:gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className={card}>
            <div className="skeleton mb-[18px] h-6 w-36" />
            <div className="skeleton h-[250px]" />
          </div>
          <div className={card}>
            <div className="skeleton mb-[18px] h-6 w-28" />
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton mb-3 h-11" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
