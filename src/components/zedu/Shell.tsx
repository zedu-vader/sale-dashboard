"use client";

// ZEDU app shell (Figma 16811:18527): Logo, Workspace switcher, User trigger, Notifications button,
// Menu/New, Menu/User, Top bar, Page header.

import {
  Bell,
  ChevronsUpDown,
  CircleHelp,
  Contact,
  Ellipsis,
  LogOut,
  Menu as MenuIcon,
  PanelLeft,
  PhoneCall,
  Plus,
  Search as SearchIcon,
  Settings,
  SquareCheck,
  Upload,
  UserPlus,
  UserRound,
} from "lucide-react";
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Avatar } from "./Avatar";
import { Button, IconButton } from "./Button";
import { cx } from "./cx";
import { Search } from "./Field";
import { Dropdown, Menu, MenuDivider, MenuHeader, MenuItem, MenuLabel } from "./Menu";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

/** Placeholder Zedu logo (black mark + wordmark) until official brand assets are confirmed. */
export function Logo({ mark = false, className }: { mark?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-2", className)}>
      <span
        role={mark ? "img" : undefined}
        aria-hidden={!mark || undefined}
        aria-label={mark ? "Zedu" : undefined}
        className="grid size-7 place-items-center rounded-z-md bg-z-primary text-[15px] font-semibold leading-5 text-z-fg-on-primary"
      >
        Z
      </span>
      {!mark && <span className="text-z-section text-z-fg">Zedu</span>}
    </span>
  );
}

type TriggerButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Top of the sidebar: logo mark, workspace name and subtitle. Opens a workspace/account menu. */
export const WorkspaceSwitcher = forwardRef<
  HTMLButtonElement,
  TriggerButtonProps & { workspace: string; subtitle?: string; collapsed?: boolean }
>(function WorkspaceSwitcher({ workspace, subtitle, collapsed, className, ...rest }, ref) {
  if (collapsed) return <Logo mark className={className} />;
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        "z-focus flex h-12 w-full shrink-0 items-center gap-2.5 rounded-z-md py-1.5 pl-1.5 pr-2 text-left transition-colors duration-150 hover:bg-z-sunken",
        className,
      )}
      {...rest}
    >
      <span className="grid size-8 shrink-0 place-items-center">
        <Logo mark />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-z-small font-medium text-z-fg">{workspace}</span>
        {subtitle && <span className="truncate text-z-caption font-normal text-z-fg-muted">{subtitle}</span>}
      </span>
      <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-z-icon" />
    </button>
  );
});

/** Sidebar footer: signed-in user. Opens the user menu. Collapsed shows the avatar only. */
export const UserTrigger = forwardRef<
  HTMLButtonElement,
  TriggerButtonProps & { name: string; email?: string | null; initials: string; image?: string | null; collapsed?: boolean }
>(function UserTrigger({ name, email, initials, image, collapsed, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={collapsed ? `Account: ${name}` : undefined}
      className={cx(
        "z-focus flex shrink-0 items-center gap-2.5 rounded-z-md text-left transition-colors duration-150 hover:bg-z-sunken",
        collapsed ? "rounded-full" : "h-12 w-full p-2",
        className,
      )}
      {...rest}
    >
      <Avatar initials={initials} src={image} online />
      {!collapsed && (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-z-small font-medium text-z-fg">{name}</span>
            {email && <span className="truncate text-z-caption font-normal text-z-fg-muted">{email}</span>}
          </span>
          <Ellipsis aria-hidden className="size-4 shrink-0 text-z-icon" />
        </>
      )}
    </button>
  );
});

/** Top-bar bell. Unread shows a red dot. */
export const NotificationsButton = forwardRef<HTMLButtonElement, TriggerButtonProps & { unread?: boolean }>(
  function NotificationsButton({ unread, className, ...rest }, ref) {
    return (
      <IconButton ref={ref} label={unread ? "Notifications, unread" : "Notifications"} className={cx("relative", className)} {...rest}>
        <Bell aria-hidden />
        {unread && (
          <span aria-hidden className="absolute left-[19px] top-1.5 size-2 rounded-full bg-z-status-danger ring-[1.5px] ring-z-surface" />
        )}
      </IconButton>
    );
  },
);

type NewMenuProps = {
  onLogCall?: () => void;
  onAddLead?: () => void;
  onNewTask?: () => void;
  onAddContact?: () => void;
  /** Omit for roles without import permission. */
  onImport?: () => void;
};

