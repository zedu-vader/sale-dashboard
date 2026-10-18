"use client";

// Top-bar bell: fetches the signed-in user's notifications and shows them in a dropdown.
// Clicking one marks it read and opens the record it points at.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { IconButton } from "@/components/zedu/Button";
import { cx } from "@/components/zedu/cx";
import { Dropdown, Menu, MenuDivider, MenuItem, MenuLabel } from "@/components/zedu/Menu";
import { formatDay } from "@/lib/format";

type Item = {
  id: string;
  label: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Response = { unread: number; items: Item[] };

/** One notification row. A filled dot marks it unread. */
function NotificationRow({ item, onSelect }: { item: Item; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex h-auto w-full shrink-0 items-start gap-2 rounded-z-sm px-2 py-2 text-left outline-none transition-colors duration-100 hover:bg-z-sunken focus-visible:bg-z-sunken"
    >
      <span
        aria-hidden
        className={cx("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-z-status-danger")}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2">
          <span className="z-overline text-z-fg-muted">{item.label}</span>
          <span className="shrink-0 text-z-caption text-z-fg-muted">{formatDay(new Date(item.createdAt))}</span>
        </span>
        <span className={cx("truncate text-z-small font-medium", item.read ? "text-z-fg-secondary" : "text-z-fg")}>
          {item.title}
        </span>
        {item.body && <span className="truncate text-z-caption text-z-fg-muted">{item.body}</span>}
      </span>
    </button>
  );
}

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Response;
        setItems(data.items);
        setUnread(data.unread);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const select = (item: Item) => {
    if (!item.read) {
      setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, read: true } : x)));
      setUnread((n) => Math.max(0, n - 1));
    }
    if (item.link) router.push(item.link);
    fetch(`/api/notifications/${item.id}`, { method: "POST" }).catch(() => undefined);
  };

  const markAll = async () => {
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await fetch("/api/notifications", { method: "POST" }).catch(() => undefined);
  };

  return (
    <Dropdown
      align="end"
      trigger={(props) => (
        <IconButton
          {...props}
          label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative"
          onClick={() => {
            props.onClick();
            load();
          }}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span aria-hidden className="absolute left-[19px] top-1.5 size-2 rounded-full bg-z-status-danger ring-[1.5px] ring-z-surface" />
          )}
        </IconButton>
      )}
    >
      <Menu label="Notifications" className="w-80">
        <MenuLabel>Notifications</MenuLabel>
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center gap-1 px-2 py-6 text-center">
            <Inbox aria-hidden className="size-5 text-z-icon" />
            <span className="text-z-small font-medium text-z-fg">You&rsquo;re all caught up</span>
            <span className="text-z-caption text-z-fg-muted">Nothing needs you right now.</span>
          </div>
        )}
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} onSelect={() => select(item)} />
        ))}
        {items.length > 0 && (
          <>
            <MenuDivider />
            <MenuItem icon={<CheckCheck />} onSelect={markAll}>
              Mark all as read
            </MenuItem>
          </>
        )}
      </Menu>
    </Dropdown>
  );
}
