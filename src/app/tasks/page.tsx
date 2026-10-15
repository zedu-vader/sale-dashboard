import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInButton } from "@/components/AuthButtons";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { Card, Logo } from "@/components/zedu";
import { INITIAL_TASKS } from "@/data/tasks";
import type { TaskItem, TaskOwner } from "@/data/tasks";
import { prisma } from "@/lib/prisma";
import { CALL_OUTCOMES, LEGACY_CALL_OUTCOMES } from "@/lib/status";

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
  let callTasks: TaskItem[] = [];
  let callTasksUnavailable = false;
  try {
    const userId = (session.user as typeof session.user & { id?: string }).id;
    if (!userId) throw new Error("Authenticated user ID is unavailable");
    const persisted = await prisma.task.findMany({
      where: { callId: { not: null }, userId },
      include: { lead: { select: { id: true, name: true } }, call: { select: { calledAt: true, outcome: true, legacyOutcome: true, durationSeconds: true } } },
      orderBy: { dueAt: "asc" },
    });
    callTasks = persisted.map((task) => taskItem(task, name));
  } catch {
    // Keep the existing Tasks screen usable if the optional persisted call-task query is unavailable.
    callTasksUnavailable = true;
  }
  const tasks = [...callTasks, ...INITIAL_TASKS];
  const open = tasks.filter((t) => t.status !== "Completed").length;
  const overdue = tasks.some((t) => t.dueTone === "overdue" && t.status !== "Completed");

  return (
    <DashboardShell
      user={{ name, email: session.user.email, image: session.user.image }}
      openTaskCount={open}
      unread={overdue}
      active="Tasks"
    >
      <TasksBoard callTasks={callTasks} callTasksUnavailable={callTasksUnavailable} />
    </DashboardShell>
  );
}

function taskItem(task: {
  id: string;
  title: string;
  subtitle: string | null;
  dueAt: Date;
  done: boolean;
  ownerName: string;
  leadId: string | null;
  callId: string | null;
  lead: { id: string; name: string } | null;
  call: { calledAt: Date; outcome: keyof typeof CALL_OUTCOMES; legacyOutcome: keyof typeof LEGACY_CALL_OUTCOMES | null; durationSeconds: number | null } | null;
}, currentUser: string): TaskItem {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(task.dueAt.getFullYear(), task.dueAt.getMonth(), task.dueAt.getDate());
  const dueTone = task.done ? "done" : dueDay < today ? "overdue" : dueDay.getTime() === today.getTime() ? "today" : "upcoming";
  const ownerName = task.ownerName || currentUser;
  const owner: TaskOwner = { key: "me", name: ownerName, initials: ownerName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?" };
  const dueLabel = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(task.dueAt);
  const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(task.dueAt);
  const callOutcome = task.call?.legacyOutcome ? LEGACY_CALL_OUTCOMES[task.call.legacyOutcome] : task.call ? CALL_OUTCOMES[task.call.outcome] : "Call";
  return {
    id: task.id,
    persisted: true,
    title: task.title,
    description: task.subtitle ?? "",
    type: "Call",
    recordName: task.lead?.name ?? "Lead",
    recordKind: "Lead",
    fromCall: task.call ? `From call · ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(task.call.calledAt)}` : undefined,
    dueText: dueTone === "overdue" ? `Overdue · ${dueLabel}` : dueTone === "today" ? `Today · ${time}` : `${dueLabel} · ${time}`,
    dueTone,
    owner,
    status: task.done ? "Completed" : "Pending",
    linkedCall: task.call ? { person: task.lead?.name ?? "Lead", when: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(task.call.calledAt), outcome: callOutcome, duration: task.call.durationSeconds ? `${Math.round(task.call.durationSeconds / 60)} min` : "—" } : undefined,
    createdBy: `Assigned to ${ownerName}`,
  };
}
