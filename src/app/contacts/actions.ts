"use server";

import { ActivityType, LeadStatus, LeadType, LostReason, TaskType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import type { ContactFormValues, DuplicateMatch, LinkableLead, MergeChoice } from "@/lib/contactTypes";
import { pairIds } from "@/lib/contacts";
import { phoneKey, validateLead, type LeadFormErrors } from "@/lib/leadForm";
import { prisma } from "@/lib/prisma";
import { contactTarget, findDuplicateContacts, recordCall, recordNote, recordTask, type CallInput, type TaskInput } from "@/lib/records";
import { contactCode, leadCode } from "@/lib/status";

async function requireUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new Error("Unauthorized");
  return { id, name: session!.user!.name ?? session!.user!.email ?? "Someone" };
}

function refresh() {
  // Contact details show on leads, the dashboard and both lists, so refresh everything.
  revalidatePath("/", "layout");
}

const clean = (s: string | undefined) => (s ?? "").trim();
const isStatus = (s: string): s is LeadStatus => s in LeadStatus;

function contactData(v: ContactFormValues) {
  const phone = clean(v.phone);
  return {
    name: clean(v.name),
    phone,
    phoneKey: phoneKey(phone),
    email: clean(v.email) || null,
    company: clean(v.company) || null,
    type: v.type === "BUSINESS" ? LeadType.BUSINESS : LeadType.INDIVIDUAL,
    notes: clean(v.notes).slice(0, 2000) || null,
  };
}

/** Called when the phone field loses focus in Add contact and Edit details. */
export async function checkContactPhone(phone: string, excludeId?: string): Promise<DuplicateMatch | null> {
  await requireUser();
  return (await findDuplicateContacts(phone, excludeId, 1))[0] ?? null;
}

export type SaveContactResult =
  | { ok: true; id: string; leadId: string | null }
  | { ok: false; errors: LeadFormErrors; duplicate?: undefined }
  | { ok: false; errors?: undefined; duplicate: DuplicateMatch };

/** Add contact. With `createLead`, also opens a New lead owned by the person adding it. */
export async function createContact(
  values: ContactFormValues,
  opts: { allowDuplicate?: boolean; createLead?: boolean } = {},
): Promise<SaveContactResult> {
  const me = await requireUser();
  const errors = validateLead(values, "contact");
  if (Object.keys(errors).length) return { ok: false, errors };
  if (!opts.allowDuplicate) {
    const [duplicate] = await findDuplicateContacts(values.phone, undefined, 1);
    if (duplicate) return { ok: false, duplicate };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Explicit times keep "created this contact" below "created lead" in the timeline.
    const now = new Date();
    const contact = await tx.contact.create({ data: { ...contactData(values), createdById: me.id } });
    let leadId: string | null = null;
    let detail = "Added manually";
    if (opts.createLead) {
      const lead = await tx.lead.create({ data: { contactId: contact.id, status: LeadStatus.NEW, ownerId: me.id, ownerName: me.name, createdById: me.id } });
      leadId = lead.id;
      detail = `Added manually · Lead ${leadCode(lead.code)} created from this contact`;
      await tx.activity.create({
        data: {
          contactId: contact.id,
          leadId,
          actorId: me.id,
          type: ActivityType.CREATED,
          toStatus: LeadStatus.NEW,
          detail: `Created from contact ${contactCode(contact.code)} · Owner: ${me.name}`,
          createdAt: new Date(now.getTime() + 1),
        },
      });
    }
    await tx.activity.create({ data: { contactId: contact.id, actorId: me.id, type: ActivityType.CONTACT_CREATED, detail, createdAt: now } });
    return { id: contact.id, leadId };
  });
  refresh();
  return { ok: true, ...result };
}

/** Edit details. Leads read these fields from the contact, so they update too. */
export async function updateContact(id: string, values: ContactFormValues): Promise<{ ok: true } | { ok: false; errors: LeadFormErrors }> {
  const me = await requireUser();
  const errors = validateLead(values, "contact");
  if (Object.keys(errors).length) return { ok: false, errors };
  const before = await prisma.contact.findUniqueOrThrow({ where: { id } });
  const data = contactData(values);
  const changed = (["name", "phone", "email", "company", "type", "notes"] as const).filter((k) => data[k] !== before[k]);
  if (!changed.length) return { ok: true };
  await prisma.$transaction([
    prisma.contact.update({ where: { id }, data }),
    prisma.activity.create({ data: { contactId: id, actorId: me.id, type: ActivityType.CONTACT_UPDATED } }),
  ]);
  refresh();
  return { ok: true };
}

