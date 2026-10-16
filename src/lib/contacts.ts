// Contacts queries (server only): the list with its tabs and filters, possible duplicates, and the profile.

import { ActivityType, CallOutcome, LeadType, type Prisma } from "@prisma/client";
import type {
  ContactCall,
  ContactListData,
  ContactListParams,
  ContactProfile,
  ContactSort,
  ContactTab,
  CreatedFilter,
  DuplicatePair,
  DuplicateReason,
  DuplicateRecord,
  LinkedFilter,
} from "./contactTypes";
import { formatDate } from "./format";
import { PAGE_SIZE, type ProfileTask, type TimelineEntry } from "./leadTypes";
import { contactSearch, dueLabel, duration, fullDate, shortDue, stamp, userName } from "./leads";
import { prisma } from "./prisma";
import { CALL_OUTCOMES, contactCode, initialsOf, leadCode } from "./status";

export * from "./contactTypes";

/* ------------------------------------------------------------------------------------------------ */
/* Params                                                                                             */

type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) => one(v).split(",").filter(Boolean);

const TABS: ContactTab[] = ["all", "individuals", "businesses", "duplicates"];

export function parseContactParams(sp: RawParams): ContactListParams {
  const tab = one(sp.tab) as ContactTab;
  const sort = one(sp.sort) as ContactSort;
  const created = one(sp.created);
  return {
    tab: TABS.includes(tab) ? tab : "all",
    q: one(sp.q).trim().slice(0, 100),
    // Company names can hold commas, so they are separated by "|".
    companies: one(sp.company).split("|").map((c) => c.trim().slice(0, 120)).filter(Boolean),
    linked: list(sp.linked).filter((l): l is LinkedFilter => l === "with" || l === "without"),
    created: created === "7" || created === "30" || created === "90" ? (created as CreatedFilter) : "",
    sort: sort === "last" || sort === "created" ? sort : "name",
    page: Math.max(1, Number.parseInt(one(sp.page), 10) || 1),
  };
}

/** "+234 803 123 4567" from a phone key. */
export function formatPhoneKey(key: string) {
  if (key.length === 13 && key.startsWith("234")) return `+234 ${key.slice(3, 6)} ${key.slice(6, 9)} ${key.slice(9)}`;
  return `+${key}`;
}

/* ------------------------------------------------------------------------------------------------ */
/* List                                                                                               */

const LIVE: Prisma.ContactWhereInput = { mergedIntoId: null };

function tabWhere(tab: ContactTab): Prisma.ContactWhereInput {
  if (tab === "individuals") return { type: LeadType.INDIVIDUAL };
  if (tab === "businesses") return { type: LeadType.BUSINESS };
  return {};
}

function filterWhere(p: ContactListParams, now: Date): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [];
  if (p.q) and.push(contactSearch(p.q));
  if (p.companies.length) and.push({ OR: p.companies.map((c) => ({ company: { equals: c, mode: "insensitive" as const } })) });
  // Both options selected = no filter.
  if (p.linked.length === 1) and.push(p.linked[0] === "with" ? { leads: { some: {} } } : { leads: { none: {} } });
  if (p.created) and.push({ createdAt: { gte: new Date(now.getTime() - Number(p.created) * 86_400_000) } });
  return and.length ? { AND: and } : {};
}

