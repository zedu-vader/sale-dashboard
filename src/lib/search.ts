// Global search (top bar, ⌘K): leads, contacts, tasks and teammates matching the text, a few of each.

import { contactSearch } from "./leads";
import { prisma } from "./prisma";
import { STAGES, contactCode, leadCode } from "./status";

export type SearchKind = "lead" | "contact" | "task" | "person";

export type SearchResult = { id: string; kind: SearchKind; title: string; subtitle: string; href: string };

export type SearchGroup = { kind: SearchKind; label: string; results: SearchResult[] };

const PER_GROUP = 5;

export async function searchEverything(raw: string): Promise<SearchGroup[]> {
  const q = raw.trim().slice(0, 100);
  if (q.length < 2) return [];
  // "LD-1042" / "CT-0318" jump straight to that record.
  const leadNo = /^ld-?(\d+)$/i.exec(q)?.[1];
  const contactNo = /^ct-?(\d+)$/i.exec(q)?.[1];
  const text = { contains: q, mode: "insensitive" as const };

  const [leads, contacts, tasks, people] = await Promise.all([
    prisma.lead.findMany({
      where: leadNo ? { code: Number(leadNo) } : { contact: contactSearch(q) },
      orderBy: [{ lastInteractionAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: PER_GROUP,
      select: { id: true, code: true, status: true, contact: { select: { name: true, company: true } }, owner: { select: { name: true } } },
    }),
    prisma.contact.findMany({
      where: { mergedIntoId: null, ...(contactNo ? { code: Number(contactNo) } : contactSearch(q)) },
      orderBy: { name: "asc" },
      take: PER_GROUP,
      select: { id: true, code: true, name: true, phone: true, company: true },
    }),
    leadNo || contactNo
      ? Promise.resolve([])
      : prisma.task.findMany({
          where: { OR: [{ title: text }, { description: text }] },
          orderBy: [{ done: "asc" }, { dueAt: "asc" }],
          take: PER_GROUP,
          select: { id: true, title: true, done: true, lead: { select: { contact: { select: { name: true } } } }, owner: { select: { name: true } } },
        }),
    leadNo || contactNo
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { disabledAt: null, OR: [{ name: text }, { email: text }] },
          orderBy: { name: "asc" },
          take: PER_GROUP,
          select: { id: true, name: true, email: true, _count: { select: { ownedLeads: true } } },
        }),
  ]);

  const groups: SearchGroup[] = [
    {
      kind: "lead",
      label: "Leads",
      results: leads.map((l) => ({
        id: l.id,
        kind: "lead",
        title: l.contact.name,
        subtitle: [leadCode(l.code), STAGES[l.status].label, l.contact.company, l.owner?.name ? `Owner ${l.owner.name}` : "Unassigned"]
          .filter(Boolean)
          .join(" · "),
        href: `/leads/${l.id}`,
      })),
    },
    {
      kind: "contact",
      label: "Contacts",
      results: contacts.map((c) => ({
        id: c.id,
        kind: "contact",
        title: c.name,
        subtitle: [contactCode(c.code), c.phone, c.company].filter(Boolean).join(" · "),
        href: `/contacts/${c.id}`,
      })),
    },
    {
      kind: "task",
      label: "Tasks",
      results: tasks.map((t) => ({
        id: t.id,
        kind: "task",
        title: t.title,
        subtitle: [t.done ? "Completed" : "Open", t.lead?.contact.name, t.owner?.name ?? "Unassigned"].filter(Boolean).join(" · "),
        // Show it whoever owns it, completed or not.
        href: `/tasks?q=${encodeURIComponent(t.title)}&owner=&status=All${t.done ? "&tab=completed" : ""}`,
      })),
    },
    {
      kind: "person",
      label: "Team",
      results: people.map((u) => ({
        id: u.id,
        kind: "person",
        title: u.name ?? u.email ?? "Teammate",
        subtitle: `${u.email ?? ""}${u.email ? " · " : ""}${u._count.ownedLeads} ${u._count.ownedLeads === 1 ? "lead" : "leads"}`,
        href: `/leads?owner=${u.id}`,
      })),
    },
  ];
  return groups.filter((g) => g.results.length > 0);
}
