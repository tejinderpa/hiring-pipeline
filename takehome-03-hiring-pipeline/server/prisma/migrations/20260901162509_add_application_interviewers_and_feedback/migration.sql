-- CreateTable
CREATE TABLE "ApplicationInterviewer" (
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationInterviewer_pkey" PRIMARY KEY ("applicationId","interviewerId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationInterviewer_interviewerId_idx" ON "ApplicationInterviewer"("interviewerId");

-- CreateIndex
CREATE INDEX "Feedback_applicationId_createdAt_idx" ON "Feedback"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_interviewerId_idx" ON "Feedback"("interviewerId");

-- AddForeignKey
ALTER TABLE "ApplicationInterviewer" ADD CONSTRAINT "ApplicationInterviewer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationInterviewer" ADD CONSTRAINT "ApplicationInterviewer_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
