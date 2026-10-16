import { notFound } from "next/navigation";
import { ContactDetail, ContactsShell } from "@/components/contacts";
import { getContact, listLinkableLeads } from "@/lib/contacts";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const contact = await getContact(params.id);
  return { title: contact ? `${contact.name} · Contacts` : "Contact" };
}

export default async function Page({ params }: Props) {
  const contact = await getContact(params.id);
  if (!contact) notFound();
  const linkableLeads = await listLinkableLeads();

  return (
    <ContactsShell>
      <ContactDetail contact={contact} linkableLeads={linkableLeads} />
    </ContactsShell>
  );
}
