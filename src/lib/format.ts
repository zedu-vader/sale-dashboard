// Content rules from Zedu Design System §9.

const numberFmt = new Intl.NumberFormat("en-US");
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthDayYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** 1,248 */
export const formatNumber = (n: number) => numberFmt.format(n);

/** No decimals unless the value is under 10: "62%", "8.5%". */
export function formatPercent(n: number) {
  const abs = Math.abs(n);
  const v = abs > 0 && abs < 10 ? Math.round(n * 10) / 10 : Math.round(n);
  return `${v}%`;
}

/** 10:12 AM */
export const formatTime = (d: Date) => timeFmt.format(d);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** "Today" / "Tomorrow" / "Yesterday", else "Oct 15" this year or "Oct 15, 2025" otherwise. */
export function formatDay(d: Date, now = new Date()) {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDate(d, now);
}

/** "Oct 15" this year, "Oct 15, 2025" otherwise. Never relative. */
export function formatDate(d: Date, now = new Date()) {
  return d.getFullYear() === now.getFullYear() ? monthDay.format(d) : monthDayYear.format(d);
}

/** "Oct 1 – Oct 15, 2026" (or a single day). */
export function formatRange(from: Date, to: Date) {
  const sameDay = startOfDay(from).getTime() === startOfDay(to).getTime();
  if (sameDay) return monthDayYear.format(from);
  const start = from.getFullYear() === to.getFullYear() ? monthDay.format(from) : monthDayYear.format(from);
  return `${start} – ${monthDayYear.format(to)}`;
}
