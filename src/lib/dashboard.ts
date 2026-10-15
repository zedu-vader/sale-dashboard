import { CallOutcome, LeadStatus, LeadType } from "@prisma/client";
import { formatDay, formatNumber, formatPercent, formatRange, formatTime } from "./format";
import { prisma } from "./prisma";
import { RANGE_PRESETS, resolveRange, type RangeKey } from "./range";
import { LOST_REASONS } from "./status";

export const MONTHLY_TARGET = 40;
const CHART_DAYS = 7;
const DAY = 86_400_000;

export type KpiIcon = "leads" | "calls" | "connected" | "converted";

export type Kpi = {
  label: string;
  icon: KpiIcon;
  value: number;
  delta: number | null;
  deltaLabel: string;
  note: string;
  spark: number[];
  hero?: boolean;
};

export type ChartDay = { label: string; made: number; connected: number; unanswered: number; today: boolean };

export type Insight = { label: string; value: string; tone?: "success" };

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  type: "Individual" | "Business";
  status: LeadStatus;
  lostReason: string | null;
  owner: string;
  lastCallAt: string | null;
  lastCallLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  nextActionLabel: string | null;
};

export type TaskDue = "overdue" | "today" | "tomorrow";

export type TaskRow = { id: string; title: string; subtitle: string | null; due: TaskDue; dueLabel: string; when: string; done: boolean };

export type Outcome = { key: CallOutcome; name: string; value: number; color: string };

export type DashboardData = {
  range: { key: RangeKey; label: string; period: string };
  kpis: Kpi[];
  chart: { days: ChartDay[]; max: number; insights: Insight[]; summary: string };
  leads: LeadRow[];
  tasks: TaskRow[];
  outcomes: { total: number; items: Outcome[] };
  target: { done: number; goal: number };
  newLeadCount: number;
};

// Indigo scale only: coral is reserved for urgency (§1.4).
const OUTCOMES: { key: CallOutcome; name: string; color: string }[] = [
  { key: "CONNECTED", name: "Connected", color: "#3b1fa8" },
  { key: "NO_ANSWER", name: "No answer", color: "#6d4dff" },
  { key: "NOT_INTERESTED", name: "Not interested", color: "#b9a8ff" },
  { key: "OTHER", name: "Other", color: "#e6e0ff" },
];

const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function startOfDay(d: Date, addDays = 0) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + addDays);
  return x;
}

const pctChange = (now: number, prev: number) => (prev === 0 ? null : ((now - prev) / prev) * 100);
const rate = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);

