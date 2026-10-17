// Shared client types for the Tasks screens (Figma: "ZEDU · Tasks screens", node 7:4065).
// Rows are built server-side in src/lib/tasks.ts — no mock data here.

export type TaskType = "Call" | "Email" | "Follow-up" | "Meeting" | "Other";
export type TaskStatus = "Pending" | "Completed";
export type StatusFilter = TaskStatus | "All";
export type DueTone = "overdue" | "today" | "upcoming" | "done";
export type TaskTab = "all" | "overdue" | "today" | "upcoming" | "completed";

export interface TaskOwner {
  key: string;
  name: string;
  initials: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  recordName: string;
  /** Lead, or Internal for team-only records. */
  recordKind: "Lead" | "Internal";
  /** "From call · Oct 12" — shown when the task was created from a call. */
  fromCall?: string;
  dueText: string;
  dueTone: DueTone;
  /** ISO instant, for editing the due date/time. */
  dueAt: string;
  owner: TaskOwner;
  /** Assignee user id, null when Unassigned. */
  ownerId: string | null;
  status: TaskStatus;
  leadId?: string | null;
  callId?: string | null;
  /** Originating call shown in the edit panel ("Created from a call" card). */
  linkedCall?: { person: string; when: string; outcome: string; duration: string };
  createdBy: string;
}

export const TASK_TYPES: TaskType[] = ["Call", "Email", "Follow-up", "Meeting", "Other"];

export const TASK_STATUSES: TaskStatus[] = ["Pending", "Completed"];

/** Africa/Lagos is UTC+1 year-round (no DST), so wall time is a fixed shift. */
const LAGOS_MS = 3600_000;

function lagosWall(d: Date): Date {
  return new Date(d.getTime() + LAGOS_MS);
}

/** YYYY-MM-DD of today in Lagos, plus an optional day offset. */
export function lagosToday(offsetDays = 0): string {
  return lagosWall(new Date(Date.now() + offsetDays * 86400000)).toISOString().slice(0, 10);
}

/** ISO instant -> Lagos wall date for <input type="date">. */
export function isoToDateInput(iso: string): string {
  return lagosWall(new Date(iso)).toISOString().slice(0, 10);
}

/** ISO instant -> Lagos wall time for <input type="time">. */
export function isoToTimeInput(iso: string): string {
  return lagosWall(new Date(iso)).toISOString().slice(11, 16);
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}
