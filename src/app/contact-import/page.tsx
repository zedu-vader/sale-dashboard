import { ContactsShell } from "@/components/contacts";
import { ContactImportScreen } from "@/components/contacts/ContactImportScreen";

export const metadata = { title: "Import contacts" };
export const dynamic = "force-dynamic";

export default function ContactImportPage() {
  return (
    <ContactsShell>
      <ContactImportScreen />
    </ContactsShell>
  );
}
