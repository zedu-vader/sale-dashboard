import { Ellipsis, LayoutDashboard, Phone, SquareCheck, UserRound } from "lucide-react";

// Mobile bottom tab bar, Zedu Design System §5.3 (below 768px).
export function BottomTabs({ onMore }: { onMore: () => void }) {
  const tab = "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <a href="/" aria-current="page" className={`${tab} text-brand-bright`}>
        <LayoutDashboard size={20} />
        Home
      </a>
      <a href="#" className={`${tab} text-ink-muted`}>
        <UserRound size={20} />
        Leads
      </a>
      <div className="flex flex-1 justify-center">
        <a
          href="#"
          aria-label="Call"
          className="-mt-5 grid h-[52px] w-[52px] place-items-center self-start rounded-full bg-gradient-brand text-white shadow-brand ring-4 ring-surface"
        >
          <Phone size={20} />
        </a>
      </div>
      <a href="#" className={`${tab} text-ink-muted`}>
        <SquareCheck size={20} />
        Tasks
      </a>
      <button onClick={onMore} className={`${tab} text-ink-muted`}>
        <Ellipsis size={20} />
        More
      </button>
    </nav>
  );
}