/** Deletes the contact with its leads, tasks, notes and timeline. Logged calls stay in reports. */
export async function deleteContact(id: string) {
  await requireUser();
  await prisma.$transaction([
    prisma.duplicateDismissal.deleteMany({ where: { OR: [{ aId: id }, { bId: id }] } }),
    prisma.contact.updateMany({ where: { mergedIntoId: id }, data: { mergedIntoId: null } }),
    prisma.contact.delete({ where: { id } }),
  ]);
  refresh();
}

/** "Not a duplicate": hides the pair from Possible duplicates for everyone. */
export async function dismissDuplicate(x: string, y: string) {
  const me = await requireUser();
  const [aId, bId] = pairIds(x, y);
  await prisma.duplicateDismissal.upsert({ where: { aId_bId: { aId, bId } }, update: {}, create: { aId, bId, dismissedBy: me.id } });
  refresh();
}

/**
 * Folds `mergeId` into `keepId`: the chosen field values are kept, its leads, calls, tasks, notes and timeline
 * move across, the merge is recorded, and the old record points at the survivor so its links still work.
 */
export async function mergeContacts(keepId: string, mergeId: string, choice: MergeChoice): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUser();
  if (keepId === mergeId) return { ok: false, error: "Pick two different contacts." };
  const [keep, merge] = await Promise.all([
    prisma.contact.findUnique({ where: { id: keepId } }),
    prisma.contact.findUnique({ where: { id: mergeId } }),
  ]);
  if (!keep || !merge || keep.mergedIntoId || merge.mergedIntoId) return { ok: false, error: "One of these contacts was already merged or deleted. Refresh and try again." };

  const from = (field: keyof MergeChoice) => (choice[field] === "merge" ? merge : keep)[field];
  const phone = from("phone") as string;
  const notes = [keep.notes, merge.notes].filter(Boolean).filter((n, i, all) => all.indexOf(n) === i).join("\n\n") || null;
  const moved = { where: { contactId: mergeId }, data: { contactId: keepId } };

  await prisma.$transaction([
    prisma.lead.updateMany(moved),
    prisma.call.updateMany(moved),
    prisma.task.updateMany(moved),
    prisma.note.updateMany(moved),
    prisma.activity.updateMany(moved),
    prisma.contact.updateMany({ where: { mergedIntoId: mergeId }, data: { mergedIntoId: keepId } }),
    prisma.contact.update({
      where: { id: keepId },
      data: {
        name: from("name") as string,
        phone,
        phoneKey: phoneKey(phone),
        email: from("email") as string | null,
        company: from("company") as string | null,
        type: from("type") as LeadType,
        notes,
        lastInteractionAt:
          keep.lastInteractionAt && merge.lastInteractionAt
            ? new Date(Math.max(keep.lastInteractionAt.getTime(), merge.lastInteractionAt.getTime()))
            : keep.lastInteractionAt ?? merge.lastInteractionAt,
        createdAt: keep.createdAt < merge.createdAt ? keep.createdAt : merge.createdAt,
      },
    }),
    prisma.contact.update({ where: { id: mergeId }, data: { mergedIntoId: keepId } }),
    prisma.duplicateDismissal.deleteMany({ where: { OR: [{ aId: mergeId }, { bId: mergeId }] } }),
    prisma.activity.create({
      data: {
        contactId: keepId,
        actorId: me.id,
        type: ActivityType.CONTACTS_MERGED,
        detail: `${contactCode(merge.code)} (${merge.name}) was merged into ${contactCode(keep.code)}`,
      },
    }),
  ]);
  refresh();
  return { ok: true };
}

export type NewLeadInput = { status: string; ownerId: string; followUp: string; notes: string };

