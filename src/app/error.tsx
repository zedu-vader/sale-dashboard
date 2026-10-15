"use client";

import { CircleAlert } from "lucide-react";
import { Button, Card } from "@/components/zedu";

// Inline error card with Retry.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="zedu grid min-h-screen place-items-center bg-z-app px-4">
      <Card className="w-full max-w-[420px] items-center text-center">
        <div role="alert" className="flex flex-col items-center gap-1">
          <CircleAlert aria-hidden className="mb-2 size-5 text-z-fg-danger" />
          <h1 className="text-z-section text-z-fg">Couldn&apos;t load your dashboard</h1>
          <p className="text-z-small text-z-fg-muted">Check your connection and try again.</p>
        </div>
        <Button variant="secondary" onClick={reset}>
          Retry
        </Button>
      </Card>
    </main>
  );
}
