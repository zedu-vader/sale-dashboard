"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, X } from "lucide-react";
import { Button, FieldLabel, Input, SegmentedControl } from "@/components/zedu";
import { DuplicateError, addContact, updateContact } from "./api";
import { TYPE_LABEL, type Contact, type ContactType, type NewContact } from "./data";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing contact to edit; omitted for "add". */
  contact?: Contact;
  onSaved: (contact: Contact) => void;
}

const EMPTY: NewContact = { name: "", phone: "", email: null, company: null, type: "INDIVIDUAL", notes: null };

export function ContactDialog({ open, onClose, contact, onSaved }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<NewContact>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dupHits, setDupHits] = useState<{ id: string; name: string; phone: string }[]>([]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setForm(contact ? { name: contact.name, phone: contact.phone, email: contact.email, company: contact.company, type: contact.type, notes: contact.notes } : EMPTY);
      setError("");
      setDupHits([]);
      dialog.showModal();
      dialog.querySelector("input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, contact]);

  const set = (patch: Partial<NewContact>) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e: FormEvent, confirmDuplicates = false) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Enter a name.");
    if (!form.phone.trim()) return setError("Enter a phone number.");
    setSaving(true);
    setError("");
    if (!confirmDuplicates) setDupHits([]);
    try {
      const saved = contact
        ? await updateContact(contact.id, form, { confirmDuplicates })
        : await addContact(form, confirmDuplicates);
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof DuplicateError) setDupHits(err.duplicates);
      else setError(err instanceof Error ? err.message : "Could not save the contact.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-32px)] max-w-lg rounded-z-xl border-0 bg-z-surface p-0 text-z-fg shadow-z-lg backdrop:bg-[rgba(24,24,28,.4)]"
    >
      <form onSubmit={(e) => submit(e)} className="zedu flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-z-section">{contact ? "Edit contact" : "Add contact"}</h2>
            <p className="m-0 mt-0.5 text-z-small text-z-fg-muted">
              {contact ? "Update this person's details." : "Someone the team knows, even if you haven't reached out yet."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 flex-none cursor-pointer place-items-center rounded-z-md bg-transparent p-0 text-z-icon hover:bg-z-sunken hover:text-z-icon-strong"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required value={form.name} maxLength={200} placeholder="e.g. Adaeze Okonkwo" onChange={(e) => set({ name: e.target.value })} />
          <Input label="Phone number" required value={form.phone} maxLength={40} placeholder="+234 803 123 4567" onChange={(e) => set({ phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email ?? ""} maxLength={200} placeholder="name@company.com" onChange={(e) => set({ email: e.target.value || null })} />
          <Input label="Company" value={form.company ?? ""} maxLength={200} placeholder="e.g. Zenith Logistics" onChange={(e) => set({ company: e.target.value || null })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Contact type</FieldLabel>
          <SegmentedControl
            label="Contact type"
            value={form.type ?? "INDIVIDUAL"}
            onChange={(v) => set({ type: v as ContactType })}
            options={[
              { value: "INDIVIDUAL", label: TYPE_LABEL.INDIVIDUAL },
              { value: "BUSINESS", label: TYPE_LABEL.BUSINESS },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="contact-notes">Notes</FieldLabel>
          <textarea
            id="contact-notes"
            value={form.notes ?? ""}
            maxLength={2000}
            rows={3}
            placeholder="Where you met, what they do, when to reach out…"
            onChange={(e) => set({ notes: e.target.value || null })}
            className="w-full resize-y rounded-z-md border border-z-line-strong bg-z-surface px-3 py-2 text-z-body text-z-fg shadow-z-xs outline-none placeholder:text-z-fg-placeholder hover:border-z-line-hover focus:border-z-line-focus focus:shadow-z-focus-input"
          />
        </div>

        {dupHits.length > 0 && (
          <div role="alert" className="flex items-start gap-2.5 rounded-z-md border border-z-line bg-z-danger-subtle p-3">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-z-fg-danger" />
            <div className="flex min-w-0 flex-col gap-1 text-z-small">
              <p className="m-0 font-medium text-z-fg">Possible duplicate{dupHits.length > 1 ? "s" : ""}</p>
              <p className="m-0 text-z-fg-secondary">
                {dupHits.map((d) => `${d.name} (${d.phone})`).join(" · ")} already share{dupHits.length === 1 ? "s" : ""} this phone number or email.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="m-0 text-z-small font-medium text-z-fg-danger">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {dupHits.length > 0 ? (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={(e) => submit(e, true)}>
                {saving ? "Saving…" : "Save anyway"}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : contact ? "Save changes" : "Add contact"}
              </Button>
            </>
          )}
        </div>
      </form>
    </dialog>
  );
}
