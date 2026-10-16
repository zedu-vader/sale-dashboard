import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getContactList, parseContactParams } from "@/lib/contacts";
import { getShellCounts } from "@/lib/shell";
import { ContactsView } from "@/components/contacts/ContactsView";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contacts · Zedu Sales" };

type Props = { searchParams: Record<string, string | string[] | undefined> };

export default async function ContactsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = parseContactParams(searchParams);
  const [data, shell] = await Promise.all([getContactList(params), getShellCounts()]);
  const name = session.user.name;

  return (
    <AppShell user={{ name, email: session.user.email, image: session.user.image, role: session.user.role }} {...shell}>
      <ContactsView params={params} data={data} />
    </AppShell>
  );
}
