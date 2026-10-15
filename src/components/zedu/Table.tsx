// ZEDU/Table header cell and ZEDU/Table cell (Figma 16803:18319, 16803:18431).
// Dense, borderless tables: 40px header in Overline, 52px rows split by 1px border/default, 12px cell padding.

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Avatar } from "./Avatar";
import { cx } from "./cx";

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cx("w-full border-collapse text-left", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

type Sort = "asc" | "desc" | "none";

type HeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** Shows the sort control. Pair with onSort. */
  sort?: Sort;
  onSort?: () => void;
  /** Checkbox column (44px). */
  checkbox?: boolean;
};

const sortIcon = { asc: ArrowUp, desc: ArrowDown, none: ArrowUpDown };
const ariaSort = { asc: "ascending", desc: "descending", none: "none" } as const;

export function TableHead({ sort, onSort, checkbox, className, children, ...rest }: HeadProps) {
  const SortIcon = sort ? sortIcon[sort] : null;
  return (
    <th
      scope="col"
      aria-sort={sort ? ariaSort[sort] : undefined}
      className={cx(
        "h-10 whitespace-nowrap border-b border-z-line bg-z-surface px-3 align-middle z-overline font-medium text-z-fg-muted",
        checkbox && "w-11",
        className,
      )}
      {...rest}
    >
      {SortIcon ? (
        <button
          type="button"
          onClick={onSort}
          className="z-focus -mx-1 inline-flex items-center gap-1 rounded-z-xs px-1 uppercase hover:text-z-fg"
        >
          {children}
          <SortIcon aria-hidden className="size-3 text-z-icon-subtle" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

/** Body row. Hover is bg/subtle; selected rows are bg/selected with a checked checkbox. */
export function TableRow({
  selected,
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      data-selected={selected || undefined}
      className={cx(
        "border-b border-z-line transition-colors duration-100 last:border-b-0",
        selected ? "bg-z-selected" : "bg-z-surface hover:bg-z-subtle",
        className,
      )}
      {...rest}
    />
  );
}

type CellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  /** primary: names (Body/Small medium). text: everything else (Body/Small secondary). checkbox: 44px. actions: 56px, right-aligned. */
  type?: "primary" | "text" | "checkbox" | "actions";
};

export function TableCell({ type = "text", className, ...rest }: CellProps) {
  return (
    <td
      className={cx(
        "h-[52px] whitespace-nowrap px-3 align-middle text-z-small",
        type === "primary" ? "font-medium text-z-fg" : "font-normal text-z-fg-secondary",
        type === "checkbox" && "w-11",
        type === "actions" && "w-14 text-right",
        className,
      )}
      {...rest}
    />
  );
}

/** Person cell content: 24px avatar + name. */
export function Person({ name, initials, src }: { name: ReactNode; initials: string; src?: string | null }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar size={24} initials={initials} src={src} />
      <span className="truncate font-medium text-z-fg">{name}</span>
    </span>
  );
}
