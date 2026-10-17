import { Role } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Context) {
  const adminAuth = await requireAdmin();
  if (adminAuth instanceof NextResponse) return adminAuth;

  const targetId = params.id;
  const currentAdminId = adminAuth.user.id;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, disabledAt: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: { role?: Role; disabledAt?: Date | null } = {};

  // Handling account deactivation / reactivation
  if ("disabled" in body) {
    const shouldDisable = Boolean(body.disabled);

    if (targetId === currentAdminId && shouldDisable) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    updateData.disabledAt = shouldDisable ? new Date() : null;
  }

  // Handling role change
  if ("role" in body) {
    const newRole = body.role;
    if (newRole !== Role.ADMIN && newRole !== Role.MEMBER) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    if (targetId === currentAdminId && newRole !== Role.ADMIN) {
      // Check if there is at least one other active admin
      const otherAdmins = await prisma.user.count({
        where: {
          role: Role.ADMIN,
          disabledAt: null,
          id: { not: currentAdminId },
        },
      });

      if (otherAdmins === 0) {
        return NextResponse.json(
          { error: "Cannot demote the only active Administrator" },
          { status: 400 },
        );
      }
    }

    updateData.role = newRole;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabledAt: true,
    },
  });

  return NextResponse.json(updated);
}
