// Lead form values and validation, shared by the Add lead modal, the Edit details panel and the server actions.

export type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  company: string;
  type: "INDIVIDUAL" | "BUSINESS";
  status: string;
  /** User id, or "" for unassigned. */
  ownerId: string;
  /** yyyy-mm-dd, Add lead only. */
  followUp?: string;
  /** Add lead only. */
  notes?: string;
};

export type LeadFormField = "name" | "phone" | "email" | "company" | "followUp";

/** Field → message that says what to do. Empty when valid. */
export type LeadFormErrors = Partial<Record<LeadFormField, string>>;

/** Short labels for the error summary alert ("Email: enter a full email address."). */
export const FIELD_LABELS: Record<LeadFormField, string> = {
  name: "Lead name",
  phone: "Phone number",
  email: "Email",
  company: "Company",
  followUp: "Next follow-up",
};

/** Digits only, for comparing phone numbers whatever their formatting. */
export const phoneDigits = (phone: string) => phone.replace(/\D/g, "");

/**
 * Phone digits in +234 form, stored on contacts for search and duplicate checks: a local 11-digit number
 * starting with 0 is rewritten, so 0803 123 4567 and +234 803 123 4567 give the same key.
 * Keep in step with the SQL in prisma/migrations/0006_contacts.
 */
export function phoneKey(phone: string) {
  const d = phoneDigits(phone);
  return d.length === 11 && d.startsWith("0") ? `234${d.slice(1)}` : d;
}

/** The digits to look for inside a phoneKey when searching ("0803 123" → "803123"). */
export const phoneSearchDigits = (q: string) => phoneDigits(q).replace(/^0/, "");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(v: Pick<LeadFormValues, "name" | "phone" | "email" | "company" | "followUp">, noun = "lead"): LeadFormErrors {
  const errors: LeadFormErrors = {};
  if (!v.name.trim()) errors.name = `Enter the ${noun}'s name.`;
  else if (v.name.trim().length > 120) errors.name = "Keep the name under 120 characters.";

  const digits = phoneDigits(v.phone);
  if (!v.phone.trim()) errors.phone = "Enter a phone number.";
  else if (digits.length < 7 || digits.length > 15 || /[^\d\s()+\-.]/.test(v.phone))
    errors.phone = "Enter a phone number with 7 to 15 digits, like +234 803 123 4567.";

  if (v.email.trim() && !EMAIL.test(v.email.trim())) errors.email = "Enter a full email address, like name@company.com.";
  if (v.company.trim().length > 120) errors.company = "Keep the company name under 120 characters.";
  if (v.followUp && Number.isNaN(Date.parse(v.followUp))) errors.followUp = "Pick a valid date.";
  return errors;
}

/** "Email: enter a full email address." — the summary line for one field. */
export function summaryLine(field: LeadFormField, message: string) {
  const short = field === "email" ? "enter a full email address." : message.charAt(0).toLowerCase() + message.slice(1);
  return `${FIELD_LABELS[field]}: ${short}`;
}
