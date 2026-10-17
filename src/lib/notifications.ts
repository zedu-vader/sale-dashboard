// Notification prompts: what one user needs to do or know. Generated from records (tasks,
// leads, access requests) and stored, so they survive a page refresh.

import { LeadStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { STAGES } from "./status";

export const NOTIFICATION_TYPES = {
  TASK_DUE_TODAY: "TASK_DUE_TODAY",
  TASK_OVERDUE: "TASK_OVERDUE",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  LEAD_ASSIGNED: "LEAD_ASSIGNED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  ACCESS_REQUEST: "ACCESS_REQUEST",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Short label shown beside a notification. */
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  TASK_DUE_TODAY: "Due today",
  TASK_OVERDUE: "Overdue",
  TASK_ASSIGNED: "Task",
  LEAD_ASSIGNED: "Lead",
  LEAD_STATUS_CHANGED: "Lead",
  ACCESS_REQUEST: "Access",
};

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  /** Dedupe key, e.g. "TASK_OVERDUE:<taskId>". */
  key: string;
  title: string;
  body?: string | null;
  /** Route opened when the notification is clicked. */
  link?: string | null;
};

/** Create a notification unless one with the same (user, key) already exists. */
export async function notify({ userId, type, key, title, body, link }: NotifyInput) {
  try {
    await prisma.notification.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, type, key, title, body: body ?? null, link: link ?? null },
      update: {},
    });
  } catch (err) {
    // Two requests can race to create the same notification; losing the race just means it already exists.
    if ((err as { code?: string }).code !== "P2002") throw err;
  }
}

/** Send the same notification to every active admin (used for access requests). */
export async function notifyAdmins(input: Omit<NotifyInput, "userId">) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", disabledAt: null }, select: { id: true } });
  await Promise.all(admins.map((a) => notify({ ...input, userId: a.id })));
}

/** Human-readable label for a pipeline stage, for lead status notifications. */
export function statusLabel(status: LeadStatus): string {
  return STAGES[status]?.label ?? status;
}

function startOfDay(d: Date, addDays = 0) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + addDays);
  return x;
}

/**
 * Create the due-today and overdue task notifications for one user, and drop any that no
 * longer apply (task completed, reassigned, or moved past today).
 */
export async function generateTaskNotifications(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(now, 1);

  const tasks = await prisma.task.findMany({
    where: { ownerId: userId, done: false, dueAt: { lt: tomorrowStart } },
    select: { id: true, title: true, dueAt: true, leadId: true, lead: { select: { id: true, contact: { select: { name: true } } } } },
    orderBy: { dueAt: "asc" },
  });

  const keys: string[] = [];
  for (const t of tasks) {
    const overdue = t.dueAt < todayStart;
    const type = overdue ? NOTIFICATION_TYPES.TASK_OVERDUE : NOTIFICATION_TYPES.TASK_DUE_TODAY;
    const key = `${type}:${t.id}`;
    keys.push(key);
    await notify({
      userId,
      type,
      key,
      title: overdue ? `Overdue: ${t.title}` : `Due today: ${t.title}`,
      body: t.lead?.contact.name ?? null,
      link: t.leadId ? `/leads/${t.leadId}` : null,
    });
  }

  await prisma.notification.deleteMany({
    where: { userId, type: { in: [NOTIFICATION_TYPES.TASK_OVERDUE, NOTIFICATION_TYPES.TASK_DUE_TODAY] }, key: { notIn: keys } },
  });
}

export type NotificationItem = {
  id: string;
  type: NotificationType;
  label: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

/** The user's notifications, unread first, after bringing due-task prompts up to date. */
export async function getNotifications(userId: string) {
  await generateTaskNotifications(userId);
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: 50,
  });
  return {
    unread: rows.filter((r) => !r.readAt).length,
    items: rows.map((r) => ({
      id: r.id,
      type: r.type as NotificationType,
      label: NOTIFICATION_LABELS[r.type as NotificationType] ?? "Notice",
      title: r.title,
      body: r.body,
      link: r.link,
      read: !!r.readAt,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function markRead(userId: string, id: string) {
  await prisma.notification.updateMany({ where: { userId, id, readAt: null }, data: { readAt: new Date() } });
}
