"use client";

import { useRouter } from "next/navigation";
import ContactImport from "@/components/ContactImport";

export default function ContactImportPage() {
  const router = useRouter();

  function refreshContacts() {
    router.push("/contacts");
    router.refresh();
  }

  return (
    <ContactImport
      onClose={() => router.push("/contacts")}
      onImported={refreshContacts}
    />
  );
}