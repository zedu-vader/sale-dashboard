"use server";

import { revalidatePath } from "next/cache";
import { TaskType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeam } from "@/lib/leads";
import { searchEverything } from "@/lib/search";
import { getLeadOptions, getTasks } from "@/lib/tasks";

export async function toggleTask(id: string, done: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.task.update({ where: { id }, data: { done, completedAt: done ? new Date() : null } });
  // Tasks show on the dashboard and on lead profiles.
  revalidatePath("/", "layout");
}

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return { id: session.user.id, name: session.user.name };
}

export type TaskMutation = { ok: true } | { ok: false; error: string };

const DB_TYPE: Record<string, TaskType> = {
  Call: TaskType.CALL,
  Email: TaskType.EMAIL,
  "Follow-up": TaskType.FOLLOW_UP,
  Meeting: TaskType.MEETING,
  Other: TaskType.OTHER,
};

export type TaskInput = {
  title: string;
  description?: string;
  /** Client label ("Call" … "Other"). */
  type: string;
  /** YYYY-MM-DD in Africa/Lagos. */
  dueDate: string;
  /** HH:MM in Africa/Lagos. */
  dueTime: string;
  /** User id, or null for Unassigned. */
  ownerId?: string | null;
  leadId?: string | null;
  callId?: string | null;
};

function toDueAt(dueDate: string, dueTime: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !/^\d{2}:\d{2}$/.test(dueTime)) return null;
  const [y, m, d] = dueDate.split("-").map(Number);
  const [hh, mm] = dueTime.split(":").map(Number);
  // Africa/Lagos is UTC+1 year-round.
  return new Date(Date.UTC(y, m - 1, d, hh - 1, mm));
}

function refreshTasks() {
  // Tasks also show on the dashboard, the sidebar badge and lead/contact profiles.
  revalidatePath("/", "layout");
}

export async function createTask(input: TaskInput): Promise<TaskMutation> {
  const me = await requireUser();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  const type = DB_TYPE[input.type];
  if (!type) return { ok: false, error: "Invalid task type" };
  const dueAt = toDueAt(input.dueDate, input.dueTime);
  if (!dueAt) return { ok: false, error: "A valid due date and time are required" };
  // A task on a lead also belongs to the lead's contact.
  const lead = input.leadId ? await prisma.lead.findUnique({ where: { id: input.leadId }, select: { contactId: true } }) : null;
  await prisma.task.create({
    data: {
      title: title.slice(0, 200),
      description: input.description?.trim().slice(0, 2000) || null,
      type,
      done: false,
      completedAt: null,
      dueAt,
      ownerId: input.ownerId || null,
      leadId: input.leadId || null,
      contactId: lead?.contactId ?? null,
      callId: input.callId || null,
      userId: me.id,
    },
  });
  refreshTasks();
  return { ok: true };
}

export async function updateTask(id: string, input: TaskInput & { done: boolean }): Promise<TaskMutation> {
  await requireUser();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  const type = DB_TYPE[input.type];
  if (!type) return { ok: false, error: "Invalid task type" };
  const dueAt = toDueAt(input.dueDate, input.dueTime);
  if (!dueAt) return { ok: false, error: "A valid due date and time are required" };
  await prisma.task.update({
    where: { id },
    data: {
      title: title.slice(0, 200),
      description: input.description?.trim().slice(0, 2000) || null,
      type,
      done: input.done,
      completedAt: input.done ? new Date() : null,
      dueAt,
      ownerId: input.ownerId || null,
    },
  });
  refreshTasks();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<TaskMutation> {
  await requireUser();
  await prisma.task.delete({ where: { id } });
  refreshTasks();
  return { ok: true };
}

/** Top-bar search (⌘K) across leads, contacts, tasks and teammates. */
export async function globalSearch(q: string) {
  await requireUser();
  return searchEverything(q);
}

/** Owners and leads for the New task dialog opened from the top bar on any page. */
export async function getTaskFormOptions() {
  const me = await requireUser();
  const [team, leads] = await Promise.all([getTeam(me.id), getLeadOptions()]);
  return { team, leads };
}

/** Fresh rows after a mutation (small data — the board re-reads instead of patching). */
export async function listTasks() {
  await requireUser();
  return getTasks();
}
