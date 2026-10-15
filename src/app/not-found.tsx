import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export const metadata = { title: "Page not found" };

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

        <Link
          href="/"
          className="inline-flex h-[42px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-solid border-brand bg-brand px-5 text-sm font-semibold text-white no-underline hover:bg-brand-hover sm:w-auto"
        >
          <Home size={16} /> Go to home
        </Link>
      </div>
    </div>
  );
}
