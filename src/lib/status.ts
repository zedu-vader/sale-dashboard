import type { CallOutcome, LeadStatus, LeadType, LostReason, TaskType } from "@prisma/client";
import type { Stage, TaskKind } from "@/components/zedu";

// Lead pipeline stages. `stage` picks the ZEDU status pill colour; `label` is the wording on screen
// (the Leads designs say Follow-up, Converted and Not interested for FOLLOW_UP, WON and LOST).
export const STAGES: Record<LeadStatus, { stage: Stage; label: string; order: number }> = {
  NEW: { stage: "New", label: "New", order: 1 },
  CONTACTED: { stage: "Contacted", label: "Contacted", order: 2 },
  CONNECTED: { stage: "Connected", label: "Connected", order: 3 },
  INTERESTED: { stage: "Interested", label: "Interested", order: 4 },
  FOLLOW_UP: { stage: "Follow up", label: "Follow-up", order: 5 },
  QUALIFIED: { stage: "Qualified", label: "Qualified", order: 6 },
  PROPOSAL: { stage: "Proposal", label: "Proposal", order: 7 },
  WON: { stage: "Won", label: "Converted", order: 8 },
  LOST: { stage: "Lost", label: "Not interested", order: 9 },
};

/** Statuses in pipeline order, for menus and filters. */
export const STATUS_ORDER = (Object.keys(STAGES) as LeadStatus[]).sort((a, b) => STAGES[a].order - STAGES[b].order);

export const LOST_REASONS: Record<LostReason, string> = {
  NOT_INTERESTED: "Not interested",
  NO_BUDGET: "No budget",
  WRONG_CONTACT: "Wrong contact",
  WENT_WITH_COMPETITOR: "Went with competitor",
  OTHER: "Other",
};

export const CALL_OUTCOMES: Record<CallOutcome, string> = {
  CONNECTED: "Connected",
  NO_ANSWER: "No answer",
  NOT_INTERESTED: "Not interested",
  OTHER: "Other",
};

export const LEAD_TYPES: Record<LeadType, { label: string; kind: "individual" | "business" }> = {
  INDIVIDUAL: { label: "Individual", kind: "individual" },
  BUSINESS: { label: "Business", kind: "business" },
};

export const TASK_TYPES: Record<TaskType, { label: string; kind: TaskKind }> = {
  CALL: { label: "Call", kind: "call" },
  EMAIL: { label: "Email", kind: "email" },
  FOLLOW_UP: { label: "Follow-up", kind: "follow-up" },
  MEETING: { label: "Meeting", kind: "meeting" },
  OTHER: { label: "Other", kind: "other" },
};

/** LD-1042 */
export const leadCode = (code: number) => `LD-${code}`;

export const initialsOf = (name: string | null | undefined) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";
