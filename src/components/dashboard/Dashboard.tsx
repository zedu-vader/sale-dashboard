// Dashboard page content (Figma 16817:18843): page header, six KPI cards, then the activity and task panels.

import { CircleAlert, Phone, PhoneCall, SquareCheck, Star, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { DashboardData, KpiKey } from "@/lib/dashboard";
import { formatNumber } from "@/lib/format";
import { KpiCard, PageHeader } from "@/components/zedu";
import { ActivityCard } from "./ActivityCard";
import { Greeting } from "./Greeting";
import { RangeMenu } from "./RangeMenu";
import { TasksCard } from "./TasksCard";

const KPI_ICONS: Record<KpiKey, ReactNode> = {
  leads: <UserRound aria-hidden />,
  calls: <Phone aria-hidden />,
  connected: <PhoneCall aria-hidden />,
  unanswered: <CircleAlert aria-hidden />,
  converted: <Star aria-hidden />,
  followUps: <SquareCheck aria-hidden />,
};

export function Dashboard({ data, firstName }: { data: DashboardData; firstName: string }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={<Greeting firstName={firstName} />}
        actions={<RangeMenu value={data.range.key} period={data.range.period} />}
      />
      <div className="flex flex-col gap-4 px-6 pb-6 pt-2 max-sm:px-4">
        <section aria-label={`Key metrics, ${data.range.label.toLowerCase()}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.kpis.map((k) => (
            <KpiCard key={k.key} label={k.label} value={formatNumber(k.value)} icon={KPI_ICONS[k.key]} />
          ))}
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityCard items={data.activity} />
          <TasksCard tasks={data.tasks} />
        </div>
      </div>
    </>
  );
}
