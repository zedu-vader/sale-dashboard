"use client";

// Contact profile (Figma "Zedu - Sales" · Contact profile): header with CT-#### code, details and
// linked records on the left, next action + Activity/Calls/Tasks/Notes tabs on the right.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash,
  Unlink,
} from "lucide-react";
import { toggleTask } from "@/app/actions";
import { addNote } from "@/app/leads/actions";
import type { TeamMember } from "@/lib/leadTypes";
import { LEAD_TYPES } from "@/lib/status";
import {
  Avatar,
  Button,
  Checkbox,
  DetailRow,
  Dropdown,
  DueLabel,
  LeadTypeLabel,
  Menu,
  MenuItem,
  Modal,
  StatusPill,
  Tabs,
  TaskStatus,
  TaskTypeTag,
  cx,
} from "@/components/zedu";
import { LogCallModal, NewTaskModal } from "@/components/leads/LeadDialogs";
import { Timeline } from "@/components/leads/Timeline";
import { convertContact, deleteContact, fetchContact, toggleStoreTask, updateContact } from "./api";
import { ContactDialog } from "./ContactDialog";
import {
  TYPE_LABEL,
  createdLabel,
  initials,
  stageLabel,
  type ContactDetail,
  type ContactTask,
  type NewContact,
} from "./data";

type Tab = "activity" | "calls" | "tasks" | "notes";

interface Props {
  contact: ContactDetail;
  /** Leads without a contact, for the "link existing lead" picker. */
  linkableLeads: { id: string; name: string; status: string }[];
  team: TeamMember[];
}

const card = "rounded-z-xl border border-z-line bg-z-surface shadow-z-sm";

