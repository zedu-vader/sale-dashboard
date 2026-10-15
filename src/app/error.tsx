"use client";

import { CircleAlert } from "lucide-react";
import { button } from "@/components/ui/button";

// Inline error card with Retry (§7.10).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div role="alert" className="card flex w-full max-w-[420px] flex-col items-center text-center">
        <CircleAlert size={24} className="mb-3 text-danger" />
        <h1 className="text-h3">Couldn&apos;t load your dashboard</h1>
        <p className="mb-4 mt-1 text-body text-ink-muted">Check your connection and try again.</p>
        <button onClick={reset} className={button({ variant: "secondary" })}>Retry</button>
      </div>
    </main>
  );
}
