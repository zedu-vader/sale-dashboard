import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInButton } from "@/components/AuthButtons";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { Card, Logo } from "@/components/zedu";
import { INITIAL_TASKS } from "@/data/tasks";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6">
        <Card className="w-full max-w-[400px] items-start !gap-3 !p-8 max-sm:!p-6">
          <Logo />
          <h1 className="mt-4 text-z-page text-z-fg">Tasks</h1>
          <p className="mb-2 text-z-small text-z-fg-muted">Sign in to see your tasks and follow-ups.</p>
          <SignInButton />
        </Card>
      </main>
    );
  }

  const name = session.user.name ?? session.user.email ?? "there";
  const open = INITIAL_TASKS.filter((t) => t.status !== "Completed").length;
  const overdue = INITIAL_TASKS.some((t) => t.dueTone === "overdue" && t.status !== "Completed");

  return (
    <DashboardShell
      user={{ name, email: session.user.email, image: session.user.image }}
      openTaskCount={open}
      unread={overdue}
      active="Tasks"
    >
      <TasksBoard />
    </DashboardShell>
  );
}
