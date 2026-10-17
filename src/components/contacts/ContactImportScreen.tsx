"use client";

import { useRouter } from "next/navigation";
import ContactImport from "./ContactImport";

export function ContactImportScreen() {
  const router = useRouter();
  // Contacts fetches fresh data on return. Refreshing this route after saving
  // would remount the importer and erase its results.
  return <ContactImport standalone onClose={() => router.push("/contacts")} />;
}
