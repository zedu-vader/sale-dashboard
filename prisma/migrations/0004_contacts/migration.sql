-- Contacts: one record per person or business. Leads, calls, tasks, notes and timeline entries link to it,
-- and a lead's name/phone/email/company/type now come from its contact.
-- Every existing lead gets its own contact (duplicates can then be merged in the app). The lead's old identity
-- columns are kept (nullable, no longer written) so nothing is lost; a later migration can drop them.

-- AlterEnum (new values aren't used below: Postgres can't use an enum value in the transaction that adds it)
ALTER TYPE "ActivityType" ADD VALUE 'CONTACT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'CONTACT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'CONTACTS_MERGED';
ALTER TYPE "ActivityType" ADD VALUE 'LEAD_LINKED';

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneKey" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "type" "LeadType" NOT NULL,
    "notes" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
    "createdById" TEXT,
    "lastInteractionAt" TIMESTAMP(3),
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateDismissal" (
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedBy" TEXT,

    CONSTRAINT "DuplicateDismissal_pkey" PRIMARY KEY ("aId","bId")
);

-- One contact per existing lead, numbered CT-0001… in lead creation order.
-- phoneKey: digits only, with a local 0-prefixed 11-digit number rewritten to 234… (0803… = +234 803…).
INSERT INTO "Contact" ("id", "code", "name", "phone", "phoneKey", "email", "company", "type", "source",
                       "createdById", "lastInteractionAt", "createdAt", "updatedAt")
SELECT 'ct' || md5(l."id"),
       ROW_NUMBER() OVER (ORDER BY l."createdAt", l."id"),
       l."name",
       l."phone",
       CASE
         WHEN length(regexp_replace(l."phone", '[^0-9]', '', 'g')) = 11 AND regexp_replace(l."phone", '[^0-9]', '', 'g') LIKE '0%'
           THEN '234' || substr(regexp_replace(l."phone", '[^0-9]', '', 'g'), 2)
         ELSE regexp_replace(l."phone", '[^0-9]', '', 'g')
       END,
       l."email",
       l."company",
       l."type",
       l."source",
       l."createdById",
       l."lastInteractionAt",
       l."createdAt",
       l."updatedAt"
FROM "Lead" l;
SELECT setval(pg_get_serial_sequence('"Contact"', 'code'), GREATEST((SELECT MAX("code") FROM "Contact"), 1),
              (SELECT COUNT(*) > 0 FROM "Contact"));

-- Lead → contact (nullable while backfilling, then required). Old identity columns become optional.
ALTER TABLE "Lead" ADD COLUMN "contactId" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;
UPDATE "Lead" SET "contactId" = 'ct' || md5("id");
ALTER TABLE "Lead" ALTER COLUMN "contactId" SET NOT NULL;

-- Calls, tasks, notes and timeline entries also point at the contact of their lead.
ALTER TABLE "Call" ADD COLUMN "contactId" TEXT;
UPDATE "Call" SET "contactId" = 'ct' || md5("leadId") WHERE "leadId" IS NOT NULL;

ALTER TABLE "Task" ADD COLUMN "contactId" TEXT;
UPDATE "Task" SET "contactId" = 'ct' || md5("leadId") WHERE "leadId" IS NOT NULL;

ALTER TABLE "Note" ADD COLUMN "contactId" TEXT,
ALTER COLUMN "leadId" DROP NOT NULL;
UPDATE "Note" SET "contactId" = 'ct' || md5("leadId") WHERE "leadId" IS NOT NULL;

ALTER TABLE "Activity" ADD COLUMN "contactId" TEXT,
ALTER COLUMN "leadId" DROP NOT NULL;
UPDATE "Activity" SET "contactId" = 'ct' || md5("leadId") WHERE "leadId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_code_key" ON "Contact"("code");

-- CreateIndex
CREATE INDEX "Contact_phoneKey_idx" ON "Contact"("phoneKey");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_name_idx" ON "Contact"("name");

-- CreateIndex
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

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
