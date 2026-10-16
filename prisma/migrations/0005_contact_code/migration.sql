-- Contact codes (CT-####): existing contacts are numbered from 1001 in creation order; new contacts continue the sequence.

-- CreateSequence
CREATE SEQUENCE "Contact_code_seq" START WITH 1001;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "code" INTEGER;

-- Backfill existing rows in creation order.
UPDATE "Contact" c SET "code" = s.n
FROM (SELECT "id", 1000 + ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS n FROM "Contact") s
WHERE c."id" = s."id";
SELECT setval('"Contact_code_seq"', GREATEST((SELECT MAX("code") FROM "Contact"), 1000));
ALTER TABLE "Contact" ALTER COLUMN "code" SET DEFAULT nextval('"Contact_code_seq"'),
ALTER COLUMN "code" SET NOT NULL;
ALTER SEQUENCE "Contact_code_seq" OWNED BY "Contact"."code";

-- CreateIndex
CREATE UNIQUE INDEX "Contact_code_key" ON "Contact"("code");
