import { ActivityType, CallConnectionStatus, CallOutcome, Prisma, TaskType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const connectionStatuses = Object.values(CallConnectionStatus);
const outcomes = Object.values(CallOutcome);
const include = {
  lead: { select: { id: true, contact: { select: { name: true, phone: true } } } },
  contact: { select: { id: true, name: true, phone: true } },
  user: { select: { id: true, name: true, email: true } },
  tasks: { select: { id: true, title: true, dueAt: true, done: true } },
} as const;
const unavailable = () => NextResponse.json(
  { error: "Calls are temporarily unavailable because the database cannot be reached. Please try again." },
  { status: 503 },
);

function validDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pagination(url: URL) {
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 50 : Number(rawLimit);
  const cursor = url.searchParams.get("cursor");
  return Number.isInteger(limit) && limit >= 1 && limit <= 100 && (!cursor || cursor.length <= 100)
    ? { limit, cursor }
    : null;
}

function present(call: Prisma.CallGetPayload<{ include: typeof include }>) {
  return {
    ...call,
    durationSeconds: call.durationSeconds,
    callerId: call.userId,
    caller: call.user,
    lead: call.lead ? { id: call.lead.id, name: call.lead.contact.name, phone: call.lead.contact.phone } : null,
    contact: call.contact,
  };
}

export async function GET(req: Request) {
  let auth;
  try { auth = await requireUser(); } catch { return unavailable(); }
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const page = pagination(url);
  if (!page) return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
  const status = url.searchParams.get("status");
  const outcome = url.searchParams.get("outcome");
  const fromValue = url.searchParams.get("from");
  const toValue = url.searchParams.get("to");
  const from = validDate(fromValue);
  const to = validDate(toValue);
  if (status && !connectionStatuses.includes(status as CallConnectionStatus)) return NextResponse.json({ error: "Invalid connection status" }, { status: 400 });
  if (outcome && !outcomes.includes(outcome as CallOutcome)) return NextResponse.json({ error: "Invalid call outcome" }, { status: 400 });
  if ((fromValue && !from) || (toValue && !to) || (from && to && from >= to)) return NextResponse.json({ error: "Invalid date range" }, { status: 400 });

  const q = url.searchParams.get("q")?.trim().slice(0, 200);
  const leadId = url.searchParams.get("leadId");
  const callerId = url.searchParams.get("callerId");
  const where: Prisma.CallWhereInput = {
    ...(leadId ? { leadId } : {}),
    ...(callerId ? { userId: callerId } : {}),
    ...(status ? { connectionStatus: status as CallConnectionStatus } : {}),
    ...(outcome ? { outcome: outcome as CallOutcome } : {}),
    ...(from || to ? { calledAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q ? { OR: [
      { notes: { contains: q, mode: "insensitive" } },
      { nextAction: { contains: q, mode: "insensitive" } },
      { callerName: { contains: q, mode: "insensitive" } },
      { contact: { is: { name: { contains: q, mode: "insensitive" } } } },
      { contact: { is: { phone: { contains: q, mode: "insensitive" } } } },
    ] } : {}),
  };

  try {
    if (page.cursor && !(await prisma.call.findFirst({ where: { AND: [where, { id: page.cursor }] }, select: { id: true } }))) {
      return NextResponse.json({ error: "Call cursor not found for these filters" }, { status: 400 });
    }
    const calls = await prisma.call.findMany({ where, include, orderBy: [{ calledAt: "desc" }, { id: "desc" }], take: page.limit + 1, ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}) });
    const hasMore = calls.length > page.limit;
    const items = hasMore ? calls.slice(0, page.limit) : calls;
    return NextResponse.json({ items: items.map(present), nextCursor: hasMore ? items.at(-1)?.id ?? null : null });
  } catch { return unavailable(); }
}

