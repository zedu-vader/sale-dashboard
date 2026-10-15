"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleTask(id: string, done: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.task.update({ where: { id }, data: { done, completedAt: done ? new Date() : null } });
  // Tasks show on the dashboard and on lead profiles.
  revalidatePath("/", "layout");
}
