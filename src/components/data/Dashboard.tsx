import type { DashboardData } from "@/lib/dashboard";
import { PageHeader } from "@/components/shell/PageHeader";
import { CallActivityChart } from "./CallActivityChart";
import { KpiCard } from "./KpiCard";
import { LeadsTable } from "./LeadsTable";
import { OutcomesDonut } from "./OutcomesDonut";
import { TaskList } from "./TaskList";

// Dashboard grid, Zedu Design System §4.5. Below xl it becomes one column with Tasks and
// Outcomes above the leads table (the column wrappers use `display: contents` so `order` applies).
export function Dashboard({ data, firstName }: { data: DashboardData; firstName: string }) {
  return (
    <>
      <PageHeader firstName={firstName} />

      <section aria-label="Key metrics" className="mb-5 grid grid-cols-2 gap-5 max-lg:mb-4 max-lg:gap-4 max-sm:mb-3 max-sm:gap-3 xl:grid-cols-4">
        {data.kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}
      </section>

      <div className="grid gap-5 max-lg:gap-4 max-sm:gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
          <div className="order-1 min-w-0"><CallActivityChart chart={data.chart} /></div>
          <div className="order-4 min-w-0"><LeadsTable leads={data.leads} /></div>
        </div>
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
          <div className="order-2 min-w-0"><TaskList tasks={data.tasks} /></div>
          <div className="order-3 min-w-0"><OutcomesDonut outcomes={data.outcomes} rangeLabel={data.range.label} /></div>
        </div>
      </div>
    </>
  );
}
