import { ActivityType, CallOutcome, LeadStatus, LeadType, type Prisma, type TaskType } from "@prisma/client";
import type { Due } from "@/components/zedu";
import { formatDate, formatTime } from "./format";
import { prisma } from "./prisma";
import type { LeadListData, LeadListParams, LeadProfile, LeadSort, LeadTab, ProfileTask, TeamMember, TimelineEntry } from "./leadTypes";
import { PAGE_SIZE } from "./leadTypes";
import { CALL_OUTCOMES, LOST_REASONS, initialsOf, leadCode } from "./status";

export * from "./leadTypes";


/* ------------------------------------------------------------------------------------------------ */
/* Due dates                                                                                          */

const DAY = 86_400_000;
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const dayDiff = (d: Date, now: Date) => Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY);

/** Short due text for list cells: "Overdue", "Today", "Tomorrow", "Mon, Oct 19" (this week), "Oct 17". */
export function shortDue(dueAt: Date, now = new Date()) {
  const diff = dayDiff(dueAt, now);
  if (dueAt < now && diff < 0) return { text: "Overdue", overdue: true };
  if (diff === 0) return { text: "Today", overdue: false };
  if (diff === 1) return { text: "Tomorrow", overdue: false };
  if (diff < 7) return { text: weekday.format(dueAt), overdue: false };
  return { text: formatDate(dueAt, now), overdue: false };
}

/** Due label for tasks: urgency + text ("Today · 3:00 PM", "2 days overdue · Oct 13", "Done · Oct 12"). */
export function dueLabel(task: { dueAt: Date; done: boolean; completedAt: Date | null }, now = new Date()): { due: Due; text: string } {
  if (task.done) return { due: "done", text: `Done · ${formatDate(task.completedAt ?? task.dueAt, now)}` };
  const diff = dayDiff(task.dueAt, now);
  if (diff < 0) {
    const days = -diff;
    return { due: "overdue", text: `${days === 1 ? "1 day" : `${days} days`} overdue · ${formatDate(task.dueAt, now)}` };
  }
  if (diff === 0) return { due: task.dueAt < now ? "overdue" : "today", text: `Today · ${formatTime(task.dueAt)}` };
  if (diff === 1) return { due: "upcoming", text: `Tomorrow · ${formatTime(task.dueAt)}` };
  return { due: "upcoming", text: diff < 7 ? weekday.format(task.dueAt) : formatDate(task.dueAt, now) };
}

/* ------------------------------------------------------------------------------------------------ */
/* Team                                                                                               */

/** Everyone who can own leads, signed-in user first. */
export async function getTeam(meId: string): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } });
  return users
    .map((u) => {
      const name = u.name ?? u.email ?? "Unnamed";
      return { id: u.id, name, initials: initialsOf(name), me: u.id === meId };
    })
    .sort((a, b) => Number(b.me) - Number(a.me));
}

/* ------------------------------------------------------------------------------------------------ */
/* List                                                                                               */

type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) => one(v).split(",").filter(Boolean);

export function parseLeadParams(sp: RawParams): LeadListParams {
  const tab = one(sp.tab);
  const sort = one(sp.sort);
  return {
    tab: tab === "mine" || tab === "unassigned" ? tab : "all",
    q: one(sp.q).trim().slice(0, 100),
    statuses: list(sp.status).filter((s): s is LeadStatus => s in LeadStatus),
    types: list(sp.type).filter((t): t is LeadType => t in LeadType),
    owners: list(sp.owner),
    sort: sort === "created" || sort === "name" ? sort : "last",
    page: Math.max(1, Number.parseInt(one(sp.page), 10) || 1),
  };
}

function tabWhere(tab: LeadTab, meId: string): Prisma.LeadWhereInput {
  if (tab === "mine") return { ownerId: meId };
  if (tab === "unassigned") return { ownerId: null };
  return {};
}

