import type { CallOutcome } from "@/data/calls";

export const outcomeStyles: Record<CallOutcome, string> = {
  Interested: "bg-success/15 text-success",
  "Requested callback": "bg-brand-soft text-brand",
  "No answer": "bg-danger/15 text-danger",
  Converted: "bg-success/15 text-success",
  "Not interested": "bg-danger/15 text-danger",
  Connected: "bg-info/15 text-info",
};

export const CALLER_AVATAR: Record<string, string> = {
  AO: "bg-brand text-white",
  FB: "bg-info/15 text-info",
  SB: "bg-info/15 text-info",
};

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${outcomeStyles[outcome]}`}
    >
      {outcome}
    </span>
  );
}

export function CallerChip({ initials, name }: { initials: string; name: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${CALLER_AVATAR[initials] ?? "bg-surface-sunken text-ink-muted"}`}
      >
        {initials}
      </span>
      <span className="text-ink-muted">{name}</span>
    </span>
  );
}
