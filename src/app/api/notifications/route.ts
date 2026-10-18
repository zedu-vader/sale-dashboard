import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNotifications, markAllRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** The signed-in user's notifications, with due-task prompts brought up to date. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return NextResponse.json(await getNotifications(session.user.id));
}

/** Mark all of the signed-in user's notifications as read. */
export async function POST() {
  const session = await getSession();
  if (!session) return unauthorized();
  await markAllRead(session.user.id);
  return NextResponse.json({ ok: true });
}
