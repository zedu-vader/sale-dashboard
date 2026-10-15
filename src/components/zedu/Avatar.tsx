// ZEDU/Avatar, ZEDU/Avatar group, ZEDU/Score (Figma 16803:18275, 16803:18276, 16803:18295).

import { cx } from "./cx";

const avatarSize = {
  24: { box: "size-6 text-[9px] leading-4", dot: "size-1.5" },
  32: { box: "size-8 text-z-caption", dot: "size-2" },
  40: { box: "size-10 text-z-body", dot: "size-2.5" },
};

type AvatarProps = {
  /** 24 for tables, 32 for comments and nav, 40 for profiles. */
  size?: keyof typeof avatarSize;
  initials: string;
  /** Photo URL. Falls back to initials on the neutral fill. */
  src?: string | null;
  /** Green online dot. */
  online?: boolean;
  className?: string;
};

export function Avatar({ size = 32, initials, src, online, className }: AvatarProps) {
  const s = avatarSize[size];
  return (
    <span
      className={cx(
        "relative inline-grid shrink-0 place-items-center rounded-full border border-z-line bg-z-sunken font-medium text-z-fg-secondary",
        s.box,
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
      {online && (
        <span
          aria-label="Online"
          className={cx("absolute bottom-0 right-0 rounded-full bg-z-status-success ring-[1.5px] ring-z-surface", s.dot)}
        />
      )}
    </span>
  );
}

/** Stacked collaborators (32px, -8px overlap) with a "+N" overflow chip. */
export function AvatarGroup({
  people,
  max = 4,
  className,
}: {
  people: { initials: string; src?: string | null; name?: string }[];
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  return (
    <div className={cx("flex items-center", className)}>
      {shown.map((p, i) => (
        <span key={i} title={p.name} className="-mr-2">
          <Avatar initials={p.initials} src={p.src} />
        </span>
      ))}
      {more > 0 && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-z-surface bg-z-accent-subtle text-z-caption font-medium text-z-fg-accent">
          +{more}
        </span>
      )}
    </div>
  );
}

/** Lead score: 10 bars + value chip. Low 1–3, mid 4–7, high 8–10. */
export function Score({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(10, Math.round(value)));
  const fill = v >= 8 ? "bg-z-score-high" : v >= 4 ? "bg-z-score-mid" : "bg-z-score-low";
  return (
    <span role="img" aria-label={`Score ${v} of 10`} className={cx("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cx("h-3.5 w-[3px] rounded-[1px]", i < v ? fill : "bg-z-score-empty")} />
        ))}
      </span>
      <span
        aria-hidden
        className="rounded-z-xs border border-z-line-strong px-1 font-mono text-[11px] leading-4 text-z-fg-secondary"
      >
        {v}/10
      </span>
    </span>
  );
}
