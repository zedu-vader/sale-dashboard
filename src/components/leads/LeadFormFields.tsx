"use client";

// Fields shared by Add lead (2-column modal) and Edit details (1-column panel).

import { Building2, Mail, Phone, UserRound } from "lucide-react";
import type { LeadFormErrors, LeadFormValues } from "@/lib/leadForm";
import type { TeamMember } from "@/lib/leadTypes";
import { STAGES, STATUS_ORDER } from "@/lib/status";
import { Input, SegmentedControl, Select, cx } from "@/components/zedu";

type Props = {
  values: LeadFormValues;
  errors: LeadFormErrors;
  team: TeamMember[];
  onChange: (patch: Partial<LeadFormValues>) => void;
  onPhoneBlur?: (phone: string) => void;
  /** Rendered between the name/phone row and the rest (the duplicate warning). */
  afterPhone?: React.ReactNode;
  layout: "modal" | "panel";
};

export function LeadFormFields({ values, errors, team, onChange, onPhoneBlur, afterPhone, layout }: Props) {
  const row = layout === "modal" ? "grid grid-cols-2 gap-4 max-sm:grid-cols-1" : "flex flex-col gap-4";
  return (
    <>
      <div className={row}>
        <Input
          label="Lead name"
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
          label="Company"
          icon={<Building2 aria-hidden />}
          value={values.company}
          error={errors.company}
          autoComplete="off"
          onChange={(e) => onChange({ company: e.target.value })}
        />
      </div>
      <div className={cx(layout === "modal" ? row : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-1.5">
          <span aria-hidden className="text-z-caption font-medium text-z-fg-secondary">
            Lead type
          </span>
          <SegmentedControl
            stretch
            label="Lead type"
            value={values.type}
            onChange={(type) => onChange({ type })}
            options={[
              { value: "INDIVIDUAL", label: "Individual" },
              { value: "BUSINESS", label: "Business" },
            ]}
          />
        </div>
        <div className={layout === "panel" ? "grid grid-cols-2 gap-3" : "contents"}>
          <Select label="Status" value={values.status} onChange={(e) => onChange({ status: e.target.value })}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGES[s].label}
              </option>
            ))}
          </Select>
          {layout === "panel" && <OwnerSelect team={team} value={values.ownerId} onChange={(ownerId) => onChange({ ownerId })} />}
        </div>
      </div>
    </>
  );
}

export function OwnerSelect({ team, value, onChange }: { team: TeamMember[]; value: string; onChange: (id: string) => void }) {
  return (
    <Select label="Owner" icon={<UserRound aria-hidden />} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Unassigned</option>
      {team.map((m) => (
        <option key={m.id} value={m.id}>
          {m.me ? `${m.name} (you)` : m.name}
        </option>
      ))}
    </Select>
  );
}
