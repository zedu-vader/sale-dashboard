"use client";

import { CheckCircle2, GitFork, ListChecks, Phone, Tag } from "lucide-react";
import { Card, StatusPill } from "@/components/zedu";

type StageItem = {
  stage: "New" | "Contacted" | "Connected" | "Interested" | "Follow up" | "Qualified" | "Proposal" | "Won" | "Lost";
  desc: string;
  label?: string;
};

const PIPELINE_STAGES: readonly StageItem[] = [
  { stage: "New", desc: "Fresh lead created manually or via CSV import" },
  { stage: "Contacted", desc: "Outbound call attempted or message sent" },
  { stage: "Connected", desc: "Direct phone contact established with the lead" },
  { stage: "Interested", desc: "Expressed interest in Zedu products or services" },
  { stage: "Follow up", desc: "Scheduled callback or follow-up task pending", label: "Follow-up" },
  { stage: "Qualified", desc: "Budget and requirements verified for proposal" },
  { stage: "Proposal", desc: "Pricing or proposal sent for review" },
  { stage: "Won", desc: "Deal closed and lead converted to client", label: "Converted" },
  { stage: "Lost", desc: "Lead decided not to proceed with a documented reason", label: "Not interested" },
];

const LOST_REASONS = [
  { code: "NOT_INTERESTED", label: "Not interested", desc: "No current need for the solution" },
  { code: "NO_BUDGET", label: "No budget", desc: "Budget constraints or price sensitivity" },
  { code: "WRONG_CONTACT", label: "Wrong contact", desc: "Not the decision maker or invalid details" },
  { code: "WENT_WITH_COMPETITOR", label: "Went with competitor", desc: "Selected an alternative vendor" },
  { code: "OTHER", label: "Other", desc: "Custom reason documented in notes" },
];

const CALL_OUTCOMES = [
  { outcome: "CONNECTED", label: "Connected", desc: "Call answered, conversation held" },
  { outcome: "NO_ANSWER", label: "No answer", desc: "Call rang out, line busy, or voicemail" },
  { outcome: "NOT_INTERESTED", label: "Not interested", desc: "Connected but declined to engage" },
  { outcome: "OTHER", label: "Other", desc: "Alternative outcome recorded with notes" },
];

const TASK_TYPES = [
  { type: "CALL", label: "Call", desc: "Scheduled phone call follow-up" },
  { type: "EMAIL", label: "Email", desc: "Information or proposal email to send" },
  { type: "FOLLOW_UP", label: "Follow-up", desc: "General follow-up checkpoint" },
  { type: "MEETING", label: "Meeting", desc: "Demo, consultation, or formal meeting" },
  { type: "OTHER", label: "Other", desc: "General sales task or reminder" },
];

export function PipelineTab() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Pipeline Stages */}
      <Card title="Lead Pipeline Stages" icon={<GitFork aria-hidden />}>
        <p className="text-z-small text-z-fg-muted mb-2">
          The 9 standard stages in the Zedu sales pipeline. Leads progress sequentially or exit at any stage to Lost.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_STAGES.map((s) => (
            <div
              key={s.stage}
              className="flex flex-col gap-1.5 rounded-z-md border border-z-line bg-z-sunken/40 p-3"
            >
              <div className="flex items-center justify-between">
                <StatusPill stage={s.stage} label={s.label} />
              </div>
              <span className="text-z-caption text-z-fg-muted">{s.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Call Outcomes & Task Types */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Call Outcomes" icon={<Phone aria-hidden />}>
          <p className="text-z-small text-z-fg-muted mb-2">
            Standardised outcomes recorded after logging outbound sales calls.
          </p>
          <ul className="flex flex-col divide-y divide-z-line">
            {CALL_OUTCOMES.map((c) => (
              <li key={c.outcome} className="flex flex-col py-2.5 first:pt-0 last:pb-0">
                <span className="text-z-small font-medium text-z-fg">{c.label}</span>
                <span className="text-z-caption text-z-fg-muted">{c.desc}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Task Types" icon={<ListChecks aria-hidden />}>
          <p className="text-z-small text-z-fg-muted mb-2">
            Categories available for scheduling sales follow-ups and activities.
          </p>
          <ul className="flex flex-col divide-y divide-z-line">
            {TASK_TYPES.map((t) => (
              <li key={t.type} className="flex flex-col py-2.5 first:pt-0 last:pb-0">
                <span className="text-z-small font-medium text-z-fg">{t.label}</span>
                <span className="text-z-caption text-z-fg-muted">{t.desc}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Lost Reasons */}
      <Card title="Lost Reasons" icon={<Tag aria-hidden />}>
        <p className="text-z-small text-z-fg-muted mb-2">
          Mandatory categorisation when moving any lead into the Lost stage to help identify drop-off causes.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOST_REASONS.map((r) => (
            <div key={r.code} className="flex flex-col gap-1 rounded-z-md border border-z-line bg-z-surface p-3">
              <span className="text-z-small font-medium text-z-fg">{r.label}</span>
              <span className="text-z-caption text-z-fg-muted">{r.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