function filterWhere(p: LeadListParams, opts: { withStatus: boolean }): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];
  if (p.q) {
    and.push({
      OR: [
        { name: { contains: p.q, mode: "insensitive" } },
        { phone: { contains: p.q } },
        { company: { contains: p.q, mode: "insensitive" } },
        { email: { contains: p.q, mode: "insensitive" } },
      ],
    });
  }
  if (opts.withStatus && p.statuses.length) and.push({ status: { in: p.statuses } });
  if (p.types.length) and.push({ type: { in: p.types } });
  if (p.owners.length) {
    const ids = p.owners.filter((o) => o !== "none");
    and.push({ OR: [...(ids.length ? [{ ownerId: { in: ids } }] : []), ...(p.owners.includes("none") ? [{ ownerId: null }] : [])] });
  }
  return and.length ? { AND: and } : {};
}

const ORDER: Record<LeadSort, Prisma.LeadOrderByWithRelationInput[]> = {
  last: [{ lastInteractionAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  created: [{ createdAt: "desc" }],
  name: [{ name: "asc" }],
};

export async function getLeadList(p: LeadListParams, meId: string): Promise<LeadListData> {
  const now = new Date();
  const where: Prisma.LeadWhereInput = { AND: [tabWhere(p.tab, meId), filterWhere(p, { withStatus: true })] };

  const [total, all, mine, unassigned, statusGroups] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.count(),
    prisma.lead.count({ where: { ownerId: meId } }),
    prisma.lead.count({ where: { ownerId: null } }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { AND: [tabWhere(p.tab, meId), filterWhere(p, { withStatus: false })] },
      _count: { _all: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(p.page, pageCount);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: ORDER[p.sort],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      calls: { orderBy: { calledAt: "desc" }, take: 1, select: { outcome: true, calledAt: true } },
      tasks: { where: { done: false }, orderBy: { dueAt: "asc" }, take: 1, select: { title: true, dueAt: true } },
    },
  });

  return {
    rows: leads.map((l) => {
      const ownerName = l.owner ? l.owner.name ?? l.owner.email ?? "Unnamed" : null;
      const call = l.calls[0];
      const task = l.tasks[0];
      const due = task ? shortDue(task.dueAt, now) : null;
      return {
        id: l.id,
        code: leadCode(l.code),
        name: l.name,
        type: l.type,
        phone: l.phone,
        company: l.company,
        status: l.status,
        owner: l.owner && ownerName ? { id: l.owner.id, name: ownerName, initials: initialsOf(ownerName) } : null,
        lastInteraction: call
          ? `${call.outcome === CallOutcome.NO_ANSWER ? "No answer" : "Call"} · ${formatDate(call.calledAt, now)}`
          : null,
        nextAction: task && due ? { text: `${task.title} · ${due.text}`, overdue: due.overdue } : null,
      };
    }),
    total,
    page,
    pageCount,
    tabCounts: { all, mine, unassigned },
    statusCounts: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Profile                                                                                            */

const stamp = (d: Date, now: Date) =>
  `${formatDate(d, now)}, ${formatTime(d)}`;

function duration(sec: number | null) {
  if (!sec) return null;
  const min = Math.round(sec / 60);
  return min < 1 ? `${sec} sec` : `${min} min`;
}

const userName = (u: { name: string | null; email: string | null } | null) => (u ? u.name ?? u.email ?? "Someone" : "Someone");

export async function getLeadProfile(id: string): Promise<LeadProfile | null> {
  const now = new Date();
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      createdBy: { select: { name: true, email: true } },
      tasks: {
        orderBy: [{ done: "asc" }, { dueAt: "asc" }],
        include: { user: { select: { name: true, email: true } }, call: { select: { calledAt: true } } },
      },
      calls: { orderBy: { calledAt: "desc" }, include: { user: { select: { name: true, email: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: { select: { name: true, email: true } },
          call: true,
          note: true,
          task: { include: { user: { select: { name: true, email: true } }, call: { select: { calledAt: true } } } },
        },
      },
    },
  });
  if (!lead) return null;

  const ownerName = lead.owner ? userName(lead.owner) : null;
  const toTask = (t: (typeof lead.tasks)[number]): ProfileTask => {
    const name = t.user ? userName(t.user) : null;
    return {
      id: t.id,
      title: t.title,
      type: t.type,
      done: t.done,
      due: dueLabel(t, now),
      owner: name ? { name, initials: initialsOf(name) } : null,
      fromCall: t.call ? `From call · ${formatDate(t.call.calledAt, now)}` : null,
    };
  };
  const callBody = (c: { outcome: CallOutcome; durationSec: number | null; notes: string | null }) => ({
    outcome: CALL_OUTCOMES[c.outcome],
    connected: c.outcome === CallOutcome.CONNECTED,
    status: null,
    duration: duration(c.durationSec),
    notes: c.notes,
  });

  const timeline: TimelineEntry[] = lead.activities.map((a) => {
    const base = { id: a.id, actor: userName(a.actor), time: stamp(a.createdAt, now) };
    switch (a.type) {
      case ActivityType.CALL_LOGGED:
        return { ...base, kind: "call", action: "logged a call", call: a.call ? callBody(a.call) : undefined };
      case ActivityType.NOTE_ADDED:
        return { ...base, kind: "note", action: "added a note", note: a.note?.body };
      case ActivityType.STATUS_CHANGED:
        return { ...base, kind: "status", action: "changed the status", status: { from: a.fromStatus, to: a.toStatus } };
      case ActivityType.TASK_CREATED:
        return {
          ...base,
          kind: "task",
          action: a.task?.type === "FOLLOW_UP" ? "created a follow-up task" : "created a task",
          task: a.task ? toTask(a.task as (typeof lead.tasks)[number]) : undefined,
        };
      case ActivityType.OWNER_CHANGED:
        return { ...base, kind: "other", action: "changed the owner", detail: a.detail };
      case ActivityType.DETAILS_UPDATED:
        return { ...base, kind: "other", action: "updated the details", detail: a.detail };
      case ActivityType.CREATED:
      default:
        return { ...base, kind: "created", action: "created this lead", detail: a.detail };
    }
  });

  const tasks = lead.tasks.map(toTask);
  const openTasks = tasks.filter((t) => !t.done);
  const lastCall = lead.calls[0];

  return {
    id: lead.id,
    code: leadCode(lead.code),
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    company: lead.company,
    type: lead.type,
    status: lead.status,
    lostReason: lead.lostReason ? LOST_REASONS[lead.lostReason] : null,
    owner: lead.owner && ownerName ? { id: lead.owner.id, name: ownerName, initials: initialsOf(ownerName) } : null,
    // Created dates always carry the year, as in the designs ("Oct 9, 2026 · Agnes Okafor").
    created: `${fullDate.format(lead.createdAt)}${lead.createdBy ? ` · ${userName(lead.createdBy)}` : ""}`,
    createdShort: fullDate.format(lead.createdAt),
    lastInteraction: lastCall
      ? `${lastCall.outcome === CallOutcome.NO_ANSWER ? "No answer" : "Call"} · ${stamp(lastCall.calledAt, now)}`
      : null,
    nextTask: openTasks[0] ?? null,
    tasks,
    timeline,
    calls: lead.calls.map((c) => ({
      id: c.id,
      kind: "call",
      actor: userName(c.user),
      action: "logged a call",
      time: stamp(c.calledAt, now),
      call: callBody(c),
    })),
    notes: lead.notes.map((n) => ({
      id: n.id,
      kind: "note",
      actor: userName(n.author),
      action: "added a note",
      time: stamp(n.createdAt, now),
      note: n.body,
    })),
    counts: { calls: lead.calls.length, openTasks: openTasks.length, tasks: tasks.length, notes: lead.notes.length },
  };
}
