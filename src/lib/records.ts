// Server-side writes shared by the lead and contact screens: calls, tasks and notes, each linked to a
// contact and (when there is one) a lead, with the matching timeline entry. Also the duplicate-phone lookup.

import { ActivityType, LegacyCallOutcome, LeadStatus, LostReason, TaskType, type Prisma } from "@prisma/client";
import type { DuplicateMatch } from "./contactTypes";
import { phoneKey } from "./leadForm";
import { prisma } from "./prisma";
import { STAGES, contactCode, leadCode } from "./status";

/** What a call, task or note is about: always a contact, plus the lead when there is one. */
export type Target = { contactId: string; leadId: string | null };

export async function leadTarget(leadId: string): Promise<Target> {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { contactId: true } });
  return { contactId: lead.contactId, leadId };
}

/** The contact's most recently created lead, which calls and tasks from the contact screen attach to. */
export async function contactTarget(contactId: string): Promise<Target> {
  const lead = await prisma.lead.findFirst({ where: { contactId }, orderBy: { createdAt: "desc" }, select: { id: true } });
  return { contactId, leadId: lead?.id ?? null };
}

const isStatus = (s: string): s is LeadStatus => s in LeadStatus;

/** Other (unmerged) contacts with the same phone number in +234 form, oldest first, with their latest lead. */
export async function findDuplicateContacts(phone: string, excludeId?: string, take = 3): Promise<DuplicateMatch[]> {
  const key = phoneKey(phone);
  if (key.length < 7) return [];
  const rows = await prisma.contact.findMany({
    where: { phoneKey: key, mergedIntoId: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: { createdAt: "asc" },
    take,
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 1, include: { owner: { select: { name: true, email: true } } } },
    },
  });
  return rows.map((c) => {
    const lead = c.leads[0];
    return {
      id: c.id,
      code: contactCode(c.code),
      name: c.name,
      company: c.company,
      lead: lead ? { id: lead.id, code: leadCode(lead.code), owner: lead.owner ? lead.owner.name ?? lead.owner.email : null } : null,
    };
  });
}

export async function recordNote(meId: string, target: Target, body: string) {
  const text = body.trim().slice(0, 5000);
  if (!text) return;
  await prisma.$transaction(async (tx) => {
    const note = await tx.note.create({ data: { ...target, authorId: meId, body: text } });
    await tx.activity.create({ data: { ...target, actorId: meId, type: ActivityType.NOTE_ADDED, noteId: note.id } });
  });
}

export type TaskInput = { title: string; type: string; due: string; ownerId: string };

export async function recordTask(meId: string, target: Target, input: TaskInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Enter what needs doing." };
  const dueAt = new Date(input.due);
  if (!input.due || Number.isNaN(dueAt.getTime())) return { ok: false, error: "Pick a due date and time." };
  const type = input.type in TaskType ? (input.type as TaskType) : TaskType.OTHER;
  await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({ data: { ...target, title: title.slice(0, 200), type, dueAt, ownerId: input.ownerId || meId, userId: meId } });
    await tx.activity.create({ data: { ...target, actorId: meId, type: ActivityType.TASK_CREATED, taskId: task.id } });
  });
  return { ok: true };
}

export type CallInput = { outcome: string; minutes: string; notes: string; status: string; followUp: string };

/**
 * Logs a call and updates the last interaction on the contact (and lead). With a lead, the status can move
 * and a follow-up task can be added; without one, the follow-up task sits on the contact.
 */
export async function recordCall(meId: string, target: Target, input: CallInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(input.outcome in LegacyCallOutcome)) return { ok: false, error: "Pick how the call went." };
  const minutes = input.minutes ? Number(input.minutes) : null;
  if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0 || minutes > 600)) return { ok: false, error: "Enter the duration in minutes (0–600)." };
  const lead = target.leadId
    ? await prisma.lead.findUniqueOrThrow({ where: { id: target.leadId }, select: { status: true, ownerId: true } })
    : null;
  const status = lead ? (isStatus(input.status) ? input.status : lead.status) : null;
  const followUp = input.followUp ? new Date(input.followUp) : null;

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    const call = await tx.call.create({
      data: {
        ...target,
        legacyOutcome: input.outcome as LegacyCallOutcome,
        durationSeconds: minutes === null ? null : Math.round(minutes * 60),
        notes: input.notes.trim().slice(0, 5000) || null,
        userId: meId,
        calledAt: now,
      },
    });
    const ops: Prisma.ActivityCreateManyInput[] = [{ ...target, actorId: meId, type: ActivityType.CALL_LOGGED, callId: call.id, createdAt: now }];
    await tx.contact.update({ where: { id: target.contactId }, data: { lastInteractionAt: now } });
    if (lead && status && target.leadId) {
      if (status !== lead.status) {
        ops.push({ ...target, actorId: meId, type: ActivityType.STATUS_CHANGED, fromStatus: lead.status, toStatus: status, createdAt: new Date(now.getTime() + 1) });
      }
      await tx.lead.update({
        where: { id: target.leadId },
        data: { lastInteractionAt: now, status, lostReason: status === LeadStatus.LOST ? LostReason.NOT_INTERESTED : null },
      });
    }
    if (followUp && !Number.isNaN(followUp.getTime())) {
      const task = await tx.task.create({
        data: {
          ...target,
          title: status ? `Follow up: ${STAGES[status].label}` : "Follow up",
          type: TaskType.FOLLOW_UP,
          dueAt: followUp,
          ownerId: lead?.ownerId ?? meId,
          userId: meId,
          callId: call.id,
        },
      });
      ops.push({ ...target, actorId: meId, type: ActivityType.TASK_CREATED, taskId: task.id, createdAt: new Date(now.getTime() + 2) });
    }
    await tx.activity.createMany({ data: ops });
  });
  return { ok: true };
}
