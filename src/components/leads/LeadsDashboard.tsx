"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Hourglass, PhoneCall, Plus, UsersRound } from "lucide-react";
import { AddLeadModal } from "./AddLeadModal";
import { initialLeads, type Lead } from "./data";
import { LeadsTable } from "./LeadsTable";
import { LeadsToolbar } from "./LeadsToolbar";
import { Sidebar } from "./Sidebar";
import { StatCard } from "./StatCard";

export function LeadsDashboard() {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [type, setType] = useState("All Lead Type");
  const [owner, setOwner] = useState("All Owners");
  const [selected, setSelected] = useState<number[]>([]);
  const [ascending, setAscending] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads
      .filter((lead) => !query || [lead.name, lead.phone, lead.company].some((value) => value?.toLowerCase().includes(query)))
      .filter((lead) => status === "All Status" || lead.status === status)
      .filter((lead) => type === "All Lead Type" || lead.type === type)
      .filter((lead) => owner === "All Owners" || lead.owner === owner)
      .sort((a, b) => ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [ascending, leads, owner, search, status, type]);

  function toggleLead(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    const visibleIds = filteredLeads.map((lead) => lead.id);
    const allSelected = visibleIds.every((id) => selected.includes(id));
    setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])));
  }

  function addLead(data: { name: string; phone: string; type: "Individual" | "Business" }) {
    const initials = data.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const newLead: Lead = { id: Date.now(), name: data.name, initials, phone: data.phone, type: data.type, status: "New", lastCall: "—", nextAction: "Call", nextActionDate: "Today", owner: "You", avatarTone: "violet" };
    setLeads((current) => [newLead, ...current]);
    setModalOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[#fbfbfd] font-sans text-[#171326] max-[760px]:block">
      <Sidebar />
      <main className="ml-[218px] w-[calc(100%-218px)] max-w-none px-[34px] pb-8 pt-[27px] max-[1080px]:ml-[82px] max-[1080px]:w-[calc(100%-82px)] max-[1080px]:px-6 max-[760px]:m-0 max-[760px]:w-full max-[760px]:px-4 max-[760px]:py-[22px]">
        <header className="flex min-h-[58px] items-start justify-between gap-6 max-[760px]:items-center max-[500px]:items-start">
          <div><h1 className="mb-[5px] mt-0 text-[28px] font-bold leading-[1.1] tracking-[-0.65px] text-[#171326]">Leads</h1><p className="m-0 text-[13px] leading-[1.45] text-[#7c7888] max-[500px]:hidden">Manage and track your leads. Add new leads, view their status and log your interactions.</p></div>
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[7px] border-0 bg-[#4b20b8] px-[17px] text-[13px] font-semibold text-white shadow-[0_5px_12px_rgb(75_32_184_/_15%)] hover:bg-[#3c169d]" onClick={() => setModalOpen(true)}><Plus size={17} /> Add Lead</button>
        </header>

        <section className="mt-[18px] grid grid-cols-4 gap-3.5 max-[1080px]:grid-cols-2 max-[500px]:grid-cols-1" aria-label="Lead metrics">
          <StatCard label="Total Leads" value={248 + leads.length - initialLeads.length} growth="12%" icon={UsersRound} tone="purple" />
          <StatCard label="Contacted" value={182} growth="18%" icon={PhoneCall} tone="blue" />
          <StatCard label="In Progress" value={96} growth="10%" icon={Hourglass} tone="orange" />
          <StatCard label="Converted" value={28} growth="8%" icon={CheckCircle2} tone="pink" />
        </section>

        <section className="mt-[17px] overflow-hidden rounded-[11px] border border-[#efecf4] bg-white shadow-[0_3px_14px_rgb(32_19_66_/_3%)]" aria-label="Leads list">
          <LeadsToolbar search={search} status={status} type={type} owner={owner} onSearchChange={setSearch} onStatusChange={setStatus} onTypeChange={setType} onOwnerChange={setOwner} />
          <LeadsTable leads={filteredLeads} selected={selected} onToggle={toggleLead} onToggleAll={toggleAll} onSort={() => setAscending((value) => !value)} />
          <footer className="flex min-h-[65px] items-center justify-between gap-[18px] border-t border-[#f1eef4] px-[17px] py-3 max-[500px]:flex-col max-[500px]:items-start">
            <span className="text-[11px] text-[#787382]">Showing {filteredLeads.length ? 1 : 0}–{filteredLeads.length} of {filteredLeads.length === leads.length ? 248 + leads.length - initialLeads.length : filteredLeads.length} leads</span>
            <div className="flex items-center gap-1">
              <button className="grid h-[31px] w-[31px] place-items-center rounded-md border-0 bg-transparent p-0 text-[11px] text-[#575161] hover:bg-[#f3effa]" type="button" aria-label="Previous page" onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button>
              {[1, 2, 3, 4, 5].map((item) => <button type="button" key={item} className={`grid h-[31px] w-[31px] place-items-center rounded-md border-0 p-0 text-[11px] ${page === item ? "bg-[#4b20b8] text-white shadow-[0_3px_8px_rgb(75_32_184_/_18%)] hover:bg-[#3c169d]" : "bg-transparent text-[#575161] hover:bg-[#f3effa]"}`} onClick={() => setPage(item)}>{item}</button>)}
              <button className="grid h-[31px] w-[31px] place-items-center rounded-md border-0 bg-transparent p-0 text-[11px] text-[#575161] hover:bg-[#f3effa]" type="button" aria-label="Next page" onClick={() => setPage((value) => Math.min(5, value + 1))}><ChevronRight size={16} /></button>
            </div>
          </footer>
        </section>
      </main>
      <AddLeadModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={addLead} />
    </div>
  );
}
