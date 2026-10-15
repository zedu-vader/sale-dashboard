"use client";

import { createContext, useContext } from "react";
import type { RangeKey } from "@/lib/range";

type RangeState = { key: RangeKey; period: string; change: (key: RangeKey) => void };

export const RangeContext = createContext<RangeState | null>(null);

export function useRange() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error("useRange must be used inside <AppShell>");
  return ctx;
}
