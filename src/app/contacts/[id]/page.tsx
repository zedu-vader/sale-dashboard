import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getContactProfile, resolveContactId } from "@/lib/contacts";
import { getTeam } from "@/lib/leads";
import { getShellCounts } from "@/lib/shell";
import { ContactProfileView } from "@/components/contacts/ContactProfileView";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: Record<string, string | string[] | undefined> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const contact = await getContactProfile(params.id).catch(() => null);
  return { title: contact ? `${contact.name} (${contact.code}) · Contacts` : "Contact · Zedu Sales" };
}

const TABS = ["activity", "calls", "tasks", "notes"] as const;

export default async function ContactPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const meId = session.user.id;

  // A merged contact's link opens the record it was merged into.
  const id = await resolveContactId(params.id);
  if (!id) notFound();
  if (id !== params.id) redirect(`/contacts/${id}`);

  const [contact, team, shell] = await Promise.all([getContactProfile(id), getTeam(meId), getShellCounts()]);
  if (!contact) notFound();

  const name = session.user.name;
  const tab = TABS.find((t) => t === searchParams.tab) ?? "activity";
  const lead = searchParams.lead === "new" || searchParams.lead === "link" ? searchParams.lead : null;

  return (
    <AppShell user={{ name, email: session.user.email, image: session.user.image }} {...shell}>
      <ContactProfileView
        contact={contact}
        team={team}
        me={{ name }}
        initialTab={tab}
        initialEdit={searchParams.edit === "1"}
        initialLead={lead}
      />
    </AppShell>
  );
}
