-- 03_create_foreign_keys.sql
-- Run third in Supabase SQL Editor.

BEGIN;

ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvaluationCycle"
  ADD CONSTRAINT "EvaluationCycle_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvaluationCycle"
  ADD CONSTRAINT "EvaluationCycle_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Reviewer"
  ADD CONSTRAINT "Reviewer_cycleId_fkey"
  FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reviewer"
  ADD CONSTRAINT "Reviewer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Reviewer"
  ADD CONSTRAINT "Reviewer_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvaluationResponse"
  ADD CONSTRAINT "EvaluationResponse_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvaluationQuestion"
  ADD CONSTRAINT "EvaluationQuestion_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "EvaluationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
