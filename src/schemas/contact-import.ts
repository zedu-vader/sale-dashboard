export type ContactImportRow = {
  name: string;
  phone: string;
  email: string;
  company: string;
};

export type ContactImportValidation =
  | {
      valid: true;
      value: ContactImportRow;
    }
  | {
      valid: false;
      error: string;
    };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactImportRow(
  input: unknown
): ContactImportValidation {
  if (!input || typeof input !== "object") {
    return {
      valid: false,
      error: "Invalid contact data.",
    };
  }

  const row = input as Record<string, unknown>;

  const name =
    typeof row.name === "string" ? row.name.trim() : "";

  const phone =
    typeof row.phone === "string" ? row.phone.trim() : "";

  const email =
    typeof row.email === "string" ? row.email.trim() : "";

  const company =
    typeof row.company === "string" ? row.company.trim() : "";

  if (!name) {
    return {
      valid: false,
      error: "Name is required.",
    };
  }

  if (name.length > 200) {
    return {
      valid: false,
      error: "Name must not exceed 200 characters.",
    };
  }

  if (!phone) {
    return {
      valid: false,
      error: "Phone number is required.",
    };
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 7) {
    return {
      valid: false,
      error: "Phone number must contain at least 7 digits.",
    };
  }

  if (phone.length > 40) {
    return {
      valid: false,
      error: "Phone number must not exceed 40 characters.",
    };
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      error: "Please provide a valid email address.",
    };
  }

  if (email.length > 200) {
    return {
      valid: false,
      error: "Email must not exceed 200 characters.",
    };
  }

  if (company.length > 200) {
    return {
      valid: false,
      error: "Company must not exceed 200 characters.",
    };
  }

  return {
    valid: true,
    value: {
      name,
      phone,
      email,
      company,
    },
  };
}