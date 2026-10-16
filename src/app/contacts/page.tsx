import { ContactsPage, ContactsShell } from "@/components/contacts";

export const metadata = { title: "Contacts" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContactsShell>
      <ContactsPage />
    </ContactsShell>
  );
}
