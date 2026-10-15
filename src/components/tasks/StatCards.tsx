import { ListChecks, CalendarDays, TriangleAlert, Clock } from "lucide-react";
import type { countTasks } from "./data";

export function StatCards({ counts }: { counts: ReturnType<typeof countTasks> }) {
  const cards = [
    { label: "All Tasks", value: counts.all, icon: ListChecks, tone: "bg-brand-soft text-brand" },
    { label: "Due Today", value: counts.today, icon: CalendarDays, tone: "bg-[#fdecec] text-[#e5484d]" },
    { label: "Overdue", value: counts.overdue, icon: TriangleAlert, tone: "bg-red-100 text-red-600" },
    { label: "Upcoming", value: counts.upcoming, icon: Clock, tone: "bg-brand-soft text-brand" },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 @4xl:grid-cols-4 @4xl:gap-3.5">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-2.5 rounded-2xl border border-solid border-line bg-white p-3 @3xl:gap-3.5 @3xl:p-4">
          <span className={`grid h-[38px] w-[38px] flex-none place-items-center rounded-xl @3xl:h-[46px] @3xl:w-[46px] ${tone}`}>
            <Icon size={20} />
          </span>
          <div>
            <small className="block text-xs text-muted">{label}</small>
            <strong className="mt-0.5 block text-[22px] font-extrabold leading-tight @3xl:text-[26px]">{value}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}
