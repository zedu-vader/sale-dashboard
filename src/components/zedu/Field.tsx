"use client";

// ZEDU/Field label, ZEDU/Input, ZEDU/Search, ZEDU/Checkbox (Figma 16799:18218).

import { Check, CircleAlert, Minus, Search as SearchIcon } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "./cx";

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean };

/** Label above a field. Required adds a red asterisk; also set aria-required on the field. */
export function FieldLabel({ required, className, children, ...rest }: FieldLabelProps) {
  return (
    <label className={cx("text-z-caption font-medium text-z-fg-secondary", className)} {...rest}>
      {children}
      {required && (
        <span aria-hidden className="text-z-fg-danger">
          {" "}
          *
        </span>
      )}
    </label>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  /** Helper text under the field. Replaced by `error` when set. */
  helper?: string;
  /** Error message: says what to do ("Enter a first and last name."). Shown with the alert icon. */
  error?: string;
  /** 16px leading icon, e.g. <UserRound />. */
  icon?: ReactNode;
};

/** 36px text field with label, optional leading icon and helper/error text. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, icon, required, disabled, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? helper;

  return (
    <div className={cx("flex flex-col gap-1.5", disabled && "opacity-50", className)}>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <div
        className={cx(
          "flex h-9 items-center gap-2 rounded-z-md border px-3 transition-[border-color,box-shadow] duration-150 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-z-icon",
          disabled
            ? "border-z-line-strong bg-z-sunken"
            : cx(
                "bg-z-surface shadow-z-xs focus-within:border-z-line-focus focus-within:shadow-z-focus-input",
                error ? "border-z-line-danger" : "border-z-line-strong hover:border-z-line-hover",
              ),
        )}
      >
        {icon}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-required={required || undefined}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className="min-w-0 flex-1 truncate bg-transparent text-z-body font-normal text-z-fg outline-none placeholder:text-z-fg-placeholder disabled:cursor-not-allowed focus-visible:outline-none"
          {...rest}
        />
      </div>
      {message && (
        <p
          id={messageId}
          className={cx(
            "flex items-center gap-1 text-z-caption font-normal",
            error ? "text-z-fg-danger" : "text-z-fg-muted",
          )}
        >
          {error && <CircleAlert aria-hidden className="size-3.5 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  );
});

type SearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  /** Sunken (grey fill) for in-context search in the sidebar, tables and panels; Outline for the top-bar global search. */
  variant?: "sunken" | "outline";
  /** md 36px; sm 32px (sidebar). */
  size?: "md" | "sm";
  /** Keyboard shortcut chip, e.g. "/" or "⌘K". */
  shortcut?: string;
  /** Accessible name. Defaults to the placeholder. */
  label?: string;
};

export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  { variant = "sunken", size = "md", shortcut, label, placeholder = "Search", className, ...rest },
  ref,
) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-z-md border pl-2.5 pr-1.5 transition-[border-color,box-shadow,background-color] duration-150",
        "focus-within:border-z-line-focus focus-within:bg-z-surface focus-within:shadow-z-focus-input",
        size === "md" ? "h-9" : "h-8",
        variant === "sunken" ? "border-transparent bg-z-sunken" : "border-z-line-strong bg-z-surface shadow-z-xs",
        className,
      )}
    >
      <SearchIcon aria-hidden className="size-4 shrink-0 text-z-icon" />
      <input
        ref={ref}
        type="search"
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-z-small font-normal text-z-fg outline-none placeholder:text-z-fg-placeholder focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
      {shortcut && (
        <kbd className="inline-flex h-[22px] shrink-0 items-center rounded-z-xs border border-z-line-strong bg-z-surface px-1.5 font-mono text-z-mono text-z-fg-muted">
          {shortcut}
        </kbd>
      )}
    </div>
  );
});

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  /** Hide the label visually (tables); it stays as the accessible name. */
  hideLabel?: boolean;
  /** Use in a table header when some, but not all, rows are selected. */
  indeterminate?: boolean;
};

/** 16px checkbox. Checked and indeterminate fill with indigo (color/bg/accent). */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hideLabel, indeterminate = false, className, ...rest },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current!);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={cx(
        "inline-flex items-center gap-2 text-z-small font-normal text-z-fg-secondary has-[:disabled]:opacity-40",
        className,
      )}
    >
      <span className="relative inline-grid size-4 shrink-0">
        <input
          ref={inner}
          type="checkbox"
          className={cx(
            "peer z-focus size-4 cursor-pointer appearance-none rounded-z-xs border border-z-line-strong bg-z-surface transition-colors duration-150",
            "hover:border-z-line-hover hover:bg-z-sunken disabled:cursor-not-allowed",
            "checked:border-z-accent checked:bg-z-accent indeterminate:border-z-accent indeterminate:bg-z-accent",
          )}
          {...rest}
        />
        <Check
          aria-hidden
          strokeWidth={2.5}
          className="pointer-events-none absolute inset-0.5 hidden size-3 text-white ![stroke-width:2.5] peer-[:checked:not(:indeterminate)]:block"
        />
        <Minus
          aria-hidden
          strokeWidth={2.5}
          className="pointer-events-none absolute inset-0.5 hidden size-3 text-white ![stroke-width:2.5] peer-indeterminate:block"
        />
      </span>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
    </label>
  );
});
