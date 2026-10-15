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

export const initialLeads: Lead[] = [
  { id: 1, name: "Tunde Adebayo", initials: "TA", phone: "+234 803 123 4567", type: "Individual", status: "Interested", lastCall: "Oct 15", nextAction: "Call again", nextActionDate: "Oct 17", owner: "You", avatarTone: "violet" },
  { id: 2, name: "Flourish Ltd", initials: "FL", phone: "+234 802 987 6543", company: "Flourish Ltd", type: "Business", status: "Follow up", lastCall: "Oct 14", nextAction: "Send details", nextActionDate: "Oct 16", owner: "You", avatarTone: "green" },
  { id: 3, name: "Kemi Ibrahim", initials: "KI", phone: "+234 816 222 3344", type: "Individual", status: "Not interested", lastCall: "Oct 14", nextAction: "—", owner: "Sarah", avatarTone: "rose" },
  { id: 4, name: "Ben Okafor", initials: "BO", phone: "+234 809 444 2211", company: "Okafor & Co.", type: "Business", status: "Connected", lastCall: "Oct 13", nextAction: "Call again", nextActionDate: "Oct 16", owner: "You", avatarTone: "cyan" },
  { id: 5, name: "Amaka Akintola", initials: "AA", phone: "+234 818 765 4321", type: "Individual", status: "Converted", lastCall: "Oct 12", nextAction: "—", owner: "Toluw", avatarTone: "purple" },
  { id: 6, name: "Daniel Osei", initials: "DO", phone: "+234 701 334 5566", company: "Osei Media", type: "Business", status: "New", lastCall: "—", nextAction: "Call", nextActionDate: "Oct 15", owner: "Femi", avatarTone: "blue" },
  { id: 7, name: "Lola Adeyemi", initials: "LO", phone: "+234 903 112 4455", type: "Individual", status: "Follow up", lastCall: "Oct 11", nextAction: "Call again", nextActionDate: "Oct 18", owner: "You", avatarTone: "lime" },
  { id: 8, name: "Uche Chima", initials: "UC", phone: "+234 806 998 7766", company: "Chima Stores", type: "Business", status: "Interested", lastCall: "Oct 10", nextAction: "Send details", nextActionDate: "Oct 16", owner: "Grace", avatarTone: "pink" },
  { id: 9, name: "Ifeanyi Nwosu", initials: "IF", phone: "+234 817 662 3311", type: "Individual", status: "Connected", lastCall: "Oct 10", nextAction: "—", owner: "Femi", avatarTone: "indigo" },
  { id: 10, name: "Ezime Okoro", initials: "EO", phone: "+234 904 221 9988", company: "Okoro Ventures", type: "Business", status: "New", lastCall: "—", nextAction: "Call", nextActionDate: "Oct 15", owner: "You", avatarTone: "amber" },
];

export const statusOptions: Array<LeadStatus | "All Status"> = [
  "All Status",
  "Interested",
  "Follow up",
  "Connected",
  "Converted",
  "New",
  "Not interested",
];
