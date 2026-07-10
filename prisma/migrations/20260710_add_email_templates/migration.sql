-- Create EmailTemplate table for customizable email templates
CREATE TABLE "EmailTemplate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL,
  "templateType" TEXT NOT NULL, -- 'invitation', 'reminder', 'self_evaluation'
  "subject" TEXT NOT NULL,
  "htmlContent" TEXT NOT NULL,
  "textContent" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE,
  CONSTRAINT "EmailTemplate_unique_school_type" UNIQUE ("schoolId", "templateType"),
  PRIMARY KEY ("id")
);

CREATE INDEX "EmailTemplate_schoolId_idx" ON "EmailTemplate"("schoolId");
