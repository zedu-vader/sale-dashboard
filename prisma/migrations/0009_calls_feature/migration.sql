-- Calls integration for the current Prisma schema. Call.outcome and Call.durationSec
-- are legacy columns and remain in place for older writers and historical records.
CREATE TYPE "CallConnectionStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED');
CREATE TYPE "CallDisposition" AS ENUM (
  'REQUESTED_CALLBACK', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'OTHER', 'NOT_APPLICABLE'
);

ALTER TABLE "Call"
  ALTER COLUMN "outcome" DROP NOT NULL,
  ADD COLUMN "callerName" TEXT,
  ADD COLUMN "connectionStatus" "CallConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
  ADD COLUMN "callOutcome" "CallDisposition" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "followUpAt" TIMESTAMP(3);

-- Preserve the legacy category and the established dashboard rule that only NO_ANSWER
-- means the call did not connect.
UPDATE "Call" SET "connectionStatus" = 'NOT_CONNECTED', "callOutcome" = 'NOT_APPLICABLE'
  WHERE "outcome" = 'NO_ANSWER';
UPDATE "Call" SET "connectionStatus" = 'CONNECTED', "callOutcome" = 'NOT_INTERESTED'
  WHERE "outcome" = 'NOT_INTERESTED';
UPDATE "Call" SET "connectionStatus" = 'CONNECTED', "callOutcome" = 'OTHER'
  WHERE "outcome" IN ('CONNECTED', 'OTHER');
UPDATE "Call" c SET "callerName" = COALESCE(NULLIF(BTRIM(u."name"), ''), u."email")
FROM "User" u WHERE c."userId" = u."id" AND c."callerName" IS NULL;

ALTER TABLE "Call" ADD CONSTRAINT "Call_connection_outcome_check" CHECK (
  ("connectionStatus" = 'NOT_CONNECTED' AND "callOutcome" = 'NOT_APPLICABLE') OR
  ("connectionStatus" = 'CONNECTED' AND "callOutcome" <> 'NOT_APPLICABLE')
);

-- Keep old application writers coherent during rollout. New writers set callOutcome/status
-- directly and leave the legacy outcome untouched.
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

CREATE INDEX "Call_userId_idx" ON "Call"("userId");
CREATE INDEX "Call_connectionStatus_calledAt_idx" ON "Call"("connectionStatus", "calledAt");
CREATE INDEX "Call_callOutcome_calledAt_idx" ON "Call"("callOutcome", "calledAt");
CREATE INDEX "Task_callId_idx" ON "Task"("callId");
