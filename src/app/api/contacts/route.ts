import { NextResponse } from "next/server";
import { createContact, listContacts, validateContact } from "@/lib/contacts";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listContacts());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = validateContact(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const saved = await createContact(result.value, body?.confirmDuplicates === true);
  if (saved.status === "duplicates") return NextResponse.json(saved, { status: 409 });
  if (saved.status === "error") return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved.contact, { status: 201 });
}