const ORDER: Record<ContactSort, Prisma.ContactOrderByWithRelationInput[]> = {
  name: [{ name: "asc" }, { code: "asc" }],
  last: [{ lastInteractionAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  created: [{ createdAt: "desc" }],
};

export async function getContactList(p: ContactListParams): Promise<ContactListData> {
  const now = new Date();
  const where: Prisma.ContactWhereInput = { AND: [LIVE, tabWhere(p.tab), filterWhere(p, now)] };
  const duplicates = p.tab === "duplicates";

  const [total, all, individuals, businesses, companyGroups, pairs] = await Promise.all([
    duplicates ? Promise.resolve(0) : prisma.contact.count({ where }),
    prisma.contact.count({ where: LIVE }),
    prisma.contact.count({ where: { ...LIVE, type: LeadType.INDIVIDUAL } }),
    prisma.contact.count({ where: { ...LIVE, type: LeadType.BUSINESS } }),
    prisma.contact.groupBy({
      by: ["company"],
      where: { ...LIVE, company: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { company: "desc" } },
      take: 30,
    }),
    getDuplicatePairs(now),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(p.page, pageCount);

  const contacts = duplicates
    ? []
    : await prisma.contact.findMany({
        where,
        orderBy: ORDER[p.sort],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          leads: { orderBy: { createdAt: "desc" }, select: { id: true, code: true, status: true } },
          calls: { orderBy: { calledAt: "desc" }, take: 1, select: { outcome: true, calledAt: true } },
        },
      });

  return {
    rows: contacts.map((c) => {
      const lead = c.leads[0];
      const call = c.calls[0];
      return {
        id: c.id,
        code: contactCode(c.code),
        name: c.name,
        type: c.type,
        phone: c.phone,
        email: c.email,
        company: c.company,
        lead: lead ? { id: lead.id, code: leadCode(lead.code), status: lead.status, more: c.leads.length - 1 } : null,
        lastInteraction: call ? `${call.outcome === CallOutcome.NO_ANSWER ? "No answer" : "Call"} · ${formatDate(call.calledAt, now)}` : null,
        created: formatDate(c.createdAt, now),
      };
    }),
    total,
    page,
    pageCount,
    tabCounts: { all, individuals, businesses, duplicates: pairs.length },
    companies: companyGroups.map((g) => g.company!).filter(Boolean),
    pairs: duplicates ? pairs : [],
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Possible duplicates                                                                                */

/** Sorted ids, as stored in DuplicateDismissal. */
export const pairIds = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x]);

/**
 * Pairs of live contacts with the same phone number (+234 form), the same email, or the same name at the
 * same company, minus pairs someone marked "Not a duplicate". Nothing is merged automatically.
 */
export async function getDuplicatePairs(now = new Date(), limit = 50): Promise<DuplicatePair[]> {
  const matches = await prisma.$queryRaw<{ aId: string; bId: string; phone: boolean; email: boolean }[]>`
    SELECT a."id" AS "aId", b."id" AS "bId",
           (a."phoneKey" = b."phoneKey") AS "phone",
           (a."email" IS NOT NULL AND lower(a."email") = lower(b."email")) AS "email"
    FROM "Contact" a
    JOIN "Contact" b ON a."id" < b."id"
     AND (a."phoneKey" = b."phoneKey"
          OR (a."email" IS NOT NULL AND lower(a."email") = lower(b."email"))
          OR (a."company" IS NOT NULL AND lower(a."name") = lower(b."name") AND lower(a."company") = lower(b."company")))
    WHERE a."mergedIntoId" IS NULL AND b."mergedIntoId" IS NULL AND length(a."phoneKey") >= 7
      AND NOT EXISTS (SELECT 1 FROM "DuplicateDismissal" d WHERE d."aId" = a."id" AND d."bId" = b."id")
    ORDER BY GREATEST(a."createdAt", b."createdAt") DESC
    LIMIT ${limit}`;
  if (!matches.length) return [];

  const ids = [...new Set(matches.flatMap((m) => [m.aId, m.bId]))];
  const records = await prisma.contact.findMany({
    where: { id: { in: ids } },
    include: {
      _count: { select: { calls: true, tasks: true } },
      leads: { orderBy: { createdAt: "desc" }, take: 1, select: { code: true } },
    },
  });
  const byId = new Map(records.map((r) => [r.id, r]));

  const toRecord = (r: (typeof records)[number]): DuplicateRecord => {
    const parts = [
      `Created ${formatDate(r.createdAt, now)}`,
      `${r._count.calls} ${r._count.calls === 1 ? "call" : "calls"}`,
      `${r._count.tasks} ${r._count.tasks === 1 ? "task" : "tasks"}`,
      r.leads[0] ? `Lead ${leadCode(r.leads[0].code)}` : "No lead",
    ];
    return { id: r.id, code: contactCode(r.code), name: r.name, phone: r.phone, email: r.email, company: r.company, type: r.type, summary: parts.join(" · ") };
  };

  return matches.flatMap((m) => {
    const x = byId.get(m.aId);
    const y = byId.get(m.bId);
    if (!x || !y) return [];
    // Older record on the left: it's the one kept by default.
    const [a, b] = x.createdAt <= y.createdAt ? [x, y] : [y, x];
    const reason: DuplicateReason = m.phone ? "phone" : m.email ? "email" : "name";
    const label =
      reason === "phone"
        ? `Same phone number · ${formatPhoneKey(a.phoneKey)}`
        : reason === "email"
          ? `Same email · ${a.email}`
          : `Same name at the same company · ${a.company}`;
    return [{ key: pairIds(a.id, b.id).join(":"), reason, label, a: toRecord(a), b: toRecord(b) }];
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* Profile                                                                                            */

/** The live record for an id, following merges ("links to CT-0402 open CT-0318"). */
export async function resolveContactId(id: string): Promise<string | null> {
  let current = id;
  for (let i = 0; i < 10; i++) {
    const c = await prisma.contact.findUnique({ where: { id: current }, select: { mergedIntoId: true } });
    if (!c) return null;
    if (!c.mergedIntoId) return current;
    current = c.mergedIntoId;
  }
  return current;
}

const callBody = (c: { outcome: CallOutcome; durationSec: number | null; notes: string | null }) => ({
  outcome: CALL_OUTCOMES[c.outcome],
  connected: c.outcome === CallOutcome.CONNECTED,
  status: null,
  duration: duration(c.durationSec),
  notes: c.notes,
});

export async function getContactProfile(id: string): Promise<ContactProfile | null> {
  const now = new Date();
  const userSel = { select: { name: true, email: true } } as const;
  const taskInclude = { owner: userSel, user: userSel, call: { select: { calledAt: true } } } as const;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      createdBy: userSel,
      leads: {
        orderBy: { createdAt: "desc" },
        include: {
          owner: userSel,
          tasks: { where: { done: false }, orderBy: { dueAt: "asc" }, take: 1, select: { title: true, dueAt: true } },
        },
      },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }], include: taskInclude },
      calls: { orderBy: { calledAt: "desc" }, include: { user: userSel, lead: { select: { id: true, code: true } } } },
      noteEntries: { orderBy: { createdAt: "desc" }, include: { author: userSel } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 60,
        include: { actor: userSel, call: true, note: true, task: { include: taskInclude }, lead: { select: { code: true } } },
      },
    },
  });
  if (!contact || contact.mergedIntoId) return null;

  const colleagues = contact.company
    ? await prisma.contact.findMany({
        where: { ...LIVE, company: { equals: contact.company, mode: "insensitive" }, id: { not: contact.id } },
        orderBy: { name: "asc" },
        select: { name: true },
        take: 3,
      })
    : [];
  const colleagueCount = contact.company
    ? await prisma.contact.count({ where: { ...LIVE, company: { equals: contact.company, mode: "insensitive" } } })
    : 0;

  type TaskRowT = (typeof contact.tasks)[number];
  const toTask = (t: TaskRowT): ProfileTask => {
    // Assignee; older tasks only have the creator-as-owner in userId.
    const who = t.owner ?? t.user;
    const name = who ? userName(who) : null;
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

  const timeline: TimelineEntry[] = contact.activities.map((a) => {
    const base = { id: a.id, actor: userName(a.actor), time: stamp(a.createdAt, now) };
    const lead = a.lead ? leadCode(a.lead.code) : null;
    switch (a.type) {
      case ActivityType.CALL_LOGGED:
        return { ...base, kind: "call", action: "logged a call", call: a.call ? callBody(a.call) : undefined };
      case ActivityType.NOTE_ADDED:
        return { ...base, kind: "note", action: "added a note", note: a.note?.body };
      case ActivityType.STATUS_CHANGED:
        return { ...base, kind: "status", action: lead ? `changed lead ${lead} status` : "changed the status", status: { from: a.fromStatus, to: a.toStatus } };
      case ActivityType.TASK_CREATED:
        return {
          ...base,
          kind: "task",
          action: a.task?.type === "FOLLOW_UP" ? "created a follow-up task" : "created a task",
          task: a.task ? toTask(a.task as TaskRowT) : undefined,
        };
      case ActivityType.OWNER_CHANGED:
        return { ...base, kind: "other", action: lead ? `changed the owner of lead ${lead}` : "changed the owner", detail: a.detail };
      case ActivityType.DETAILS_UPDATED:
      case ActivityType.CONTACT_UPDATED:
        return { ...base, kind: "other", action: "updated the details", detail: a.detail };
      case ActivityType.CONTACTS_MERGED:
        return { ...base, kind: "other", action: "merged a duplicate contact", detail: a.detail };
      case ActivityType.LEAD_LINKED:
        return { ...base, kind: "other", action: lead ? `linked lead ${lead}` : "linked a lead", detail: a.detail };
      case ActivityType.CREATED:
        return { ...base, kind: "created", action: lead ? `created lead ${lead}` : "created a lead", detail: a.detail };
      case ActivityType.CONTACT_CREATED:
      default:
        return { ...base, kind: "created", action: "created this contact", detail: a.detail };
    }
  });

  const tasks = contact.tasks.map(toTask);
  const openTasks = tasks.filter((t) => !t.done);
  const lastCall = contact.calls[0];

  const calls: ContactCall[] = contact.calls.map((c) => {
    const name = c.user ? userName(c.user) : null;
    return {
      id: c.id,
      date: stamp(c.calledAt, now),
      at: c.calledAt.toISOString(),
      outcome: CALL_OUTCOMES[c.outcome],
      connected: c.outcome === CallOutcome.CONNECTED,
      notes: c.notes,
      duration: duration(c.durationSec),
      caller: name ? { name, initials: initialsOf(name) } : null,
      lead: c.lead ? { id: c.lead.id, code: leadCode(c.lead.code) } : null,
    };
  });

  return {
    id: contact.id,
    code: contactCode(contact.code),
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    company: contact.company,
    type: contact.type,
    notes: contact.notes,
    created: `${fullDate.format(contact.createdAt)}${contact.createdBy ? ` · ${userName(contact.createdBy)}` : ""}`,
    createdShort: fullDate.format(contact.createdAt),
    lastInteraction: lastCall ? `${lastCall.outcome === CallOutcome.NO_ANSWER ? "No answer" : "Call"} · ${stamp(lastCall.calledAt, now)}` : null,
    leads: contact.leads.map((l) => {
      const task = l.tasks[0];
      const parts = [`Owner ${l.owner ? userName(l.owner) : "unassigned"}`];
      if (task) parts.push(`Next: ${task.title} · ${shortDue(task.dueAt, now).text}`);
      return { id: l.id, code: leadCode(l.code), status: l.status, meta: parts.join(" · ") };
    }),
    companyInfo: contact.company
      ? {
          name: contact.company,
          meta: [`${colleagueCount} ${colleagueCount === 1 ? "contact" : "contacts"}`, ...colleagues.slice(0, 2).map((c) => c.name)].join(" · "),
        }
      : null,
    nextTask: openTasks[0] ?? null,
    tasks,
    timeline,
    calls,
    notesTimeline: contact.noteEntries.map((n) => ({
      id: n.id,
      kind: "note",
      actor: userName(n.author),
      action: "added a note",
      time: stamp(n.createdAt, now),
      note: n.body,
    })),
    counts: { calls: calls.length, openTasks: openTasks.length, tasks: tasks.length, notes: contact.noteEntries.length },
  };
}
