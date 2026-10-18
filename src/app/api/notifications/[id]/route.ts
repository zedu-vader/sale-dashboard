import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** Mark one of the signed-in user's notifications as read. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markRead(session.user.id, params.id);
  return NextResponse.json({ ok: true });
}
