import type { NewTask, Task } from "./data";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
  return data as T;
}

export const fetchTasks = () => request<Task[]>("/api/tasks", { cache: "no-store" });

export const addTask = (task: NewTask) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(task) });

export const setTaskDone = (id: string, done: boolean) =>
  request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ done }) });
