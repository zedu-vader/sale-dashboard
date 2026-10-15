-- Add new call fields alongside the original outcome column so existing rows
-- and older writers remain compatible during the application rollout.
CREATE TYPE "CallConnectionStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED');
CREATE TYPE "CallDisposition" AS ENUM (
    'REQUESTED_CALLBACK', 'INTERESTED', 'NOT_INTERESTED',
    'CONVERTED', 'OTHER', 'NOT_APPLICABLE'
);
CREATE TYPE "TaskType" AS ENUM ('CALL', 'EMAIL', 'NOTE');

ALTER TABLE "Call"
    ADD COLUMN "callerId" TEXT,
    ADD COLUMN "callerName" TEXT,
    ADD COLUMN "durationSeconds" INTEGER,
    ADD COLUMN "connectionStatus" "CallConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    ADD COLUMN "callOutcome" "CallDisposition" NOT NULL DEFAULT 'OTHER',
    ADD COLUMN "notes" TEXT,
    ADD COLUMN "nextAction" TEXT,
    ADD COLUMN "followUpAt" TIMESTAMP(3);

-- Legacy dashboard semantics counted only NO_ANSWER as unanswered. Keep that exact mapping.
-- Retain the source enum in legacyOutcome, then choose a neutral/current outcome for the new column.
UPDATE "Call" SET "connectionStatus" = 'NOT_CONNECTED', "callOutcome" = 'NOT_APPLICABLE'
  WHERE "outcome" = 'NO_ANSWER';
UPDATE "Call" SET "connectionStatus" = 'CONNECTED', "callOutcome" = 'NOT_INTERESTED'
  WHERE "outcome" = 'NOT_INTERESTED';
UPDATE "Call" SET "connectionStatus" = 'CONNECTED', "callOutcome" = 'OTHER'
  WHERE "outcome" IN ('CONNECTED', 'OTHER');

ALTER TABLE "Call" ADD CONSTRAINT "Call_connection_outcome_check" CHECK (
    ("connectionStatus" = 'NOT_CONNECTED' AND "callOutcome" = 'NOT_APPLICABLE') OR
    ("connectionStatus" = 'CONNECTED' AND "callOutcome" <> 'NOT_APPLICABLE')
);

-- Optionality lets calls created by the new API omit this legacy-only column.
ALTER TABLE "Call" ALTER COLUMN "outcome" DROP NOT NULL;

-- Keep writes from an older application version's legacy Call API coherent
-- until the Prisma-backed Calls API is the only writer.
CREATE FUNCTION sync_legacy_call_outcome() RETURNS trigger AS $$
BEGIN
    IF NEW."outcome" = 'NO_ANSWER' THEN
        NEW."connectionStatus" := 'NOT_CONNECTED';
        NEW."callOutcome" := 'NOT_APPLICABLE';
    ELSIF NEW."outcome" = 'NOT_INTERESTED' THEN
        NEW."connectionStatus" := 'CONNECTED';
        NEW."callOutcome" := 'NOT_INTERESTED';
    ELSIF NEW."outcome" IN ('CONNECTED', 'OTHER') THEN
        NEW."connectionStatus" := 'CONNECTED';
        NEW."callOutcome" := 'OTHER';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Call_sync_legacy_outcome"
BEFORE INSERT OR UPDATE OF "outcome" ON "Call"
FOR EACH ROW EXECUTE FUNCTION sync_legacy_call_outcome();

ALTER TABLE "Task"
    ADD COLUMN "type" "TaskType",
    ADD COLUMN "ownerName" TEXT NOT NULL DEFAULT 'You',
    ADD COLUMN "leadName" TEXT,
    ADD COLUMN "leadId" TEXT,
    ADD COLUMN "callId" TEXT;

CREATE INDEX "Call_callerId_idx" ON "Call"("callerId");
CREATE INDEX "Call_connectionStatus_calledAt_idx" ON "Call"("connectionStatus", "calledAt");
CREATE INDEX "Call_callOutcome_calledAt_idx" ON "Call"("callOutcome", "calledAt");
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");
CREATE INDEX "Task_callId_idx" ON "Task"("callId");

ALTER TABLE "Call" ADD CONSTRAINT "Call_callerId_fkey"
    FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_callId_fkey"
    FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;
