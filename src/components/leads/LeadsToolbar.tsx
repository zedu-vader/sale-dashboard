import { ListFilter, Search } from "lucide-react";
import { statusOptions } from "./data";

type LeadsToolbarProps = {
  search: string;
  status: string;
  type: string;
  owner: string;
  owners: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onClearFilters: () => void;
};

export function LeadsToolbar(props: LeadsToolbarProps) {
  return (
    <div className="grid min-h-[68px] grid-cols-[minmax(250px,1.8fr)_repeat(3,minmax(120px,.65fr))_42px] items-center gap-2.5 border-b border-[#f1eef5] px-[15px] py-[13px] max-[1080px]:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(115px,.7fr))_42px] max-[760px]:flex max-[760px]:flex-wrap">
      <label className="flex h-10 items-center gap-2 rounded-[7px] border border-[#e7e3ec] px-3 text-[#8d8998] focus-within:border-[#a893df] focus-within:shadow-[0_0_0_3px_#f1ecfc] max-[760px]:w-full">
        <Search size={17} />
        <input
          className="w-full border-0 bg-transparent text-xs text-[#292336] outline-none placeholder:text-[#aaa6b2]"
          aria-label="Search leads"
          placeholder="Search by name, phone number or company..."
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
        />
      </label>
      <select className="h-10 w-full rounded-[7px] border border-[#e7e3ec] bg-white px-3 pr-8 text-xs text-[#504b5b] outline-none max-[760px]:w-[calc(50%_-_5px)] max-[500px]:w-full" aria-label="Filter by status" value={props.status} onChange={(event) => props.onStatusChange(event.target.value)}>
        {statusOptions.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="h-10 w-full rounded-[7px] border border-[#e7e3ec] bg-white px-3 pr-8 text-xs text-[#504b5b] outline-none max-[760px]:w-[calc(50%_-_5px)] max-[500px]:w-full" aria-label="Filter by lead type" value={props.type} onChange={(event) => props.onTypeChange(event.target.value)}>
        <option>All Lead Type</option>
        <option>Individual</option>
        <option>Business</option>
      </select>
      <select className="h-10 w-full rounded-[7px] border border-[#e7e3ec] bg-white px-3 pr-8 text-xs text-[#504b5b] outline-none max-[760px]:w-[calc(50%_-_5px)] max-[500px]:w-full" aria-label="Filter by owner" value={props.owner} onChange={(event) => props.onOwnerChange(event.target.value)}>
        <option>All Owners</option>
        {props.owners.map((owner) => <option key={owner}>{owner}</option>)}
      </select>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-[7px] border border-[#e7e3ec] bg-transparent p-0 text-[#655f70] hover:bg-[#f7f5fb] disabled:cursor-not-allowed disabled:opacity-35 max-[760px]:hidden"
        aria-label="Clear all filters"
        title="Clear all filters"
        disabled={!props.hasActiveFilters}
        onClick={props.onClearFilters}
      >
        <ListFilter size={18} />
      </button>
    </div>
  );
}
