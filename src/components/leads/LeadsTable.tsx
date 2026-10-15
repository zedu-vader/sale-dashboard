import { ArrowDownUp, MoreVertical } from "lucide-react";
import type { Lead } from "./data";

type LeadsTableProps = {
  leads: Lead[];
  selected: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onSort: () => void;
};

const avatarTones: Record<string, string> = {
  violet: "bg-[#e9e0fb] text-[#5830a8]",
  green: "bg-[#dff2e5] text-[#286843]",
  rose: "bg-[#f7e2e7] text-[#914050]",
  cyan: "bg-[#d9f2f1] text-[#17606a]",
  purple: "bg-[#e4ddf6] text-[#4e2ca0]",
  blue: "bg-[#dcedf7] text-[#1f5b82]",
  lime: "bg-[#e4f2dc] text-[#3e7133]",
  pink: "bg-[#f9e3ec] text-[#8d3953]",
  indigo: "bg-[#dfe8fa] text-[#304a8d]",
  amber: "bg-[#faecd2] text-[#93651d]",
};

const statusTones: Record<Lead["status"], string> = {
  Interested: "bg-[#e6f5e9] text-[#26774b]",
  "Follow up": "bg-[#fff3d9] text-[#946417]",
  "Not interested": "bg-[#fdebed] text-[#a54850]",
  Connected: "bg-[#e5f1fc] text-[#1d61a6]",
  Converted: "bg-[#dff3e9] text-[#246e45]",
  New: "bg-[#ede7fa] text-[#4e36a4]",
};

export function LeadsTable({ leads, selected, onToggle, onToggleAll, onSort }: LeadsTableProps) {
  const allChecked = leads.length > 0 && leads.every((lead) => selected.includes(lead.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] table-auto border-collapse">
        <thead>
          <tr className="h-[46px] bg-[#fcfbfd] text-left text-[11px] font-semibold text-[#6e6978] [&>th]:whitespace-nowrap [&>th]:px-[13px]">
            <th className="w-11 !pl-[17px] !pr-[7px]"><input className="m-0 h-[15px] w-[15px] accent-[#4b20b8]" aria-label="Select all leads" type="checkbox" checked={allChecked} onChange={onToggleAll} /></th>
            <th><button type="button" className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[inherit] font-[inherit] text-[inherit]" onClick={onSort}>Name <ArrowDownUp size={13} /></button></th>
            <th>Phone Number</th><th>Lead Type</th><th>Status</th><th>Last Call</th><th>Next Action</th><th>Owner</th><th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {leads.length ? leads.map((lead) => (
            <tr key={lead.id} className={`h-[65px] border-t border-[#f1eef4] text-[11.5px] text-[#302b3b] transition-colors hover:bg-[#fbf9ff] [&>td]:whitespace-nowrap [&>td]:px-[13px] [&>td]:py-2 ${selected.includes(lead.id) ? "bg-[#fbf9ff]" : ""}`}>
              <td className="w-11 !pl-[17px] !pr-[7px]"><input className="m-0 h-[15px] w-[15px] accent-[#4b20b8]" aria-label={`Select ${lead.name}`} type="checkbox" checked={selected.includes(lead.id)} onChange={() => onToggle(lead.id)} /></td>
              <td>
                <div className="flex min-w-[150px] items-center gap-2.5">
                  <span className={`grid h-[31px] w-[31px] place-items-center rounded-full text-[10px] font-bold ${avatarTones[lead.avatarTone]}`}>{lead.initials}</span>
                  <strong className="text-[11.5px] font-semibold text-[#211c2d]">{lead.name}</strong>
                </div>
              </td>
              <td className="!text-[#615c6c]">{lead.phone}</td>
              <td><span className="inline-flex min-h-[25px] items-center rounded-md bg-[#eaf2fe] px-[9px] text-[10px] font-semibold text-[#315cab]">{lead.type}</span></td>
              <td><span className={`inline-flex min-h-[25px] items-center rounded-md px-[9px] text-[10px] font-semibold ${statusTones[lead.status]}`}>{lead.status}</span></td>
              <td className="!text-[#615c6c]">{lead.lastCall}</td>
              <td>
                <div className="grid gap-[3px] text-[#302b3b]">{lead.nextAction}{lead.nextActionDate && <small className="text-[10px] text-[#777180]">{lead.nextActionDate}</small>}</div>
              </td>
              <td>{lead.owner}</td>
              <td><button type="button" className="grid h-8 w-7 place-items-center rounded-md border-0 bg-transparent p-0 text-inherit hover:bg-[#f0ecf6]" aria-label={`More options for ${lead.name}`}><MoreVertical size={18} /></button></td>
            </tr>
          )) : (
            <tr><td colSpan={9} className="h-[180px] text-center text-[13px] text-[#777180]">No leads match your filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
