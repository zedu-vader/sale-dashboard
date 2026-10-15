-- Leads: emails, companies, LD-#### codes, owners as team members, notes, an activity timeline,
-- and tasks/calls linked to leads. Additive only; existing rows are backfilled at the end.

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CALL', 'EMAIL', 'FOLLOW_UP', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'OWNER_CHANGED', 'DETAILS_UPDATED', 'CALL_LOGGED', 'NOTE_ADDED', 'TASK_CREATED');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "company" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "lastInteractionAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ownerName" SET DEFAULT '';

-- Lead code (LD-####): existing leads are numbered from 1001 in creation order; new leads continue the sequence.
CREATE SEQUENCE "Lead_code_seq" START WITH 1001;
ALTER TABLE "Lead" ADD COLUMN "code" INTEGER;
UPDATE "Lead" l SET "code" = s.n
FROM (SELECT "id", 1000 + ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS n FROM "Lead") s
WHERE l."id" = s."id";
SELECT setval('"Lead_code_seq"', GREATEST((SELECT MAX("code") FROM "Lead"), 1000));
ALTER TABLE "Lead" ALTER COLUMN "code" SET DEFAULT nextval('"Lead_code_seq"'),
ALTER COLUMN "code" SET NOT NULL;
ALTER SEQUENCE "Lead_code_seq" OWNED BY "Lead"."code";

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "durationSec" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "callId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "type" "TaskType" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "ActivityType" NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus",
    "detail" TEXT,
    "callId" TEXT,
    "noteId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_leadId_createdAt_idx" ON "Note"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_leadId_createdAt_idx" ON "Activity"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_code_key" ON "Lead"("code");

-- CreateIndex
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_lastInteractionAt_idx" ON "Lead"("lastInteractionAt");

-- CreateIndex
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill ------------------------------------------------------------------------------------------

-- Last interaction = latest call on the lead.
UPDATE "Lead" l SET "lastInteractionAt" = c.last
FROM (SELECT "leadId", MAX("calledAt") AS last FROM "Call" WHERE "leadId" IS NOT NULL GROUP BY "leadId") c
WHERE l."id" = c."leadId";

-- Owner: link the legacy free-text owner to a team member with the same name, when exactly one matches.
UPDATE "Lead" l SET "ownerId" = u."id"
FROM "User" u
WHERE l."ownerId" IS NULL
  AND l."ownerName" <> ''
  AND LOWER(TRIM(u."name")) = LOWER(TRIM(l."ownerName"))
  AND (SELECT COUNT(*) FROM "User" u2 WHERE LOWER(TRIM(u2."name")) = LOWER(TRIM(l."ownerName"))) = 1;

-- Legacy next action -> an open follow-up task linked to the lead.
INSERT INTO "Task" ("id", "title", "type", "dueAt", "leadId", "userId", "createdAt")
SELECT 'mig' || md5(l."id" || 'next'), l."nextAction", 'FOLLOW_UP', l."nextActionAt", l."id", l."ownerId", l."createdAt"
FROM "Lead" l
WHERE l."nextAction" IS NOT NULL AND l."nextActionAt" IS NOT NULL;

-- Timeline starts with a "created this lead" entry for every existing lead.
INSERT INTO "Activity" ("id", "leadId", "type", "detail", "toStatus", "createdAt")
SELECT 'mig' || md5(l."id" || 'created'), l."id", 'CREATED',
       'Added manually' || CASE WHEN l."ownerName" <> '' THEN ' · Owner: ' || l."ownerName" ELSE '' END,
       l."status", l."createdAt"
FROM "Lead" l;

-- Existing calls on leads appear on the timeline too.
INSERT INTO "Activity" ("id", "leadId", "type", "callId", "createdAt")
SELECT 'mig' || md5(c."id" || 'call'), c."leadId", 'CALL_LOGGED', c."id", c."calledAt"
FROM "Call" c
WHERE c."leadId" IS NOT NULL;
