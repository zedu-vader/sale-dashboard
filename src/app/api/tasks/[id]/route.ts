import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return NextResponse.json({ error: "Tasks are temporarily unavailable." }, { status: 503 });
  }
  const userId = session?.user ? (session.user as typeof session.user & { id?: string }).id : undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.done !== "boolean") {
    return NextResponse.json({ error: "A boolean done value is required" }, { status: 400 });
  }

  try {
    const task = await prisma.task.findFirst({ where: { id: params.id, userId }, select: { id: true } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const updated = await prisma.task.update({ where: { id: task.id }, data: { done: body.done } });
    return NextResponse.json({ id: updated.id, done: updated.done });
  } catch {
    return NextResponse.json({ error: "Tasks are temporarily unavailable." }, { status: 503 });
  }
}
