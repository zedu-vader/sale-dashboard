"use client";

// Add lead (Figma 16845:23151): validation summary, inline errors, and the duplicate-phone warning.

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { checkDuplicatePhone, createLead, type Duplicate } from "@/app/leads/actions";
import { summaryLine, validateLead, type LeadFormErrors, type LeadFormField, type LeadFormValues } from "@/lib/leadForm";
import type { TeamMember } from "@/lib/leadTypes";
import { Alert, AlertAction, Button, DateField, Modal, Textarea } from "@/components/zedu";
import { LeadFormFields, OwnerSelect } from "./LeadFormFields";

type Props = { open: boolean; onClose: () => void; team: TeamMember[] };

const empty = (ownerId: string): LeadFormValues => ({
  name: "",
  phone: "",
  email: "",
  company: "",
  type: "INDIVIDUAL",
  status: "NEW",
  ownerId,
  followUp: "",
  notes: "",
});

export function AddLeadModal({ open, onClose, team }: Props) {
  const router = useRouter();
  const me = team.find((m) => m.me)?.id ?? "";
  const [values, setValues] = useState(() => empty(me));
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  // Fresh form every time it opens.
  useEffect(() => {
    if (!open) return;
    setValues(empty(me));
    setErrors({});
    setShowSummary(false);
    setDuplicate(null);
    setFailed(false);
  }, [open, me]);

  const change = (patch: Partial<LeadFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    if ("phone" in patch) setDuplicate(null);
  };

  // Once the user has tried to save, re-check as they fix things.
  useEffect(() => {
    if (showSummary) setErrors(validateLead(values));
  }, [values, showSummary]);

  const checkPhone = (phone: string) => {
    if (validateLead({ ...values, phone }).phone) return;
    startTransition(async () => setDuplicate(await checkDuplicatePhone(phone)));
  };

  const submit = (allowDuplicate = false) => {
    const found = validateLead(values);
    setErrors(found);
    setShowSummary(true);
    if (Object.keys(found).length) return;
    startTransition(async () => {
      try {
        const res = await createLead(values, { allowDuplicate });
        if (res.ok) {
          onClose();
          router.push(`/leads/${res.id}`);
        } else if (res.duplicate) setDuplicate(res.duplicate);
        else setErrors(res.errors);
      } catch {
        setFailed(true);
      }
    });
  };

  const errorFields = Object.keys(errors) as LeadFormField[];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add lead"
      description="Fields marked * are required. A unique ID (LD-####) is assigned when you save."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit()} disabled={pending} aria-busy={pending}>
            Create lead
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {showSummary && errorFields.length > 0 && (
          <Alert tone="danger" title={`Check ${errorFields.length} ${errorFields.length === 1 ? "field" : "fields"} before saving`}>
            {errorFields.map((f) => (
              <p key={f}>{summaryLine(f, errors[f]!)}</p>
            ))}
          </Alert>
        )}
        {failed && (
          <Alert tone="danger" title="Couldn't save the lead">
            Check your connection and try again.
          </Alert>
        )}
        <LeadFormFields
          layout="modal"
          values={values}
          errors={errors}
          team={team}
          onChange={change}
          onPhoneBlur={checkPhone}
          afterPhone={
            duplicate && (
              <Alert
                tone="warning"
                title="Possible duplicate"
                actions={
                  <>
                    <AlertAction
                      onClick={() => {
                        onClose();
                        router.push(`/leads/${duplicate.id}`);
                      }}
                    >
                      Open {duplicate.code}
                    </AlertAction>
                    <AlertAction onClick={() => submit(true)}>Save as new lead</AlertAction>
                  </>
                }
              >
                {duplicate.name} ({duplicate.code}
                {duplicate.owner ? `, owner ${duplicate.owner}` : ""}) already has this phone number. Open that lead instead, or
                save this as a separate lead.
              </Alert>
            )
          }
        />
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <OwnerSelect team={team} value={values.ownerId} onChange={(ownerId) => change({ ownerId })} />
          <DateField
            label="Next follow-up (optional)"
            value={values.followUp ?? ""}
            min={new Date().toISOString().slice(0, 10)}
            error={errors.followUp}
            onChange={(e) => change({ followUp: e.target.value })}
          />
        </div>
        <Textarea label="Notes (optional)" value={values.notes} onChange={(e) => change({ notes: e.target.value })} />
        {/* Enter in a field submits. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
