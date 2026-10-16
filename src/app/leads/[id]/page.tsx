import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getLeadProfile, getTeam } from "@/lib/leads";
import { getShellCounts } from "@/lib/shell";
import { LeadProfileView } from "@/components/leads/LeadProfileView";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: Record<string, string | string[] | undefined> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lead = await getLeadProfile(params.id).catch(() => null);
  return { title: lead ? `${lead.name} (${lead.code}) · Leads` : "Lead · Zedu Sales" };
}

const TABS = ["activity", "calls", "tasks", "notes"] as const;

export default async function LeadPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const meId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !meId) redirect("/");

  const [lead, team, shell] = await Promise.all([getLeadProfile(params.id), getTeam(meId), getShellCounts()]);
  if (!lead) notFound();

  const name = session.user.name ?? session.user.email ?? "there";
  const tab = TABS.find((t) => t === searchParams.tab) ?? "activity";

  return (
    <AppShell user={{ name, email: session.user.email, image: session.user.image }} {...shell}>
      <LeadProfileView lead={lead} team={team} me={{ name }} initialTab={tab} initialEdit={searchParams.edit === "1"} />
    </AppShell>
  );
}
