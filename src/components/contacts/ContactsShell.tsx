import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { getSession } from "@/lib/auth";
import { getShellCounts } from "@/lib/shell";

// Wraps the contacts pages in the app shell.
export async function ContactsShell({ children }: { children: ReactNode }) {
  const [session, shell] = await Promise.all([getSession(), getShellCounts()]);
  const name = session?.user.name ?? session?.user.email ?? "Guest";

  return (
    <AppShell
      active="Contacts"
      user={{ name, email: session?.user.email, image: session?.user.image }}
      openTaskCount={shell.openTaskCount}
      unread={shell.unread}
    >
      {children}
    </AppShell>
  );
}
