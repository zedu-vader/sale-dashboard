import { Plus, X } from "lucide-react";
import { cx } from "@/components/zedu/cx";

/** Filter chip (Figma 3:3188): dashed "add" default, solid indigo "Field: value" active. */
export function TaskFilterChip({
  label,
  active,
  onClear,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  onClear?: () => void;
  onClick?: () => void;
  className?: string;
}) {
  if (!active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cx(
          "z-focus inline-flex h-7 shrink-0 items-center gap-1.5 rounded-z-md border border-dashed border-z-line-strong bg-z-surface py-0 pl-2.5 pr-2 text-z-small font-normal text-z-fg-secondary transition-colors duration-150 hover:border-z-line-hover hover:text-z-fg [&_svg]:size-3.5",
          className,
        )}
      >
        <Plus aria-hidden />
        {label}
      </button>
    );
  }
  return (
    <span
      className={cx(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-z-md border border-solid border-z-line-focus bg-z-selected py-0 pl-2.5 pr-2 text-z-small font-medium text-z-fg-accent",
        className,
      )}
    >
      <button type="button" onClick={onClick} className="z-focus rounded-z-xs">
        {label}
      </button>
      <button
        type="button"
        onClick={onClear ?? onClick}
        aria-label={`Clear ${label} filter`}
        className="z-focus grid size-3.5 place-items-center rounded-z-xs [&_svg]:size-3.5"
      >
        <X aria-hidden />
      </button>
    </span>
  );
}
