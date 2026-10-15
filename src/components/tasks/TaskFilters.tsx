import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";

export interface Filters {
  query: string;
  status: string;
  owner: string;
  type: string;
}

const field =
  "relative flex h-10 items-center rounded-[10px] border border-solid border-line bg-white text-muted focus-within:border-brand";

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <label className={`${field} min-w-0 flex-[1_1_120px] @3xl:flex-none`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-full w-full cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-8 font-[inherit] text-ink outline-none"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5" />
    </label>
  );
}

interface FilterProps {
  filters: Filters;
  owners: string[];
  types: readonly string[];
  onChange: (patch: Partial<Filters>) => void;
}

export function TaskFilters({ filters, owners, types, onChange }: FilterProps) {
  return (
    <div className="mb-2 flex flex-wrap gap-2.5 @3xl:grid @3xl:grid-cols-[1fr_150px_150px_160px_40px]">
      <label className={`${field} flex-[1_1_100%] @3xl:flex-none`}>
        <Search size={16} className="absolute left-3" />
        <input
          placeholder="Search tasks..."
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          className="h-full w-full border-0 bg-transparent py-0 pl-9 pr-3 font-[inherit] text-ink outline-none"
        />
      </label>
      <Select label="All Status" value={filters.status} onChange={(status) => onChange({ status })} options={["Pending", "Done", "Overdue"]} />
      <Select label="All Owners" value={filters.owner} onChange={(owner) => onChange({ owner })} options={owners} />
      <Select label="All Task Type" value={filters.type} onChange={(type) => onChange({ type })} options={[...types]} />
      <button
        aria-label="More filters"
        className="grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border border-solid border-line bg-white p-0 text-muted hover:bg-canvas"
      >
        <SlidersHorizontal size={16} />
      </button>
    </div>
  );
}