export async function POST(req: Request) {
  let auth;
  try { auth = await requireUser(); } catch { return unavailable(); }
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A JSON object is required" }, { status: 400 });

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) return NextResponse.json({ error: "An existing leadId is required" }, { status: 400 });
  if (!connectionStatuses.includes(body.connectionStatus)) return NextResponse.json({ error: "Invalid connection status" }, { status: 400 });
  if (!outcomes.includes(body.outcome)) return NextResponse.json({ error: "Invalid call outcome" }, { status: 400 });
  if ((body.connectionStatus === CallConnectionStatus.NOT_CONNECTED && body.outcome !== CallOutcome.NOT_APPLICABLE) || (body.connectionStatus === CallConnectionStatus.CONNECTED && body.outcome === CallOutcome.NOT_APPLICABLE)) {
    return NextResponse.json({ error: "NOT_APPLICABLE must be used only when the call did not connect" }, { status: 400 });
  }
  const calledAt = body.calledAt === undefined ? new Date() : typeof body.calledAt === "string" ? validDate(body.calledAt) : null;
  if (!calledAt) return NextResponse.json({ error: "calledAt must be a valid date and time" }, { status: 400 });
  if (body.durationSeconds !== undefined && body.durationSeconds !== null && (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 0 || body.durationSeconds > 2_147_483_647)) return NextResponse.json({ error: "durationSeconds must be a nonnegative integer" }, { status: 400 });
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") return NextResponse.json({ error: "notes must be a string" }, { status: 400 });
  if (body.nextAction !== undefined && body.nextAction !== null && typeof body.nextAction !== "string") return NextResponse.json({ error: "nextAction must be a string" }, { status: 400 });
  if (body.createFollowUpTask !== undefined && typeof body.createFollowUpTask !== "boolean") return NextResponse.json({ error: "createFollowUpTask must be a boolean" }, { status: 400 });
  const followUpAt = body.followUpAt == null ? null : typeof body.followUpAt === "string" ? validDate(body.followUpAt) : null;
  if (body.followUpAt != null && !followUpAt) return NextResponse.json({ error: "followUpAt must be a valid date and time" }, { status: 400 });
  const nextAction = typeof body.nextAction === "string" ? body.nextAction.trim().slice(0, 500) : "";
  const createFollowUpTask = body.createFollowUpTask ?? Boolean(nextAction && followUpAt);
  if (createFollowUpTask && (!nextAction || !followUpAt)) return NextResponse.json({ error: "Creating a follow-up task requires nextAction and followUpAt" }, { status: 400 });

  try {
    const [lead, caller] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, contactId: true, lastInteractionAt: true, contact: { select: { id: true, name: true, phone: true, lastInteractionAt: true } } } }),
      prisma.user.findUnique({ where: { id: auth.user.id }, select: { id: true, name: true, email: true } }),
    ]);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (!caller) return NextResponse.json({ error: "Authenticated user not found" }, { status: 401 });
    const callerName = caller.name?.trim() || caller.email || "Unknown caller";
    const lastInteractionAt = new Date(Math.max(calledAt.getTime(), lead.lastInteractionAt?.getTime() ?? 0, lead.contact.lastInteractionAt?.getTime() ?? 0));
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.call.create({ data: {
        leadId: lead.id, contactId: lead.contactId, userId: caller.id, callerName, calledAt,
        durationSeconds: body.durationSeconds ?? null, connectionStatus: body.connectionStatus as CallConnectionStatus,
        outcome: body.outcome as CallOutcome, legacyOutcome: null,
        notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 5000) || null : null,
        nextAction: nextAction || null, followUpAt,
      } });
      await tx.contact.update({ where: { id: lead.contactId }, data: { lastInteractionAt } });
      await tx.lead.update({ where: { id: lead.id }, data: { lastInteractionAt } });
      await tx.activity.create({ data: { leadId: lead.id, contactId: lead.contactId, actorId: caller.id, type: ActivityType.CALL_LOGGED, callId: created.id, createdAt: calledAt } });
      if (createFollowUpTask) {
        const task = await tx.task.create({ data: {
          title: nextAction, subtitle: typeof body.notes === "string" ? body.notes.trim().slice(0, 500) || null : null,
          dueAt: followUpAt!, type: TaskType.FOLLOW_UP, ownerId: caller.id,
          userId: caller.id, leadId: lead.id, contactId: lead.contactId, callId: created.id,
        } });
        await tx.activity.create({ data: { leadId: lead.id, contactId: lead.contactId, actorId: caller.id, type: ActivityType.TASK_CREATED, taskId: task.id } });
      }
      return tx.call.findUniqueOrThrow({ where: { id: created.id }, include });
    });
    return NextResponse.json(present(result), { status: 201 });
  } catch { return unavailable(); }
}
