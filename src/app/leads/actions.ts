"use server";

import { ActivityType, LeadStatus, LeadType, LostReason, TaskType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import type { DuplicateMatch } from "@/lib/contactTypes";
import { phoneKey, validateLead, type LeadFormErrors, type LeadFormValues } from "@/lib/leadForm";
import { prisma } from "@/lib/prisma";
import { findDuplicateContacts, leadTarget, recordCall, recordNote, recordTask, type CallInput, type TaskInput } from "@/lib/records";
import { leadCode } from "@/lib/status";

export type { CallInput, TaskInput };

async function requireUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new Error("Unauthorized");
  return { id, name: session!.user!.name ?? session!.user!.email ?? "Someone" };
}

function refresh() {
  // Leads show up on the dashboard, the lists and the profiles, so refresh them all.
  revalidatePath("/", "layout");
}

const isStatus = (s: string): s is LeadStatus => s in LeadStatus;
const clean = (s: string | undefined) => (s ?? "").trim();

/** Called when the phone field loses focus in Add lead. */
export async function checkDuplicatePhone(phone: string): Promise<DuplicateMatch | null> {
  await requireUser();
  return (await findDuplicateContacts(phone, undefined, 1))[0] ?? null;
}

export type CreateLeadResult =
  | { ok: true; id: string; code: string }
  | { ok: false; errors: LeadFormErrors; duplicate?: undefined }
  | { ok: false; errors?: undefined; duplicate: DuplicateMatch };

/** Add lead: creates the contact (name, phone, email, company, type) and its first lead. */
export async function createLead(values: LeadFormValues, opts: { allowDuplicate?: boolean } = {}): Promise<CreateLeadResult> {
  const me = await requireUser();
  const errors = validateLead(values);
  if (Object.keys(errors).length) return { ok: false, errors };

  if (!opts.allowDuplicate) {
    const [duplicate] = await findDuplicateContacts(values.phone, undefined, 1);
    if (duplicate) return { ok: false, duplicate };
  }

  const status = isStatus(values.status) ? values.status : LeadStatus.NEW;
  const owner = values.ownerId ? await prisma.user.findUnique({ where: { id: values.ownerId }, select: { id: true, name: true, email: true } }) : null;
  const ownerLabel = owner ? owner.name ?? owner.email ?? "Unnamed" : "Unassigned";
  const followUp = values.followUp ? new Date(`${values.followUp}T09:00:00`) : null;
  const notes = clean(values.notes);

  const lead = await prisma.$transaction(async (tx) => {
    // Explicit times keep "created this contact" below "created lead" in the contact timeline.
    const now = new Date();
    const contact = await tx.contact.create({
      data: {
        name: clean(values.name),
        phone: clean(values.phone),
        phoneKey: phoneKey(values.phone),
        email: clean(values.email) || null,
        company: clean(values.company) || null,
        type: values.type === "BUSINESS" ? LeadType.BUSINESS : LeadType.INDIVIDUAL,
        createdById: me.id,
      },
    });
    const lead = await tx.lead.create({
      data: {
        contactId: contact.id,
        status,
        lostReason: status === LeadStatus.LOST ? LostReason.OTHER : null,
        ownerId: owner?.id ?? null,
        ownerName: owner ? ownerLabel : "",
        createdById: me.id,
      },
    });
    const target = { contactId: contact.id, leadId: lead.id };
    await tx.activity.create({
      data: { contactId: contact.id, actorId: me.id, type: ActivityType.CONTACT_CREATED, detail: `Added manually · Lead ${leadCode(lead.code)} created from this contact`, createdAt: now },
    });
    await tx.activity.create({
      data: { ...target, actorId: me.id, type: ActivityType.CREATED, toStatus: status, detail: `Added manually · Owner: ${ownerLabel}`, createdAt: new Date(now.getTime() + 1) },
    });
    if (notes) {
      const note = await tx.note.create({ data: { ...target, authorId: me.id, body: notes } });
      await tx.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.NOTE_ADDED, noteId: note.id } });
    }
    if (followUp) {
      const task = await tx.task.create({
        data: { ...target, title: "Follow up", type: TaskType.FOLLOW_UP, dueAt: followUp, userId: owner?.id ?? me.id },
      });
      await tx.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.TASK_CREATED, taskId: task.id } });
    }
    return lead;
  });

  refresh();
  return { ok: true, id: lead.id, code: leadCode(lead.code) };
}

export type UpdateLeadResult = { ok: true } | { ok: false; errors: LeadFormErrors };

