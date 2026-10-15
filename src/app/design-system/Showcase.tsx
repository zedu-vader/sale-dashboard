"use client";

// Live reference for the ZEDU design system, laid out like the Figma page (Fatethrow › ZEDU · Design system).

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  CircleHelp,
  CloudDownload,
  CloudUpload,
  Contact,
  Download,
  Ellipsis,
  Forward,
  Funnel,
  LayoutDashboard,
  LogOut,
  Mail,
  Minus,
  PanelLeft,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Search as SearchIcon,
  Settings,
  SlidersHorizontal,
  SquareCheck,
  Star,
  Trash,
  TrendingDown,
  TrendingUp,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Avatar,
  AvatarGroup,
  BulkActionBar,
  Button,
  Card,
  Checkbox,
  CountBadge,
  Delta,
  Dropdown,
  FieldLabel,
  IconButton,
  Input,
  KpiCard,
  NavItem,
  NavSection,
  NewMenu,
  NotificationsButton,
  PageHeader,
  Person,
  Score,
  Search,
  SegmentedControl,
  Sidebar,
  SidebarDivider,
  STAGES,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TopBar,
  UserMenu,
  UserTrigger,
  WorkspaceSwitcher,
  type Stage,
} from "@/components/zedu";

const swatches: Record<string, string[]> = {
  Surfaces: ["bg-app", "bg-surface", "bg-subtle", "bg-sunken", "bg-selected", "bg-primary", "bg-inverse", "bg-accent", "bg-danger"],
  Text: ["text-primary", "text-secondary", "text-muted", "text-placeholder", "text-accent", "text-success", "text-warning", "text-danger"],
  "Borders & focus": ["border-default", "border-strong", "border-hover", "border-focus", "border-danger", "focus-ring"],
  "Charts, status & score": [
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "status-success",
    "status-warning",
    "status-danger",
    "status-info",
    "score-high",
    "score-mid",
    "score-low",
  ],
};

const typeRamp = [
  { name: "Display", spec: "Geist Medium 28/36", className: "text-z-display", sample: "1,248" },
  { name: "Heading/Page", spec: "Geist SemiBold 20/28", className: "text-z-page", sample: "Leads" },
  { name: "Heading/Section", spec: "Geist SemiBold 16/24", className: "text-z-section", sample: "Customer profile" },
  { name: "Heading/Card", spec: "Geist SemiBold 14/20", className: "text-z-card", sample: "Sales revenue" },
  { name: "Body/Default", spec: "Geist Regular 14/20", className: "text-z-body", sample: "Got it. I'll send the update after my meeting." },
  { name: "Body/Medium", spec: "Geist Medium 14/20", className: "text-z-body font-medium", sample: "Schedule a call" },
  { name: "Body/Small", spec: "Geist Regular 13/20", className: "text-z-small", sample: "Nordic Soft AB" },
  { name: "Body/Small medium", spec: "Geist Medium 13/20", className: "text-z-small font-medium", sample: "Emma Johansson" },
  { name: "Caption/Default", spec: "Geist Regular 12/16", className: "text-z-caption", sample: "15 mins ago" },
  { name: "Caption/Medium", spec: "Geist Medium 12/16", className: "text-z-caption font-medium", sample: "Qualified" },
  { name: "Overline", spec: "Geist Medium 11/16", className: "z-overline", sample: "Customer" },
  { name: "Mono", spec: "Geist Mono Regular 12/16", className: "font-mono text-z-mono", sample: "⌘K · 9/10" },
];

const radii = [
  ["xs", "rounded-z-xs", "Checkbox, chips"],
  ["sm", "rounded-z-sm", "Segments"],
  ["md", "rounded-z-md", "Buttons, inputs, nav"],
  ["lg", "rounded-z-lg", "Bulk bar"],
  ["xl", "rounded-z-xl", "Cards"],
  ["2xl", "rounded-z-2xl", "Panels, modals"],
  ["full", "rounded-full", "Pills, avatars"],
];

const elevations = [
  ["Shadow/XS", "shadow-z-xs"],
  ["Shadow/SM", "shadow-z-sm"],
  ["Shadow/MD", "shadow-z-md"],
  ["Shadow/LG", "shadow-z-lg"],
  ["Focus/Ring", "shadow-z-focus-ring"],
  ["Focus/Input", "border border-z-line-focus shadow-z-focus-input"],
];

