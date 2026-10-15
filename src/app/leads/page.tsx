import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getLeadList, getTeam, parseLeadParams } from "@/lib/leads";
import { getShellCounts } from "@/lib/shell";
import { LeadsView } from "@/components/leads/LeadsView";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leads · Zedu Sales" };

type Props = { searchParams: Record<string, string | string[] | undefined> };

export default async function LeadsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const meId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !meId) redirect("/");

  const params = parseLeadParams(searchParams);
  const [data, team, shell] = await Promise.all([getLeadList(params, meId), getTeam(meId), getShellCounts()]);
  const name = session.user.name ?? session.user.email ?? "there";

  return (
    <AppShell user={{ name, email: session.user.email, image: session.user.image }} {...shell}>
      <LeadsView params={params} data={data} team={team} />
    </AppShell>
  );
}