/** Edit details: name, phone, email, company and type are saved on the contact; status and owner on the lead. */
export async function updateLead(id: string, values: LeadFormValues): Promise<UpdateLeadResult> {
  const me = await requireUser();
  const errors = validateLead(values);
  if (Object.keys(errors).length) return { ok: false, errors };

  const before = await prisma.lead.findUniqueOrThrow({ where: { id }, include: { contact: true } });
  const status = isStatus(values.status) ? values.status : before.status;
  const ownerId = values.ownerId || null;
  const owner = ownerId ? await prisma.user.findUnique({ where: { id: ownerId }, select: { name: true, email: true } }) : null;
  const target = { leadId: id, contactId: before.contactId };

  const data = {
    name: clean(values.name),
    phone: clean(values.phone),
    email: clean(values.email) || null,
    company: clean(values.company) || null,
    type: values.type === "BUSINESS" ? LeadType.BUSINESS : LeadType.INDIVIDUAL,
  };
  const detailsChanged = (Object.keys(data) as (keyof typeof data)[]).some((k) => data[k] !== before.contact[k]);

  await prisma.$transaction([
    ...(detailsChanged
      ? [
          prisma.contact.update({ where: { id: before.contactId }, data: { ...data, phoneKey: phoneKey(data.phone) } }),
          prisma.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.DETAILS_UPDATED } }),
        ]
      : []),
    prisma.lead.update({
      where: { id },
      data: {
        status,
        lostReason: status === LeadStatus.LOST ? before.lostReason ?? LostReason.OTHER : null,
        ownerId,
        ownerName: owner ? owner.name ?? owner.email ?? "" : "",
      },
    }),
    ...(status !== before.status
      ? [prisma.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.STATUS_CHANGED, fromStatus: before.status, toStatus: status } })]
      : []),
    ...(ownerId !== before.ownerId
      ? [prisma.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.OWNER_CHANGED, detail: owner ? `Owner: ${owner.name ?? owner.email}` : "Owner removed" } })]
      : []),
  ]);
  refresh();
  return { ok: true };
}

/** Status for one or more leads. LOST records a reason (defaults to Other). */
export async function setLeadStatus(ids: string[], status: string, lostReason?: string) {
  const me = await requireUser();
  if (!isStatus(status) || !ids.length) return;
  const reason = status === LeadStatus.LOST ? (lostReason && lostReason in LostReason ? (lostReason as LostReason) : LostReason.OTHER) : null;
  const leads = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true, contactId: true, status: true } });
  const changed = leads.filter((l) => l.status !== status);
  await prisma.$transaction([
    prisma.lead.updateMany({ where: { id: { in: ids } }, data: { status, lostReason: reason } }),
    prisma.activity.createMany({
      data: changed.map((l) => ({
        leadId: l.id,
        contactId: l.contactId,
        actorId: me.id,
        type: ActivityType.STATUS_CHANGED,
        fromStatus: l.status,
        toStatus: status,
      })),
    }),
  ]);
  refresh();
}

/** Owner for one or more leads; null removes the owner. */
export async function assignLeads(ids: string[], ownerId: string | null) {
  const me = await requireUser();
  if (!ids.length) return;
  const owner = ownerId ? await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, name: true, email: true } }) : null;
  if (ownerId && !owner) throw new Error("Unknown team member");
  const label = owner ? owner.name ?? owner.email ?? "" : "";
  const leads = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true, contactId: true, ownerId: true } });
  const changed = leads.filter((l) => l.ownerId !== (owner?.id ?? null));
  await prisma.$transaction([
    prisma.lead.updateMany({ where: { id: { in: ids } }, data: { ownerId: owner?.id ?? null, ownerName: label } }),
    prisma.activity.createMany({
      data: changed.map((l) => ({
        leadId: l.id,
        contactId: l.contactId,
        actorId: me.id,
        type: ActivityType.OWNER_CHANGED,
        detail: owner ? `Owner: ${label}` : "Owner removed",
      })),
    }),
  ]);
  refresh();
}

/** Deletes the leads only; their contacts (and the contacts' own history) stay. */
export async function deleteLeads(ids: string[]) {
  await requireUser();
  if (!ids.length) return;
  await prisma.lead.deleteMany({ where: { id: { in: ids } } });
  refresh();
}

export async function addNote(leadId: string, body: string) {
  const me = await requireUser();
  await recordNote(me.id, await leadTarget(leadId), body);
  refresh();
}

export async function createTask(leadId: string, input: TaskInput) {
  const me = await requireUser();
  const res = await recordTask(me.id, await leadTarget(leadId), input);
  if (res.ok) refresh();
  return res;
}

/** Logs a call, updates the last interaction, and optionally moves the status and adds a follow-up task. */
export async function logCall(leadId: string, input: CallInput) {
  const me = await requireUser();
  const res = await recordCall(me.id, await leadTarget(leadId), input);
  if (res.ok) refresh();
  return res;
}
