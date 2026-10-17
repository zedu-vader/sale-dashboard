import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { initialsOf } from "@/lib/status";

export type TeamMemberDetail = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  initials: string;
  disabledAt: string | null;
  createdAt: string;
  leadCount: number;
  me: boolean;
};

export async function getTeamMembersWithStats(currentUserId: string): Promise<TeamMemberDetail[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabledAt: true,
      createdAt: true,
      _count: {
        select: { ownedLeads: true },
      },
    },
    orderBy: [{ disabledAt: "asc" }, { name: "asc" }],
  });

  return users
    .map((u) => {
      const name = u.name ?? u.email ?? "Unnamed";
      return {
        id: u.id,
        name,
        email: u.email,
        role: u.role,
        initials: initialsOf(name),
        disabledAt: u.disabledAt ? u.disabledAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        leadCount: u._count.ownedLeads,
        me: u.id === currentUserId,
      };
    })
    .sort((a, b) => Number(b.me) - Number(a.me));
}
