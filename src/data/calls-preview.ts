import type { CallRecord, CallOutcome, LeadOption, CallerOption } from "@/components/calls/types";

const leads: LeadOption[] = [
  { id: "preview-lead-1", name: "Northstar Logistics", phone: "+1 (415) 555-0132" },
  { id: "preview-lead-2", name: "Amina Okafor", phone: "+234 803 555 0164" },
  { id: "preview-lead-3", name: "Brightpath Schools", phone: "+234 809 555 0128" },
  { id: "preview-lead-4", name: "Mosaic Retail Group", phone: "+1 (212) 555-0177" },
  { id: "preview-lead-5", name: "Daniel Mensah", phone: "+233 24 555 0139" },
  { id: "preview-lead-6", name: "Greenline Health", phone: "+234 802 555 0186" },
];

export const previewCallers: CallerOption[] = [
  { id: "preview-caller-1", name: "Alex Morgan" },
  { id: "preview-caller-2", name: "Jordan Lee" },
];

const outcomes: CallOutcome[] = ["INTERESTED", "REQUESTED_CALLBACK", "NOT_INTERESTED", "CONVERTED", "OTHER", "NOT_APPLICABLE"];
const notes = [
  "Discussed the team plan and requested a short proposal.",
  "Asked for a callback after reviewing the details with their team.",
  "No answer; will try again during the preferred contact window.",
  "Confirmed the next steps and shared onboarding information.",
  "Not a fit right now; keep the relationship open for later.",
  "Left a brief message with the main office.",
];

export const previewCalls: CallRecord[] = Array.from({ length: 32 }, (_, index) => {
  const lead = leads[index % leads.length]!;
  const connectionStatus = index % 4 === 2 ? "NOT_CONNECTED" : "CONNECTED";
  const outcome = connectionStatus === "NOT_CONNECTED" ? "NOT_APPLICABLE" : outcomes[index % (outcomes.length - 1)]!;
  const calledAt = new Date(Date.UTC(2026, 9, 15 - index, 8 + (index % 8), (index * 7) % 60));
  const hasTask = index % 5 === 1;
  return {
    id: `preview-call-${String(index + 1).padStart(2, "0")}`,
    leadId: lead.id,
    callerId: `preview-caller-${index % 2 + 1}`,
    callerName: previewCallers[index % 2]!.name,
    calledAt: calledAt.toISOString(),
    durationSeconds: connectionStatus === "CONNECTED" ? 75 + index * 23 : null,
    connectionStatus,
    outcome,
    notes: notes[index % notes.length]!,
    nextAction: hasTask ? "Send the requested information" : null,
    followUpAt: hasTask ? new Date(calledAt.getTime() + 3 * 86400000).toISOString() : null,
    lead: { id: lead.id, name: lead.name, phone: lead.phone },
    caller: { id: `preview-caller-${index % 2 + 1}`, name: previewCallers[index % 2]!.name, email: null },
    tasks: hasTask ? [{ id: `preview-task-${index + 1}`, title: "Send the requested information", dueAt: new Date(calledAt.getTime() + 3 * 86400000).toISOString(), done: index % 10 === 1 }] : [],
  };
});

export const previewLeads = leads;