const icons = {
  Plus,
  Minus,
  Check,
  X,
  Search: SearchIcon,
  "Chevron down": ChevronDown,
  "Chevron right": ChevronRight,
  "Chevrons up down": ChevronsUpDown,
  Ellipsis,
  Funnel,
  "Arrow up down": ArrowUpDown,
  "Arrow up": ArrowUp,
  "Arrow down": ArrowDown,
  Sliders: SlidersHorizontal,
  "Cloud upload": CloudUpload,
  "Cloud download": CloudDownload,
  "Trending up": TrendingUp,
  "Trending down": TrendingDown,
  "Layout dashboard": LayoutDashboard,
  "User round": UserRound,
  Users,
  Phone,
  "Phone call": PhoneCall,
  Mail,
  Calendar,
  Bell,
  Settings,
  "Circle help": CircleHelp,
  "Circle alert": CircleAlert,
  Pencil,
  Trash,
  Forward,
  Star,
  Download,
  Upload,
  Contact,
  "Square check": SquareCheck,
  "User plus": UserPlus,
  "Log out": LogOut,
  "Panel left": PanelLeft,
};

const leads: { name: string; company: string; email: string; stage: Stage; manager: [string, string]; score: number; created: string }[] = [
  { name: "Emma Johansson", company: "Nordic Soft AB", email: "emma@nordicsoft.io", stage: "Qualified", manager: ["Jacob Müller", "JM"], score: 9, created: "Dec 08, 2025" },
  { name: "Ethan Wilson", company: "Travel Ventures", email: "ethan@travelventures.com", stage: "Connected", manager: ["Olivia Davis", "OD"], score: 6, created: "Dec 07, 2025" },
  { name: "William Lee", company: "AI Dynamics", email: "w.lee@aidynamics.com", stage: "Proposal", manager: ["James Smith", "JS"], score: 7, created: "Dec 05, 2025" },
  { name: "Isabella Hernandez", company: "Design Studios", email: "isabella@designstudios.net", stage: "New", manager: ["Liam Johnson", "LJ"], score: 3, created: "Dec 06, 2025" },
  { name: "Ava Clark", company: "Smart Homes Inc.", email: "ava@smarthomes.com", stage: "Lost", manager: ["Noah Garcia", "NG"], score: 2, created: "Dec 03, 2025" },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-5 rounded-z-2xl border border-z-line bg-z-surface p-10 max-md:p-5">
      <h2 className="text-z-page text-z-fg">{title}</h2>
      {intro && <p className="max-w-[820px] text-z-small text-z-fg-muted">{intro}</p>}
      {children}
    </section>
  );
}

function Sub({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-z-card text-z-fg">{title}</h3>
      {intro && <p className="max-w-[820px] text-z-small text-z-fg-muted">{intro}</p>}
      {children}
    </div>
  );
}

/** Grey stage the Figma page puts behind each component set. */
function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`flex flex-wrap items-start gap-5 rounded-z-xl bg-z-sunken/70 p-5 ${className ?? ""}`}>{children}</div>;
}

