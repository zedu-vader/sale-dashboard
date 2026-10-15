import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const unavailable = () => NextResponse.json(
  { error: "The follow-up task could not be saved because the database is temporarily unavailable. Please try again." },
  { status: 503 },
);

const taskTypes = ["Call", "Email", "Note"] as const;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let session: Session | null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return unavailable();
  }
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & { id?: string };
  if (!user.id) return NextResponse.json({ error: "Authenticated user ID is unavailable" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A JSON object is required" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const notes = body.notes === undefined ? "" : body.notes;
  const dueAt = typeof body.dueAt === "string" ? new Date(body.dueAt) : null;
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "Title must be 200 characters or fewer" }, { status: 400 });
  if (typeof notes !== "string") return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
  if (notes.length > 500) return NextResponse.json({ error: "Description must be 500 characters or fewer" }, { status: 400 });
  if (!dueAt || Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "A valid due date is required" }, { status: 400 });
  if (typeof body.type !== "string" || !(taskTypes as readonly string[]).includes(body.type)) {
    return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
  }

  try {
    const task = await prisma.$transaction(async (tx) => {
      const call = await tx.call.findUnique({
        where: { id: params.id },
        select: { id: true, leadId: true, lead: { select: { id: true, name: true } } },
      });
      if (!call) return null;
      if (!call.lead) throw new Error("This call has no associated lead");
      return tx.task.create({
        data: {
          title,
          subtitle: notes.trim() || null,
          dueAt,
          type: body.type === "Email" ? "EMAIL" : body.type === "Note" ? "NOTE" : "CALL",
          ownerName: user.name?.trim() || user.email || "You",
          userId: user.id,
          leadId: call.lead.id,
          leadName: call.lead.name,
          callId: call.id,
        },
        include: { lead: { select: { id: true, name: true } } },
      });
    });
    if (!task) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "This call has no associated lead") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return unavailable();
  }
}
