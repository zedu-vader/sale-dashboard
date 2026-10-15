import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Empty state, Zedu Design System §7.10: icon in a soft circle, a title, one line, one action.
export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-bright">
        <Icon size={24} strokeWidth={2} />
      </span>
      <h3 className="text-h3">{title}</h3>
      <p className="mt-1 text-body text-ink-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
