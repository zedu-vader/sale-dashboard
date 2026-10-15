// Types and constants for the Leads screens, safe to import from client components (no Prisma client).

import type { LeadStatus, LeadType, TaskType } from "@prisma/client";
import type { ActivityKind, Due } from "@/components/zedu";

export const PAGE_SIZE = 25;

export type TeamMember = { id: string; name: string; initials: string; me: boolean };

export type LeadTab = "all" | "mine" | "unassigned";
export type LeadSort = "last" | "created" | "name";

export const SORTS: Record<LeadSort, string> = {
  last: "Last interaction",
  created: "Newest",
  name: "Name (A–Z)",
};

export type LeadListParams = {
  tab: LeadTab;
  q: string;
  statuses: LeadStatus[];
  types: LeadType[];
  /** User ids; "none" means unassigned. */
  owners: string[];
  sort: LeadSort;
  page: number;
};

export type LeadRow = {
  id: string;
  code: string;
  name: string;
  type: LeadType;
  phone: string;
  company: string | null;
  status: LeadStatus;
  owner: { id: string; name: string; initials: string } | null;
  lastInteraction: string | null;
  nextAction: { text: string; overdue: boolean } | null;
};

export type LeadListData = {
  rows: LeadRow[];
  total: number;
  page: number;
  pageCount: number;
  tabCounts: Record<LeadTab, number>;
  /** Per status, under the current tab, search, type and owner filters (ignoring the status filter). */
  statusCounts: Partial<Record<LeadStatus, number>>;
};

export type ProfileTask = {
  id: string;
  title: string;
  type: TaskType;
  done: boolean;
  due: { due: Due; text: string };
  owner: { name: string; initials: string } | null;
  fromCall: string | null;
};

export type TimelineEntry = {
  id: string;
  kind: ActivityKind;
  actor: string;
  action: string;
  time: string;
  call?: { outcome: string; connected: boolean; status: string | null; duration: string | null; notes: string | null };
  note?: string;
  status?: { from: LeadStatus | null; to: LeadStatus | null };
  task?: ProfileTask;
  detail?: string | null;
};

export type LeadProfile = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  type: LeadType;
  status: LeadStatus;
  lostReason: string | null;
  owner: { id: string; name: string; initials: string } | null;
  created: string;
  createdShort: string;
  lastInteraction: string | null;
  nextTask: ProfileTask | null;
  tasks: ProfileTask[];
  timeline: TimelineEntry[];
  calls: TimelineEntry[];
  notes: TimelineEntry[];
  counts: { calls: number; openTasks: number; tasks: number; notes: number };
};

