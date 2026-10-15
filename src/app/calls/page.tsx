import { getServerSession } from "next-auth";
import { SignInButton } from "@/components/AuthButtons";
import { CallsPage } from "@/components/calls/CallsPage";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, Logo } from "@/components/zedu";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { parseRange } from "@/lib/range";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calls" };

type Props = { searchParams: { log?: string | string[]; leadId?: string | string[]; range?: string | string[] } };

export default async function CallsRoute({ searchParams }: Props) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return <Unavailable />;
  }
  if (!session?.user) {
    return <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6"><Card className="w-full max-w-[400px] items-start !gap-3 !p-8"><Logo /><h1 className="mt-4 text-z-page text-z-fg">Calls</h1><p className="mb-2 text-z-small text-z-fg-muted">Sign in to view and log calls.</p><SignInButton /></Card></main>;
  }

  const name = session.user.name ?? session.user.email ?? "there";
  const range = parseRange(searchParams.range);
  try {
    const [dashboard, leads, callers] = await Promise.all([
      getDashboardData(range),
      prisma.lead.findMany({ select: { id: true, name: true, phone: true }, orderBy: { name: "asc" } }),
      prisma.user.findMany({ where: { calls: { some: {} } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    ]);
    return <DashboardShell user={{ name, email: session.user.email, image: session.user.image }} openTaskCount={dashboard.openTaskCount} unread={dashboard.overdueCount > 0} active="Calls">
      <div className="zedu px-6 pb-6 pt-4 max-sm:px-4"><CallsPage leads={leads} callers={callers.map((caller) => ({ id: caller.id, name: caller.name?.trim() || caller.email || "Unknown caller" }))} callerName={name} /></div>
    </DashboardShell>;
  } catch {
    return <Unavailable />;
  }
}

function Unavailable() {
  return <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6"><section role="alert" className="w-full max-w-[420px]"><Card className="items-start !gap-3 !p-8"><Logo /><h1 className="mt-3 text-z-page text-z-fg">Calls are temporarily unavailable</h1><p className="text-z-small text-z-fg-muted">We couldn’t reach the Calls data. Check your connection and try again.</p><a href="/calls" className="text-z-small font-medium text-z-fg underline">Try again</a></Card></section></main>;
}
