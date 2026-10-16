import type { Due, Stage, TaskKind } from "@/components/zedu";
import type { TimelineEntry } from "@/lib/leadTypes";

export const CONTACT_TYPES = ["INDIVIDUAL", "BUSINESS"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const TYPE_LABEL: Record<ContactType, string> = {
  INDIVIDUAL: "Individual",
  BUSINESS: "Business",
};

/** Pipeline record a contact is linked to, if the team has reached out. */
export interface ContactLead {
  id: string;
  /** Human-readable lead code, e.g. "LD-1042". */
  code: string;
  name: string;
  /** LeadStatus enum value; label lookup happens in the UI. */
  status: string;
  owner: string;
  nextAction: string | null;
}

/** Other contacts that share a phone number or email address. */
export interface DuplicateHit {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface Contact {
  id: string;
  /** Human-readable code, e.g. "CT-1001". */
  code: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: ContactType | null;
  notes: string | null;
  createdAt: string;
  /** Short "what happened last" line for the list, e.g. "Call · Oct 14". */
  lastInteraction: string | null;
  lead: ContactLead | null;
  duplicates: DuplicateHit[];
}

export type NewContact = {
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: ContactType | null;
  notes: string | null;
};

/** A task shown on the contact profile. Lead tasks are real records; "store" tasks are the JSON-file mock list. */
export interface ContactTask {
  id: string;
  title: string;
  kind: TaskKind | null;
  done: boolean;
  due: { due: Due; text: string };
  owner: { name: string; initials: string } | null;
  fromCall: string | null;
  source: "lead" | "store";
}

export interface ContactDetail extends Contact {
  timeline: TimelineEntry[];
  calls: TimelineEntry[];
  /** Notes left on the linked lead (the contact's own free-text notes stay in `notes`). */
  notesTimeline: TimelineEntry[];
  tasks: ContactTask[];
  nextTask: ContactTask | null;
  counts: { calls: number; openTasks: number; tasks: number; notes: number };
  /** Other contacts at the same company (this one excluded). */
  sameCompany: { id: string; name: string; initials: string }[];
}

export const OUTCOME_LABEL: Record<string, string> = {
  CONNECTED: "Connected",
  NO_ANSWER: "No answer",
  NOT_INTERESTED: "Not interested",
  OTHER: "Other",
};

/** CT-1001 (padded to at least four digits). */
export const contactCode = (code: number) => `CT-${String(code).padStart(4, "0")}`;

/** Digits only; a local Nigerian "0…" number is normalised to international form for comparison. */
export function phoneKey(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function createdLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/** Display label for a LeadStatus enum value ("FOLLOW_UP" → "Follow up"). */
export function stageLabel(status: string): Stage {
  return (
    {
      NEW: "New",
      CONTACTED: "Contacted",
      CONNECTED: "Connected",
      INTERESTED: "Interested",
      FOLLOW_UP: "Follow up",
      QUALIFIED: "Qualified",
      PROPOSAL: "Proposal",
      WON: "Won",
      LOST: "Lost",
    } as Record<string, Stage>
  )[status] ?? "New";
}

/** Search by name, phone number or email. Phone matches on digits, ignoring spacing. */
export function matchesQuery(c: Contact, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    c.name.toLowerCase().includes(q) ||
    (digits !== "" && phoneKey(c.phone).includes(digits)) ||
    (c.email?.toLowerCase().includes(q) ?? false)
  );
}
