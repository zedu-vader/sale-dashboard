import leadsData from "@/data/leads.json";

export type LeadStatus =
  | "Interested"
  | "Follow up"
  | "Not interested"
  | "Connected"
  | "Converted"
  | "New";

export type Lead = {
  id: number;
  name: string;
  initials: string;
  phone: string;
  company?: string;
  type: "Individual" | "Business";
  status: LeadStatus;
  lastCall: string;
  nextAction: string;
  nextActionDate?: string;
  owner: string;
  avatarTone: string;
};

export const initialLeads = leadsData as Lead[];

export const statusOptions: Array<LeadStatus | "All Status"> = [
  "All Status",
  "Interested",
  "Follow up",
  "Connected",
  "Converted",
  "New",
  "Not interested",
];
