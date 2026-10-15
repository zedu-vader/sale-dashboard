// Date-range presets for the top bar picker (§7.3). Shared by the server data layer and the client picker.

export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "last-month", label: "Last month" },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]["key"];

export const DEFAULT_RANGE: RangeKey = "month";

export function parseRange(value: string | string[] | undefined): RangeKey {
  const v = Array.isArray(value) ? value[0] : value;
  return RANGE_PRESETS.some((p) => p.key === v) ? (v as RangeKey) : DEFAULT_RANGE;
}

/** Inclusive start, exclusive end. */
export function resolveRange(key: RangeKey, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  switch (key) {
    case "today":
      return { from: today, to: tomorrow };
    case "7d":
      return { from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6), to: tomorrow };
    case "last-month":
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "month":
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: tomorrow };
  }
}
