// ZEDU/Tab and ZEDU/Segmented control (Figma 16800:18310, 16800:18320).

import { CountBadge } from "./Badges";
import { cx } from "./cx";

type Option<T extends string> = { value: T; label: string; count?: number | string };

type Props<T extends string> = {
  /** Accessible name for the tab list. */
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Underline tabs for filtering a page (All, Assigned to me, New, Follow up, Overdue).
 * 20px gaps above a 1px divider; active = indigo text and 2px indicator.
 */
export function Tabs<T extends string>({ label, options, value, onChange, className }: Props<T>) {
  return (
    <div role="tablist" aria-label={label} className={cx("flex gap-5 overflow-x-auto border-b border-z-line", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className="group z-focus flex shrink-0 flex-col rounded-t-z-xs"
          >
            <span
              className={cx(
                "flex items-center gap-1.5 whitespace-nowrap px-1 py-2.5 text-z-small transition-colors duration-150",
                on ? "font-medium text-z-fg-accent" : "font-normal text-z-fg-secondary group-hover:text-z-fg",
              )}
            >
              {o.label}
              {o.count !== undefined && <CountBadge count={o.count} tone={on ? "accent" : "neutral"} />}
            </span>
            <span
              aria-hidden
              className={cx(
                "h-0.5 w-full rounded-t-[2px] transition-colors duration-150",
                on ? "bg-z-accent" : "group-hover:bg-z-line-hover",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Switches a view in place (Monthly / Quarterly / Yearly, list / grid).
 * 32px sunken track, 2px inset; the active segment is a white chip with a hairline shadow.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  stretch,
}: Props<T> & { /** Fill the width with equal segments (form fields). */ stretch?: boolean }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("items-center gap-0.5 rounded-z-md bg-z-sunken p-0.5", stretch ? "flex w-full [&>button]:flex-1" : "inline-flex", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "z-focus h-7 min-w-[60px] whitespace-nowrap rounded-z-sm px-3 text-z-small transition-colors duration-150",
              on ? "bg-z-surface font-medium text-z-fg shadow-z-xs" : "font-normal text-z-fg-secondary hover:text-z-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
