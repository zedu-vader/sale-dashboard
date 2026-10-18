import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const unavailable = () => NextResponse.json({ error: "Call history is temporarily unavailable. Please try again." }, { status: 503 });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  let auth;
  try { auth = await requireUser(); } catch { return unavailable(); }
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 50 : Number(rawLimit);
  const cursor = url.searchParams.get("cursor");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor && cursor.length > 100)) return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (cursor && !(await prisma.call.findFirst({ where: { id: cursor, leadId: lead.id }, select: { id: true } }))) return NextResponse.json({ error: "Call cursor not found for lead" }, { status: 400 });
    const calls = await prisma.call.findMany({
      where: { leadId: lead.id },
      include: {
        lead: { select: { id: true, contact: { select: { name: true, phone: true } } } },
        contact: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, title: true, dueAt: true, done: true } },
      },
      orderBy: [{ calledAt: "desc" }, { id: "desc" }], take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = calls.length > limit;
    const items = (hasMore ? calls.slice(0, limit) : calls).map((call) => ({
      ...call, callerId: call.userId, caller: call.user,
      lead: call.lead ? { id: call.lead.id, name: call.lead.contact.name, phone: call.lead.contact.phone } : null,
    }));
    return NextResponse.json({ items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null });
  } catch { return unavailable(); }
}
