import type { Insight } from "@/lib/dashboard";

// Insight chips that close every chart card (§7.9).
export function InsightChips({ insights }: { insights: Insight[] }) {
  return (
    <dl className="mt-1.5 flex flex-wrap gap-3">
      {insights.map((i) => (
        <div key={i.label} className="min-w-[140px] flex-1 rounded-lg bg-surface-sunken px-3.5 py-3">
          <dt className="text-overline uppercase text-ink-muted">{i.label}</dt>
          <dd className={`mt-1 text-[18px] font-bold leading-6 ${i.tone === "success" ? "text-[#0b8a50] dark:text-success" : ""}`}>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
