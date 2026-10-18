export type ConnectionStatus = "CONNECTED" | "NOT_CONNECTED";
export type CallOutcome = "REQUESTED_CALLBACK" | "INTERESTED" | "NOT_INTERESTED" | "CONVERTED" | "OTHER" | "NOT_APPLICABLE";
export type TaskKind = "Call" | "Email" | "Note";

export interface LeadOption { id: string; name: string; phone: string }
export interface CallerOption { id: string; name: string }
export interface CallRecord {
  id: string;
  leadId: string | null;
  callerId: string | null;
  callerName: string | null;
  calledAt: string;
  durationSeconds: number | null;
  connectionStatus: ConnectionStatus;
  outcome: CallOutcome;
  legacyOutcome?: string | null;
  notes: string | null;
  nextAction: string | null;
  followUpAt: string | null;
  lead: { id: string; name: string; phone: string } | null;
  contact?: { id: string; name: string; phone: string } | null;
  caller: { id: string; name: string | null; email: string | null } | null;
  tasks: { id: string; title: string; dueAt: string; done: boolean }[];
}

export const OUTCOME_LABELS: Record<CallOutcome, string> = {
  REQUESTED_CALLBACK: "Requested callback",
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not interested",
  CONVERTED: "Converted",
  OTHER: "Other",
  NOT_APPLICABLE: "Not applicable",
};

const LEGACY_OUTCOME_LABELS: Record<string, string> = {
  CONNECTED: "Historical: connected",
  NO_ANSWER: "Historical: no answer",
  NOT_INTERESTED: "Historical: not interested",
  OTHER: "Historical: other",
};

export function callOutcomeLabel(call: Pick<CallRecord, "outcome" | "legacyOutcome">) {
  return call.legacyOutcome
    ? LEGACY_OUTCOME_LABELS[call.legacyOutcome] ?? `Historical outcome (${call.legacyOutcome})`
    : OUTCOME_LABELS[call.outcome];
}

export function formatCallDate(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Couldn’t reach the Calls service. Check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
  return data as T;
}
