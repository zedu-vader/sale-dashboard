-- AlterTable: assignee + long description on tasks
ALTER TABLE "Task" ADD COLUMN "description" TEXT,
ADD COLUMN "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
