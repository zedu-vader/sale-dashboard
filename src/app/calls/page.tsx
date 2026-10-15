import CallsClient from "@/components/calls/CallsClient";
import { AppShell } from "@/components/shell/AppShell";
import { mockCalls, mockFollowUps } from "@/data/calls";

export const metadata = {
  title: "Calls | Sale Dashboard",
  description: "Track outbound calls, outcomes and follow-ups.",
};

// Mock shell props until the calls page is backed by the session + dashboard data layer.
export default function CallsPage() {
  return (
    <AppShell
      user={{ name: "Agnes" }}
      range={{ key: "month", period: "Oct 1 – Oct 31, 2026" }}
      newLeadCount={0}
      target={{ done: 14, goal: 20 }}
      activeHref="/calls"
    >
      <CallsClient initialCalls={mockCalls} initialFollowUps={mockFollowUps} />
    </AppShell>
  );
}
