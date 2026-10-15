export type CallOutcome =
  | "Interested"
  | "Requested callback"
  | "No answer"
  | "Converted"
  | "Not interested"
  | "Connected";

export const CALL_OUTCOMES: CallOutcome[] = [
  "Interested",
  "Requested callback",
  "No answer",
  "Converted",
  "Not interested",
  "Connected",
];

export interface Caller {
  initials: string;
  name: string;
}

export interface NextAction {
  label: string;
  date: string;
}

export interface CallRecord {
  id: string;
  name: string;
  initials: string;
  phone: string;
  leadType: "Individual" | "Business";
  startedAt: string;
  durationSec: number | null;
  outcome: CallOutcome;
  caller: Caller;
  nextAction: NextAction | null;
  notes: string;
  attempts: number;
}

export interface FollowUp {
  id: string;
  name: string;
  phone: string;
  reason: string;
  dueAt: string;
}

const AGNES: Caller = { initials: "AO", name: "Agnes" };
const FEMI: Caller = { initials: "FB", name: "Femi" };
const SARAH: Caller = { initials: "SB", name: "Sarah" };

export const mockCalls: CallRecord[] = [
  {
    id: "call-01",
    name: "Tunde Adebayo",
    initials: "TA",
    phone: "+234 803 123 4567",
    leadType: "Individual",
    startedAt: "2026-10-15T10:12:00",
    durationSec: 384,
    outcome: "Interested",
    caller: AGNES,
    nextAction: { label: "Call again", date: "Oct 17" },
    notes: "Interested in the growth plan. Asked for pricing details.",
    attempts: 2,
  },
  {
    id: "call-02",
    name: "Flourish Ltd",
    initials: "FL",
    phone: "+234 802 987 6543",
    leadType: "Business",
    startedAt: "2026-10-15T09:45:00",
    durationSec: 250,
    outcome: "Requested callback",
    caller: FEMI,
    nextAction: { label: "Call back", date: "Oct 16" },
    notes: "Discussed onboarding for a 12-seat team. Requested a callback.",
    attempts: 3,
  },
  {
    id: "call-03",
    name: "Kemi Ibrahim",
    initials: "KI",
    phone: "+234 816 222 3344",
    leadType: "Individual",
    startedAt: "2026-10-14T16:20:00",
    durationSec: null,
    outcome: "No answer",
    caller: AGNES,
    nextAction: { label: "Call again", date: "Oct 16" },
    notes: "No answer. Try again tomorrow.",
    attempts: 1,
  },
  {
    id: "call-04",
    name: "Ben Okafor",
    initials: "BO",
    phone: "+234 809 444 2211",
    leadType: "Business",
    startedAt: "2026-10-14T11:05:00",
    durationSec: 481,
    outcome: "Converted",
    caller: FEMI,
    nextAction: null,
    notes: "Converted to the annual plan after the demo.",
    attempts: 2,
  },
  {
    id: "call-05",
    name: "Amaka Akintola",
    initials: "AA",
    phone: "+234 818 765 4321",
    leadType: "Individual",
    startedAt: "2026-10-13T15:30:00",
    durationSec: 198,
    outcome: "Not interested",
    caller: AGNES,
    nextAction: null,
    notes: "Said the timing is wrong. Asked not to call again this quarter.",
    attempts: 1,
  },
  {
    id: "call-06",
    name: "Daniel Osei",
    initials: "DO",
    phone: "+234 701 334 5566",
    leadType: "Business",
    startedAt: "2026-10-13T10:15:00",
    durationSec: 302,
    outcome: "Interested",
    caller: SARAH,
    nextAction: { label: "Send details", date: "Oct 16" },
    notes: "Wants a comparison with his current provider.",
    attempts: 1,
  },
  {
    id: "call-07",
    name: "Lola Adeyemi",
    initials: "LA",
    phone: "+234 903 112 4455",
    leadType: "Individual",
    startedAt: "2026-10-12T14:45:00",
    durationSec: null,
    outcome: "No answer",
    caller: FEMI,
    nextAction: { label: "Call again", date: "Oct 18" },
    notes: "No answer after three rings.",
    attempts: 2,
  },
  {
    id: "call-08",
    name: "Uche Chima",
    initials: "UC",
    phone: "+234 806 998 7766",
    leadType: "Business",
    startedAt: "2026-10-12T11:30:00",
    durationSec: 160,
    outcome: "Interested",
    caller: AGNES,
    nextAction: { label: "Follow up", date: "Oct 16" },
    notes: "Shared product details over WhatsApp after the call.",
    attempts: 1,
  },
  {
    id: "call-09",
    name: "Ifeanyi Nwosu",
    initials: "IN",
    phone: "+234 817 662 3311",
    leadType: "Individual",
    startedAt: "2026-10-10T16:12:00",
    durationSec: 435,
    outcome: "Connected",
    caller: SARAH,
    nextAction: { label: "Call again", date: "Oct 17" },
    notes: "Asked for a second demo with his team on the call.",
    attempts: 2,
  },
  {
    id: "call-10",
    name: "Ezinne Okoro",
    initials: "EO",
    phone: "+234 904 221 9988",
    leadType: "Business",
    startedAt: "2026-10-10T11:08:00",
    durationSec: null,
    outcome: "No answer",
    caller: AGNES,
    nextAction: { label: "Call again", date: "Oct 15" },
    notes: "Line was busy, then no answer on retry.",
    attempts: 3,
  },
  {
    id: "call-11",
    name: "Chidi Eze",
    initials: "CE",
    phone: "+234 805 555 0192",
    leadType: "Individual",
    startedAt: "2026-10-09T10:02:00",
    durationSec: 212,
    outcome: "Connected",
    caller: SARAH,
    nextAction: { label: "Send details", date: "Oct 14" },
    notes: "Connected briefly. Sent the starter-pack PDF.",
    attempts: 2,
  },
  {
    id: "call-12",
    name: "Ngozi Obi",
    initials: "NO",
    phone: "+234 807 311 8874",
    leadType: "Business",
    startedAt: "2026-10-08T14:40:00",
    durationSec: 329,
    outcome: "Requested callback",
    caller: FEMI,
    nextAction: { label: "Call back", date: "Oct 13" },
    notes: "Left a voicemail with callback number, then spoke to the PA.",
    attempts: 1,
  },
  {
    id: "call-13",
    name: "Danjuma Bello",
    initials: "DB",
    phone: "+234 810 204 6651",
    leadType: "Individual",
    startedAt: "2026-10-08T09:15:00",
    durationSec: 188,
    outcome: "Interested",
    caller: AGNES,
    nextAction: { label: "Call again", date: "Oct 14" },
    notes: "Curious about pricing for a single seat.",
    attempts: 1,
  },
  {
    id: "call-14",
    name: "Fatima Sule",
    initials: "FS",
    phone: "+234 813 908 1120",
    leadType: "Business",
    startedAt: "2026-10-07T13:25:00",
    durationSec: null,
    outcome: "No answer",
    caller: SARAH,
    nextAction: { label: "Call again", date: "Oct 12" },
    notes: "No answer. Try again next week.",
    attempts: 3,
  },
  {
    id: "call-15",
    name: "Emeka Nwosu",
    initials: "EN",
    phone: "+234 806 777 3429",
    leadType: "Individual",
    startedAt: "2026-10-07T10:50:00",
    durationSec: 415,
    outcome: "Converted",
    caller: FEMI,
    nextAction: null,
    notes: "Converted after the team demo.",
    attempts: 2,
  },
  {
    id: "call-16",
    name: "Aisha Musa",
    initials: "AM",
    phone: "+234 812 456 9083",
    leadType: "Individual",
    startedAt: "2026-10-06T16:05:00",
    durationSec: 233,
    outcome: "Connected",
    caller: SARAH,
    nextAction: { label: "Follow up", date: "Oct 11" },
    notes: "Wants to compare plans before deciding.",
    attempts: 1,
  },
  {
    id: "call-17",
    name: "Wale Johnson",
    initials: "WJ",
    phone: "+234 804 321 7765",
    leadType: "Business",
    startedAt: "2026-10-06T11:30:00",
    durationSec: 145,
    outcome: "Not interested",
    caller: AGNES,
    nextAction: null,
    notes: "Happy with current vendor. Closed lost.",
    attempts: 1,
  },
  {
    id: "call-18",
    name: "Zainab Lawal",
    initials: "ZL",
    phone: "+234 815 678 2034",
    leadType: "Individual",
    startedAt: "2026-10-05T12:20:00",
    durationSec: 276,
    outcome: "Interested",
    caller: FEMI,
    nextAction: { label: "Call again", date: "Oct 10" },
    notes: "Asked about discount for early payment.",
    attempts: 2,
  },
  {
    id: "call-19",
    name: "Peter Adeyinka",
    initials: "PA",
    phone: "+234 809 345 7812",
    leadType: "Business",
    startedAt: "2026-10-04T09:55:00",
    durationSec: null,
    outcome: "No answer",
    caller: SARAH,
    nextAction: { label: "Call again", date: "Oct 09" },
    notes: "No answer on both attempts.",
    attempts: 2,
  },
  {
    id: "call-20",
    name: "Grace Ebere",
    initials: "GE",
    phone: "+234 803 890 4561",
    leadType: "Individual",
    startedAt: "2026-10-03T15:10:00",
    durationSec: 358,
    outcome: "Connected",
    caller: AGNES,
    nextAction: { label: "Send details", date: "Oct 08" },
    notes: "Sent onboarding guide after the call.",
    attempts: 1,
  },
  {
    id: "call-21",
    name: "Musa Abdullahi",
    initials: "MA",
    phone: "+234 807 123 8890",
    leadType: "Business",
    startedAt: "2026-10-02T10:40:00",
    durationSec: 194,
    outcome: "Requested callback",
    caller: FEMI,
    nextAction: { label: "Call back", date: "Oct 07" },
    notes: "Asked to call back when the MD is available.",
    attempts: 1,
  },
  {
    id: "call-22",
    name: "Tolu Alabi",
    initials: "TA",
    phone: "+234 810 567 1234",
    leadType: "Individual",
    startedAt: "2026-10-01T13:15:00",
    durationSec: 301,
    outcome: "Interested",
    caller: SARAH,
    nextAction: { label: "Follow up", date: "Oct 06" },
    notes: "Followed up on product interest from the website form.",
    attempts: 1,
  },
];

export const mockFollowUps: FollowUp[] = [
  {
    id: "fu-01",
    name: "Tunde Adebayo",
    phone: "+234 803 123 4567",
    reason: "Share pricing details",
    dueAt: "2026-10-16T10:00:00",
  },
  {
    id: "fu-02",
    name: "Flourish Ltd",
    phone: "+234 802 987 6543",
    reason: "Send onboarding proposal",
    dueAt: "2026-10-16T11:30:00",
  },
  {
    id: "fu-03",
    name: "Ben Okafor",
    phone: "+234 809 444 2211",
    reason: "Check decision with partner",
    dueAt: "2026-10-16T14:00:00",
  },
  {
    id: "fu-04",
    name: "Emeka Nwosu",
    phone: "+234 806 777 3429",
    reason: "Second demo with his team",
    dueAt: "2026-10-17T09:30:00",
  },
];

export function formatDuration(totalSec: number | null): string {
  if (totalSec === null) return "—";
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatDurationShort(totalSec: number | null): string {
  if (totalSec === null) return "—";
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export function initialsFromName(name: string): string {
  const words = name.replace(/ Ltd$/, "").split(" ");
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
