import { prisma } from "./prisma";

function startOfDay(d: Date, addDays = 0) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + addDays);
  return x;
}

/** Counts the app shell shows on every page: the Tasks nav badge and the notifications dot. */
export async function getShellCounts() {
  const now = new Date();
  const [openTaskCount, overdueCount] = await Promise.all([
    prisma.task.count({ where: { done: false, dueAt: { lt: startOfDay(now, 1) } } }),
    prisma.task.count({ where: { done: false, dueAt: { lt: startOfDay(now) } } }),
  ]);
  return { openTaskCount, unread: overdueCount > 0 };
}