/** Menu/New: quick-create from the top-bar "New" button. */
export function NewMenu({ onLogCall, onAddLead, onNewTask, onAddContact, onImport }: NewMenuProps) {
  return (
    <Menu label="Create">
      <MenuLabel>Create</MenuLabel>
      <MenuItem icon={<PhoneCall />} shortcut="C" onSelect={onLogCall}>
        Log call
      </MenuItem>
      <MenuItem icon={<UserRound />} shortcut="L" onSelect={onAddLead}>
        Add lead
      </MenuItem>
      <MenuItem icon={<SquareCheck />} shortcut="T" onSelect={onNewTask}>
        New task
      </MenuItem>
      <MenuItem icon={<Contact />} shortcut="N" onSelect={onAddContact}>
        Add contact
      </MenuItem>
      {onImport && (
        <>
          <MenuDivider />
          <MenuItem icon={<Upload />} onSelect={onImport}>
            Import contacts (CSV)
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

type UserMenuProps = {
  name: string;
  /** e.g. "agnes@zedu.chat · Admin". */
  subtitle?: string;
  onProfile?: () => void;
  /** Admin only: omit for sales reps. */
  onTeam?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onLogOut?: () => void;
};

/** Menu/User: opened from the sidebar user trigger. */
export function UserMenu({ name, subtitle, onProfile, onTeam, onSettings, onHelp, onLogOut }: UserMenuProps) {
  return (
    <Menu label="Account">
      <MenuHeader title={name} subtitle={subtitle} />
      <MenuDivider />
      <MenuItem icon={<UserRound />} onSelect={onProfile}>
        Profile
      </MenuItem>
      {onTeam && (
        <MenuItem icon={<UserPlus />} onSelect={onTeam}>
          Team &amp; invitations
        </MenuItem>
      )}
      <MenuItem icon={<Settings />} onSelect={onSettings}>
        Settings
      </MenuItem>
      <MenuItem icon={<CircleHelp />} onSelect={onHelp}>
        Help center
      </MenuItem>
      <MenuDivider />
      <MenuItem icon={<LogOut />} tone="danger" onSelect={onLogOut}>
        Log out
      </MenuItem>
    </Menu>
  );
}

type TopBarProps = {
  /** Desktop: toggles the sidebar rail. */
  onToggleSidebar?: () => void;
  /** Mobile (<768px): opens the sidebar drawer. */
  onOpenMenu?: () => void;
  onSearch?: (query: string) => void;
  onHelp?: () => void;
  /** Contents of the "New" dropdown, usually <NewMenu />. */
  newMenu?: ReactNode;
  /** Replaces the built-in search box (e.g. a search with live results). It then owns ⌘K itself. */
  search?: ReactNode;
  /** Mobile (<768px) search icon. */
  onMobileSearch?: () => void;
  className?: string;
};

/**
 * Global 56px top bar. Desktop: sidebar toggle, global search (⌘K), help, notifications, and "New" — the only
 * Primary button in the shell. Mobile: menu, logo, search, notifications, New.
 */
export function TopBar({
  onToggleSidebar,
  onOpenMenu,
  onSearch,
  onHelp,
  newMenu = <NewMenu />,
  search,
  onMobileSearch,
  className,
}: TopBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the global search.
  useEffect(() => {
    if (search) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [search]);

  return (
    <header
      className={cx(
        "flex h-14 shrink-0 items-center gap-2 border-b border-z-line bg-z-surface px-3 md:pl-4 md:pr-6",
        className,
      )}
    >
      <IconButton label="Open menu" className="md:hidden" onClick={onOpenMenu}>
        <MenuIcon aria-hidden />
      </IconButton>
      <IconButton label="Toggle sidebar" className="max-md:hidden" onClick={onToggleSidebar}>
        <PanelLeft aria-hidden />
      </IconButton>
      <Logo className="md:hidden" />
      {search ? (
        <div className="max-md:hidden">{search}</div>
      ) : (
        <form
          role="search"
          className="max-md:hidden"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.(String(new FormData(e.currentTarget).get("q") ?? ""));
          }}
        >
          <Search ref={searchRef} name="q" variant="outline" placeholder="Search leads, contacts, calls…" shortcut="⌘K" className="w-80" />
        </form>
      )}
      <div className="flex-1" />
      <IconButton label="Search" className="md:hidden" onClick={onMobileSearch}>
        <SearchIcon aria-hidden />
      </IconButton>
      <IconButton label="Help" className="max-md:hidden" onClick={onHelp}>
        <CircleHelp aria-hidden />
      </IconButton>
      <NotificationsBell />
      <div aria-hidden className="h-5 w-px bg-z-line max-md:hidden" />
      <Dropdown
        align="end"
        trigger={(props) => (
          <Button size="sm" icon={<Plus aria-hidden />} {...props}>
            New
          </Button>
        )}
      >
        {newMenu}
      </Dropdown>
    </header>
  );
}

type PageHeaderProps = {
  title: string;
  /** Record count shown after the title in placeholder grey. */
  count?: number | string;
  description?: ReactNode;
  /** Up to two Secondary sm buttons. The page Primary is the top-bar "New". */
  actions?: ReactNode;
  /** <Tabs> for list pages (Leads, Calls, Tasks, Contacts). */
  tabs?: ReactNode;
  className?: string;
};

/** Top of every page: title (Heading/Page), optional count, one-line description, actions, optional tabs. */
export function PageHeader({ title, count, description, actions, tabs, className }: PageHeaderProps) {
  return (
    <div className={cx("flex flex-col px-6 pt-6 max-sm:px-4", tabs ? "gap-4" : "pb-5", className)}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
          <h1 className="flex items-baseline gap-2 text-z-page">
            <span className="text-z-fg">{title}</span>
            {count !== undefined && <span className="font-normal text-z-fg-placeholder">{count}</span>}
          </h1>
          {description && <p className="text-z-small font-normal text-z-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {tabs}
    </div>
  );
}
