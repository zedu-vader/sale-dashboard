import { NextResponse } from "next/server";
import { updateTask } from "@/lib/tasks-store";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (typeof body?.done !== "boolean") return NextResponse.json({ error: "`done` must be a boolean" }, { status: 400 });

  const task = await updateTask(params.id, { done: body.done });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}