/** Create lead for an existing contact: the lead reads the contact's details, nothing is copied. */
export async function createLeadForContact(contactId: string, input: NewLeadInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const me = await requireUser();
  const contact = await prisma.contact.findUniqueOrThrow({ where: { id: contactId }, select: { code: true } });
  const status = isStatus(input.status) ? input.status : LeadStatus.NEW;
  const owner = input.ownerId ? await prisma.user.findUnique({ where: { id: input.ownerId }, select: { id: true, name: true, email: true } }) : null;
  const ownerLabel = owner ? owner.name ?? owner.email ?? "Unnamed" : "Unassigned";
  const followUp = input.followUp ? new Date(`${input.followUp}T09:00:00`) : null;
  if (followUp && Number.isNaN(followUp.getTime())) return { ok: false, error: "Pick a valid follow-up date." };
  const notes = clean(input.notes).slice(0, 5000);

  const lead = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        contactId,
        status,
        lostReason: status === LeadStatus.LOST ? LostReason.OTHER : null,
        ownerId: owner?.id ?? null,
        ownerName: owner ? ownerLabel : "",
        createdById: me.id,
      },
    });
    const target = { contactId, leadId: lead.id };
    await tx.activity.create({
      data: { ...target, actorId: me.id, type: ActivityType.CREATED, toStatus: status, detail: `Created from contact ${contactCode(contact.code)} · Owner: ${ownerLabel}` },
    });
    if (notes) {
      const note = await tx.note.create({ data: { ...target, authorId: me.id, body: notes } });
      await tx.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.NOTE_ADDED, noteId: note.id } });
    }
    if (followUp) {
      const task = await tx.task.create({ data: { ...target, title: "Follow up", type: TaskType.FOLLOW_UP, dueAt: followUp, userId: owner?.id ?? me.id } });
      await tx.activity.create({ data: { ...target, actorId: me.id, type: ActivityType.TASK_CREATED, taskId: task.id } });
    }
    return lead;
  });
  refresh();
  return { ok: true, id: lead.id };
}

/** Leads for the "Link existing lead" picker, matched on the lead code or the contact's details. */
export async function searchLinkableLeads(contactId: string, q: string): Promise<LinkableLead[]> {
  await requireUser();
  const text = q.trim().slice(0, 100);
  const code = Number.parseInt(text.replace(/^LD-?/i, ""), 10);
  const leads = await prisma.lead.findMany({
    where: {
      contactId: { not: contactId },
      ...(text
        ? {
            OR: [
              ...(Number.isFinite(code) ? [{ code }] : []),
              { contact: { name: { contains: text, mode: "insensitive" as const } } },
              { contact: { company: { contains: text, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, code: true, status: true, contact: { select: { name: true } } },
  });
  return leads.map((l) => ({ id: l.id, code: leadCode(l.code), name: l.contact.name, status: l.status }));
}

/** Points an existing lead (and its calls, tasks, notes and timeline) at this contact. */
export async function linkLeadToContact(contactId: string, leadId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUser();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: { select: { code: true } } } });
  if (!lead) return { ok: false, error: "That lead no longer exists." };
  if (lead.contactId === contactId) return { ok: true };
  const moved = { where: { leadId }, data: { contactId } };
  await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { contactId } }),
    prisma.call.updateMany(moved),
    prisma.task.updateMany(moved),
    prisma.note.updateMany(moved),
    prisma.activity.updateMany(moved),
    prisma.activity.create({
      data: { contactId, leadId, actorId: me.id, type: ActivityType.LEAD_LINKED, detail: `Moved from contact ${contactCode(lead.contact.code)}` },
    }),
  ]);
  refresh();
  return { ok: true };
}

export async function addContactNote(contactId: string, body: string) {
  const me = await requireUser();
  await recordNote(me.id, { contactId, leadId: null }, body);
  refresh();
}

export async function createContactTask(contactId: string, input: TaskInput) {
  const me = await requireUser();
  const res = await recordTask(me.id, await contactTarget(contactId), input);
  if (res.ok) refresh();
  return res;
}

export async function logContactCall(contactId: string, input: CallInput) {
  const me = await requireUser();
  const res = await recordCall(me.id, await contactTarget(contactId), input);
  if (res.ok) refresh();
  return res;
}
