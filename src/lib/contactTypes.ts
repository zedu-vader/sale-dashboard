// Types and constants for the Contacts screens, safe to import from client components (no Prisma client).

import type { LeadStatus, LeadType } from "@prisma/client";
import type { ProfileTask, TimelineEntry } from "./leadTypes";

/** A contact that already has a phone number someone is entering, with its latest lead. */
export type DuplicateMatch = {
  id: string;
  code: string;
  name: string;
  company: string | null;
  lead: { id: string; code: string; owner: string | null } | null;
};

export type ContactTab = "all" | "individuals" | "businesses" | "duplicates";
export type ContactSort = "name" | "last" | "created";

export const CONTACT_SORTS: Record<ContactSort, string> = {
  name: "Name A–Z",
  last: "Last interaction",
  created: "Newest",
};

/** Linked lead filter: contacts with or without a lead. */
export type LinkedFilter = "with" | "without";
/** Created filter: within the last N days. */
export type CreatedFilter = "7" | "30" | "90";

export const CREATED_FILTERS: Record<CreatedFilter, string> = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" };
export const LINKED_FILTERS: Record<LinkedFilter, string> = { with: "Has a lead", without: "No lead" };

export type ContactListParams = {
  tab: ContactTab;
  q: string;
  companies: string[];
  linked: LinkedFilter[];
  created: CreatedFilter | "";
  sort: ContactSort;
  page: number;
};

export type ContactRow = {
  id: string;
  code: string;
  name: string;
  type: LeadType;
  phone: string;
  email: string | null;
  company: string | null;
  /** The latest lead; `more` counts any others. */
  lead: { id: string; code: string; status: LeadStatus; more: number } | null;
  lastInteraction: string | null;
  created: string;
};

export type DuplicateRecord = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: LeadType;
  /** "Created Oct 9 · 3 calls · 2 tasks · Lead LD-1042" */
  summary: string;
};

export type DuplicateReason = "phone" | "email" | "name";

export type DuplicatePair = {
  /** "aId:bId" with the ids sorted, as stored when dismissed. */
  key: string;
  reason: DuplicateReason;
  /** "Same phone number · +234 803 123 4567" */
  label: string;
  /** The older record first: it's the one kept by default when merging. */
  a: DuplicateRecord;
  b: DuplicateRecord;
};

export type ContactListData = {
  rows: ContactRow[];
  total: number;
  page: number;
  pageCount: number;
  tabCounts: Record<ContactTab, number>;
  /** Company names for the Company filter, most common first. */
  companies: string[];
  /** Only filled on the Possible duplicates tab. */
  pairs: DuplicatePair[];
};

export type ContactCall = {
  id: string;
  date: string;
  /** For sorting: ISO time. */
  at: string;
  outcome: string;
  connected: boolean;
  notes: string | null;
  duration: string | null;
  caller: { name: string; initials: string } | null;
  lead: { id: string; code: string } | null;
};

export type ContactLead = {
  id: string;
  code: string;
  status: LeadStatus;
  /** "Owner Agnes Okafor · Next: proposal today" */
  meta: string;
};

export type ContactProfile = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: LeadType;
  notes: string | null;
  created: string;
  createdShort: string;
  lastInteraction: string | null;
  leads: ContactLead[];
  /** Others at the same company: "2 contacts · Tolu Bankole". */
  companyInfo: { name: string; meta: string } | null;
  nextTask: ProfileTask | null;
  tasks: ProfileTask[];
  timeline: TimelineEntry[];
  calls: ContactCall[];
  notesTimeline: TimelineEntry[];
  counts: { calls: number; openTasks: number; tasks: number; notes: number };
};

/** Fields picked one by one in the merge dialog. */
export type MergeField = "name" | "phone" | "email" | "company" | "type";

export const MERGE_FIELDS: Record<MergeField, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  company: "Company",
  type: "Contact type",
};

/** Which record each field's value comes from. */
export type MergeChoice = Record<MergeField, "keep" | "merge">;

export type ContactFormValues = {
  name: string;
  phone: string;
  email: string;
  company: string;
  type: "INDIVIDUAL" | "BUSINESS";
  notes: string;
};

/** A lead the Create lead dialog can link: one whose contact isn't this one. */
export type LinkableLead = { id: string; code: string; name: string; status: LeadStatus };
