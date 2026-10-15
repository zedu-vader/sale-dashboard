import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const unavailable = () => NextResponse.json(
  { error: "Call history is temporarily unavailable because the database cannot be reached. Please try again." },
  { status: 503 },
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  let session: Session | null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return unavailable();
  }
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 50 : Number(rawLimit);
  const cursor = url.searchParams.get("cursor");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor && cursor.length > 100)) {
    return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
  }
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (cursor && !(await prisma.call.findFirst({ where: { id: cursor, leadId: lead.id }, select: { id: true } }))) {
      return NextResponse.json({ error: "Call cursor not found for lead" }, { status: 400 });
    }

    const calls = await prisma.call.findMany({
      where: { leadId: lead.id },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        caller: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, title: true, dueAt: true, done: true } },
      },
      orderBy: [{ calledAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = calls.length > limit;
    const items = hasMore ? calls.slice(0, limit) : calls;
    return NextResponse.json({ items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null });
  } catch {
    return unavailable();
  }
}
