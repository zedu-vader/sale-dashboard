"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";

/** Undo toast (Figma 7:4092): dark pill, bottom-centre, check + message + Undo + close. */
export function TasksToast({
  message,
  actionLabel = "Undo",
  onAction,
  onClose,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-z-md bg-z-inverse py-2 pl-3 pr-2 shadow-z-lg"
    >
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-z-status-success [&_svg]:size-3 [&_svg]:text-white">
        <Check aria-hidden strokeWidth={3} />
      </span>
      <p className="truncate text-z-small font-normal text-z-fg-on-primary">{message}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="z-focus shrink-0 rounded-z-xs px-1 text-z-small font-medium text-white underline underline-offset-2"
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="z-focus grid size-6 shrink-0 place-items-center rounded-z-xs text-z-fg-on-inverse-muted hover:text-white [&_svg]:size-3.5"
      >
        <X aria-hidden />
      </button>
    </div>
  );
}
