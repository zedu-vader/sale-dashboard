import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  growth: string;
  icon: LucideIcon;
  tone: "purple" | "blue" | "orange" | "pink";
};

const tones = {
  purple: "bg-[#f0eaff] text-[#5425c7]",
  blue: "bg-[#edf3ff] text-[#3059bf]",
  orange: "bg-[#fff3e5] text-[#bd7120]",
  pink: "bg-[#f7eafa] text-[#8d26b5]",
};

export function StatCard({ label, value, growth, icon: Icon, tone }: StatCardProps) {
  return (
    <article className="flex min-h-[104px] items-start gap-[13px] overflow-hidden rounded-[11px] border border-[#efecf4] bg-white p-[18px] shadow-[0_3px_13px_rgb(32_19_66_/_3%)] max-[760px]:p-3.5 max-[500px]:min-h-[90px]">
      <div className={`grid h-[43px] w-[43px] shrink-0 place-items-center rounded-[10px] ${tones[tone]}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="grid gap-px">
        <span className="text-xs font-medium text-[#666174]">{label}</span>
        <strong className="mt-px text-[27px] leading-none tracking-[-0.5px]">{value}</strong>
        <small className="mt-1 flex items-center gap-[3px] text-[10px] font-semibold text-[#239450]"><TrendingUp size={13} /> {growth}</small>
      </div>
      <TrendingUp className="mb-px ml-auto mt-auto text-[#7c59d2] opacity-75" size={38} strokeWidth={1.5} />
    </article>
  );
}
