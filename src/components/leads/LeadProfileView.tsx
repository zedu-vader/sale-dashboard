"use client";

// Lead profile (Figma 16844:22607 · Activity, 16844:22965 · Tasks, 16847:23538 · Edit details).

import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LeadStatus } from "@prisma/client";
import { addNote, assignLeads, createTask, deleteLeads, logCall, setLeadStatus } from "@/app/leads/actions";
import type { LeadProfile, TeamMember } from "@/lib/leadTypes";
import { LEAD_TYPES, LOST_REASONS, STAGES, STATUS_ORDER, initialsOf } from "@/lib/status";
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
  MenuLabel,
  Modal,
  StatusPill,
  cx,
} from "@/components/zedu";
import { HistoryTabs, NextActionCard, NoteComposer, TasksTab, Timeline, card, type HistoryTab } from "@/components/records/ProfileParts";
import { EditLeadSheet, LogCallModal, NewTaskModal } from "./LeadDialogs";

type Tab = HistoryTab;

type Props = { lead: LeadProfile; team: TeamMember[]; me: { name: string }; initialTab: Tab; initialEdit: boolean };

export function LeadProfileView({ lead, team, me, initialTab, initialEdit }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [editing, setEditing] = useState(initialEdit);
  const [loggingCall, setLoggingCall] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));

  const first = lead.name.split(/\s+/)[0];
  const stage = STAGES[lead.status];

  return (
    <div className={cx("transition-opacity duration-150", pending && "opacity-70")}>
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-z-line px-6 pb-5 pt-4 max-sm:px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-z-small">
          <Link href="/leads" className="z-focus rounded-z-xs font-normal text-z-fg-muted hover:text-z-fg">
            Leads
          </Link>
          <ChevronRight aria-hidden className="size-3.5 text-z-icon-subtle" />
          <span aria-current="page" className="font-medium text-z-fg">
            {lead.name}
          </span>
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 basis-72 items-center gap-4">
          <Avatar size={40} initials={initialsOf(lead.name)} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate text-z-page text-z-fg">{lead.name}</h1>
              <span className="shrink-0 rounded-z-xs border border-z-line-strong px-1.5 py-0.5 font-mono text-z-mono text-z-fg-secondary">
                {lead.code}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-z-small">
              <LeadTypeLabel type={LEAD_TYPES[lead.type].kind} />
              {lead.company && (
                <>
                  <span aria-hidden className="text-z-fg-muted">
                    ·
                  </span>
                  <span className="text-z-fg-secondary">{lead.company}</span>
                </>
              )}
              <span aria-hidden className="text-z-fg-muted">
                ·
              </span>
              <span className="text-z-fg-muted">Created {lead.createdShort}</span>
              <span aria-hidden className="text-z-fg-muted">
                ·
              </span>
              <Link href={`/contacts/${lead.contact.id}`} className="z-focus rounded-z-xs text-z-fg-accent hover:underline">
                Contact {lead.contact.code}
              </Link>
            </div>
          </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusMenu
              status={lead.status}
              onChange={(status, reason) => run(() => setLeadStatus([lead.id], status, reason))}
            />
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
              <Menu label="More actions" className="w-48">
                <MenuItem tone="danger" icon={<Trash />} onSelect={() => setConfirmDelete(true)}>
                  Delete lead
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
                <a href={`tel:${lead.phone.replace(/\s+/g, "")}`} className="hover:underline">
                  {lead.phone}
                </a>
              </DetailRow>
              <DetailRow label="Email" icon={lead.email ? <Mail aria-hidden /> : undefined}>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="hover:underline" title={lead.email}>
                    {lead.email}
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Company" icon={lead.company ? <Building2 aria-hidden /> : undefined}>
                {lead.company ?? "—"}
              </DetailRow>
              <DetailRow label="Lead type">{LEAD_TYPES[lead.type].label}</DetailRow>
              <DetailRow label="Owner">{lead.owner?.name ?? "Unassigned"}</DetailRow>
              <DetailRow label="Created">{lead.created}</DetailRow>
              <DetailRow label="Last interaction">{lead.lastInteraction ?? "—"}</DetailRow>
              <DetailRow label="Next action">
                {lead.nextTask ? `${lead.nextTask.title} · ${lead.nextTask.due.text}` : "—"}
              </DetailRow>
              {lead.status === "LOST" && lead.lostReason && <DetailRow label="Reason">{lead.lostReason}</DetailRow>}
            </dl>
          </section>

          <section className={cx(card, "flex flex-col gap-1 p-4")} aria-label="Ownership">
            <p className="text-z-small text-z-fg-muted">Assigned to</p>
            <div className="flex items-center gap-2 pt-1">
              <Avatar initials={lead.owner?.initials ?? "–"} />
              <p className="min-w-0 flex-1 truncate text-z-small font-medium text-z-fg">{lead.owner?.name ?? "Unassigned"}</p>
              <Dropdown
                align="end"
                trigger={(p) => (
                  <Button variant="secondary" size="sm" {...p}>
                    {lead.owner ? "Reassign" : "Assign"}
                  </Button>
                )}
              >
                <Menu label="Assign to" className="w-60">
                  <MenuLabel>Assign to</MenuLabel>
                  {team.map((m) => (
                    <MenuItem
                      key={m.id}
                      icon={<Avatar size={24} initials={m.initials} />}
                      disabled={m.id === lead.owner?.id}
                      onSelect={() => run(() => assignLeads([lead.id], m.id))}
                    >
                      {m.me ? `${m.name} (you)` : m.name}
                    </MenuItem>
                  ))}
                  {lead.owner && (
                    <>
                      <MenuDivider />
                      <MenuItem onSelect={() => run(() => assignLeads([lead.id], null))}>
                        <span className="text-z-fg-secondary">Remove owner</span>
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </Dropdown>
            </div>
          </section>
        </aside>

        <div className="flex min-w-0 flex-1 basis-[480px] flex-col gap-4">
          <NextActionCard task={lead.nextTask} onNewTask={() => setNewTask(true)} emptyText={"Nothing scheduled. Add a task so this lead doesn't go cold."} />

          <section className={cx(card, "min-h-[520px] overflow-hidden")}>
            <HistoryTabs label="Lead history" value={tab} onChange={setTab} counts={lead.counts} />

            <div role="tabpanel">
              {tab === "activity" && (
                <div className="flex flex-col gap-4 p-4">
                  <NoteComposer id={lead.id} firstName={first} me={me.name} onSave={(text) => addNote(lead.id, text)} />
                  <Timeline entries={lead.timeline} empty="Nothing has happened on this lead yet." />
                </div>
              )}
              {tab === "calls" && (
                <div className="p-4">
                  <Timeline entries={lead.calls} empty="No calls logged yet. Use Log call after you speak to them." />
                </div>
              )}
              {tab === "tasks" && <TasksTab tasks={lead.tasks} linkedTo={lead.name} onNewTask={() => setNewTask(true)} />}
              {tab === "notes" && (
                <div className="flex flex-col gap-4 p-4">
                  <NoteComposer id={lead.id} firstName={first} me={me.name} onSave={(text) => addNote(lead.id, text)} />
                  <Timeline entries={lead.notes} empty="No notes yet." />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <EditLeadSheet lead={lead} team={team} open={editing} onClose={() => setEditing(false)} />
      <LogCallModal
        open={loggingCall}
        onClose={() => setLoggingCall(false)}
        description={`${lead.name} · ${lead.phone}`}
        status={lead.status}
        onSave={(values) => logCall(lead.id, values)}
      />
      <NewTaskModal
        open={newTask}
        onClose={() => setNewTask(false)}
        team={team}
        description={`Linked to ${lead.name} (${lead.code})`}
        defaultOwnerId={lead.owner?.id}
        onSave={(values) => createTask(lead.id, values)}
      />
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        width={440}
        title={`Delete ${lead.name}?`}
        description="Notes, tasks and the timeline for this lead are removed. Logged calls stay in your reports. This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await deleteLeads([lead.id]);
                  router.push("/leads");
                })
              }
            >
              Delete lead
            </Button>
          </>
        }
      >
        <p className="text-z-small text-z-fg-secondary">
          {lead.code} · {stage.label}
        </p>
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function StatusMenu({ status, onChange }: { status: LeadStatus; onChange: (s: LeadStatus, reason?: string) => void }) {
  const [askReason, setAskReason] = useState(false);
  const s = STAGES[status];
  return (
    <Dropdown
      align="end"
      trigger={(p) => (
        <button
          type="button"
          aria-label={`Status: ${s.label}. Change status`}
          className="z-focus flex h-8 items-center gap-1.5 rounded-z-md border border-z-line-strong bg-z-surface pl-1.5 pr-2 shadow-z-xs transition-colors hover:border-z-line-hover"
          {...p}
          onClick={() => {
            setAskReason(false);
            p.onClick();
          }}
        >
          <StatusPill stage={s.stage} label={s.label} />
          <ChevronDown aria-hidden className="size-3.5 text-z-icon" />
        </button>
      )}
    >
      {askReason ? (
        <div role="menu" aria-label="Why not interested?" className="flex w-60 flex-col rounded-z-lg border border-z-line bg-z-surface p-1 shadow-z-md">
          <div className="flex items-center gap-1 pr-2">
            <IconButton label="Back to statuses" onClick={() => setAskReason(false)} className="size-6">
              <ChevronLeft aria-hidden />
            </IconButton>
            <MenuLabel>Why not interested?</MenuLabel>
          </div>
          {Object.entries(LOST_REASONS).map(([k, v]) => (
            <MenuItem key={k} onSelect={() => onChange("LOST", k)}>
              {v}
            </MenuItem>
          ))}
        </div>
      ) : (
        <div role="menu" aria-label="Change status" className="flex w-56 flex-col rounded-z-lg border border-z-line bg-z-surface p-1 shadow-z-md">
          <MenuLabel>Lead status</MenuLabel>
          {STATUS_ORDER.map((k) => (
            <div
              key={k}
              onClickCapture={(e) => {
                // "Not interested" needs a reason first, so keep the menu open.
                if (k === "LOST" && k !== status) {
                  e.stopPropagation();
                  setAskReason(true);
                }
              }}
            >
              <MenuItem icon={k === status ? <Check /> : <span className="size-4" />} onSelect={() => k !== status && k !== "LOST" && onChange(k)}>
                <StatusPill stage={STAGES[k].stage} label={STAGES[k].label} />
              </MenuItem>
            </div>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
