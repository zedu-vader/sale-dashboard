import { LeadStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { authOptions } from "@/lib/auth";
import { MONTHLY_TARGET } from "@/lib/dashboard";
import { formatRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DEFAULT_RANGE, resolveRange } from "@/lib/range";

// Wraps the contacts pages in the app shell. Range chrome and the target card
// use light queries rather than the full dashboard data layer.
export async function ContactsShell({ children }: { children: ReactNode }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [session, newLeadCount, wonThisMonth] = await Promise.all([
    getServerSession(authOptions),
    prisma.lead.count({ where: { status: LeadStatus.NEW } }),
    prisma.lead.count({ where: { status: LeadStatus.WON, createdAt: { gte: monthStart } } }),
  ]);
  const name = session?.user?.name ?? session?.user?.email ?? "Guest";
  const { from, to } = resolveRange(DEFAULT_RANGE, now);

  return (
    <AppShell
      user={{ name, email: session?.user?.email, image: session?.user?.image }}
      range={{ key: DEFAULT_RANGE, period: formatRange(from, new Date(to.getTime() - 1)) }}
      newLeadCount={newLeadCount}
      target={{ done: wonThisMonth, goal: MONTHLY_TARGET }}
      activeHref="/contacts"
    >
      {children}
    </AppShell>
  );
}
