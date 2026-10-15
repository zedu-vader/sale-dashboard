// Button recipes, Zedu Design System §7.1. Returns class strings so they work on <button> and <a> alike.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-small font-bold transition duration-base ease-out disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white shadow-brand hover:shadow-[0_14px_28px_-10px_rgba(109,77,255,.9)] motion-safe:hover:-translate-y-px motion-safe:active:scale-[.98]",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-sunken motion-safe:active:scale-[.98]",
  ghost: "text-brand-bright hover:bg-brand-soft",
  danger: "bg-danger text-white hover:bg-danger/90 motion-safe:active:scale-[.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-md px-3",
  md: "h-10 rounded-lg px-4",
  lg: "h-12 rounded-lg px-5",
};

export function button({ variant = "primary", size = "md" }: { variant?: Variant; size?: Size } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

/** 40px square icon button, secondary style. */
export const iconButton =
  "inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink transition duration-fast ease-out hover:bg-surface-sunken";

/** 32px inline call action in rows. */
export const callButton =
  "inline-grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-bright transition duration-base ease-out hover:bg-brand-bright hover:text-white";
