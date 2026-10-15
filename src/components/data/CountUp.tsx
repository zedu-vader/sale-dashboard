"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

// Counts up once on first load (§8). Later value changes swap in directly; reduced motion skips the animation.
export function CountUp({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    if (played.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      played.current = true;
      setValue(to);
      return;
    }
    played.current = true;
    let frame: number;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return (
    <>
      <span aria-hidden>{formatNumber(value)}</span>
      <span className="sr-only">{formatNumber(to)}</span>
    </>
  );
}
