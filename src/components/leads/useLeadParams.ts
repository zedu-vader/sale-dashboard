"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Reads and writes the Leads list state in the URL (?tab, q, status, type, owner, sort, page), so filters
 * survive reloads and can be shared. Any change other than `page` sends you back to page 1.
 */
export function useLeadParams() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(search.toString());
      for (const [key, value] of Object.entries(changes)) {
        const v = Array.isArray(value) ? value.join(",") : value;
        if (v) next.set(key, v);
        else next.delete(key);
      }
      if (!("page" in changes)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, search],
  );

  return { set, pending };
}
