import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/tasks-store";
import { OWNERS, TASK_TYPES, type NewTask } from "@/components/tasks/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listTasks());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const dueAt = typeof body?.dueAt === "string" ? new Date(body.dueAt) : null;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!dueAt || Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "A valid due date is required" }, { status: 400 });
  if (!TASK_TYPES.includes(body.type)) return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
  if (typeof body.owner !== "string" || !Object.hasOwn(OWNERS, body.owner)) return NextResponse.json({ error: "Unknown owner" }, { status: 400 });

  const input: NewTask = {
    title: title.slice(0, 200),
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "",
    lead: typeof body.lead === "string" ? body.lead.trim().slice(0, 200) : "",
    type: body.type,
    dueAt: dueAt.toISOString(),
    owner: body.owner,
  };
  return NextResponse.json(await createTask(input), { status: 201 });
}