export async function getDashboardData(rangeKey: RangeKey): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(now, 1);

  const { from, to } = resolveRange(rangeKey, now);
  const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
  const cur = { gte: from, lt: to };
  const prev = { gte: prevFrom, lt: from };

  // The chart shows the 7 days ending with the period (or today, whichever is earlier).
  const chartEnd = to < tomorrowStart ? to : tomorrowStart;
  const chartStart = startOfDay(new Date(chartEnd.getTime() - DAY), -(CHART_DAYS - 1));
  const answered = { not: CallOutcome.NO_ANSWER };

  const [
    leadsNow, leadsPrev, callsNow, callsPrev, connNow, connPrev, wonNow, wonPrev,
    chartCalls, chartLeads, outcomeGroups, latestLeads, tasks, newLeadCount, wonThisMonth,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: cur } }),
    prisma.lead.count({ where: { createdAt: prev } }),
    prisma.call.count({ where: { calledAt: cur } }),
    prisma.call.count({ where: { calledAt: prev } }),
    prisma.call.count({ where: { calledAt: cur, outcome: answered } }),
    prisma.call.count({ where: { calledAt: prev, outcome: answered } }),
    prisma.lead.count({ where: { createdAt: cur, status: LeadStatus.WON } }),
    prisma.lead.count({ where: { createdAt: prev, status: LeadStatus.WON } }),
    prisma.call.findMany({ where: { calledAt: { gte: chartStart, lt: chartEnd } }, select: { calledAt: true, outcome: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: chartStart, lt: chartEnd } }, select: { createdAt: true, status: true } }),
    prisma.call.groupBy({ by: ["outcome"], where: { calledAt: cur }, _count: { _all: true } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { calls: { orderBy: { calledAt: "desc" }, take: 1, select: { calledAt: true } } },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { dueAt: { gte: todayStart, lt: startOfDay(now, 2) } },
          { dueAt: { lt: todayStart }, done: false },
        ],
      },
      orderBy: { dueAt: "asc" },
    }),
    prisma.lead.count({ where: { status: LeadStatus.NEW } }),
    prisma.lead.count({ where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }, status: LeadStatus.WON } }),
  ]);

  // Bucket the chart window by day.
  const buckets = new Map<number, ChartDay & { leads: number; won: number }>();
  for (let i = 0; i < CHART_DAYS; i++) {
    const d = startOfDay(chartStart, i);
    const today = d.getTime() === todayStart.getTime();
    buckets.set(d.getTime(), { label: today ? "Today" : shortDay.format(d), made: 0, connected: 0, unanswered: 0, today, leads: 0, won: 0 });
  }
  for (const c of chartCalls) {
    const b = buckets.get(startOfDay(c.calledAt).getTime());
    if (!b) continue;
    b.made++;
    if (c.outcome === CallOutcome.NO_ANSWER) b.unanswered++;
    else b.connected++;
  }
  for (const l of chartLeads) {
    const b = buckets.get(startOfDay(l.createdAt).getTime());
    if (!b) continue;
    b.leads++;
    if (l.status === LeadStatus.WON) b.won++;
  }
  const series = [...buckets.values()];
  const days: ChartDay[] = series.map(({ label, made, connected, unanswered, today }) => ({ label, made, connected, unanswered, today }));

  const best = series.reduce((a, b) => (b.made > a.made ? b : a), series[0]);
  const weekMade = series.reduce((s, d) => s + d.made, 0);
  const weekConnected = series.reduce((s, d) => s + d.connected, 0);
  // Round the y-axis up to a multiple of 4 ticks' worth so gridlines land on whole numbers.
  const peak = Math.max(...series.map((d) => d.made));
  const max = Math.max(20, Math.ceil(peak / 20) * 20);

  const delta = (n: number, p: number) => {
    const d = pctChange(n, p);
    return { delta: d, deltaLabel: d === null ? "–" : `${d >= 0 ? "↑" : "↓"} ${formatPercent(Math.abs(d))}` };
  };

  const kpis: Kpi[] = [
    { label: "Total leads", icon: "leads", value: leadsNow, ...delta(leadsNow, leadsPrev), note: "vs last period", spark: series.map((d) => d.leads) },
    { label: "Calls made", icon: "calls", value: callsNow, ...delta(callsNow, callsPrev), note: "vs last period", spark: series.map((d) => d.made) },
    { label: "Connected calls", icon: "connected", value: connNow, ...delta(connNow, connPrev), note: `${formatPercent(rate(connNow, callsNow))} connect rate`, spark: series.map((d) => d.connected) },
    { label: "Converted", icon: "converted", value: wonNow, ...delta(wonNow, wonPrev), note: `${formatPercent(rate(wonNow, leadsNow))} of leads`, spark: series.map((d) => d.won), hero: true },
  ];

  const counts = new Map(outcomeGroups.map((g) => [g.outcome, g._count._all]));
  const outcomeItems = OUTCOMES.map((o) => ({ ...o, value: counts.get(o.key) ?? 0 }));

  const connectRate = rate(weekConnected, weekMade);
  const preset = RANGE_PRESETS.find((p) => p.key === rangeKey)!;

  return {
    range: { key: rangeKey, label: preset.label, period: formatRange(from, new Date(to.getTime() - 1)) },
    kpis,
    chart: {
      days,
      max,
      insights: [
        { label: "Best day", value: weekMade ? `${best.label} · ${formatNumber(best.made)} calls` : "—" },
        { label: "Avg / day", value: `${formatNumber(Math.round(weekMade / CHART_DAYS))} calls` },
        { label: "Connect rate", value: formatPercent(connectRate), tone: "success" },
      ],
      summary:
        `Calls over the last ${CHART_DAYS} days: ` +
        days.map((d) => `${d.label}, ${d.made} made, ${d.connected} connected, ${d.unanswered} unanswered`).join("; ") +
        ".",
    },
    leads: latestLeads.map((l) => {
      const lastCall = l.calls[0]?.calledAt;
      return {
        id: l.id,
        name: l.name,
        phone: l.phone,
        type: l.type === LeadType.BUSINESS ? "Business" : "Individual",
        status: l.status,
        lostReason: l.lostReason ? LOST_REASONS[l.lostReason] : null,
        owner: l.ownerName,
        lastCallAt: lastCall?.toISOString() ?? null,
        lastCallLabel: lastCall ? `${formatDay(lastCall, now)}, ${formatTime(lastCall)}` : null,
        nextAction: l.nextAction,
        nextActionAt: l.nextActionAt?.toISOString() ?? null,
        nextActionLabel: l.nextActionAt ? formatDay(l.nextActionAt, now) : null,
      };
    }),
    tasks: tasks.map((t) => {
      const due: TaskDue = t.dueAt < todayStart ? "overdue" : t.dueAt < tomorrowStart ? "today" : "tomorrow";
      return {
        id: t.id,
        title: t.title,
        subtitle: t.subtitle,
        due,
        dueLabel: due === "overdue" ? "Overdue" : due === "today" ? "Today" : "Tomorrow",
        when: due === "overdue" ? formatDay(t.dueAt, now) : formatTime(t.dueAt),
        done: t.done,
      };
    }),
    outcomes: { total: outcomeItems.reduce((s, o) => s + o.value, 0), items: outcomeItems },
    target: { done: wonThisMonth, goal: MONTHLY_TARGET },
    newLeadCount,
  };
}
