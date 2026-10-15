import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Phone } from "lucide-react";
import { SignInButton } from "@/components/AuthButtons";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LeadCallHistory } from "@/components/calls/LeadCallHistory";
import { Card, PageHeader, StatusPill } from "@/components/zedu";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { STAGES } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function LeadProfile({ params }: { params: { id: string } }) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return <Unavailable />;
  }
  if (!session?.user) return <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6"><Card className="w-full max-w-[400px] items-start !gap-3 !p-8"><h1 className="text-z-page text-z-fg">Lead</h1><p className="text-z-small text-z-fg-muted">Sign in to view lead details and call history.</p><SignInButton /></Card></main>;

  let lead;
  let dashboard;
  try {
    [lead, dashboard] = await Promise.all([
      prisma.lead.findUnique({ where: { id: params.id } }),
      getDashboardData("30d"),
    ]);
  } catch {
    return <Unavailable />;
  }
  if (!lead) notFound();
  const name = session.user.name ?? session.user.email ?? "there";

  return <DashboardShell user={{ name, email: session.user.email, image: session.user.image }} openTaskCount={dashboard.openTaskCount} unread={dashboard.overdueCount > 0} active="Leads">
    <div className="zedu">
      <PageHeader title={lead.name} description={lead.phone} actions={<Link href={`/calls?log=1&leadId=${encodeURIComponent(lead.id)}`} className="inline-flex h-9 items-center gap-2 rounded-z-md bg-z-inverse px-3 text-z-small font-medium text-white"><Phone size={15} aria-hidden />Log call</Link>} />
      <div className="grid gap-4 px-6 pb-6 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(320px,1.2fr)] max-sm:px-4">
        <Card title="Lead details">
          <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-3 text-z-small">
            <dt className="text-z-fg-muted">Phone</dt><dd className="m-0 text-z-fg">{lead.phone}</dd>
            <dt className="text-z-fg-muted">Type</dt><dd className="m-0 text-z-fg">{lead.type === "BUSINESS" ? "Business" : "Individual"}</dd>
            <dt className="text-z-fg-muted">Status</dt><dd className="m-0"><StatusPill stage={STAGES[lead.status].label} /></dd>
            <dt className="text-z-fg-muted">Owner</dt><dd className="m-0 text-z-fg">{lead.ownerName}</dd>
            {lead.nextAction && <><dt className="text-z-fg-muted">Next action</dt><dd className="m-0 text-z-fg">{lead.nextAction}{lead.nextActionAt ? ` · ${lead.nextActionAt.toLocaleDateString()}` : ""}</dd></>}
          </dl>
        </Card>
        <LeadCallHistory leadId={lead.id} />
      </div>
    </div>
  </DashboardShell>;
}

function Unavailable() {
  return <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6"><section role="alert" className="w-full max-w-[420px]"><Card className="items-start !gap-3 !p-8"><h1 className="text-z-page text-z-fg">Lead details are temporarily unavailable</h1><p className="text-z-small text-z-fg-muted">We couldn’t confirm your sign-in or reach the lead data. Check your connection and try again.</p><Link href="/calls" className="text-z-small font-medium text-z-fg underline">Back to Calls</Link></Card></section></main>;
}
