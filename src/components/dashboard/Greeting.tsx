"use client";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "Good morning, Agnes. Here's your sales activity." in the viewer's local time. */
export function Greeting({ firstName }: { firstName: string }) {
  return (
    <span suppressHydrationWarning>
      {greeting(new Date().getHours())}, {firstName}. Here&apos;s your sales activity.
    </span>
  );
}
