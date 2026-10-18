import { redirect } from "next/navigation";
import { CallsPage } from "@/components/calls/CallsPage";
import { AppShell } from "@/components/shell/AppShell";
import { Card, Logo } from "@/components/zedu";
import { getSession } from "@/lib/auth";
import { getShellCounts } from "@/lib/shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calls · Zedu Sales" };

type Props = { searchParams: { log?: string | string[]; leadId?: string | string[] } };

export default async function CallsRoute({ searchParams }: Props) {
  let session;
  try { session = await getSession(); } catch { return <Unavailable />; }
  if (!session) redirect("/login?next=/calls");
  try {
    const [shell, leads, callers] = await Promise.all([
      getShellCounts(),
      prisma.lead.findMany({ select: { id: true, contact: { select: { name: true, phone: true } } }, orderBy: { contact: { name: "asc" } } }),
      prisma.user.findMany({ where: { calls: { some: {} } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    ]);
    const name = session.user.name || session.user.email;
    return <AppShell user={{ name, email: session.user.email, image: session.user.image, role: session.user.role }} {...shell} active="Calls">
      <div className="zedu px-6 pb-6 pt-4 max-sm:px-4">
        <CallsPage
          leads={leads.map((lead) => ({ id: lead.id, name: lead.contact.name, phone: lead.contact.phone }))}
          callers={callers.map((caller) => ({ id: caller.id, name: caller.name?.trim() || caller.email || "Unknown caller" }))}
          callerName={name}
        />
      </div>
    </AppShell>;
  } catch { return <Unavailable />; }
}

function Unavailable() {
  return <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6"><section role="alert" className="w-full max-w-[420px]"><Card className="items-start !gap-3 !p-8"><Logo /><h1 className="mt-3 text-z-page text-z-fg">Calls are temporarily unavailable</h1><p className="text-z-small text-z-fg-muted">We couldn’t reach the Calls data. Check your connection and try again.</p><a href="/calls" className="text-z-small font-medium text-z-fg underline">Try again</a></Card></section></main>;
}
