"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, PhoneCall, SquareCheck, Trash2, Unlink } from "lucide-react";
import { Avatar, Button, Card, StatusPill } from "@/components/zedu";
import { convertContact, deleteContact, fetchContact, updateContact } from "./api";
import { ContactDialog } from "./ContactDialog";
import {
  OUTCOME_LABEL,
  TYPE_LABEL,
  createdLabel,
  initials,
  stageLabel,
  type ContactDetail,
} from "./data";

interface Props {
  contact: ContactDetail;
  /** Leads without a contact, for the "link existing lead" picker. */
  linkableLeads: { id: string; name: string; status: string }[];
}

const detailRow = "flex items-baseline justify-between gap-4 border-b border-z-line py-2.5 last:border-b-0";
const detailKey = "shrink-0 text-z-caption text-z-fg-muted";

export function ContactDetail({ contact: initial, linkableLeads }: Props) {
  const router = useRouter();
  const [contact, setContact] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkLeadId, setLinkLeadId] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function refresh() {
    const fresh = await fetchContact(contact.id);
    if (fresh) setContact(fresh);
  }

  async function run(action: () => Promise<unknown>, onError?: (e: Error) => void) {
    setBusy(true);
    setActionError("");
    try {
      await action();
      await refresh();
    } catch (err) {
      if (onError) onError(err as Error);
      else setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteContact(contact.id);
      router.push("/contacts");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the contact");
      setBusy(false);
    }
  }

  const leadStatusLabel = contact.lead ? stageLabel(contact.lead.status) : null;

  return (
    <div className="zedu flex flex-col gap-4 p-6 pt-4 max-sm:p-4 max-sm:pt-3">
      <div className="flex items-center gap-2">
        <Link href="/contacts" className="z-focus inline-flex items-center gap-1 rounded-z-xs text-z-small text-z-fg-secondary hover:text-z-fg">
          <ArrowLeft aria-hidden className="size-4" />
          Contacts
        </Link>
        <ChevronRight aria-hidden className="size-3.5 text-z-fg-placeholder" />
        <span className="truncate text-z-small text-z-fg-muted">{contact.name}</span>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <Avatar size={40} initials={initials(contact.name)} />
        <div className="min-w-0 flex-1 basis-60">
          <h1 className="flex flex-wrap items-center gap-2 text-z-page">
            <span className="text-z-fg">{contact.name}</span>
            {contact.type && (
              <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full bg-z-sunken px-2 text-z-caption font-medium text-z-fg-secondary">
                {TYPE_LABEL[contact.type]}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-z-small text-z-fg-muted">
            {contact.company ?? "No company"}
            {contact.company && " · "}
            Added {createdLabel(contact.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
          {confirmDelete ? (
            <Button variant="danger" disabled={busy} onClick={remove}>
              Confirm delete
            </Button>
          ) : (
            <Button variant="secondary" icon={<Trash2 aria-hidden />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p role="alert" className="m-0 text-z-small font-medium text-z-fg-danger">
          {actionError}
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Card title="Details">
            <dl className="m-0">
              <div className={detailRow}>
                <dt className={detailKey}>Phone number</dt>
                <dd className="m-0 truncate font-mono text-z-mono font-medium text-z-fg">
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-z-fg-accent">
                    {contact.phone}
                  </a>
                </dd>
              </div>
              <div className={detailRow}>
                <dt className={detailKey}>Email address</dt>
                <dd className="m-0 truncate text-z-small font-medium text-z-fg">
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="hover:text-z-fg-accent">
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-z-fg-placeholder">Not provided</span>
                  )}
                </dd>
              </div>
              <div className={detailRow}>
                <dt className={detailKey}>Company / organisation</dt>
                <dd className="m-0 truncate text-z-small font-medium text-z-fg">
                  {contact.company ?? <span className="text-z-fg-placeholder">Not provided</span>}
                </dd>
              </div>
              <div className={detailRow}>
                <dt className={detailKey}>Date created</dt>
                <dd className="m-0 text-z-small font-medium text-z-fg">{createdLabel(contact.createdAt)}</dd>
              </div>
              {contact.notes && (
                <div className="flex flex-col gap-1.5 border-t border-z-line py-2.5">
                  <dt className={detailKey}>Notes</dt>
                  <dd className="m-0 whitespace-pre-wrap text-z-small text-z-fg-secondary">{contact.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Call history" icon={<PhoneCall aria-hidden />}>
            {contact.calls.length === 0 ? (
              <p className="m-0 text-z-small text-z-fg-muted">
                No calls yet. Calls to this contact appear here once they&apos;re in the pipeline.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-0 p-0">
                {contact.calls.map((call) => (
                  <li key={call.id} className="flex items-center justify-between gap-4 border-b border-z-line py-2.5 last:border-b-0">
                    <span className="text-z-small font-medium text-z-fg">{OUTCOME_LABEL[call.outcome] ?? call.outcome}</span>
                    <span className="text-z-caption text-z-fg-muted">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(call.calledAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Pipeline">
            {contact.lead ? (
              <div className="flex flex-col gap-2">
                <p className="m-0 text-z-small text-z-fg-muted">In the pipeline as a lead.</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-z-small font-medium text-z-fg">{contact.lead.name}</span>
                  {leadStatusLabel && <StatusPill stage={leadStatusLabel} />}
                </div>
                <p className="m-0 text-z-caption text-z-fg-muted">Owner: {contact.lead.owner}</p>
                {contact.lead.nextAction && (
                  <p className="m-0 text-z-caption text-z-fg-muted">Next action: {contact.lead.nextAction}</p>
                )}
                <div className="mt-1">
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
              <div className="flex flex-col gap-3">
                <p className="m-0 text-z-small text-z-fg-muted">
                  Not contacted yet. Move this contact into the pipeline when you start outreach.
                </p>
                <div>
                  <Button disabled={busy} onClick={() => run(() => convertContact(contact.id))}>
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
          </Card>

          <Card title="Tasks" icon={<SquareCheck aria-hidden />}>
            {contact.tasks.length === 0 ? (
              <p className="m-0 text-z-small text-z-fg-muted">No tasks mention this contact.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-0 p-0">
                {contact.tasks.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 border-b border-z-line py-2.5 last:border-b-0">
                    <span className="min-w-0">
                      <span className={`block truncate text-z-small font-medium ${t.done ? "text-z-fg-muted line-through" : "text-z-fg"}`}>
                        {t.title}
                      </span>
                      {t.subtitle && <span className="block truncate text-z-caption text-z-fg-muted">{t.subtitle}</span>}
                    </span>
                    <span className="shrink-0 text-z-caption text-z-fg-muted">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(t.dueAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ContactDialog
        open={editing}
        onClose={() => setEditing(false)}
        contact={contact}
        onSaved={() => refresh()}
      />
    </div>
  );
}

function contactForm(c: ContactDetail) {
  return { name: c.name, phone: c.phone, email: c.email, company: c.company, type: c.type, notes: c.notes };
}
