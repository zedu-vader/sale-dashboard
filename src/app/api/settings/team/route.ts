import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getTeamMembersWithStats } from "@/lib/settings";

export async function GET() {
  const adminAuth = await requireAdmin();
  if (adminAuth instanceof NextResponse) return adminAuth;

  const members = await getTeamMembersWithStats(adminAuth.user.id);
  return NextResponse.json(members);
}
