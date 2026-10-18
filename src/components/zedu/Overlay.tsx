"use client";

// Modal (Figma 16845:23256 · Add lead) and side sheet (Figma 16847:23613 · Edit details).

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";
import { cx } from "./cx";

/** Escape closes; focus moves into the dialog on open and back to the trigger on close. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    // Prefer the first form field, else the dialog itself.
    const first = ref.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea");
    (first ?? ref.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Buttons, right-aligned on the subtle footer bar. */
  footer?: ReactNode;
  /** Default 720px (Add lead). */
  width?: number;
  children: ReactNode;
};

/** Centred dialog on a scrim: radius 16, Shadow/LG, header, scrolling body, subtle footer. */
export function Modal({ open, onClose, title, description, footer, width = 720, children }: ModalProps) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-z-inverse/40" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ maxWidth: width }}
        className="relative flex max-h-[calc(100dvh-32px)] w-full flex-col overflow-hidden rounded-z-2xl bg-z-surface shadow-z-lg outline-none"
      >
        <div className="flex items-start gap-2 pb-1 pl-6 pr-4 pt-5 max-sm:pl-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id={titleId} className="text-z-section text-z-fg">
              {title}
            </h2>
            {description && <p className="text-z-small font-normal text-z-fg-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X aria-hidden />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-4 max-sm:px-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-z-line bg-z-subtle px-6 py-4 max-sm:px-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Overline above the title, e.g. "Lead · LD-1042". */
  eyebrow?: string;
  title: string;
  /** Actions beside the title, e.g. a "Mark complete" button. */
  actions?: ReactNode;
  /** Footer row: a hint on the left, buttons on the right. */
  footer?: ReactNode;
  children: ReactNode;
};

/** 460px panel docked to the right edge below the top bar. The page behind stays visible. */
export function Sheet({ open, onClose, eyebrow, title, actions, footer, children }: SheetProps) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cx(
        "fixed bottom-0 right-0 top-14 z-40 flex w-[460px] max-w-full flex-col border-l border-z-line bg-z-surface shadow-z-lg outline-none",
      )}
    >
      <div className="flex items-center gap-2 border-b border-z-line py-4 pl-5 pr-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {eyebrow && <p className="z-overline text-z-fg-muted">{eyebrow}</p>}
          <h2 id={titleId} className="truncate text-z-section text-z-fg">
            {title}
          </h2>
        </div>
        {actions}
        <IconButton label="Close" onClick={onClose}>
          <X aria-hidden />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      {footer && <div className="flex flex-wrap items-center gap-2 border-t border-z-line px-5 py-3">{footer}</div>}
    </div>,
    document.body,
  );
}
