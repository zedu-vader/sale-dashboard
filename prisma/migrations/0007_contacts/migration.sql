-- Contacts become the record leads, calls, tasks, notes and timeline entries hang off: every lead points to a
-- contact and reads its name/phone/email/company/type from it.
--
-- This upgrades the Contact table from 0003_contacts (a directory where a contact could point to one lead) in
-- place, so no saved contact is lost:
--   * a lead already linked from a contact keeps that contact (Contact.leadId becomes Lead.contactId);
--   * every other lead gets a new contact made from its own details;
--   * contacts without a lead stay as they are.
-- The lead's old identity columns are kept (nullable, no longer written); a later migration can drop them.

-- AlterEnum (new values aren't used below: Postgres can't use an enum value in the transaction that adds it)
ALTER TYPE "ActivityType" ADD VALUE 'CONTACT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'CONTACT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'CONTACTS_MERGED';
ALTER TYPE "ActivityType" ADD VALUE 'LEAD_LINKED';

-- New contact columns (nullable while backfilling).
ALTER TABLE "Contact" ADD COLUMN "code" INTEGER,
ADD COLUMN "phoneKey" TEXT,
ADD COLUMN "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "createdById" TEXT,
ADD COLUMN "lastInteractionAt" TIMESTAMP(3),
ADD COLUMN "mergedIntoId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "DuplicateDismissal" (
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedBy" TEXT,

    CONSTRAINT "DuplicateDismissal_pkey" PRIMARY KEY ("aId","bId")
);

-- Lead → contact. Leads already linked from the directory keep that contact.
ALTER TABLE "Lead" ADD COLUMN "contactId" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;
UPDATE "Lead" l SET "contactId" = c."id" FROM "Contact" c WHERE c."leadId" = l."id";

-- Fill gaps on those linked contacts from their lead.
UPDATE "Contact" c
SET "email" = COALESCE(c."email", l."email"),
    "company" = COALESCE(c."company", l."company"),
    "type" = COALESCE(c."type", l."type"),
    "source" = l."source",
    "createdById" = l."createdById",
    "lastInteractionAt" = l."lastInteractionAt",
    "createdAt" = LEAST(c."createdAt", l."createdAt")
FROM "Lead" l
WHERE l."contactId" = c."id";

-- Every other lead gets its own contact.
INSERT INTO "Contact" ("id", "name", "phone", "email", "company", "type", "source", "createdById",
                       "lastInteractionAt", "createdAt", "updatedAt")
SELECT 'ct' || md5(l."id"), l."name", l."phone", l."email", l."company", l."type", l."source", l."createdById",
       l."lastInteractionAt", l."createdAt", l."updatedAt"
FROM "Lead" l
WHERE l."contactId" IS NULL;
UPDATE "Lead" SET "contactId" = 'ct' || md5("id") WHERE "contactId" IS NULL;
ALTER TABLE "Lead" ALTER COLUMN "contactId" SET NOT NULL;

-- Contact type is now required (directory contacts could leave it blank).
UPDATE "Contact" SET "type" = 'INDIVIDUAL' WHERE "type" IS NULL;
ALTER TABLE "Contact" ALTER COLUMN "type" SET NOT NULL;

-- phoneKey: digits only, with a local 0-prefixed 11-digit number rewritten to 234… (0803… = +234 803…).
-- Keep in step with phoneKey() in src/lib/leadForm.ts.
UPDATE "Contact" SET "phoneKey" = CASE
  WHEN length(regexp_replace("phone", '[^0-9]', '', 'g')) = 11 AND regexp_replace("phone", '[^0-9]', '', 'g') LIKE '0%'
    THEN '234' || substr(regexp_replace("phone", '[^0-9]', '', 'g'), 2)
  ELSE regexp_replace("phone", '[^0-9]', '', 'g')
END;
ALTER TABLE "Contact" ALTER COLUMN "phoneKey" SET NOT NULL;

-- CT-#### codes in creation order, then new contacts continue from the highest.
CREATE SEQUENCE "Contact_code_seq" AS INTEGER OWNED BY "Contact"."code";
UPDATE "Contact" c SET "code" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn FROM "Contact") n
WHERE n."id" = c."id";
SELECT setval('"Contact_code_seq"', GREATEST((SELECT MAX("code") FROM "Contact"), 1), (SELECT COUNT(*) > 0 FROM "Contact"));
ALTER TABLE "Contact" ALTER COLUMN "code" SET DEFAULT nextval('"Contact_code_seq"'),
ALTER COLUMN "code" SET NOT NULL;

-- The contact → lead link is replaced by Lead.contactId.
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_leadId_fkey";
DROP INDEX "Contact_leadId_key";
DROP INDEX "Contact_phone_idx";
ALTER TABLE "Contact" DROP COLUMN "leadId";

-- Calls, tasks, notes and timeline entries also point at the contact of their lead.
ALTER TABLE "Call" ADD COLUMN "contactId" TEXT;
UPDATE "Call" t SET "contactId" = l."contactId" FROM "Lead" l WHERE l."id" = t."leadId";

ALTER TABLE "Task" ADD COLUMN "contactId" TEXT;
UPDATE "Task" t SET "contactId" = l."contactId" FROM "Lead" l WHERE l."id" = t."leadId";

ALTER TABLE "Note" ADD COLUMN "contactId" TEXT,
ALTER COLUMN "leadId" DROP NOT NULL;
UPDATE "Note" t SET "contactId" = l."contactId" FROM "Lead" l WHERE l."id" = t."leadId";

ALTER TABLE "Activity" ADD COLUMN "contactId" TEXT,
ALTER COLUMN "leadId" DROP NOT NULL;
UPDATE "Activity" t SET "contactId" = l."contactId" FROM "Lead" l WHERE l."id" = t."leadId";

-- CreateIndex
CREATE UNIQUE INDEX "Contact_code_key" ON "Contact"("code");

-- CreateIndex
CREATE INDEX "Contact_phoneKey_idx" ON "Contact"("phoneKey");

-- CreateIndex
CREATE INDEX "Contact_name_idx" ON "Contact"("name");

-- CreateIndex
CREATE INDEX "Contact_mergedIntoId_idx" ON "Contact"("mergedIntoId");

-- CreateIndex
CREATE INDEX "Lead_contactId_idx" ON "Lead"("contactId");

-- CreateIndex
CREATE INDEX "Call_contactId_idx" ON "Call"("contactId");

-- CreateIndex
CREATE INDEX "Task_contactId_idx" ON "Task"("contactId");

-- CreateIndex
CREATE INDEX "Note_contactId_createdAt_idx" ON "Note"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_contactId_createdAt_idx" ON "Activity"("contactId", "createdAt");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
