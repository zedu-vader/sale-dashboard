import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLeadOptions, getTasks } from "@/lib/tasks";
import { getTeam } from "@/lib/leads";
import { getShellCounts } from "@/lib/shell";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tasks · Zedu Sales" };

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/tasks");
  const meId = session.user.id;

  const [tasks, team, shell, leads] = await Promise.all([
    getTasks(),
    getTeam(meId),
    getShellCounts(),
    getLeadOptions(),
  ]);
  const name = session.user.name;

  return (
    <AppShell
      user={{ name, email: session.user.email, image: session.user.image, role: session.user.role }}
      {...shell}
      active="Tasks"
    >
      <Suspense>
        <TasksBoard initial={tasks} userId={meId} userName={name} leads={leads} team={team} />
      </Suspense>
    </AppShell>
  );
}
