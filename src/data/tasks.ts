// Mock data for the Tasks screens (Figma: "ZEDU · Tasks screens", node 7:4065).
// UI-only pass: hardcoded rows + in-memory interactions. No API routes, no DB.

export type TaskType = "Call" | "Email" | "Follow-up" | "Meeting" | "Other";
export type TaskStatus = "Pending" | "Completed" | "Cancelled";
export type DueTone = "overdue" | "today" | "upcoming" | "done";
export type TaskTab = "all" | "overdue" | "today" | "upcoming" | "completed";

export interface TaskOwner {
  key: string;
  name: string;
  initials: string;
}

export const ME: TaskOwner = { key: "me", name: "Agnes Okafor", initials: "AO" };
export const IBRAHIM: TaskOwner = { key: "ibrahim", name: "Ibrahim Musa", initials: "IM" };
export const ZAINAB: TaskOwner = { key: "zainab", name: "Zainab Bello", initials: "ZB" };
export const UNASSIGNED: TaskOwner = { key: "unassigned", name: "Unassigned", initials: "–" };

export const TASK_OWNERS: TaskOwner[] = [ME, IBRAHIM, ZAINAB, UNASSIGNED];

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  recordName: string;
  /** Lead, Contact, or Internal (team-only record). */
  recordKind: "Lead" | "Contact" | "Internal";
  /** "From call · Oct 12" — shown when the task was created from a call. */
  fromCall?: string;
  dueText: string;
  dueTone: DueTone;
  owner: TaskOwner;
  status: TaskStatus;
  /** Originating call shown in the edit panel ("Created from a call" card). */
  linkedCall?: { person: string; when: string; outcome: string; duration: string };
  createdBy: string;
}

export const TASK_TYPES: TaskType[] = ["Call", "Email", "Follow-up", "Meeting", "Other"];

/** Tab counts are the Figma values (17 / 2 / 3 / 12). */
export const TASK_TAB_COUNTS: Record<TaskTab, number | null> = {
  all: 17,
  overdue: 2,
  today: 3,
  upcoming: 12,
  completed: null,
};

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: "t1",
    title: "Call back about bulk pricing",
    description: "Tunde asked for bulk pricing for 5 outlets. Call back with the tiered quote.",
    type: "Call",
    recordName: "Tunde Bakare",
    recordKind: "Lead",
    fromCall: "From call · Oct 12",
    dueText: "2 days overdue · Oct 13",
    dueTone: "overdue",
    owner: ME,
    status: "Pending",
    createdBy: "Created by Agnes Okafor on Oct 12",
  },
  {
    id: "t2",
    title: "Email onboarding checklist",
    description: "Send Ngozi the onboarding checklist and setup links.",
    type: "Email",
    recordName: "Ngozi Nwosu",
    recordKind: "Contact",
    dueText: "1 day overdue · Oct 14",
    dueTone: "overdue",
    owner: ME,
    status: "Pending",
    createdBy: "Created by Agnes Okafor on Oct 13",
  },
  {
    id: "t3",
    title: "Confirm demo time with Femi",
    description: "Confirm the demo slot with Femi Adeyemi for the Lagoon Foods team.",
    type: "Call",
    recordName: "Femi Adeyemi",
    recordKind: "Lead",
    fromCall: "From call · Oct 12",
    dueText: "Done · Today, 11:40 AM",
    dueTone: "done",
    owner: ME,
    status: "Completed",
    createdBy: "Created by Agnes Okafor on Oct 12",
  },
  {
    id: "t4",
    title: "Send proposal to Lagoon Foods",
    description: "Confirm pricing for 3 outlets and send the proposal before Friday.",
    type: "Follow-up",
    recordName: "Amaka Obi",
    recordKind: "Lead",
    fromCall: "From call · Oct 14",
    dueText: "Today · 3:00 PM",
    dueTone: "today",
    owner: ME,
    status: "Pending",
    linkedCall: { person: "Amaka Obi", when: "Oct 14, 10:12 AM", outcome: "Connected", duration: "4 min" },
    createdBy: "Created by Agnes Okafor on Oct 14 · Last edited 2 minutes ago",
  },
  {
    id: "t5",
    title: "Weekly pipeline review",
    description: "Review the team pipeline and update next actions.",
    type: "Meeting",
    recordName: "Sales team",
    recordKind: "Internal",
    dueText: "Today · 4:30 PM",
    dueTone: "today",
    owner: ME,
    status: "Pending",
    createdBy: "Created by Agnes Okafor on Oct 14",
  },
  {
    id: "t6",
    title: "First call: introduce Zedu",
    description: "Introductory call with Chiamaka Eze.",
    type: "Call",
    recordName: "Chiamaka Eze",
    recordKind: "Lead",
    dueText: "Tomorrow · 10:00 AM",
    dueTone: "upcoming",
    owner: ME,
    status: "Pending",
    createdBy: "Created by Agnes Okafor on Oct 14",
  },
  {
    id: "t7",
    title: "Share case study",
    description: "Share the Shoprite case study with Kunle Ajayi.",
    type: "Email",
    recordName: "Kunle Ajayi",
    recordKind: "Contact",
    dueText: "Mon, Oct 19",
    dueTone: "upcoming",
    owner: ME,
    status: "Pending",
    createdBy: "Created by Agnes Okafor on Oct 14",
  },
  {
    id: "t8",
    title: "Demo follow-up with Wale",
    description: "Follow up on yesterday's demo with Wale Johnson.",
    type: "Follow-up",
    recordName: "Wale Johnson",
    recordKind: "Lead",
    fromCall: "From call · Oct 13",
    dueText: "Fri, Oct 17",
    dueTone: "upcoming",
    owner: IBRAHIM,
    status: "Pending",
    createdBy: "Created by Ibrahim Musa on Oct 13",
  },
  {
    id: "t9",
    title: "Intro call with Dayo",
    description: "First introductory call with Dayo Ade.",
    type: "Call",
    recordName: "Dayo Ade",
    recordKind: "Contact",
    dueText: "Mon, Oct 20",
    dueTone: "upcoming",
    owner: ZAINAB,
    status: "Pending",
    createdBy: "Created by Zainab Bello on Oct 14",
  },
  {
    id: "t10",
    title: "Research Lagoon Foods",
    description: "Background research before the proposal goes out.",
    type: "Other",
    recordName: "Amaka Obi",
    recordKind: "Lead",
    dueText: "Tue, Oct 21",
    dueTone: "upcoming",
    owner: UNASSIGNED,
    status: "Pending",
    createdBy: "Created by Agnes Okafor on Oct 14",
  },
];
