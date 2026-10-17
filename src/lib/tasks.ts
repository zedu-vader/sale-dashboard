import { TaskType, type Prisma } from "@prisma/client";
import type { DueTone, TaskItem, TaskType as ClientType } from "@/data/tasks";
import { prisma } from "./prisma";
import { CALL_OUTCOMES, LEGACY_CALL_OUTCOMES } from "./status";

const LAGOS = "Africa/Lagos";

/** YYYY-MM-DD of an instant in the user's local day (Africa/Lagos, UTC+1, no DST). */
export function lagosDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function addDays(base: string, n: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: LAGOS, hour: "numeric", minute: "2-digit", hour12: true });
const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: LAGOS, weekday: "short", month: "short", day: "numeric" });

const CLIENT_TYPE: Record<TaskType, ClientType> = {
  [TaskType.CALL]: "Call",
  [TaskType.EMAIL]: "Email",
  [TaskType.FOLLOW_UP]: "Follow-up",
  [TaskType.MEETING]: "Meeting",
  [TaskType.OTHER]: "Other",
};

type Row = Prisma.TaskGetPayload<{
  include: {
    owner: { select: { id: true; name: true } };
    lead: { select: { id: true; contact: { select: { name: true } } } };
    call: { select: { id: true; calledAt: true; outcome: true; legacyOutcome: true; connectionStatus: true; durationSeconds: true; lead: { select: { contact: { select: { name: true } } } } } };
    user: { select: { name: true } };
  };
}>;

export function toTaskItem(t: Row, now = new Date()): TaskItem {
  const today = lagosDay(now);
  const due = lagosDay(t.dueAt);
  const done = t.done;
  let dueTone: DueTone;
  let dueText: string;
  if (done) {
    dueTone = "done";
    const at = t.completedAt ?? t.dueAt;
    dueText = lagosDay(at) === today ? `Done · Today, ${timeFmt.format(at)}` : `Done · ${dayFmt.format(at)}`;
  } else if (due < today) {
    dueTone = "overdue";
    const days = Math.round((Date.parse(today) - Date.parse(due)) / 86400000);
    dueText = `${days} day${days === 1 ? "" : "s"} overdue · ${dayFmt.format(t.dueAt).split(", ").slice(1).join(", ")}`;
  } else if (due === today) {
    dueTone = "today";
    dueText = `Today · ${timeFmt.format(t.dueAt)}`;
  } else {
    dueTone = "upcoming";
    dueText = due === addDays(today, 1) ? `Tomorrow · ${timeFmt.format(t.dueAt)}` : dayFmt.format(t.dueAt);
  }
  const ownerName = t.owner?.name ?? "Unassigned";
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    type: CLIENT_TYPE[t.type],
    recordName: t.lead?.contact.name ?? "No linked record",
    recordKind: t.lead ? "Lead" : "Internal",
    fromCall: t.call ? `From call · ${dayFmt.format(t.call.calledAt)}` : undefined,
    dueText,
    dueTone,
    dueAt: t.dueAt.toISOString(),
    owner: {
      key: t.ownerId ?? "unassigned",
      name: ownerName,
      initials:
        ownerName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]!.toUpperCase())
          .join("") || "?",
    },
    ownerId: t.ownerId,
    status: done ? "Completed" : "Pending",
    leadId: t.leadId,
    callId: t.callId,
    linkedCall: t.call
      ? {
          person: t.call.lead?.contact.name ?? t.lead?.contact.name ?? "a lead",
          when: `${dayFmt.format(t.call.calledAt)}, ${timeFmt.format(t.call.calledAt)}`,
          outcome: t.call.legacyOutcome ? LEGACY_CALL_OUTCOMES[t.call.legacyOutcome] : CALL_OUTCOMES[t.call.outcome],
          duration: t.call.durationSeconds === null ? "" : `${Math.round(t.call.durationSeconds / 60)} min`,
        }
      : undefined,
    createdBy: t.user?.name ? `Created by ${t.user.name} on ${dayFmt.format(t.createdAt)}` : "",
  };
}

const taskInclude = {
  owner: { select: { id: true, name: true } },
  // A lead's name lives on its contact.
  lead: { select: { id: true, contact: { select: { name: true } } } },
  call: { select: { id: true, calledAt: true, outcome: true, legacyOutcome: true, connectionStatus: true, durationSeconds: true, lead: { select: { contact: { select: { name: true } } } } } },
  user: { select: { name: true } },
} as const;

/** All tasks, oldest due first. Filtering happens in the board (small data). */
export async function getTasks(): Promise<TaskItem[]> {
  const rows = await prisma.task.findMany({ include: taskInclude, orderBy: { dueAt: "asc" } });
  const now = new Date();
  return rows.map((t) => toTaskItem(t, now));
}

export async function getLeadOptions(): Promise<{ id: string; name: string }[]> {
  const leads = await prisma.lead.findMany({ select: { id: true, contact: { select: { name: true } } }, orderBy: { contact: { name: "asc" } } });
  return leads.map((l) => ({ id: l.id, name: l.contact.name }));
}
