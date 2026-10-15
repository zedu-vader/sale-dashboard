import { NextResponse } from "next/server";
import { convertContact } from "@/lib/contacts";

export const dynamic = "force-dynamic";

/** Start outreach: create a New lead from the contact and link the two records. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const saved = await convertContact(params.id);
  if (saved.status === "error") return NextResponse.json({ error: saved.error }, { status: 409 });
  if (saved.status !== "updated") return NextResponse.json({ error: "Could not convert the contact" }, { status: 409 });
  return NextResponse.json(saved.contact);
}
