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
import { addNote, assignLeads, deleteLeads, setLeadStatus } from "@/app/leads/actions";
import type { LeadProfile, ProfileTask, TeamMember } from "@/lib/leadTypes";
import { LEAD_TYPES, LOST_REASONS, STAGES, STATUS_ORDER, TASK_TYPES, initialsOf } from "@/lib/status";
import {
  Avatar,
  Button,
  Checkbox,
  CountBadge,
  DetailRow,
  Dropdown,
  DueLabel,
  IconButton,
  LeadTypeLabel,
  Menu,
  MenuDivider,
  MenuItem,
  MenuLabel,
  Modal,
  StatusPill,
  TaskStatus,
  TaskTypeTag,
  cx,
} from "@/components/zedu";
import { EditLeadSheet, LogCallModal, NewTaskModal } from "./LeadDialogs";
import { Timeline, useOptimisticDone } from "./Timeline";

type Tab = "activity" | "calls" | "tasks" | "notes";

type Props = { lead: LeadProfile; team: TeamMember[]; me: { name: string }; initialTab: Tab; initialEdit: boolean };

const card = "rounded-z-xl border border-z-line bg-z-surface shadow-z-sm";

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
          <NextActionCard task={lead.nextTask} onNewTask={() => setNewTask(true)} />

          <section className={cx(card, "min-h-[520px] overflow-hidden")}>
            <div role="tablist" aria-label="Lead history" className="flex gap-5 overflow-x-auto border-b border-z-line px-4">
              {(
                [
                  ["activity", "Activity", undefined],
                  ["calls", "Calls", lead.counts.calls],
                  ["tasks", "Tasks", lead.counts.openTasks],
                  ["notes", "Notes", lead.counts.notes],
                ] as const
              ).map(([key, label, count]) => {
                const on = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(key)}
                    className="group z-focus flex shrink-0 flex-col rounded-t-z-xs"
                  >
                    <span
                      className={cx(
                        "flex items-center gap-1.5 whitespace-nowrap px-1 py-2.5 text-z-small",
                        on ? "font-medium text-z-fg-accent" : "font-normal text-z-fg-secondary group-hover:text-z-fg",
                      )}
                    >
                      {label}
                      {count !== undefined && <CountBadge count={count} tone={on ? "accent" : "neutral"} />}
                    </span>
                    <span aria-hidden className={cx("h-0.5 w-full rounded-t-[2px]", on ? "bg-z-accent" : "group-hover:bg-z-line-hover")} />
                  </button>
                );
              })}
            </div>

            <div role="tabpanel">
              {tab === "activity" && (
                <div className="flex flex-col gap-4 p-4">
                  <NoteComposer leadId={lead.id} firstName={first} me={me.name} />
                  <Timeline entries={lead.timeline} empty="Nothing has happened on this lead yet." />
                </div>
              )}
              {tab === "calls" && (
                <div className="p-4">
                  <Timeline entries={lead.calls} empty="No calls logged yet. Use Log call after you speak to them." />
                </div>
              )}
              {tab === "tasks" && <TasksTab lead={lead} onNewTask={() => setNewTask(true)} />}
              {tab === "notes" && (
                <div className="flex flex-col gap-4 p-4">
                  <NoteComposer leadId={lead.id} firstName={first} me={me.name} />
                  <Timeline entries={lead.notes} empty="No notes yet." />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <EditLeadSheet lead={lead} team={team} open={editing} onClose={() => setEditing(false)} />
      <LogCallModal lead={lead} open={loggingCall} onClose={() => setLoggingCall(false)} />
      <NewTaskModal lead={lead} team={team} open={newTask} onClose={() => setNewTask(false)} />
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

/* ---------------------------------------------------------------------------------------------- */

function NextActionCard({ task, onNewTask }: { task: LeadProfile["nextTask"]; onNewTask: () => void }) {
  const [done, toggle] = useOptimisticDone(task);
  return (
    <section aria-label="Next action" className={cx(card, "flex items-center gap-3 py-3 pl-4 pr-3")}>
      {task ? (
        <>
          <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => toggle(e.target.checked)} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className={cx("truncate text-z-small font-medium", done ? "text-z-fg-muted line-through" : "text-z-fg")}>{task.title}</p>
          </div>
          <DueLabel due={done ? "done" : task.due.due}>{done ? "Done" : task.due.text}</DueLabel>
          <Button variant="secondary" size="sm" icon={<Check aria-hidden />} disabled={done} onClick={() => toggle(true)}>
            Mark complete
          </Button>
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className="text-z-small text-z-fg-secondary">Nothing scheduled. Add a task so this lead doesn&apos;t go cold.</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
            New task
          </Button>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function NoteComposer({ leadId, firstName, me }: { leadId: string; firstName: string; me: string }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const save = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      await addNote(leadId, text);
      setText("");
    });
  };
  return (
    <form
      className="flex items-center gap-2.5 rounded-z-md border border-z-line-strong bg-z-surface py-2 pl-3 pr-2 shadow-z-xs focus-within:border-z-line-focus focus-within:shadow-z-focus-input"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Avatar size={24} initials={initialsOf(me)} />
      <label htmlFor={`note-${leadId}`} className="sr-only">
        Add a note
      </label>
      <input
        id={`note-${leadId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Add a note about ${firstName}…`}
        className="min-w-0 flex-1 bg-transparent text-z-small text-z-fg outline-none placeholder:text-z-fg-placeholder focus-visible:outline-none"
      />
      <Button type="submit" variant="secondary" size="sm" disabled={pending || !text.trim()}>
        Add note
      </Button>
    </form>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function TasksTab({ lead, onNewTask }: { lead: LeadProfile; onNewTask: () => void }) {
  const open = lead.tasks.filter((t) => !t.done).length;
  const completed = lead.tasks.length - open;
  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center gap-3 py-2.5 pl-4 pr-3">
        <p className="min-w-0 flex-1 text-z-small text-z-fg-muted">
          {open} open · {completed} completed · linked to {lead.name}
        </p>
        <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
          New task
        </Button>
      </div>
      {lead.tasks.length === 0 ? (
        <p className="px-4 py-8 text-center text-z-small text-z-fg-muted">No tasks yet.</p>
      ) : (
        <ul className="border-t border-z-line">
          {lead.tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: ProfileTask }) {
  const [done, toggle] = useOptimisticDone(task);
  return (
    <li className="flex min-h-[60px] flex-wrap items-center gap-3 border-b border-z-line py-2 pl-3 pr-2 hover:bg-z-subtle">
      <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => toggle(e.target.checked)} />
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <p className={cx("truncate text-z-small font-medium", done ? "text-z-fg-muted" : "text-z-fg")}>{task.title}</p>
        <div className="flex items-center gap-2">
          <TaskTypeTag type={TASK_TYPES[task.type].kind} />
          {task.fromCall && (
            <span className="flex items-center gap-1 whitespace-nowrap text-z-caption text-z-fg-muted">
              <Phone aria-hidden className="size-3" />
              {task.fromCall}
            </span>
          )}
        </div>
      </div>
      <div className="w-[180px] max-md:w-auto">
        <DueLabel due={done ? "done" : task.due.due}>{done && !task.done ? "Done · just now" : task.due.text}</DueLabel>
      </div>
      <div className="flex w-40 items-center gap-2 max-md:hidden">
        <Avatar size={24} initials={task.owner?.initials ?? "–"} />
        <span className="truncate text-z-small text-z-fg-secondary">{task.owner?.name ?? "Unassigned"}</span>
      </div>
      <div className="w-24">
        <TaskStatus status={done ? "completed" : "pending"} />
      </div>
      <Dropdown
        align="end"
        trigger={(p) => (
          <IconButton label={`Actions for ${task.title}`} {...p}>
            <Ellipsis aria-hidden />
          </IconButton>
        )}
      >
        <Menu label={`Actions for ${task.title}`} className="w-48">
          <MenuItem icon={<Check />} onSelect={() => toggle(!done)}>
            {done ? "Mark as pending" : "Mark complete"}
          </MenuItem>
        </Menu>
      </Dropdown>
    </li>
  );
}
