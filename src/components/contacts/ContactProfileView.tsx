"use client";

// Contact profile (Figma 16854:24629 · Activity, 16856:25414 · Calls, 16857:25760 · Create lead,
// 16857:26248 · Edit details): details, linked records, next action and the history tabs.

import { Building2, ChevronRight, Ellipsis, Link2, Mail, Pencil, Phone, Plus, Trash, UserRound, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { addContactNote, createContactTask, deleteContact, logContactCall } from "@/app/contacts/actions";
import type { ContactCall, ContactProfile } from "@/lib/contactTypes";
import type { TeamMember } from "@/lib/leadTypes";
import { LEAD_TYPES, STAGES, initialsOf } from "@/lib/status";
import {
  Avatar,
  Button,
  DetailRow,
  Dropdown,
  IconButton,
  LeadTypeLabel,
  Menu,
  MenuDivider,
  MenuItem,
  Modal,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableRow,
  cx,
} from "@/components/zedu";
import { LogCallModal, NewTaskModal } from "@/components/leads/LeadDialogs";
import { HistoryTabs, NextActionCard, NoteComposer, TasksTab, Timeline, card, type HistoryTab } from "@/components/records/ProfileParts";
import { CreateLeadModal, EditContactSheet } from "./ContactDialogs";

type Props = {
  contact: ContactProfile;
  team: TeamMember[];
  me: { name: string };
  initialTab: HistoryTab;
  initialEdit: boolean;
  initialLead: "new" | "link" | null;
};

export function ContactProfileView({ contact, team, me, initialTab, initialEdit, initialLead }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<HistoryTab>(initialTab);
  const [editing, setEditing] = useState(initialEdit);
  const [leadDialog, setLeadDialog] = useState<"new" | "link" | null>(initialLead);
  const [loggingCall, setLoggingCall] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const first = contact.name.split(/\s+/)[0];
  // Calls and tasks from here attach to the latest lead, as on the server.
  const lead = contact.leads[0] ?? null;

  return (
    <div className={cx("transition-opacity duration-150", pending && "opacity-70")}>
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-z-line px-6 pb-5 pt-4 max-sm:px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-z-small">
          <Link href="/contacts" className="z-focus rounded-z-xs font-normal text-z-fg-muted hover:text-z-fg">
            Contacts
          </Link>
          <ChevronRight aria-hidden className="size-3.5 text-z-icon-subtle" />
          <span aria-current="page" className="font-medium text-z-fg">
            {contact.name}
          </span>
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 basis-72 items-center gap-4">
            <Avatar size={40} initials={initialsOf(contact.name)} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-z-page text-z-fg">{contact.name}</h1>
                <span className="shrink-0 rounded-z-xs border border-z-line-strong px-1.5 py-0.5 font-mono text-z-mono text-z-fg-secondary">
                  {contact.code}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-z-small">
                <LeadTypeLabel type={LEAD_TYPES[contact.type].kind} />
                {contact.company && (
                  <>
                    <Dot />
                    <span className="text-z-fg-secondary">{contact.company}</span>
                  </>
                )}
                <Dot />
                <span className="text-z-fg-muted">Created {contact.createdShort}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Phone aria-hidden />} onClick={() => setLoggingCall(true)}>
              Log call
            </Button>
            <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={() => setNewTask(true)}>
              New task
            </Button>
            <Button variant="secondary" size="sm" icon={<Pencil aria-hidden />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Dropdown
              align="end"
              trigger={(p) => (
                <IconButton label="More actions" {...p}>
                  <Ellipsis aria-hidden />
                </IconButton>
              )}
            >
              <Menu label="More actions" className="w-52">
                <MenuItem icon={<UserRoundPlus />} onSelect={() => setLeadDialog("new")}>
                  Create lead
                </MenuItem>
                <MenuItem icon={<Link2 />} onSelect={() => setLeadDialog("link")}>
                  Link existing lead
                </MenuItem>
                <MenuDivider />
                <MenuItem tone="danger" icon={<Trash />} onSelect={() => setConfirmDelete(true)}>
                  Delete contact
                </MenuItem>
              </Menu>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-wrap items-start gap-6 px-6 pb-6 pt-5 max-sm:px-4">
        <aside className="flex w-80 flex-col gap-4 max-lg:w-full">
          <section className={cx(card, "flex flex-col gap-1 p-4")} aria-labelledby="details-title">
            <div className="flex items-center pb-1">
              <h2 id="details-title" className="flex-1 text-z-card text-z-fg">
                Details
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            </div>
            <dl className="flex flex-col gap-1">
              <DetailRow label="Phone" icon={<Phone aria-hidden />}>
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:underline">
                  {contact.phone}
                </a>
              </DetailRow>
              <DetailRow label="Email" icon={contact.email ? <Mail aria-hidden /> : undefined}>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="hover:underline" title={contact.email}>
                    {contact.email}
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Company" icon={contact.company ? <Building2 aria-hidden /> : undefined}>
                {contact.company ?? "—"}
              </DetailRow>
              <DetailRow label="Contact type">{LEAD_TYPES[contact.type].label}</DetailRow>
              <DetailRow label="Created">{contact.created}</DetailRow>
              <DetailRow label="Last interaction">{contact.lastInteraction ?? "—"}</DetailRow>
              <div className="flex items-start gap-3 py-1.5">
                <dt className="w-28 shrink-0 text-z-small font-normal text-z-fg-muted">Notes</dt>
                <dd className="min-w-0 flex-1 whitespace-pre-line text-z-small text-z-fg">
                  {contact.notes ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className={cx(card, "flex flex-col gap-2 p-4")} aria-labelledby="linked-title">
            <div className="flex items-center">
              <h2 id="linked-title" className="flex-1 text-z-card text-z-fg">
                Linked records
              </h2>
              <Button variant="ghost" size="sm" icon={<Link2 aria-hidden />} onClick={() => setLeadDialog("link")}>
                Link
              </Button>
            </div>
            {contact.leads.map((l) => (
              <RecordLink
                key={l.id}
                href={`/leads/${l.id}`}
                tile={<UserRound aria-hidden />}
                accent
                title={
                  <>
                    <span className="truncate">Lead · {l.code}</span>
                    <StatusPill stage={STAGES[l.status].stage} label={STAGES[l.status].label} />
                  </>
                }
                meta={l.meta}
              />
            ))}
            {contact.companyInfo && (
              <RecordLink
                href={`/contacts?company=${encodeURIComponent(contact.companyInfo.name)}`}
                tile={<Building2 aria-hidden />}
                title={<span className="truncate">{contact.companyInfo.name}</span>}
                meta={contact.companyInfo.meta}
              />
            )}
            {contact.leads.length === 0 && (
              <div className="flex items-center gap-3 rounded-z-lg border border-dashed border-z-line-strong px-3 py-2.5">
                <p className="min-w-0 flex-1 text-z-small text-z-fg-muted">No lead yet.</p>
                <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={() => setLeadDialog("new")}>
                  Create lead
                </Button>
              </div>
            )}
          </section>
        </aside>

        <div className="flex min-w-0 flex-1 basis-[480px] flex-col gap-4">
          <NextActionCard
            task={contact.nextTask}
            onNewTask={() => setNewTask(true)}
            emptyText="Nothing scheduled. Add a task to follow up with this contact."
          />

          <section className={cx(card, "min-h-[520px] overflow-hidden")}>
            <HistoryTabs label="Contact history" value={tab} onChange={setTab} counts={contact.counts} />
            <div role="tabpanel">
              {tab === "activity" && (
                <div className="flex flex-col gap-4 p-4">
                  <NoteComposer id={contact.id} firstName={first} me={me.name} onSave={(text) => addContactNote(contact.id, text)} />
                  <Timeline entries={contact.timeline} empty="Nothing has happened with this contact yet." />
                </div>
              )}
              {tab === "calls" && <CallsTab calls={contact.calls} onLogCall={() => setLoggingCall(true)} />}
              {tab === "tasks" && <TasksTab tasks={contact.tasks} linkedTo={contact.name} onNewTask={() => setNewTask(true)} />}
              {tab === "notes" && (
                <div className="flex flex-col gap-4 p-4">
                  <NoteComposer id={contact.id} firstName={first} me={me.name} onSave={(text) => addContactNote(contact.id, text)} />
                  <Timeline entries={contact.notesTimeline} empty="No notes yet." />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <EditContactSheet contact={contact} open={editing} onClose={() => setEditing(false)} />
      <CreateLeadModal
        contact={contact}
        team={team}
        open={leadDialog !== null}
        initialMode={leadDialog ?? "new"}
        onClose={() => setLeadDialog(null)}
      />
      <LogCallModal
        open={loggingCall}
        onClose={() => setLoggingCall(false)}
        description={lead ? `${contact.name} · ${contact.phone} · Lead ${lead.code}` : `${contact.name} · ${contact.phone}`}
        status={lead?.status ?? null}
        onSave={(values) => logContactCall(contact.id, values)}
      />
      <NewTaskModal
        open={newTask}
        onClose={() => setNewTask(false)}
        team={team}
        description={lead ? `Linked to ${contact.name} (${contact.code}) and lead ${lead.code}` : `Linked to ${contact.name} (${contact.code})`}
        onSave={(values) => createContactTask(contact.id, values)}
      />
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        width={440}
        title={`Delete ${contact.name}?`}
        description={
          contact.leads.length
            ? "Their leads, tasks, notes and timeline are removed too. Logged calls stay in your reports. This can't be undone."
            : "Their tasks, notes and timeline are removed. Logged calls stay in your reports. This can't be undone."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteContact(contact.id);
                  router.push("/contacts");
                })
              }
            >
              Delete contact
            </Button>
          </>
        }
      >
        <p className="text-z-small text-z-fg-secondary">
          {[contact.code, ...contact.leads.map((l) => `Lead ${l.code}`)].join(" · ")}
        </p>
      </Modal>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-z-fg-muted">
      ·
    </span>
  );
}

/** ZEDU/Record link: 56px card with a 32px icon tile, title row, meta line and a chevron. */
function RecordLink({ href, tile, accent, title, meta }: { href: string; tile: ReactNode; accent?: boolean; title: ReactNode; meta: string }) {
  return (
    <Link
      href={href}
      className="z-focus flex min-h-14 items-center gap-3 rounded-z-lg border border-z-line px-3 py-2 transition-colors hover:border-z-line-hover hover:bg-z-subtle"
    >
      <span
        aria-hidden
        className={cx(
          "grid size-8 shrink-0 place-items-center rounded-z-md [&_svg]:size-4",
          accent ? "bg-z-accent-subtle text-z-fg-accent" : "bg-z-sunken text-z-icon",
        )}
      >
        {tile}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2 text-z-small font-medium text-z-fg">{title}</span>
        <span className="truncate text-z-caption text-z-fg-muted">{meta}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-z-icon-subtle" />
    </Link>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function CallsTab({ calls, onLogCall }: { calls: ContactCall[]; onLogCall: () => void }) {
  const router = useRouter();
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const rows = useMemo(() => (order === "desc" ? calls : [...calls].reverse()), [calls, order]);
  return (
    <div className="flex flex-col pb-2">
      <div className="flex items-center gap-3 py-2.5 pl-4 pr-3">
        <p className="min-w-0 flex-1 text-z-small text-z-fg-muted">
          {calls.length} {calls.length === 1 ? "call" : "calls"} · logged manually after each call
        </p>
        <Button variant="secondary" size="sm" icon={<Phone aria-hidden />} onClick={onLogCall}>
          Log call
        </Button>
      </div>
      {calls.length === 0 ? (
        <p className="border-t border-z-line px-4 py-8 text-center text-z-small text-z-fg-muted">No calls logged yet. Use Log call after you speak to them.</p>
      ) : (
        <div className="overflow-x-auto border-t border-z-line">
          <Table className="min-w-[792px] table-fixed">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[260px]" />
              <col className="w-[90px]" />
              <col className="w-[150px]" />
              <col className="w-[90px]" />
              <col className="w-[52px]" />
            </colgroup>
            <thead>
              <tr>
                <TableHead sort={order} onSort={() => setOrder(order === "desc" ? "asc" : "desc")}>
                  Date
                </TableHead>
                <TableHead>Outcome and notes</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="truncate">
                    <time dateTime={c.at}>{c.date}</time>
                  </TableCell>
                  <TableCell>
                    <p className={cx("truncate text-z-small font-medium", c.connected ? "text-z-fg" : "text-z-fg-secondary")}>{c.outcome}</p>
                    <p className="truncate text-z-caption text-z-fg-muted" title={c.notes ?? undefined}>
                      {c.notes ?? "No notes"}
                    </p>
                  </TableCell>
                  <TableCell className="truncate">{c.duration ?? "—"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Avatar size={24} initials={c.caller?.initials ?? "–"} />
                      <span className="truncate text-z-fg">{c.caller?.name ?? "Unknown"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="truncate">
                    {c.lead ? (
                      <Link href={`/leads/${c.lead.id}`} className="z-focus rounded-z-xs font-medium text-z-fg-accent hover:underline">
                        {c.lead.code}
                      </Link>
                    ) : (
                      <span className="text-z-fg-placeholder">—</span>
                    )}
                  </TableCell>
                  <TableCell type="actions" className="!px-2">
                    {c.lead && (
                      <Dropdown
                        align="end"
                        trigger={(p) => (
                          <IconButton label={`Actions for the call on ${c.date}`} {...p}>
                            <Ellipsis aria-hidden />
                          </IconButton>
                        )}
                      >
                        <Menu label="Call actions" className="w-44 text-left">
                          <MenuItem onSelect={() => router.push(`/leads/${c.lead!.id}?tab=calls`)}>Open lead</MenuItem>
                        </Menu>
                      </Dropdown>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
