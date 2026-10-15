import "./tailwind.css";
import Link from "next/link";
import { CheckSquare, SearchX } from "lucide-react";

export const metadata = { title: "Page not found" };

const btn =
  "inline-flex h-[42px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-solid px-5 text-sm font-semibold no-underline";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-sm text-ink">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-solid border-line bg-white px-6 py-10 text-center sm:px-10">
        <span className="text-[28px] font-extrabold tracking-tight text-brand">Zedu</span>

        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <SearchX size={26} />
        </span>

        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted">Error 404</p>
          <h1 className="m-0 mt-1 text-[26px] font-extrabold tracking-tight text-ink">Page not found</h1>
          <p className="m-0 mt-2 leading-snug text-muted">The page you’re looking for doesn’t exist or may have been moved.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/tasks" className={`${btn} border-brand bg-brand text-white hover:bg-brand-hover`}>
            <CheckSquare size={16} /> Go to Tasks
          </Link>
          <Link href="/" className={`${btn} border-line bg-white text-brand hover:bg-canvas`}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
