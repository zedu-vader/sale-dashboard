import { CallOutcome, Lead, LeadStatus, LeadType } from "@prisma/client";
import { prisma } from "./prisma";
import { dueLabel, getLeadProfile } from "./leads";
import { formatDate, formatTime } from "./format";
import { TASK_TYPES, leadCode } from "./status";
import { listTasks } from "./tasks-store";
import type { ProfileTask, TimelineEntry } from "./leadTypes";
import {
  CONTACT_TYPES,
  contactCode,
  phoneKey,
  type Contact,
  type ContactDetail,
  type ContactTask,
  type ContactType,
  type DuplicateHit,
  type NewContact,
} from "@/components/contacts/data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactRow = {
  id: string;
  code: number;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: LeadType | null;
  notes: string | null;
  createdAt: Date;
  lead: (Lead & { calls?: { outcome: CallOutcome; calledAt: Date }[] }) | null;
};

export type ValidationResult =
  | { ok: true; value: NewContact }
  | { ok: false; error: string };

export function validateContact(body: unknown): ValidationResult {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const company = typeof b.company === "string" ? b.company.trim() : "";
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  const type = b.type === null ? null : b.type;

  if (!name) return { ok: false, error: "Name is required" };
  if (name.length > 200) return { ok: false, error: "Name is too long" };
  if (!phone) return { ok: false, error: "Phone number is required" };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Enter a valid phone number" };
  if (phone.length > 40) return { ok: false, error: "Phone number is too long" };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address" };
  if (email.length > 200) return { ok: false, error: "Email is too long" };
  if (company.length > 200) return { ok: false, error: "Company is too long" };
  if (notes.length > 2000) return { ok: false, error: "Notes are too long (2000 characters max)" };
  if (type !== null && !CONTACT_TYPES.includes(type as ContactType)) {
    return { ok: false, error: "Invalid contact type" };
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      email: email || null,
      company: company || null,
      type: (type as ContactType | null) ?? null,
      notes: notes || null,
    },
  };
}

/** Contacts that share a phone number (digit-normalised) or email address with the input. */
export async function findDuplicates(input: { phone: string; email?: string | null }, excludeId?: string) {
  const contacts = await prisma.contact.findMany({
    where: { id: excludeId ? { not: excludeId } : undefined },
    select: { id: true, name: true, phone: true, email: true },
  });
  const phone = phoneKey(input.phone);
  const email = input.email?.toLowerCase();
  return contacts.filter(
    (c) => phoneKey(c.phone) === phone || (email !== undefined && email !== "" && c.email?.toLowerCase() === email),
  );
}

function toContact(c: ContactRow, duplicates: DuplicateHit[]): Contact {
  const lastCall = c.lead?.calls?.[0];
  return {
    id: c.id,
    code: contactCode(c.code),
    name: c.name,
    phone: c.phone,
    email: c.email,
    company: c.company,
    type: c.type as ContactType | null,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    lastInteraction: lastCall
      ? `${lastCall.outcome === CallOutcome.NO_ANSWER ? "No answer" : "Call"} · ${formatDate(lastCall.calledAt)}`
      : null,
    lead: c.lead
      ? {
          id: c.lead.id,
          code: leadCode(c.lead.code),
          name: c.lead.name,
          status: c.lead.status,
          owner: c.lead.ownerName,
          nextAction: c.lead.nextAction,
        }
      : null,
    duplicates,
  };
}

/** Every contact with its pipeline link, last interaction and duplicate hints, newest first. */
export async function listContacts(): Promise<Contact[]> {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: { lead: { include: { calls: { orderBy: { calledAt: "desc" }, take: 1 } } } },
  });

  // Group by shared phone / email so each contact can point at its duplicates.
  const byPhone = new Map<string, typeof contacts>();
  const byEmail = new Map<string, typeof contacts>();
  for (const c of contacts) {
    const pk = phoneKey(c.phone);
    byPhone.set(pk, [...(byPhone.get(pk) ?? []), c]);
    const ek = c.email?.toLowerCase();
    if (ek) byEmail.set(ek, [...(byEmail.get(ek) ?? []), c]);
  }

  return contacts.map((c) => {
    const pk = phoneKey(c.phone);
    const ek = c.email?.toLowerCase();
    const seen = new Map<string, (typeof contacts)[number]>();
    for (const other of [...(byPhone.get(pk) ?? []), ...(ek ? (byEmail.get(ek) ?? []) : [])]) {
      if (other.id !== c.id) seen.set(other.id, other);
    }
    return toContact(
      c,
      [...seen.values()].map((d) => ({ id: d.id, name: d.name, phone: d.phone, email: d.email })),
    );
  });
}

const toLeadTask = (t: ProfileTask): ContactTask => ({ ...t, kind: TASK_TYPES[t.type].kind, source: "lead" });

const STORE_KIND: Record<string, ContactTask["kind"]> = { Call: "call", Email: "email", Note: "other" };

function toStoreTask(t: { id: string; title: string; type: string; dueAt: string; done: boolean; owner: string }): ContactTask {
  return {
    id: t.id,
    title: t.title,
    kind: STORE_KIND[t.type] ?? "other",
    done: t.done,
    due: dueLabel({ dueAt: new Date(t.dueAt), done: t.done, completedAt: null }),
    owner: { name: t.owner, initials: t.owner.slice(0, 2).toUpperCase() },
    fromCall: null,
    source: "store",
  };
}

