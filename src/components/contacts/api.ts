import type { Contact, ContactDetail, DuplicateHit, NewContact } from "./data";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 409 && Array.isArray((data as DuplicateFail).duplicates)) {
      throw new DuplicateError((data as DuplicateFail).duplicates);
    }
    throw new Error(data?.error ?? "Something went wrong");
  }
  return data as T;
}

export class DuplicateError extends Error {
  constructor(readonly duplicates: DuplicateHit[]) {
    super("Possible duplicate contacts");
    this.name = "DuplicateError";
  }
}

type DuplicateFail = { duplicates: DuplicateHit[] };

export const fetchContacts = () => request<Contact[]>("/api/contacts", { cache: "no-store" });

export const fetchContact = (id: string) => request<ContactDetail>(`/api/contacts/${id}`, { cache: "no-store" });

export const addContact = (contact: NewContact, confirmDuplicates = false) =>
  request<Contact>("/api/contacts", {
    method: "POST",
    body: JSON.stringify({ ...contact, confirmDuplicates }),
  });

export const updateContact = (id: string, contact: NewContact, options?: { leadId?: string | null; confirmDuplicates?: boolean }) =>
  request<Contact>(`/api/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...contact, ...options }),
  });

export const deleteContact = (id: string) => request<{ ok: true }>(`/api/contacts/${id}`, { method: "DELETE" });

export const convertContact = (id: string) => request<Contact>(`/api/contacts/${id}/convert`, { method: "POST" });