function Foundations() {
  return (
    <Section id="foundations" title="Foundations" intro="Semantic colour, type, spacing, radius and elevation. Every swatch and sample below is bound to the live token.">
      {Object.entries(swatches).map(([group, names]) => (
        <div key={group} className="flex flex-col gap-3">
          <p className="z-overline text-z-fg-muted">{group}</p>
          <div className="flex flex-wrap gap-3">
            {names.map((n) => (
              <div key={n} className="flex w-20 flex-col gap-1.5">
                <div className="h-11 rounded-z-md border border-z-line" style={{ background: `var(--z-${n})` }} />
                <p className="text-z-caption text-z-fg-muted">
                  {n.split("-")[0]}/<wbr />
                  {n.split("-").slice(1).join("-")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="z-overline text-z-fg-muted">Type · Geist</p>
      <div className="flex flex-col gap-3">
        {typeRamp.map((t) => (
          <div key={t.name} className="flex items-center gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-1">
            <div className="w-60 shrink-0 text-z-caption text-z-fg-muted">
              <p>ZEDU/{t.name}</p>
              <p>{t.spec}</p>
            </div>
            <p className={`${t.className} text-z-fg`}>{t.sample}</p>
          </div>
        ))}
      </div>
      <p className="z-overline text-z-fg-muted">Spacing · space/*</p>
      <div className="flex flex-wrap items-end gap-4">
        {[2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64].map((s) => (
          <div key={s} className="flex flex-col items-center gap-1.5">
            <div className="rounded-[2px] bg-z-chart-1" style={{ width: s, height: s }} />
            <p className="text-z-caption text-z-fg-muted">{s}</p>
          </div>
        ))}
      </div>
      <p className="z-overline text-z-fg-muted">Radius · radius/*</p>
      <div className="flex flex-wrap gap-4">
        {radii.map(([name, cls, use]) => (
          <div key={name} className="flex flex-col gap-1.5">
            <div className={`h-14 w-24 border border-z-line-strong bg-z-sunken ${cls}`} />
            <p className="text-z-caption text-z-fg-muted">
              radius/{name}
              <br />
              {use}
            </p>
          </div>
        ))}
      </div>
      <p className="z-overline text-z-fg-muted">Elevation · ZEDU/Shadow, ZEDU/Focus</p>
      <div className="flex flex-wrap gap-6 rounded-z-xl bg-z-app px-6 pb-8 pt-6">
        {elevations.map(([name, cls]) => (
          <div key={name} className={`grid h-[72px] w-[130px] place-items-center rounded-z-xl bg-z-surface text-z-caption text-z-fg-muted ${cls}`}>
            ZEDU/{name}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Icons() {
  return (
    <Section
      id="icons"
      title="Icons"
      intro="Lucide at 1.5px stroke (set by the .zedu root). Use 16px in buttons, inputs, tables and nav; 20px only for empty states and section headers; 14px inside pills. Colour comes from text-z-icon / text-z-icon-strong."
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
        {Object.entries(icons).map(([name, Icon]) => (
          <div key={name} className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-z-md text-center hover:bg-z-subtle">
            <Icon aria-hidden className="size-6 text-z-icon" />
            <span className="text-z-caption text-z-fg-muted">{name}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Buttons() {
  return (
    <Section
      id="buttons"
      title="Buttons"
      intro='Black Primary is the one main action per view ("Add lead", "Save"). Secondary (white, hairline border) for supporting actions like Import and Export; Ghost for toolbar and in-row actions; Danger only for destructive actions, behind a confirm. Sizes: md 36px for page and form actions, sm 32px for toolbars, cards and tables.'
    >
      <Sub title="Button" intro="Hover and Tab-focus any button to see its states.">
        <Panel className="flex-col">
          {(["md", "sm"] as const).map((size) =>
            (["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
              <div key={size + variant} className="flex flex-wrap items-center gap-5">
                <Button variant={variant} size={size} icon={<Plus aria-hidden />}>
                  Add lead
                </Button>
                <Button variant={variant} size={size} icon={<Plus aria-hidden />} disabled>
                  Add lead
                </Button>
                <span className="text-z-caption text-z-fg-muted">
                  {variant} · {size}
                </span>
              </div>
            )),
          )}
        </Panel>
      </Sub>
      <Sub title="Icon button" intro='32px square. Ghost for toolbar icons (filter, sort, view switch, row "…" menu); Outline when it sits next to Secondary buttons. Always give it a label.'>
        <Panel>
          <IconButton label="More actions">
            <Ellipsis aria-hidden />
          </IconButton>
          <IconButton label="More actions" disabled>
            <Ellipsis aria-hidden />
          </IconButton>
          <IconButton label="More actions" variant="outline">
            <Ellipsis aria-hidden />
          </IconButton>
          <IconButton label="More actions" variant="outline" disabled>
            <Ellipsis aria-hidden />
          </IconButton>
        </Panel>
      </Sub>
    </Section>
  );
}

function FormControls() {
  const [checks, setChecks] = useState([false, true]);
  return (
    <Section
      id="forms"
      title="Form controls"
      intro="Labels sit above fields in Caption/Medium. Fields are 36px, white, radius 8, 1px border/strong with a hairline shadow. Focus switches to border/focus plus a soft indigo halo. Errors use border/danger and a message that says what to do, with the alert icon so colour is never the only signal."
    >
      <Sub title="Field label">
        <Panel>
          <FieldLabel>Full name</FieldLabel>
          <FieldLabel required>Full name</FieldLabel>
        </Panel>
      </Sub>
      <Sub title="Input">
        <Panel className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          <Input label="Full name" icon={<UserRound aria-hidden />} placeholder="e.g. Emma Johansson" helper="As it should appear on calls and emails." />
          <Input label="Full name" icon={<UserRound aria-hidden />} defaultValue="Emma Johansson" helper="As it should appear on calls and emails." />
          <Input label="Full name" icon={<UserRound aria-hidden />} defaultValue="Emma" error="Enter a first and last name." required />
          <Input label="Full name" icon={<UserRound aria-hidden />} placeholder="e.g. Emma Johansson" helper="As it should appear on calls and emails." disabled />
        </Panel>
      </Sub>
      <Sub title="Search" intro='Sunken for search inside the sidebar, tables and panels; Outline for global search in the top bar. The shortcut chip shows the keyboard shortcut ("/" or ⌘K).'>
        <Panel>
          <Search shortcut="/" className="w-[260px]" />
          <Search variant="outline" shortcut="/" className="w-[260px]" />
        </Panel>
      </Sub>
      <Sub title="Checkbox" intro="16px, radius 4. Use Indeterminate in the table header when some rows are selected. Hide the label in tables; it stays as the accessible name.">
        <Panel>
          <Checkbox label="Select lead" checked={checks[0]} onChange={(e) => setChecks([e.target.checked, checks[1]])} />
          <Checkbox label="Select lead" checked={checks[1]} onChange={(e) => setChecks([checks[0], e.target.checked])} />
          <Checkbox label="Select lead" indeterminate checked readOnly />
          <Checkbox label="Select lead" disabled />
          <Checkbox label="Select lead" checked disabled readOnly />
        </Panel>
      </Sub>
    </Section>
  );
}

function BadgesTabs() {
  const [tab, setTab] = useState("all");
  const [period, setPeriod] = useState("monthly");
  return (
    <Section id="badges" title="Badges & tabs">
      <Sub title="Status pill" intro="Soft tint + darker text, sentence case, 22px tall, fully rounded. Order: New → Contacted → Connected → Interested → Follow up → Qualified → Proposal → Won. Lost is an exit from any stage and records a reason.">
        <Panel>
          {STAGES.map((s) => (
            <StatusPill key={s} stage={s} />
          ))}
        </Panel>
      </Sub>
      <Sub title="Delta" intro="Period change beside a KPI value: trend icon + percentage, no background. Green up, red down, grey flat. Never colour alone.">
        <Panel>
          <Delta direction="up" value="12%" />
          <Delta direction="down" value="12%" />
          <Delta direction="flat" value="12%" />
        </Panel>
      </Sub>
      <Sub title="Count badge" intro="Neutral (outlined square) for nav and tab counts; Accent beside an active tab; Danger (red) only for unread notifications.">
        <Panel>
          <CountBadge count={4} />
          <CountBadge count={4} tone="accent" />
          <CountBadge count={4} tone="danger" />
        </Panel>
      </Sub>
      <Sub title="Tab" intro="Underline tabs for filtering a page. Active = indigo text and 2px indicator.">
        <Tabs
          label="Lead filters"
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All", count: 248 },
            { value: "mine", label: "Assigned to me" },
            { value: "new", label: "New" },
            { value: "follow-up", label: "Follow up" },
            { value: "overdue", label: "Overdue" },
          ]}
        />
      </Sub>
      <Sub title="Segmented control" intro="For switching a view in place. 32px sunken track, 2px inset, active segment is a white chip with a hairline shadow.">
        <div>
          <SegmentedControl
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
        </div>
      </Sub>
    </Section>
  );
}

function Cards() {
  return (
    <Section
      id="cards"
      title="Cards"
      intro='White surface, radius 12, 1px border/default and Shadow/SM, 20px padding. Card titles are Heading/Card with an optional 16px icon; the action is a small Secondary button ("See all"). Tables inside cards bleed to the card edges.'
    >
      <Card
        title="Recent activity"
        icon={<LayoutDashboard aria-hidden />}
        action={
          <Button variant="secondary" size="sm">
            See all
          </Button>
        }
        className="w-full max-w-[420px]"
      >
        <div className="grid h-[140px] place-items-center rounded-z-md border border-dashed border-z-line-strong bg-z-subtle text-z-caption text-z-fg-muted">
          Swap in content
        </div>
      </Card>
      <Sub title="KPI card" intro="Inline: label on top, value and delta on one line, indigo sparkline on the right. Icon: tinted icon tile with label and value. Values use Display with tabular figures.">
        <Panel>
          <KpiCard label="New leads" value="42" delta={{ direction: "up", value: "12%" }} sparkline={[4, 9, 6, 12, 10, 14, 11, 17, 15, 21]} className="w-[280px]" />
          <KpiCard label="New leads" value="42" delta={{ direction: "up", value: "12%" }} icon={<Users aria-hidden />} className="w-[280px]" />
        </Panel>
      </Sub>
    </Section>
  );
}

function TableSection() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const all = selected.size === leads.length;
  const some = selected.size > 0 && !all;
  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Section
      id="table"
      title="Table"
      intro="Dense, borderless tables: 40px header in Overline, 52px rows separated by 1px border/default, 12px cell padding. Names in Body/Small medium, everything else Body/Small secondary. Row hover is bg/subtle; selected rows are bg/selected with a checked checkbox."
    >
      <Sub title="Avatar">
        <Panel className="items-center">
          <Avatar size={24} initials="EJ" />
          <Avatar size={32} initials="EJ" online />
          <Avatar size={40} initials="EJ" />
        </Panel>
      </Sub>
      <Sub title="Avatar group · Score">
        <AvatarGroup people={[{ initials: "JM" }, { initials: "OD" }, { initials: "LJ" }, { initials: "JS" }, ...Array.from({ length: 5 }, () => ({ initials: "?" }))]} />
        <div className="flex flex-wrap gap-6">
          <Score value={9} />
          <Score value={7} />
          <Score value={3} />
        </div>
      </Sub>
      <Sub title="Example · Leads table" intro="Select rows to see the bulk action bar.">
        <Card bleed>
          <Table>
            <thead>
              <tr>
                <TableHead checkbox>
                  <Checkbox
                    label="Select all leads"
                    hideLabel
                    checked={all}
                    indeterminate={some}
                    onChange={() => setSelected(all ? new Set() : new Set(leads.map((_, i) => i)))}
                  />
                </TableHead>
                <TableHead sort="none">Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Score</TableHead>
                <TableHead sort="desc">Created</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <TableRow key={l.email} selected={selected.has(i)}>
                  <TableCell type="checkbox">
                    <Checkbox label={`Select ${l.name}`} hideLabel checked={selected.has(i)} onChange={() => toggle(i)} />
                  </TableCell>
                  <TableCell type="primary">{l.name}</TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>
                    <StatusPill stage={l.stage} />
                  </TableCell>
                  <TableCell>
                    <Person name={l.manager[0]} initials={l.manager[1]} />
                  </TableCell>
                  <TableCell>
                    <Score value={l.score} />
                  </TableCell>
                  <TableCell>{l.created}</TableCell>
                  <TableCell type="actions">
                    <IconButton label={`Actions for ${l.name}`}>
                      <Ellipsis aria-hidden />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      </Sub>
      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onDiscard={() => setSelected(new Set())}
          actions={[
            { label: "Edit", icon: <Pencil aria-hidden />, onClick: () => {} },
            { label: "Assign to", icon: <Forward aria-hidden />, onClick: () => {} },
            { label: "Delete", icon: <Trash aria-hidden />, onClick: () => {} },
          ]}
        />
      )}
    </Section>
  );
}

function AppShellDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [page, setPage] = useState("Leads");
  const [tab, setTab] = useState("all");
  const nav = [
    { label: "Dashboard", icon: <LayoutDashboard aria-hidden /> },
    { label: "Leads", icon: <UserRound aria-hidden /> },
    { label: "Calls", icon: <Phone aria-hidden /> },
    { label: "Tasks", icon: <SquareCheck aria-hidden />, count: 4 },
    { label: "Contacts", icon: <Contact aria-hidden /> },
  ];

  return (
    <Section
      id="shell"
      title="App shell"
      intro='Sidebar (Expanded 248px / Collapsed 64px rail), top bar with global search and the "New" menu, and the page header. Use the sidebar toggle in the top bar, and the role switch below.'
    >
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Role"
          value={admin ? "admin" : "rep"}
          onChange={(v) => setAdmin(v === "admin")}
          options={[
            { value: "rep", label: "Sales rep" },
            { value: "admin", label: "Admin" },
          ]}
        />
        <NotificationsButton />
        <NotificationsButton unread />
      </div>
      <div className="relative flex h-[720px] overflow-hidden rounded-z-xl border border-z-line">
        <Sidebar
          collapsed={collapsed}
          className="max-md:hidden"
          header={
            <>
              <Dropdown
                className={collapsed ? undefined : "w-full"}
                trigger={(p) => <WorkspaceSwitcher workspace="Zedu" subtitle="Marketing dashboard" collapsed={collapsed} {...p} />}
              >
                <UserMenu name="Zedu" subtitle="Marketing dashboard" />
              </Dropdown>
              {collapsed ? (
                <IconButton label="Search" className="w-10">
                  <SearchIcon aria-hidden />
                </IconButton>
              ) : (
                <Search size="sm" shortcut="/" className="w-full shrink-0" />
              )}
            </>
          }
          footer={
            <>
              <NavItem label="Help center" icon={<CircleHelp aria-hidden />} />
              <SidebarDivider />
              <Dropdown
                side="top"
                className={collapsed ? undefined : "w-full"}
                trigger={(p) => (
                  <UserTrigger name="Agnes Okafor" email="agnes@zedu.chat" initials="AO" collapsed={collapsed} {...p} />
                )}
              >
                <UserMenu
                  name="Agnes Okafor"
                  subtitle={`agnes@zedu.chat · ${admin ? "Admin" : "Sales rep"}`}
                  onTeam={admin ? () => {} : undefined}
                />
              </Dropdown>
            </>
          }
        >
          <NavSection label="Sales">
            {nav.map((n) => (
              <NavItem key={n.label} {...n} active={page === n.label} onClick={() => setPage(n.label)} />
            ))}
          </NavSection>
          {admin && (
            <>
              {collapsed && <SidebarDivider />}
              <NavSection label="Admin">
                <NavItem label="Team & invitations" icon={<UserPlus aria-hidden />} count={2} active={page === "Team"} onClick={() => setPage("Team")} />
                <NavItem label="Settings" icon={<Settings aria-hidden />} active={page === "Settings"} onClick={() => setPage("Settings")} />
              </NavSection>
            </>
          )}
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col bg-z-surface">
          <TopBar unread onToggleSidebar={() => setCollapsed((c) => !c)} newMenu={<NewMenu onImport={admin ? () => {} : undefined} />} />
          <PageHeader
            title={page}
            count={page === "Leads" ? 248 : undefined}
            description="Good morning, Agnes. Here's your sales activity."
            actions={
              <>
                <Button variant="secondary" size="sm" icon={<Upload aria-hidden />}>
                  Import
                </Button>
                <Button variant="secondary" size="sm" icon={<Plus aria-hidden />}>
                  Add lead
                </Button>
              </>
            }
            tabs={
              <Tabs
                label="Lead filters"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "all", label: "All", count: 248 },
                  { value: "mine", label: "Assigned to me" },
                  { value: "new", label: "New" },
                  { value: "follow-up", label: "Follow up" },
                  { value: "overdue", label: "Overdue" },
                ]}
              />
            }
          />
          <div className="grid grid-cols-1 gap-px border-b border-z-line bg-z-line sm:grid-cols-3">
            <KpiCard plain label="New leads" value="42" delta={{ direction: "up", value: "12%" }} sparkline={[3, 6, 4, 8, 7, 10, 9, 12]} />
            <KpiCard plain label="Qualified" value="18" delta={{ direction: "down", value: "4.2%" }} sparkline={[9, 8, 9, 7, 8, 6, 7, 6]} />
            <KpiCard plain label="Won" value="7" delta={{ direction: "flat", value: "0%" }} sparkline={[2, 3, 2, 3, 2, 3, 2, 3]} />
          </div>
        </div>
      </div>
    </Section>
  );
}

const toc = [
  ["foundations", "Foundations"],
  ["icons", "Icons"],
  ["buttons", "Buttons"],
  ["forms", "Form controls"],
  ["badges", "Badges & tabs"],
  ["cards", "Cards"],
  ["table", "Table"],
  ["shell", "App shell"],
];

export function Showcase() {
  return (
    <div className="zedu min-h-screen bg-z-app">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-10 max-sm:px-4">
        <header className="flex flex-col gap-2">
          <p className="text-z-caption text-z-fg-muted">v2.0 · Oct 2026 · Light mode</p>
          <h1 className="text-z-display text-z-fg">ZEDU design system</h1>
          <p className="max-w-[720px] text-z-small text-z-fg-muted">
            Calm, neutral, data-first. White surfaces on a light grey app background, hairline borders, almost no shadow. Black is the action colour; indigo marks data
            and selection. Components live in <code className="font-mono text-z-mono">src/components/zedu</code>.
          </p>
          <nav aria-label="Sections" className="mt-2 flex flex-wrap gap-2">
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="z-focus rounded-full border border-z-line-strong bg-z-surface px-3 py-1 text-z-caption font-medium text-z-fg-secondary hover:border-z-line-hover hover:text-z-fg">
                {label}
              </a>
            ))}
          </nav>
        </header>
        <Foundations />
        <Icons />
        <Buttons />
        <FormControls />
        <BadgesTabs />
        <Cards />
        <TableSection />
        <AppShellDemo />
      </div>
    </div>
  );
}