export async function getContact(id: string): Promise<ContactDetail | null> {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { lead: true },
  });
  if (!contact) return null;

  const base = toContact(contact, []);

  // Linked contacts borrow the lead's profile (timeline, calls, notes, real tasks).
  const [profile, storeTasks, sameCompany] = await Promise.all([
    contact.leadId ? getLeadProfile(contact.leadId).catch(() => null) : Promise.resolve(null),
    listTasks(),
    contact.company
      ? prisma.contact.findMany({
          where: { company: { equals: contact.company, mode: "insensitive" }, id: { not: contact.id } },
          select: { id: true, name: true },
          orderBy: { createdAt: "asc" },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  // Tasks without a pipeline link are matched on the contact name (Task has no contact FK yet).
  const name = contact.name.toLowerCase();
  const matched = storeTasks
    .filter((t) => t.lead.toLowerCase() === name || t.title.toLowerCase().includes(name))
    .sort((a, b) => Number(a.done) - Number(b.done) || +new Date(a.dueAt) - +new Date(b.dueAt));

  const tasks = profile ? profile.tasks.map(toLeadTask) : matched.map(toStoreTask);
  const nextTask = profile
    ? profile.nextTask
      ? toLeadTask(profile.nextTask)
      : null
    : matched.find((t) => !t.done)
      ? toStoreTask(matched.find((t) => !t.done)!)
      : null;

  const timeline: TimelineEntry[] = profile?.timeline ?? [
    {
      id: `created-${contact.id}`,
      kind: "created",
      actor: "Someone",
      action: "created this contact",
      time: `${formatDate(contact.createdAt)}, ${formatTime(contact.createdAt)}`,
      detail: "Added manually",
    },
  ];

  return {
    ...base,
    lastInteraction: profile?.lastInteraction ?? null,
    timeline,
    calls: profile?.calls ?? [],
    notesTimeline: profile?.notes ?? [],
    tasks,
    nextTask,
    counts: profile?.counts ?? { calls: 0, openTasks: tasks.filter((t) => !t.done).length, tasks: tasks.length, notes: 0 },
    sameCompany: sameCompany.map((c) => ({ ...c, initials: c.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?" })),
  };
}

export type SaveResult =
  | { status: "created"; contact: Contact }
  | { status: "updated"; contact: Contact }
  | { status: "duplicates"; duplicates: DuplicateHit[] }
  | { status: "error"; error: string };

export async function createContact(input: NewContact, confirmDuplicates = false): Promise<SaveResult> {
  if (!confirmDuplicates) {
    const duplicates = await findDuplicates(input);
    if (duplicates.length > 0) return { status: "duplicates", duplicates };
  }
  const created = await prisma.contact.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      company: input.company,
      type: input.type,
      notes: input.notes,
    },
    include: { lead: true },
  });
  return { status: "created", contact: toContact(created, []) };
}

export async function updateContact(
  id: string,
  input: NewContact,
  leadId: string | null | undefined,
  confirmDuplicates = false,
): Promise<SaveResult> {
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return { status: "error", error: "Contact not found" };

  const contactChanged =
    existing.name !== input.name ||
    existing.phone !== input.phone ||
    existing.email !== input.email ||
    existing.company !== input.company ||
    existing.type !== input.type ||
    existing.notes !== input.notes;

  if (contactChanged && !confirmDuplicates) {
    const duplicates = await findDuplicates(input, id);
    if (duplicates.length > 0) return { status: "duplicates", duplicates };
  }

  if (leadId !== undefined && leadId !== existing.leadId) {
    if (leadId !== null) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) return { status: "error", error: "Lead not found" };
      const owner = await prisma.contact.findFirst({ where: { leadId, id: { not: id } } });
      if (owner) return { status: "error", error: "That lead is already linked to another contact" };
    }
  }

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      ...(contactChanged
        ? {
            name: input.name,
            phone: input.phone,
            email: input.email,
            company: input.company,
            type: input.type,
            notes: input.notes,
          }
        : {}),
      ...(leadId !== undefined ? { leadId } : {}),
    },
    include: { lead: true },
  });
  return { status: "updated", contact: toContact(updated, []) };
}

export async function deleteContact(id: string) {
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.contact.delete({ where: { id } });
  return existing;
}

/** Start outreach: create a NEW lead from the contact and link the two records. */
export async function convertContact(id: string): Promise<SaveResult> {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return { status: "error", error: "Contact not found" };
  if (contact.leadId) return { status: "error", error: "Contact is already in the pipeline" };

  const lead = await prisma.lead.create({
    data: {
      name: contact.name,
      phone: contact.phone,
      type: contact.type ?? "INDIVIDUAL",
      status: LeadStatus.NEW,
      ownerName: "You",
    },
  });
  const updated = await prisma.contact.update({
    where: { id },
    data: { leadId: lead.id },
    include: { lead: true },
  });
  return { status: "updated", contact: toContact(updated, []) };
}

/** Leads that are not linked to any contact, for the "link existing lead" picker. */
export async function listLinkableLeads() {
  return prisma.lead.findMany({
    where: { contact: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, status: true },
  });
}
