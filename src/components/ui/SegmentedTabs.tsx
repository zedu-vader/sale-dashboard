// Segmented tabs, Zedu Design System §7.3.

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedTabs<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`h-7 rounded-[8px] px-3 text-caption font-semibold transition duration-base ease-out ${
              on ? "bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