export function ContactDetail({ contact: initial, linkableLeads, team }: Props) {
  const router = useRouter();
  const [contact, setContact] = useState(initial);
  const [tab, setTab] = useState<Tab>("activity");
  const [editing, setEditing] = useState(false);
  const [loggingCall, setLoggingCall] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkLeadId, setLinkLeadId] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = async () => {
    const fresh = await fetchContact(contact.id).catch(() => null);
    if (fresh) setContact(fresh);
  };

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError("");
    try {
      await action();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const toggleTaskAction = async (task: ContactTask, value: boolean) => {
    if (task.source === "lead") await toggleTask(task.id, value);
    else await toggleStoreTask(task.id, value);
    await refresh();
  };

  const remove = () =>
    startTransition(async () => {
      try {
        await deleteContact(contact.id);
        router.push("/contacts");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not delete the contact");
      }
    });

  const inPipeline = !!contact.lead;
  const meName = team.find((m) => m.me)?.name ?? "You";
  const first = contact.name.split(/\s+/)[0];
  // The leads' dialogs only need a slice of the lead; build it from the linked record.
  const callLead = contact.lead
    ? { id: contact.lead.id, name: contact.lead.name, phone: contact.phone, status: contact.lead.status as LeadStatus }
    : null;
  const taskLead = contact.lead ? { id: contact.lead.id, code: contact.lead.code, name: contact.lead.name, owner: null } : null;

  return (
    <div className={cx("zedu transition-opacity duration-150", pending && "opacity-70")}>
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
            <Avatar size={40} initials={initials(contact.name)} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-z-page text-z-fg">{contact.name}</h1>
                <span className="shrink-0 rounded-z-xs border border-z-line-strong px-1.5 py-0.5 font-mono text-z-mono text-z-fg-secondary">
                  {contact.code}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-z-small">
                {contact.type && <LeadTypeLabel type={LEAD_TYPES[contact.type].kind} />}
                {contact.company && (
                  <>
                    <span aria-hidden className="text-z-fg-muted">
                      ·
                    </span>
                    <span className="text-z-fg-secondary">{contact.company}</span>
                  </>
                )}
                <span aria-hidden className="text-z-fg-muted">
                  ·
                </span>
                <span className="text-z-fg-muted">Created {createdLabel(contact.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contact.lead ? (
              <>
                <Button variant="secondary" size="sm" icon={<Phone aria-hidden />} onClick={() => setLoggingCall(true)}>
                  Log call
                </Button>
                <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={() => setNewTask(true)}>
                  New task
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => run(() => convertContact(contact.id))}
              >
                Convert to lead
              </Button>
            )}
            <Dropdown
              align="end"
              trigger={(p) => (
                <Button variant="secondary" size="sm" icon={<Pencil aria-hidden />} {...p}>
                  Edit
                  <ChevronDown aria-hidden className="size-3.5 text-z-icon" />
                </Button>
              )}
            >
              <Menu label="Contact actions" className="w-48">
                <MenuItem icon={<Pencil />} onSelect={() => setEditing(true)}>
                  Edit details
                </MenuItem>
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
          {/* Details */}
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
                  <span className="font-mono text-z-mono">{contact.phone}</span>
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
              <DetailRow label="Contact type">{contact.type ? TYPE_LABEL[contact.type] : "—"}</DetailRow>
              <DetailRow label="Created">{createdLabel(contact.createdAt)}</DetailRow>
              <DetailRow label="Last interaction">{contact.lastInteraction ?? "—"}</DetailRow>
            </dl>
            {contact.notes && (
              <div className="flex flex-col gap-1 border-t border-z-line pt-2">
                <p className="z-overline text-z-fg-muted">Notes</p>
                <p className="m-0 whitespace-pre-wrap text-z-small text-z-fg-secondary">{contact.notes}</p>
              </div>
            )}
          </section>

          {/* Linked records */}
          <section className={cx(card, "flex flex-col gap-3 p-4")} aria-labelledby="linked-title">
            <h2 id="linked-title" className="text-z-card text-z-fg">
              Linked records
            </h2>
            {contact.lead ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="z-overline flex-1 text-z-fg-muted">Lead</span>
                  <span className="shrink-0 rounded-z-xs border border-z-line-strong px-1.5 py-0.5 font-mono text-z-mono text-z-fg-secondary">
                    {contact.lead.code}
                  </span>
                  <StatusPill stage={stageLabel(contact.lead.status)} />
                </div>
                <Link
                  href={`/leads/${contact.lead.id}`}
                  className="z-focus truncate text-z-small font-medium text-z-fg hover:underline"
                >
                  {contact.lead.name}
                </Link>
                <p className="m-0 text-z-caption text-z-fg-muted">
                  Owner: {contact.lead.owner || "Unassigned"}
                  {contact.lead.nextAction ? ` · Next: ${contact.lead.nextAction}` : ""}
                </p>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Unlink aria-hidden />}
                    disabled={busy}
                    onClick={() => run(() => updateContact(contact.id, contactForm(contact), { leadId: null }))}
                  >
                    Unlink lead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="m-0 text-z-small text-z-fg-secondary">
                  Not in the pipeline yet. Create a lead to start logging calls, notes and tasks.
                </p>
                <div>
                  <Button size="sm" disabled={busy} onClick={() => run(() => convertContact(contact.id))}>
                    Convert to lead
                  </Button>
                </div>
                {linkableLeads.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-z-caption font-medium text-z-fg-secondary">Or link an existing lead</span>
                    <div className="flex gap-2">
                      <select
                        aria-label="Link an existing lead"
                        value={linkLeadId}
                        onChange={(e) => setLinkLeadId(e.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-z-md border border-z-line-strong bg-z-surface px-2 text-z-small text-z-fg shadow-z-xs hover:border-z-line-hover focus:border-z-line-focus focus:shadow-z-focus-input focus:outline-none"
                      >
                        <option value="">Choose a lead…</option>
                        {linkableLeads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        disabled={!linkLeadId || busy}
                        onClick={() => run(() => updateContact(contact.id, contactForm(contact), { leadId: linkLeadId }))}
                      >
                        Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {contact.sameCompany.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-z-line pt-3">
                <p className="z-overline text-z-fg-muted">
                  {contact.company} — {contact.sameCompany.length + 1} contacts
                </p>
                <ul className="m-0 flex list-none flex-col p-0">
                  {contact.sameCompany.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/contacts/${c.id}`}
                        className="z-focus -mx-1 flex items-center gap-2 rounded-z-xs px-1 py-1 hover:bg-z-subtle"
                      >
                        <Avatar size={24} initials={c.initials} />
                        <span className="truncate text-z-small font-medium text-z-fg">{c.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </aside>

        {/* Right column */}
        <div className="flex min-w-0 flex-1 basis-[480px] flex-col gap-4">
          <NextActionCard
            task={contact.nextTask}
            inPipeline={inPipeline}
            onToggle={toggleTaskAction}
            onNewTask={() => setNewTask(true)}
            onConvert={() => run(() => convertContact(contact.id))}
          />

          <section className={cx(card, "min-h-[520px] overflow-hidden")}>
            <Tabs
              label="Contact history"
              value={tab}
              onChange={setTab}
              className="px-4"
              options={[
                { value: "activity", label: "Activity" },
                { value: "calls", label: "Calls", count: contact.counts.calls },
                { value: "tasks", label: "Tasks", count: contact.counts.tasks },
                { value: "notes", label: "Notes", count: contact.counts.notes },
              ]}
            />
            <div role="tabpanel">
              {tab === "activity" && (
                <div className="flex flex-col gap-4 p-4">
                  {contact.lead && (
                    <NoteComposer leadId={contact.lead.id} firstName={first} me={meName} onAdded={refresh} />
                  )}
                  <Timeline entries={contact.timeline} empty="Nothing has happened on this contact yet." />
                  {!contact.lead && (
                    <p className="m-0 rounded-z-md bg-z-subtle px-3 py-2 text-z-caption text-z-fg-muted">
                      Convert this contact to a lead to start tracking calls, notes and tasks.
                    </p>
                  )}
                </div>
              )}
              {tab === "calls" && (
                <div className="p-4">
                  <Timeline
                    entries={contact.calls}
                    empty={inPipeline ? "No calls logged yet. Use Log call after you speak to them." : "No calls yet. Calls appear here once this contact is linked to a lead."}
                  />
                </div>
              )}
              {tab === "tasks" && (
                <TasksTab contact={contact} inPipeline={inPipeline} onToggle={toggleTaskAction} onNewTask={() => setNewTask(true)} />
              )}
              {tab === "notes" && (
                <div className="flex flex-col gap-4 p-4">
                  {contact.lead ? (
                    <>
                      <NoteComposer leadId={contact.lead.id} firstName={first} me={meName} onAdded={refresh} />
                      <Timeline entries={contact.notesTimeline} empty="No notes yet." />
                    </>
                  ) : (
                    <p className="m-0 py-8 text-center text-z-small text-z-fg-muted">
                      Notes appear once this contact is linked to a lead.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {editing && (
        <ContactDialog open={editing} onClose={() => setEditing(false)} contact={contact} onSaved={() => refresh()} />
      )}
      {callLead && (
        <LogCallModal
          lead={callLead}
          open={loggingCall}
          onClose={() => {
            setLoggingCall(false);
            refresh();
          }}
        />
      )}
      {taskLead && (
        <NewTaskModal
          lead={taskLead}
          team={team}
          open={newTask}
          onClose={() => {
            setNewTask(false);
            refresh();
          }}
        />
      )}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        width={440}
        title={`Delete ${contact.name}?`}
        description="The contact record is removed. Linked leads, calls and tasks stay in the pipeline. This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                remove();
              }}
            >
              Delete contact
            </Button>
          </>
        }
      >
        <p className="text-z-small text-z-fg-secondary">
          {contact.code}
          {contact.lead ? ` · Linked to ${contact.lead.code}` : ""}
        </p>
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function NextActionCard({
  task,
  inPipeline,
  onToggle,
  onNewTask,
  onConvert,
}: {
  task: ContactTask | null;
  inPipeline: boolean;
  onToggle: (task: ContactTask, value: boolean) => Promise<void>;
  onNewTask: () => void;
  onConvert: () => void;
}) {
  const [done, setDone] = useState(task?.done ?? false);
  const [, startTransition] = useTransition();
  useEffect(() => setDone(task?.done ?? false), [task?.id, task?.done]);
  const mark = (value: boolean) => {
    if (!task) return;
    setDone(value);
    startTransition(async () => {
      try {
        await onToggle(task, value);
      } catch {
        setDone(!value);
      }
    });
  };
  return (
    <section aria-label="Next action" className={cx(card, "flex items-center gap-3 py-3 pl-4 pr-3")}>
      {task ? (
        <>
          <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => mark(e.target.checked)} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className={cx("truncate text-z-small font-medium", done ? "text-z-fg-muted line-through" : "text-z-fg")}>{task.title}</p>
          </div>
          <DueLabel due={done ? "done" : task.due.due}>{done ? "Done" : task.due.text}</DueLabel>
          <Button variant="secondary" size="sm" icon={<Check aria-hidden />} disabled={done} onClick={() => mark(true)}>
            Mark complete
          </Button>
        </>
      ) : inPipeline ? (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className="text-z-small text-z-fg-secondary">Nothing scheduled. Add a task so this contact doesn&apos;t go cold.</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
            New task
          </Button>
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="z-overline text-z-fg-muted">Next action</p>
            <p className="text-z-small text-z-fg-secondary">Not in the pipeline yet — create a lead to schedule follow-ups.</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onConvert}>
            Convert to lead
          </Button>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function NoteComposer({ leadId, firstName, me, onAdded }: { leadId: string; firstName: string; me: string; onAdded: () => void }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const save = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      await addNote(leadId, text);
      setText("");
      onAdded();
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
      <Avatar size={24} initials={initials(me)} />
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

function TasksTab({
  contact,
  inPipeline,
  onToggle,
  onNewTask,
}: {
  contact: ContactDetail;
  inPipeline: boolean;
  onToggle: (task: ContactTask, value: boolean) => Promise<void>;
  onNewTask: () => void;
}) {
  const open = contact.tasks.filter((t) => !t.done).length;
  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center gap-3 py-2.5 pl-4 pr-3">
        <p className="min-w-0 flex-1 text-z-small text-z-fg-muted">
          {open} open · {contact.tasks.length - open} completed
        </p>
        {inPipeline && (
          <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} onClick={onNewTask}>
            New task
          </Button>
        )}
      </div>
      {contact.tasks.length === 0 ? (
        <p className="px-4 py-8 text-center text-z-small text-z-fg-muted">No tasks yet.</p>
      ) : (
        <ul className="border-t border-z-line">
          {contact.tasks.map((t) => (
            <ContactTaskRow key={t.id} task={t} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactTaskRow({ task, onToggle }: { task: ContactTask; onToggle: (task: ContactTask, value: boolean) => Promise<void> }) {
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();
  useEffect(() => setDone(task.done), [task.id, task.done]);
  const toggle = (value: boolean) => {
    setDone(value);
    startTransition(async () => {
      try {
        await onToggle(task, value);
      } catch {
        setDone(!value);
      }
    });
  };
  return (
    <li className="flex min-h-[60px] flex-wrap items-center gap-3 border-b border-z-line py-2 pl-3 pr-2 last:border-b-0 hover:bg-z-subtle">
      <Checkbox label={`Mark "${task.title}" complete`} hideLabel checked={done} onChange={(e) => toggle(e.target.checked)} />
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <p className={cx("truncate text-z-small font-medium", done ? "text-z-fg-muted line-through" : "text-z-fg")}>{task.title}</p>
        {task.kind && <TaskTypeTag type={task.kind} />}
      </div>
      <div className="w-[180px] max-md:w-auto">
        <DueLabel due={done ? "done" : task.due.due}>{done ? "Done" : task.due.text}</DueLabel>
      </div>
      <div className="flex w-40 items-center gap-2 max-md:hidden">
        <Avatar size={24} initials={task.owner?.initials ?? "–"} />
        <span className="truncate text-z-small text-z-fg-secondary">{task.owner?.name ?? "Unassigned"}</span>
      </div>
      <div className="w-24">
        <TaskStatus status={done ? "completed" : "pending"} />
      </div>
    </li>
  );
}

function contactForm(c: ContactDetail): NewContact {
  return { name: c.name, phone: c.phone, email: c.email, company: c.company, type: c.type, notes: c.notes };
}
