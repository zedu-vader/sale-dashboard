"use client";

// Fields shared by Add contact (2-column modal, Figma 16855:24896) and Edit details (1-column panel, 16857:26248).

import { Building2, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";
import type { ContactFormValues, DuplicateMatch } from "@/lib/contactTypes";
import type { LeadFormErrors } from "@/lib/leadForm";
import { Alert, AlertAction, Input, SegmentedControl, Textarea, cx } from "@/components/zedu";

type Props = {
  values: ContactFormValues;
  errors: LeadFormErrors;
  onChange: (patch: Partial<ContactFormValues>) => void;
  onPhoneBlur?: (phone: string) => void;
  /** Rendered between the name/phone row and the rest (the duplicate warning). */
  afterPhone?: ReactNode;
  layout: "modal" | "panel";
};

export const emptyContact = (): ContactFormValues => ({ name: "", phone: "", email: "", company: "", type: "INDIVIDUAL", notes: "" });

export function ContactFormFields({ values, errors, onChange, onPhoneBlur, afterPhone, layout }: Props) {
  const row = layout === "modal" ? "grid grid-cols-2 gap-4 max-sm:grid-cols-1" : "flex flex-col gap-4";
  return (
    <>
      <div className={row}>
        <Input
          label="Full name"
          required
          value={values.name}
          error={errors.name}
          autoComplete="off"
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Input
          label="Phone number"
          required
          type="tel"
          icon={<Phone aria-hidden />}
          value={values.phone}
          error={errors.phone}
          autoComplete="off"
          onChange={(e) => onChange({ phone: e.target.value })}
          onBlur={(e) => onPhoneBlur?.(e.currentTarget.value)}
        />
      </div>
      {afterPhone}
      <div className={row}>
        <Input
          label="Email"
          type="email"
          icon={<Mail aria-hidden />}
          value={values.email}
          error={errors.email}
          autoComplete="off"
          onChange={(e) => onChange({ email: e.target.value })}
        />
        <Input
          label="Company or organisation"
          icon={<Building2 aria-hidden />}
          value={values.company}
          error={errors.company}
          autoComplete="off"
          onChange={(e) => onChange({ company: e.target.value })}
        />
      </div>
      <div className={cx("flex flex-col gap-1.5", layout === "modal" && "max-w-[calc(50%-8px)] max-sm:max-w-none")}>
        <span aria-hidden className="text-z-caption font-medium text-z-fg-secondary">
          Contact type
        </span>
        <SegmentedControl
          stretch
          label="Contact type"
          value={values.type}
          onChange={(type) => onChange({ type })}
          options={[
            { value: "INDIVIDUAL", label: "Individual" },
            { value: "BUSINESS", label: "Business" },
          ]}
        />
      </div>
      <Textarea
        label="Notes (optional)"
        placeholder="Add anything the team should know."
        value={values.notes}
        maxLength={2000}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
    </>
  );
}

/** "This contact may already exist" warning under the phone field. */
export function DuplicateContactAlert({
  phone,
  match,
  onOpen,
  onSaveAnyway,
  saveLabel,
}: {
  phone: string;
  match: DuplicateMatch;
  onOpen: () => void;
  onSaveAnyway?: () => void;
  saveLabel?: string;
}) {
  const details = [match.code, match.company, match.lead && `lead ${match.lead.code}`].filter(Boolean).join(", ");
  return (
    <Alert
      tone="warning"
      title="This contact may already exist"
      actions={
        <>
          <AlertAction onClick={onOpen}>Open {match.code}</AlertAction>
          {onSaveAnyway && <AlertAction onClick={onSaveAnyway}>{saveLabel ?? "Save as a new contact"}</AlertAction>}
        </>
      }
    >
      {phone.trim()} matches {match.name} ({details}). Phone numbers are compared in +234 format, so 0803… and +234 803… are the
      same number.
    </Alert>
  );
}
