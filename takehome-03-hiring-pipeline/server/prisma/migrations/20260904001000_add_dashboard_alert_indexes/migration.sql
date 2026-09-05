-- CreateIndex
CREATE INDEX IF NOT EXISTS "Application_stage_idx" ON "Application"("stage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Application_stageEnteredAt_idx" ON "Application"("stageEnteredAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Application_interviewScheduledAt_idx" ON "Application"("interviewScheduledAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Application_appliedAt_idx" ON "Application"("appliedAt");
