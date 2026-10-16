import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { NewTask, Task } from "@/components/tasks/data";

/**
 * Temporary JSON-file persistence for tasks. Swap for Prisma when the Task
 * model exists; keep these function signatures and the API routes won't change.
 */
const FILE = path.join(process.cwd(), "data", "tasks.json");

// Serialise read-modify-write cycles within this process. Kept on globalThis so
// every route bundle (and dev hot reloads) shares one queue.
const g = globalThis as unknown as { __tasksQueue?: Promise<unknown> };
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = (g.__tasksQueue ?? Promise.resolve()).then(fn, fn);
  g.__tasksQueue = run.catch(() => undefined);
  return run;
}

function seed(): Task[] {
  const at = (days: number, h: number, m = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const mk = (title: string, notes: string, lead: string, type: Task["type"], dueAt: string, owner: string): Task => ({
    id: randomUUID(),
    title,
    notes,
    lead,
    type,
    dueAt,
    done: false,
    owner,
  });
  return [
    mk("Call Tunde Adebayo", "Follow up on product interest", "Tunde Adebayo", "Call", at(0, 23, 0), "You"),
    mk("Send product details", "Email brochure and pricing", "Flourish Ltd", "Email", at(0, 23, 30), "You"),
    mk("Call Ben Okafor", "Discuss onboarding", "Ben Okafor", "Call", at(0, 23, 45), "Femi"),
    mk("Follow up with Kemi", "Share product details", "Kemi Ibrahim", "Call", at(1, 10, 0), "You"),
    mk("Update lead notes", "Log call outcomes", "Lola Adeyemi", "Note", at(2, 9, 0), "Sarah"),
    mk("Call Daniel Osei", "Initial outreach", "Daniel Osei", "Call", at(2, 14, 0), "Femi"),
    mk("Send contract", "Share final agreement", "Amaka Akintola", "Email", at(3, 11, 0), "You"),
    mk("Check on application", "Follow up on sign up", "Uche Chima", "Call", at(3, 15, 30), "Grace"),
    mk("Re-send invoice", "Invoice 0231 unpaid", "Ifeanyi Nwosu", "Email", at(-2, 10, 0), "You"),
    mk("Call Ezinne Okoro", "Confirm demo slot", "Ezinne Okoro", "Call", at(-3, 16, 0), "Femi"),
  ];
}

async function load(): Promise<Task[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Task[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const tasks = seed();
    await save(tasks);
    return tasks;
  }
}

async function save(tasks: Task[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(tasks, null, 2));
  await fs.rename(tmp, FILE);
}

export function listTasks() {
  return exclusive(load);
}

export function createTask(input: NewTask) {
  return exclusive(async () => {
    const tasks = await load();
    const task: Task = { ...input, id: randomUUID(), done: false };
    tasks.unshift(task);
    await save(tasks);
    return task;
  });
}

export function updateTask(id: string, patch: Partial<Pick<Task, "done">>) {
  return exclusive(async () => {
    const tasks = await load();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, patch);
    await save(tasks);
    return task;
  });
}
