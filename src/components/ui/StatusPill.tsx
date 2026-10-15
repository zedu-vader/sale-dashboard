import type { LeadStatus } from "@prisma/client";
import { STAGES } from "@/lib/status";

export function StatusPill({ status }: { status: LeadStatus }) {
  const stage = STAGES[status];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-caption font-bold ${stage.pill}`}>
      {stage.label}
    </span>
  );
}
