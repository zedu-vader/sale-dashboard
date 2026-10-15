import type { CallOutcome, LeadStatus, LostReason } from "@prisma/client";
import type { Stage } from "@/components/zedu";

// Lead pipeline stages, mapped to the ZEDU status pill labels (which fix the pill colour per stage).
export const STAGES: Record<LeadStatus, { label: Stage; order: number }> = {
  NEW: { label: "New", order: 1 },
  CONTACTED: { label: "Contacted", order: 2 },
  CONNECTED: { label: "Connected", order: 3 },
  INTERESTED: { label: "Interested", order: 4 },
  FOLLOW_UP: { label: "Follow up", order: 5 },
  QUALIFIED: { label: "Qualified", order: 6 },
  PROPOSAL: { label: "Proposal", order: 7 },
  WON: { label: "Won", order: 8 },
  LOST: { label: "Lost", order: 9 },
};

export const LOST_REASONS: Record<LostReason, string> = {
  NOT_INTERESTED: "Not interested",
  NO_BUDGET: "No budget",
  WRONG_CONTACT: "Wrong contact",
  WENT_WITH_COMPETITOR: "Went with competitor",
  OTHER: "Other",
};

export const CALL_OUTCOMES: Record<CallOutcome, string> = {
  REQUESTED_CALLBACK: "Requested callback",
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not interested",
  CONVERTED: "Converted",
  OTHER: "Other",
  NOT_APPLICABLE: "Not applicable",
};

export const LEGACY_CALL_OUTCOMES = {
  CONNECTED: "Connected",
  NO_ANSWER: "No answer",
  NOT_INTERESTED: "Not interested",
  OTHER: "Other",
} as const;
