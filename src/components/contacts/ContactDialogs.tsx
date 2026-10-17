"use client";

// Edit details panel for a contact (Figma 16857:26248) and Create a lead for an existing contact (16857:25760).

import { Link2, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { checkContactPhone, createLeadForContact, linkLeadToContact, searchLinkableLeads, updateContact } from "@/app/contacts/actions";
import type { ContactFormValues, ContactProfile, DuplicateMatch, LinkableLead } from "@/lib/contactTypes";
import { validateLead, type LeadFormErrors } from "@/lib/leadForm";
import type { TeamMember } from "@/lib/leadTypes";
import { LEAD_TYPES, STAGES, STATUS_ORDER, initialsOf } from "@/lib/status";
import {
  Alert,
  Avatar,
  Button,
  DateField,
  Input,
  LeadTypeLabel,
  Modal,
  SegmentedControl,
  Select,
  Sheet,
  StatusPill,
  Textarea,
  cx,
} from "@/components/zedu";
import { OwnerSelect } from "@/components/leads/LeadFormFields";
import { ContactFormFields, DuplicateContactAlert } from "./ContactFormFields";

const toValues = (c: ContactProfile): ContactFormValues => ({
  name: c.name,
  phone: c.phone,
  email: c.email ?? "",
  company: c.company ?? "",
  type: c.type,
  notes: c.notes ?? "",
});

function leadsHint(codes: string[]) {
  if (!codes.length) return "Changes show everywhere this contact appears.";
  if (codes.length === 1) return `Also updates lead ${codes[0]}, which uses these details.`;
  return `Also updates leads ${codes.join(", ")}, which use these details.`;
}

export function EditContactSheet({ contact, open, onClose }: { contact: ContactProfile; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState(() => toValues(contact));
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setValues(toValues(contact));
    setErrors({});
    setDuplicate(null);
    setFailed(false);
  }, [open, contact]);

  const hasErrors = Object.keys(errors).length > 0;
  useEffect(() => {
    if (hasErrors) setErrors(validateLead(values, "contact"));
  }, [values, hasErrors]);

  const save = () => {
    const found = validateLead(values, "contact");
    setErrors(found);
    if (Object.keys(found).length) return;
    startTransition(async () => {
      try {
        const res = await updateContact(contact.id, values);
        if (res.ok) onClose();
        else setErrors(res.errors);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow={`Contact · ${contact.code}`}
      title="Edit details"
      footer={
        <>
          <p className="min-w-0 flex-1 text-z-caption text-z-fg-muted">{leadsHint(contact.leads.map((l) => l.code))}</p>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending} aria-busy={pending}>
            Save
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {failed && (
          <Alert tone="danger" title="Couldn't save your changes">
            Check your connection and try again.
          </Alert>
        )}
        <ContactFormFields
          layout="panel"
          values={values}
          errors={errors}
          onChange={(patch) => {
            setValues((prev) => ({ ...prev, ...patch }));
            if ("phone" in patch) setDuplicate(null);
          }}
          onPhoneBlur={(phone) => {
            if (phone.trim() && phone.trim() !== contact.phone)
              startTransition(async () => setDuplicate(await checkContactPhone(phone, contact.id).catch(() => null)));
          }}
          afterPhone={
            duplicate && (
              <DuplicateContactAlert
                phone={values.phone}
                match={duplicate}
                onOpen={() => {
                  onClose();
                  router.push(`/contacts/${duplicate.id}`);
                }}
              />
            )
          }
        />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/* ---------------------------------------------------------------------------------------------- */

type Mode = "new" | "link";

export function CreateLeadModal({
  contact,
  team,
  open,
  initialMode = "new",
  onClose,
}: {
  contact: ContactProfile;
  team: TeamMember[];
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
}) {
  const router = useRouter();
  const me = team.find((m) => m.me)?.id ?? "";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState({ status: "NEW", ownerId: me, followUp: "", notes: "" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LinkableLead[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setValues({ status: "NEW", ownerId: me, followUp: "", notes: "" });
    setQuery("");
    setResults(null);
    setPicked(null);
    setError(null);
  }, [open, initialMode, me]);

  // Debounced lead search for "Link existing lead".
  useEffect(() => {
    if (!open || mode !== "link") return;
    let live = true;
    const t = setTimeout(() => {
      searchLinkableLeads(contact.id, query)
        .then((r) => live && setResults(r))
        .catch(() => live && setResults([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [open, mode, query, contact.id]);

  const save = () =>
    startTransition(async () => {
      setError(null);
      try {
        if (mode === "new") {
          const res = await createLeadForContact(contact.id, values);
          if (!res.ok) return setError(res.error);
          onClose();
          router.push(`/leads/${res.id}`);
        } else {
          if (!picked) return setError("Pick the lead to link.");
          const res = await linkLeadToContact(contact.id, picked);
          if (!res.ok) return setError(res.error);
          onClose();
        }
      } catch {
        setError("Couldn't save. Check your connection and try again.");
      }
    });

  const line = [contact.phone, contact.email, contact.company].filter(Boolean).join(" · ");

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      title={`Create a lead for ${contact.name}`}
      description="Track a sales opportunity for an existing contact."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending || (mode === "link" && !picked)} aria-busy={pending}>
            {mode === "new" ? "Create lead" : "Link lead"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          stretch
          label="Lead"
          value={mode}
          onChange={setMode}
          options={[
            { value: "new", label: "Create new lead" },
            { value: "link", label: "Link existing lead" },
          ]}
        />

        <div className="overflow-hidden rounded-z-lg border border-z-line">
          <div className="flex items-center gap-3 p-3">
            <Avatar size={40} initials={initialsOf(contact.name)} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="flex items-center gap-2">
                <span className="truncate text-z-small font-medium text-z-fg">{contact.name}</span>
                <span className="shrink-0 font-mono text-z-mono text-z-fg-muted">{contact.code}</span>
              </p>
              <p className="truncate text-z-caption text-z-fg-muted">{line}</p>
            </div>
            <LeadTypeLabel type={LEAD_TYPES[contact.type].kind} />
          </div>
          <p className="flex items-start gap-2 bg-z-accent-subtle px-3 py-2 text-z-caption text-z-fg-accent">
            <Link2 aria-hidden className="mt-0.5 size-3 shrink-0" />
            {mode === "new"
              ? "The lead uses this contact's name, phone, email and company. Nothing is copied — edit them once on the contact and the lead updates too."
              : "The lead moves to this contact, with its calls, tasks and notes. It then shows this contact's name, phone, email and company."}
          </p>
        </div>

        {error && <Alert tone="danger" title={error} />}

        {mode === "new" ? (
          <>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Select label="Lead status" value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGES[s].label}
                  </option>
                ))}
              </Select>
              <OwnerSelect team={team} value={values.ownerId} onChange={(ownerId) => setValues({ ...values, ownerId })} />
            </div>
            <DateField
              label="Next follow-up (optional)"
              value={values.followUp}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setValues({ ...values, followUp: e.target.value })}
            />
            <Textarea
              label="Lead notes (optional)"
              placeholder="What are they interested in? Budget, timing, who decides."
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Input
              label="Find a lead"
              icon={<SearchIcon aria-hidden />}
              placeholder="LD-1042, name or company"
              value={query}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
            <div role="radiogroup" aria-label="Leads" className="flex max-h-60 flex-col overflow-y-auto rounded-z-lg border border-z-line">
              {results === null ? (
                <p className="px-3 py-6 text-center text-z-small text-z-fg-muted">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-z-small text-z-fg-muted">No other leads match.</p>
              ) : (
                results.map((l) => {
                  const on = picked === l.id;
                  return (
                    <label
                      key={l.id}
                      className={cx(
                        "flex min-h-11 cursor-pointer items-center gap-3 border-b border-z-line px-3 py-2 last:border-b-0",
                        on ? "bg-z-selected" : "hover:bg-z-subtle",
                      )}
                    >
                      <input type="radio" name="link-lead" checked={on} onChange={() => setPicked(l.id)} className="z-focus size-4 accent-z-accent" />
                      <span className="w-16 shrink-0 font-mono text-z-mono text-z-fg-secondary">{l.code}</span>
                      <span className={cx("min-w-0 flex-1 truncate text-z-small", on ? "font-medium text-z-fg" : "text-z-fg")}>{l.name}</span>
                      <StatusPill stage={STAGES[l.status].stage} label={STAGES[l.status].label} />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
