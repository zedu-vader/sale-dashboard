import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTask as updateLegacyTask } from "@/lib/tasks-store";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let auth;
  try { auth = await requireUser(); } catch {
    return NextResponse.json({ error: "Tasks are temporarily unavailable." }, { status: 503 });
  }
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.done !== "boolean") return NextResponse.json({ error: "A boolean done value is required" }, { status: 400 });
  try {
    const persisted = await prisma.task.findUnique({ where: { id: params.id }, select: { id: true } });
    if (persisted) {
      const task = await prisma.task.update({
        where: { id: persisted.id },
        data: { done: body.done, completedAt: body.done ? new Date() : null },
        select: { id: true, done: true, completedAt: true },
      });
      return NextResponse.json(task);
    }
    const legacyTask = await updateLegacyTask(params.id, { done: body.done });
    if (!legacyTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(legacyTask);
  } catch {
    return NextResponse.json({ error: "Tasks are temporarily unavailable." }, { status: 503 });
  }
}
