import type { LeadStatus, LostReason } from "@prisma/client";

// Lead pipeline stages and pill styles, Zedu Design System §7.6.
// Dark mode keeps the background opacity and lightens the text to the semantic dark token.
export const STAGES: Record<LeadStatus, { label: string; order: number; pill: string }> = {
  NEW: { label: "New", order: 1, pill: "bg-indigo-100 text-[#4b2bd6] dark:bg-brand-soft dark:text-[#b9a8ff]" },
  CONTACTED: { label: "Contacted", order: 2, pill: "bg-[rgba(107,104,144,.12)] text-[#4a4770] dark:bg-[rgba(161,157,201,.14)] dark:text-[#c3c0e3]" },
  CONNECTED: { label: "Connected", order: 3, pill: "bg-[rgba(46,144,250,.12)] text-[#1a6fd1] dark:text-[#53b1fd]" },
  INTERESTED: { label: "Interested", order: 4, pill: "bg-[rgba(18,183,106,.12)] text-[#0b8a50] dark:text-[#32d583]" },
  FOLLOW_UP: { label: "Follow up", order: 5, pill: "bg-[rgba(245,165,36,.15)] text-[#b4740a] dark:text-[#fdb022]" },
  QUALIFIED: { label: "Qualified", order: 6, pill: "bg-[rgba(109,77,255,.14)] text-[#5534e0] dark:bg-[rgba(157,133,255,.18)] dark:text-[#b9a8ff]" },
  PROPOSAL: { label: "Proposal", order: 7, pill: "bg-coral-100 text-[#c4502f] dark:bg-[rgba(255,122,89,.15)] dark:text-[#ff8f73]" },
  WON: { label: "Won", order: 8, pill: "bg-gradient-brand text-white" },
  LOST: { label: "Lost", order: 9, pill: "bg-[rgba(240,68,97,.12)] text-[#d0284a] dark:text-[#f97066]" },
};

export const LOST_REASONS: Record<LostReason, string> = {
  NOT_INTERESTED: "Not interested",
  NO_BUDGET: "No budget",
  WRONG_CONTACT: "Wrong contact",
  WENT_WITH_COMPETITOR: "Went with competitor",
  OTHER: "Other",
};
