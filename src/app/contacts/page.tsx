import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getContactList, parseContactParams } from "@/lib/contacts";
import { getShellCounts } from "@/lib/shell";
import { ContactsView } from "@/components/contacts/ContactsView";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contacts · Zedu Sales" };

type Props = { searchParams: Record<string, string | string[] | undefined> };

export default async function ContactsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const meId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !meId) redirect("/");

  const params = parseContactParams(searchParams);
  const [data, shell] = await Promise.all([getContactList(params), getShellCounts()]);
  const name = session.user.name ?? session.user.email ?? "there";

  return (
    <AppShell user={{ name, email: session.user.email, image: session.user.image }} {...shell}>
      <ContactsView params={params} data={data} />
    </AppShell>
  );
}
