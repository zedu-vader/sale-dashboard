import { notFound } from "next/navigation";
import { ContactDetail, ContactsShell } from "@/components/contacts";
import { getSession } from "@/lib/auth";
import { getContact, listLinkableLeads } from "@/lib/contacts";
import { getTeam } from "@/lib/leads";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const contact = await getContact(params.id);
  return { title: contact ? `${contact.name} (${contact.code}) · Contacts` : "Contact" };
}

export default async function Page({ params }: Props) {
  const [contact, linkableLeads, session] = await Promise.all([
    getContact(params.id),
    listLinkableLeads(),
    getSession(),
  ]);
  if (!contact) notFound();
  const team = session ? await getTeam(session.user.id) : [];

  return (
    <ContactsShell>
      <ContactDetail contact={contact} linkableLeads={linkableLeads} team={team} />
    </ContactsShell>
  );
}
