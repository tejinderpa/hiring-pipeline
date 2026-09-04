-- AlterTable
ALTER TABLE "Application" ADD COLUMN "stageEnteredAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN "interviewScheduledAt" TIMESTAMP(3);

-- Backfill stageEnteredAt from the latest event that put the application into its
-- current stage when possible. Fall back to appliedAt for older/demo rows with no
-- usable stage event history.
UPDATE "Application" AS application
SET "stageEnteredAt" = COALESCE(
  (
    SELECT event."createdAt"
    FROM "ApplicationEvent" AS event
    WHERE event."applicationId" = application."id"
      AND event."newStage" = application."stage"
    ORDER BY event."createdAt" DESC
    LIMIT 1
  ),
  application."appliedAt"
);

ALTER TABLE "Application" ALTER COLUMN "stageEnteredAt" SET NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "stageEnteredAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "AlertDismissal" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stage" "ApplicationStage" NOT NULL,
    "dismissedBy" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertDismissal_applicationId_stage_key" ON "AlertDismissal"("applicationId", "stage");

-- CreateIndex
CREATE INDEX "AlertDismissal_dismissedBy_idx" ON "AlertDismissal"("dismissedBy");

-- AddForeignKey
ALTER TABLE "AlertDismissal" ADD CONSTRAINT "AlertDismissal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDismissal" ADD CONSTRAINT "AlertDismissal_dismissedBy_fkey" FOREIGN KEY ("dismissedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
