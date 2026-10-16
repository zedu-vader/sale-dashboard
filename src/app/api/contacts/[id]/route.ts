import { NextResponse } from "next/server";
import { deleteContact, getContact, updateContact, validateContact } from "@/lib/contacts";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const contact = await getContact(params.id);
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json().catch(() => null);
  const result = validateContact(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const leadId = body?.leadId === null ? null : typeof body?.leadId === "string" ? body.leadId : undefined;
  const saved = await updateContact(params.id, result.value, leadId, body?.confirmDuplicates === true);
  if (saved.status === "duplicates") return NextResponse.json(saved, { status: 409 });
  if (saved.status === "error") return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved.contact);
}

export async function DELETE(_req: Request, { params }: Params) {
  const deleted = await deleteContact(params.id);
  if (!deleted) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
