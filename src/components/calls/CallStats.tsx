import Sparkline from "./Sparkline";

export interface StatDef {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  deltaGood: boolean;
  iconBg: string;
  icon: React.ReactNode;
  trend: number[];
}

function StatCard({ stat }: { stat: StatDef }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
          {stat.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-muted">{stat.label}</p>
          <p className="text-[26px] font-bold leading-tight text-ink">{stat.value}</p>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className={`text-xs font-medium ${stat.deltaGood ? "text-success" : "text-danger"}`}>
          {stat.deltaUp ? "↑" : "↓"} {stat.delta} this period
        </p>
        <Sparkline points={stat.trend} tone={stat.deltaGood ? "brand" : "danger"} />
      </div>
    </div>
  );
}

export default function CallStats({ stats }: { stats: StatDef[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.label} stat={s} />
      ))}
    </div>
  );
}
