# ZEDU design system v2

React + Tailwind v4 implementation of the **ZEDU · Design system** page in Figma
([Fatethrow, node 16796:18178](https://www.figma.com/design/oe3hs2Wvde1hpbCpQqx5vU/Fatethrow?node-id=16796-18178)).

Live reference: run `npm run dev` and open **/design-system**.

Calm, neutral, data-first: white surfaces on a light grey app background, hairline borders, almost no shadow.
Black is the action colour; indigo marks data and selection (charts, links, active tabs, checked boxes, selected rows).
Status colour appears only in soft tinted pills, deltas and score bars.

## Using it

```tsx
import { Button, Card, StatusPill } from "@/components/zedu";
import { Plus } from "lucide-react";

export function Example() {
  return (
    <div className="zedu bg-z-app">
      <Card title="Leads" action={<Button variant="secondary" size="sm">See all</Button>}>
        <StatusPill stage="Qualified" />
        <Button icon={<Plus aria-hidden />}>Add lead</Button>
      </Card>
    </div>
  );
}
```

- **Wrap ZEDU screens in `className="zedu"`.** It sets Geist Regular on text/primary, tabular figures, and the
  1.5px Lucide stroke the icons are drawn with (lucide-react defaults to 2px).
- Icons come from `lucide-react`. Size them with `size-4` (16px: buttons, inputs, tables, nav), `size-5` (20px:
  empty states, section headers) or `size-3.5` (14px: inside pills). Colour with `text-z-icon` / `text-z-icon-strong`.
- `className` on a component is appended to its defaults (no tailwind-merge), so use it for layout (width, margin),
  not to restyle a variant. If a variant is missing, add it to the component.
- Light mode only. The Figma Dark mode mirrors Light until it is designed.

## Tokens

All tokens are prefixed `z` so they sit beside the v1 dashboard tokens in `globals.css` without clashing.
They are defined in [`tokens.css`](./tokens.css) and map 1:1 to the Figma variables.

| Figma | CSS variable | Tailwind |
| --- | --- | --- |
| `color/bg/app`, `surface`, `subtle`, `sunken`, `selected`, `primary`, `inverse`, `accent`, `danger` | `--z-bg-*` | `bg-z-app`, `bg-z-surface`, `bg-z-subtle`, `bg-z-sunken`, `bg-z-selected`, `bg-z-primary`, `bg-z-inverse`, `bg-z-accent`, `bg-z-danger` |
| `color/text/primary`, `secondary`, `muted`, `placeholder`, `accent`, `success`, `warning`, `danger` | `--z-text-*` | `text-z-fg`, `text-z-fg-secondary`, `text-z-fg-muted`, `text-z-fg-placeholder`, `text-z-fg-accent`, `text-z-fg-success`, … |
| `color/icon/*` | `--z-icon-*` | `text-z-icon`, `text-z-icon-strong`, `text-z-icon-subtle` |
| `color/border/default`, `strong`, `hover`, `focus`, `danger` | `--z-border-*` | `border-z-line`, `border-z-line-strong`, `border-z-line-hover`, `border-z-line-focus`, `border-z-line-danger` |
| `color/chart/1–4`, `status/*`, `score/*` | `--z-chart-*`, `--z-status-*`, `--z-score-*` | `bg-z-chart-1`, `bg-z-status-success`, `bg-z-score-high`, … |
| `color/pill/<stage>` | `--z-pill-<stage>-bg/-fg` | `bg-z-pill-new text-z-pill-new-fg` (use `<StatusPill>`) |
| `radius/xs–2xl`, `full` | | `rounded-z-xs` (4) `sm` (6) `md` (8) `lg` (10) `xl` (12) `2xl` (16), `rounded-full` |
| `space/*` (2–64) | | Tailwind's spacing scale: `space/8` = `2`, `space/12` = `3`, `space/20` = `5` … |
| `ZEDU/Shadow/XS–LG`, `ZEDU/Focus/Ring`, `ZEDU/Focus/Input` | | `shadow-z-xs`, `shadow-z-sm`, `shadow-z-md`, `shadow-z-lg`, `shadow-z-focus-ring`, `shadow-z-focus-input` |
| `ZEDU/Display`, `Heading/Page`, `Heading/Section`, `Heading/Card` | | `text-z-display`, `text-z-page`, `text-z-section`, `text-z-card` |
| `ZEDU/Body/Default`, `Body/Small`, `Caption/Default`, `Mono` | | `text-z-body`, `text-z-small`, `text-z-caption`, `font-mono text-z-mono` (add `font-medium` for the Medium styles) |
| `ZEDU/Overline` | | `z-overline` (11/16, medium, 6% tracking, uppercase) |

`z-focus` gives any interactive element the ZEDU keyboard focus ring.

## Components

| Figma | Code | Notes |
| --- | --- | --- |
| Button | `Button`, `buttonClass()` | `variant` primary · secondary · ghost · danger, `size` md (36) · sm (32), `icon`. One Primary per view. `buttonClass()` for `<Link>`. |
| Icon button | `IconButton` | 32px, ghost · outline. `label` is required (aria-label + tooltip). |
| Field label, Input | `FieldLabel`, `Input` | `label`, `helper`, `error`, `icon`, `required`, `disabled`. |
| Search | `Search` | sunken (in-context) · outline (top bar), `shortcut`, `size` md · sm. |
| Checkbox | `Checkbox` | `label` (+ `hideLabel` in tables), `indeterminate`. |
| Status pill | `StatusPill`, `STAGES` | `stage` = New … Won, Lost. |
| Delta | `Delta` | `direction` up · down · flat, `value`. |
| Count badge | `CountBadge` | `tone` neutral · accent · danger. |
| Tab | `Tabs` | Controlled: `options`, `value`, `onChange`; `count` per option. |
| Segment / Segmented control | `SegmentedControl` | Same API as `Tabs`. |
| Card | `Card` | `title`, `icon`, `action`, `bleed` (tables to the edges). |
| KPI card | `KpiCard`, `Sparkline` | Inline (`sparkline`) or Icon (`icon`) variant, `delta`, `plain` for edge-to-edge rows. |
| Avatar, Avatar group, Score | `Avatar`, `AvatarGroup`, `Score` | Avatar sizes 24 · 32 · 40, `online`. Score 0–10. |
| Table header cell, Table cell | `Table`, `TableHead`, `TableRow`, `TableCell`, `Person` | Semantic `<table>`. `TableHead sort`/`onSort`; `TableRow selected`; `TableCell type` primary · text · checkbox · actions. |
| Nav item, Nav section label, Sidebar | `Sidebar`, `NavSection`, `NavItem`, `SidebarDivider` | `Sidebar collapsed` (64px rail) is read by the items inside it. |
| Bulk action bar | `BulkActionBar` | `count`, `actions`, `onDiscard`; floats bottom-centre. |
| Menu item, divider, label | `Menu`, `MenuItem`, `MenuDivider`, `MenuLabel`, `MenuHeader`, `Dropdown` | `Dropdown` handles open/close, outside click, Escape and arrow keys. |
| Menu/New, Menu/User | `NewMenu`, `UserMenu` | Pass a handler per item; omit `onImport` / `onTeam` to hide role-restricted rows. |
| Logo, Workspace switcher, User trigger, Notifications button | `Logo`, `WorkspaceSwitcher`, `UserTrigger`, `NotificationsButton` | |
| Top bar, Page header | `TopBar`, `PageHeader` | `TopBar` is responsive (desktop / mobile variants) and focuses search on ⌘K. `PageHeader` takes `actions` and `tabs`. |
| Select, Textarea | `Select`, `DateField`, `Textarea` | Same frame as `Input` (label, icon, helper/error). `Select` is a native select; `DateField` adds the "Pick a date" placeholder. |
| Alert | `Alert`, `AlertAction` | `tone` warning · danger · info, optional `actions` (text buttons). Danger is announced as an alert. |
| Filter chip | `FilterChip` | Default (dashed "+ Field") or `active` ("Field: value" with clear). |
| Due label, Task type, Task status | `DueLabel`, `TaskTypeTag`, `TaskStatus` | `due` overdue · today · upcoming · done · none. Overdue is derived, so `TaskStatus` is only Pending / Completed. |
| Lead type, Detail row | `LeadTypeLabel`, `DetailRow` | Individual (indigo dot) / Business (orange dot). `DetailRow` goes inside a `<dl>`. |
| Activity item | `ActivityItem`, `ActivityBody` | Timeline entry with rail; hide the line on the last item with `last`. |
| Modal, side panel | `Modal`, `Sheet` | Escape closes, focus moves in and back. `Sheet` docks right below the top bar (Edit details). |
| Bulk action bar | `BulkActionButton` | For bar actions that open a menu (wrap in `Dropdown`). |

`StatusPill` takes an optional `label` to rename a stage while keeping its colour (the Leads screens show
Won as "Converted", Lost as "Not interested" and Follow up as "Follow-up"). `SegmentedControl` has `stretch`
for full-width form fields.

## Extending

Keep the `z` prefix for new tokens and the ZEDU names for components, and bind new components to `z` tokens only.
When the Figma page changes, update `tokens.css` first, then the component, then `/design-system`.

Not built yet (listed under "Next" in Figma): dark mode values, a custom date picker (`DateField` uses the
browser's), toast, bar and donut charts.
