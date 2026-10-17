import { CallConnectionStatus, LeadStatus, type Prisma } from "@prisma/client";
import { formatDay, formatRange, formatTime } from "./format";
import { prisma } from "./prisma";
import { RANGE_PRESETS, resolveRange, type RangeKey } from "./range";
import { CALL_OUTCOMES, LEGACY_CALL_OUTCOMES } from "./status";

const ACTIVITY_LIMIT = 8;
const UPCOMING_DAYS = 7;

export type KpiKey = "leads" | "calls" | "connected" | "unanswered" | "converted" | "followUps";

export type Kpi = { key: KpiKey; label: string; value: number };

export type ActivityItem = {
  id: string;
  kind: "call" | "lead";
  name: string;
  /** "Call · Connected" or "New lead". */
  detail: string;
  /** Current pipeline stage of the lead, when there is one. */
  status: LeadStatus | null;
  at: string;
  when: string;
};

export type TaskGroup = "overdue" | "today" | "upcoming";

export type TaskRow = { id: string; title: string; subtitle: string | null; group: TaskGroup; when: string; done: boolean };

export type DashboardData = {
  range: { key: RangeKey; label: string; period: string };
  kpis: Kpi[];
  activity: ActivityItem[];
  tasks: TaskRow[];
  /** Open tasks due today or overdue (sidebar count). */
  openTaskCount: number;
  overdueCount: number;
};

function startOfDay(d: Date, addDays = 0) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + addDays);
  return x;
}

const stamp = (d: Date, now: Date) => `${formatDay(d, now)}, ${formatTime(d)}`;

export async function getDashboardData(rangeKey: RangeKey): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(now, 1);
  const upcomingEnd = startOfDay(now, 1 + UPCOMING_DAYS);

  const { from, to } = resolveRange(rangeKey, now);
  const cur: Prisma.DateTimeFilter = { gte: from, lt: to };

  const [leads, calls, connected, unanswered, converted, followUps, recentCalls, recentLeads, tasks] = await Promise.all([
    prisma.lead.count({ where: { createdAt: cur } }),
    prisma.call.count({ where: { calledAt: cur } }),
    // Every call that was picked up, whatever the result. Connected + unanswered = calls made.
    prisma.call.count({ where: { calledAt: cur, connectionStatus: CallConnectionStatus.CONNECTED } }),
    prisma.call.count({ where: { calledAt: cur, connectionStatus: CallConnectionStatus.NOT_CONNECTED } }),
    prisma.lead.count({ where: { createdAt: cur, status: LeadStatus.WON } }),
    // A pipeline snapshot, not range-bound: leads currently waiting on a follow-up.
    prisma.lead.count({ where: { status: LeadStatus.FOLLOW_UP } }),
    prisma.call.findMany({
      orderBy: { calledAt: "desc" },
      take: ACTIVITY_LIMIT,
      select: {
        id: true,
        outcome: true,
        legacyOutcome: true,
        calledAt: true,
        contact: { select: { name: true } },
        lead: { select: { status: true, contact: { select: { name: true } } } },
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_LIMIT,
      select: { id: true, status: true, createdAt: true, contact: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: {
        OR: [{ dueAt: { lt: todayStart }, done: false }, { dueAt: { gte: todayStart, lt: upcomingEnd } }],
      },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  const activity: ActivityItem[] = [
    ...recentCalls.map((c) => ({
      id: `call-${c.id}`,
      kind: "call" as const,
      name: c.contact?.name ?? c.lead?.contact.name ?? "Unknown contact",
      detail: `Call · ${c.legacyOutcome ? LEGACY_CALL_OUTCOMES[c.legacyOutcome] : CALL_OUTCOMES[c.outcome]}`,
      status: c.lead?.status ?? null,
      date: c.calledAt,
    })),
    ...recentLeads.map((l) => ({
      id: `lead-${l.id}`,
      kind: "lead" as const,
      name: l.contact.name,
      detail: "New lead",
      status: l.status,
      date: l.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, ACTIVITY_LIMIT)
    .map(({ date, ...a }) => ({ ...a, at: date.toISOString(), when: stamp(date, now) }));

  const taskRows: TaskRow[] = tasks.map((t) => {
    const group: TaskGroup = t.dueAt < todayStart ? "overdue" : t.dueAt < tomorrowStart ? "today" : "upcoming";
    return {
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      group,
      when: group === "today" ? formatTime(t.dueAt) : stamp(t.dueAt, now),
      done: t.done,
    };
  });

  const preset = RANGE_PRESETS.find((p) => p.key === rangeKey)!;

  return {
    range: { key: rangeKey, label: preset.label, period: formatRange(from, new Date(to.getTime() - 1)) },
    kpis: [
      { key: "leads", label: "Total leads", value: leads },
      { key: "calls", label: "Calls made", value: calls },
      { key: "connected", label: "Connected calls", value: connected },
      { key: "unanswered", label: "Unanswered calls", value: unanswered },
      { key: "converted", label: "Converted leads", value: converted },
      { key: "followUps", label: "Pending follow-ups", value: followUps },
    ],
    activity,
    tasks: taskRows,
    openTaskCount: taskRows.filter((t) => !t.done && t.group !== "upcoming").length,
    overdueCount: taskRows.filter((t) => t.group === "overdue").length,
  };
}
