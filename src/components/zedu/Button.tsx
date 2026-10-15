// ZEDU/Button and ZEDU/Icon button (Figma 16798:18310, 16798:18337).

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const base =
  "z-focus inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-z-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-z-primary text-z-fg-on-primary shadow-z-xs hover:bg-z-primary-hover",
  secondary:
    "border border-z-line-strong bg-z-surface text-z-fg shadow-z-xs hover:border-z-line-hover hover:bg-z-subtle [&_svg]:text-z-icon",
  ghost: "text-z-fg-secondary hover:bg-z-sunken focus-visible:bg-z-surface [&_svg]:text-z-icon",
  danger: "bg-z-danger text-z-fg-on-primary shadow-z-xs hover:bg-z-danger-hover",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-9 gap-2 px-4 text-z-body",
  sm: "h-8 gap-1.5 px-3 text-z-small",
};

/**
 * Class string for a ZEDU button, for use on <a>/<Link>.
 * Primary is the one main action per view; Secondary for supporting actions; Ghost for toolbars and rows;
 * Danger only for destructive actions, behind a confirm. md (36px) for page/form actions, sm (32px) for toolbars, cards, tables.
 */
export function buttonClass({ variant = "primary", size = "md" }: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cx(base, variants[variant], sizes[size]);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 16px leading icon, e.g. <Plus />. */
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx(buttonClass({ variant, size }), className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  /** Required: used as aria-label and tooltip. */
  label: string;
  /** Ghost for toolbars and row menus; Outline when it sits next to Secondary buttons. */
  variant?: "ghost" | "outline";
  children: ReactNode;
};

/** 32px icon-only button. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", className, children, type = "button", title, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cx(
        "z-focus inline-grid size-8 shrink-0 place-items-center rounded-z-md text-z-icon transition-colors duration-150 hover:text-z-icon-strong disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        variant === "ghost"
          ? "hover:bg-z-sunken focus-visible:bg-z-surface"
          : "border border-z-line-strong bg-z-surface shadow-z-xs hover:border-z-line-hover hover:bg-z-subtle",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
