"use client";

import { Calendar, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { RANGE_PRESETS, type RangeKey } from "@/lib/range";
import { Button, Dropdown, Menu, MenuItem } from "@/components/zedu";

/** Page-header date range button ("Last 30 days") with the preset menu. Writes ?range= to the URL. */
export function RangeMenu({ value, period }: { value: RangeKey; period: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const label = RANGE_PRESETS.find((p) => p.key === value)?.label ?? period;

  const select = (key: RangeKey) => {
    if (key !== value) startTransition(() => router.push(`${pathname}?range=${key}`, { scroll: false }));
  };

  return (
    <Dropdown
      align="end"
      trigger={(p) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<Calendar aria-hidden />}
          title={period}
          aria-busy={pending}
          className={pending ? "opacity-60" : undefined}
          {...p}
        >
          {label}
        </Button>
      )}
    >
      <Menu label="Date range" className="w-52">
        {RANGE_PRESETS.map((preset) => (
          <MenuItem
            key={preset.key}
            onSelect={() => select(preset.key)}
            icon={preset.key === value ? <Check aria-hidden /> : <span aria-hidden className="size-4" />}
          >
            {preset.label}
            {preset.key === value && <span className="sr-only"> (selected)</span>}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}
