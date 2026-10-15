import type { Stage } from "@/components/zedu";

export const CONTACT_TYPES = ["INDIVIDUAL", "BUSINESS"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const TYPE_LABEL: Record<ContactType, string> = {
  INDIVIDUAL: "Individual",
  BUSINESS: "Business",
};

/** Pipeline record a contact is linked to, if the team has reached out. */
export interface ContactLead {
  id: string;
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
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: ContactType | null;
  notes: string | null;
  createdAt: string;
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

export interface CallEntry {
  id: string;
  outcome: string;
  calledAt: string;
}

export interface TaskEntry {
  id: string;
  title: string;
  subtitle: string | null;
  dueAt: string;
  done: boolean;
  owner: string;
}

export interface ContactDetail extends Contact {
  calls: CallEntry[];
  tasks: TaskEntry[];
}

export const OUTCOME_LABEL: Record<string, string> = {
  CONNECTED: "Connected",
  NO_ANSWER: "No answer",
  NOT_INTERESTED: "Not interested",
  OTHER: "Other",
};

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
