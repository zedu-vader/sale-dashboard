import type { ComponentProps } from "react";

export type SkeletonProps = ComponentProps<"div">;

/**
 * Base skeleton primitive for the Settings components adhering to ZEDU tokens.
 * Uses `animate-pulse`, `bg-z-sunken`, and default `rounded-z-md`.
 */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-z-md bg-z-sunken ${className}`}
      {...props}
    />
  );
}

/**
 * Skeletal loading state for the Team Members table in TeamTab.
 */
export function TeamMembersSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-z-line p-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-7 w-24 rounded-z-sm" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeletal loading state for the Invitations list in TeamTab.
 */
export function InvitationsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-z-line p-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full Settings screen skeleton for component-level fallback/Suspense.
 */
export function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings" className="flex flex-col gap-6 p-6 max-sm:px-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-z-xl border border-z-line bg-z-surface p-6 shadow-z-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="mt-2 flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-9 w-28 self-end" />
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-z-xl border border-z-line bg-z-surface p-6 shadow-z-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="mt-2 flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-9 w-28 self-end" />
          </div>
        </div>
      </div>
    </div>
  );
}
