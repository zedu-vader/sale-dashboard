"use client";

// Add contact (Figma 16855:24896): required name and phone, the duplicate warning (phones compared in +234
// form), and "Also create a lead for this contact".

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { checkContactPhone, createContact } from "@/app/contacts/actions";
import type { DuplicateMatch } from "@/lib/contactTypes";
import { validateLead, type LeadFormErrors } from "@/lib/leadForm";
import { Alert, Button, Checkbox, Modal } from "@/components/zedu";
import { ContactFormFields, DuplicateContactAlert, emptyContact } from "./ContactFormFields";

export function AddContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState(emptyContact);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);
  const [withLead, setWithLead] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  // Fresh form every time it opens.
  useEffect(() => {
    if (!open) return;
    setValues(emptyContact());
    setErrors({});
    setDuplicate(null);
    setWithLead(false);
    setFailed(false);
  }, [open]);

  // After a failed save, re-check as the user fixes things.
  const hasErrors = Object.keys(errors).length > 0;
  useEffect(() => {
    if (hasErrors) setErrors(validateLead(values, "contact"));
  }, [values, hasErrors]);

  const checkPhone = (phone: string) => {
    if (!phone.trim()) return;
    startTransition(async () => setDuplicate(await checkContactPhone(phone).catch(() => null)));
  };

  const submit = (allowDuplicate = false) => {
    const found = validateLead(values, "contact");
    setErrors(found);
    if (Object.keys(found).length) return;
    startTransition(async () => {
      try {
        const res = await createContact(values, { allowDuplicate, createLead: withLead });
        if (res.ok) {
          onClose();
          router.push(`/contacts/${res.id}`);
        } else if (res.duplicate) setDuplicate(res.duplicate);
        else setErrors(res.errors);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={640}
      title="Add contact"
      description="Save someone you talk to. You can create a lead for them now or later."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit(false)} disabled={pending} aria-busy={pending}>
            Add contact
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        {failed && (
          <Alert tone="danger" title="Couldn't add this contact">
            Check your connection and try again.
          </Alert>
        )}
        <ContactFormFields
          layout="modal"
          values={values}
          errors={errors}
          onChange={(patch) => {
            setValues((prev) => ({ ...prev, ...patch }));
            if ("phone" in patch) setDuplicate(null);
          }}
          onPhoneBlur={checkPhone}
          afterPhone={
            duplicate && (
              <DuplicateContactAlert
                phone={values.phone}
                match={duplicate}
                onOpen={() => {
                  onClose();
                  router.push(`/contacts/${duplicate.id}`);
                }}
                onSaveAnyway={() => submit(true)}
              />
            )
          }
        />
        <Checkbox label="Also create a lead for this contact" checked={withLead} onChange={(e) => setWithLead(e.target.checked)} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
