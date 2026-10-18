import { ActivityType, TaskType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const unavailable = () => NextResponse.json({ error: "The follow-up task could not be saved. Please try again." }, { status: 503 });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let auth;
  try { auth = await requireUser(); } catch { return unavailable(); }
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A JSON object is required" }, { status: 400 });
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const notes = body.notes === undefined ? "" : body.notes;
  const dueAt = typeof body.dueAt === "string" ? new Date(body.dueAt) : null;
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "Title must be 200 characters or fewer" }, { status: 400 });
  if (typeof notes !== "string") return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
  if (notes.length > 500) return NextResponse.json({ error: "Description must be 500 characters or fewer" }, { status: 400 });
  if (!dueAt || Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "A valid due date is required" }, { status: 400 });
  const types: Record<string, TaskType> = { Call: TaskType.CALL, Email: TaskType.EMAIL, Note: TaskType.OTHER };
  if (typeof body.type !== "string" || !types[body.type]) return NextResponse.json({ error: "Invalid task type" }, { status: 400 });

  try {
    const task = await prisma.$transaction(async (tx) => {
      const call = await tx.call.findUnique({ where: { id: params.id }, select: { id: true, leadId: true, contactId: true } });
      if (!call) return null;
      if (!call.leadId || !call.contactId) return { noLead: true as const };
      const lead = await tx.lead.findUnique({ where: { id: call.leadId }, select: { id: true, contactId: true, ownerId: true } });
      if (!lead || lead.contactId !== call.contactId) return { noLead: true as const };
      const created = await tx.task.create({
        data: {
          title, description: notes.trim() || null, subtitle: notes.trim() || null, dueAt,
          type: types[body.type], done: false, ownerId: auth.user.id,
          userId: auth.user.id, leadId: lead.id, contactId: lead.contactId, callId: call.id,
        },
      });
      await tx.activity.create({ data: { leadId: lead.id, contactId: lead.contactId, actorId: auth.user.id, type: ActivityType.TASK_CREATED, taskId: created.id } });
      return created;
    });
    if (!task) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    if ("noLead" in task) return NextResponse.json({ error: "This call has no associated lead" }, { status: 409 });
    return NextResponse.json(task, { status: 201 });
  } catch { return unavailable(); }
}
