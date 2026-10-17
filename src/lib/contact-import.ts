import { prisma } from "./prisma";
import {
  importReport,
  reviewImport,
  type ImportRow,
  type ReviewedRow,
} from "@/schemas/contact-import";

const contactFields = { id: true, phone: true, email: true } as const;

export async function previewContactImport(rows: ImportRow[]) {
  const existing = await prisma.contact.findMany({ select: contactFields });
  return importReport(reviewImport(rows, existing));
}

export async function commitContactImport(rows: ImportRow[]) {
  return prisma.$transaction(
    async (tx) => {
      // Serialise CSV commits across app instances, including repeated requests.
      // Manual creation deliberately retains its existing behaviour.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(928314, 1)::text`;
      const existing = await tx.contact.findMany({ select: contactFields });
      const reviewed = reviewImport(rows, existing);
      const results: ReviewedRow[] = [];
      for (const row of reviewed) {
        if (row.status !== "ready") {
          results.push(row);
          continue;
        }
        // Recover from a row-level database rejection without losing other saved records.
        await tx.$executeRawUnsafe("SAVEPOINT csv_contact_row");
        try {
          const contact = await tx.contact.create({
            data: {
              name: row.name,
              phone: row.phone,
              email: row.email || null,
              company: row.company || null,
              type: null,
              notes: null,
            },
            select: { id: true },
          });
          results.push({ ...row, status: "imported", contactId: contact.id });
        } catch {
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT csv_contact_row");
          results.push({
            ...row,
            status: "failed",
            error:
              "Could not save this contact. Correct the record or retry the import.",
          });
        }
        await tx.$executeRawUnsafe("RELEASE SAVEPOINT csv_contact_row");
      }
      return importReport(results);
    },
    { maxWait: 10000, timeout: 60000 },
  );
}
