// Date-range presets for the dashboard range menu. Shared by the server data layer and the client menu.

export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "last-month", label: "Last month" },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]["key"];

export const DEFAULT_RANGE: RangeKey = "30d";

export function parseRange(value: string | string[] | undefined): RangeKey {
  const v = Array.isArray(value) ? value[0] : value;
  return RANGE_PRESETS.some((p) => p.key === v) ? (v as RangeKey) : DEFAULT_RANGE;
}

/** Inclusive start, exclusive end. */
export function resolveRange(key: RangeKey, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const daysAgo = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
  switch (key) {
    case "today":
      return { from: today, to: tomorrow };
    case "7d":
      return { from: daysAgo(6), to: tomorrow };
    case "30d":
      return { from: daysAgo(29), to: tomorrow };
    case "last-month":
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "month":
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: tomorrow };
  }
}
