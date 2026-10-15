import {
  BarChart3,
  CheckSquare,
  ContactRound,
  LayoutDashboard,
  Phone,
  UsersRound,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Leads", icon: UsersRound, active: true },
  { label: "Calls", icon: Phone },
  { label: "Tasks", icon: CheckSquare },
  { label: "Contacts", icon: ContactRound },
  { label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-[218px] flex-col border-r border-[#eeeaf5] bg-white px-[18px] pb-6 pt-[27px] max-[1080px]:w-[82px] max-[1080px]:px-[13px] max-[760px]:static max-[760px]:h-auto max-[760px]:w-full max-[760px]:flex-row max-[760px]:items-center max-[760px]:overflow-x-auto max-[760px]:border-b max-[760px]:border-r-0 max-[760px]:px-4 max-[760px]:py-[13px]">
      <div className="px-[13px] pb-7 text-[27px] font-extrabold tracking-[-1.2px] text-[#4216a5] max-[1080px]:px-0.5 max-[1080px]:text-center max-[1080px]:text-[21px] max-[760px]:pb-0 max-[760px]:pr-2.5 max-[760px]:text-xl">Zedu</div>
      <nav className="grid gap-1.5 max-[760px]:flex max-[760px]:gap-1" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            type="button"
            className={`flex min-h-[43px] w-full items-center gap-[13px] rounded-[9px] border-0 px-[13px] text-left text-sm font-medium transition-colors max-[1080px]:justify-center max-[1080px]:px-0 max-[760px]:min-h-10 max-[760px]:w-[42px] max-[760px]:min-w-[42px] ${active ? "bg-zedu-100 font-semibold text-zedu-600 hover:bg-[#ece4fb]" : "bg-transparent text-[#494455] hover:bg-[#f7f5fb] hover:text-zedu-600"}`}
            key={label}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span className="max-[1080px]:hidden">{label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-[#f1eef5] px-2 pt-3.5 max-[1080px]:justify-center max-[1080px]:px-0 max-[760px]:hidden">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-zedu-600 text-[11px] font-bold text-white">AO</span>
        <span className="grid gap-px max-[1080px]:hidden">
          <strong className="text-xs">Agnes</strong>
          <small className="text-[10px] text-[#777386]">Sales Team</small>
        </span>
        <span className="ml-auto text-xl text-[#797483] max-[1080px]:hidden">›</span>
      </div>
    </aside>
  );
}
