-- Create SmsMessage table
CREATE TABLE "SmsMessage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL,
  "cycleId" UUID,
  "reviewerId" UUID,
  "twilioSid" TEXT NOT NULL UNIQUE,
  "toPhone" TEXT NOT NULL,
  "fromPhone" TEXT NOT NULL,
  "messageBody" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "deliveredAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT,
  CONSTRAINT "SmsMessage_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE SET NULL,
  CONSTRAINT "SmsMessage_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- Create SmsMessage indexes
CREATE INDEX "SmsMessage_schoolId_idx" ON "SmsMessage"("schoolId");
CREATE INDEX "SmsMessage_cycleId_idx" ON "SmsMessage"("cycleId");
CREATE INDEX "SmsMessage_reviewerId_idx" ON "SmsMessage"("reviewerId");
CREATE INDEX "SmsMessage_status_idx" ON "SmsMessage"("status");
CREATE INDEX "SmsMessage_createdAt_idx" ON "SmsMessage"("createdAt");

-- Create SmsReply table
CREATE TABLE "SmsReply" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL,
  "twilioSid" TEXT NOT NULL UNIQUE,
  "originalSid" TEXT NOT NULL,
  "replyFromPhone" TEXT NOT NULL,
  "replyToPhone" TEXT NOT NULL,
  "messageBody" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsReply_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT,
  PRIMARY KEY ("id")
);

-- Create SmsReply indexes
CREATE INDEX "SmsReply_schoolId_idx" ON "SmsReply"("schoolId");
CREATE INDEX "SmsReply_originalSid_idx" ON "SmsReply"("originalSid");
CREATE INDEX "SmsReply_createdAt_idx" ON "SmsReply"("createdAt");

-- Create EmailMessage table
CREATE TABLE "EmailMessage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL,
  "cycleId" UUID,
  "reviewerId" UUID,
  "resendId" TEXT NOT NULL UNIQUE,
  "toEmail" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "htmlContent" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "deliveredAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT,
  CONSTRAINT "EmailMessage_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE SET NULL,
  CONSTRAINT "EmailMessage_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- Create EmailMessage indexes
CREATE INDEX "EmailMessage_schoolId_idx" ON "EmailMessage"("schoolId");
CREATE INDEX "EmailMessage_cycleId_idx" ON "EmailMessage"("cycleId");
CREATE INDEX "EmailMessage_reviewerId_idx" ON "EmailMessage"("reviewerId");
CREATE INDEX "EmailMessage_status_idx" ON "EmailMessage"("status");
CREATE INDEX "EmailMessage_createdAt_idx" ON "EmailMessage"("createdAt");
