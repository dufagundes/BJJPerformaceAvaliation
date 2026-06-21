-- 02_create_indexes.sql
-- Run second in Supabase SQL Editor.

BEGIN;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

CREATE UNIQUE INDEX "StaffMember_userId_key" ON "StaffMember"("userId");
CREATE INDEX "StaffMember_isActive_idx" ON "StaffMember"("isActive");

CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");
CREATE INDEX "Contact_isActive_idx" ON "Contact"("isActive");
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

CREATE INDEX "EvaluationCycle_subjectId_idx" ON "EvaluationCycle"("subjectId");
CREATE INDEX "EvaluationCycle_createdBy_idx" ON "EvaluationCycle"("createdBy");
CREATE INDEX "EvaluationCycle_status_idx" ON "EvaluationCycle"("status");
CREATE INDEX "EvaluationCycle_deadline_idx" ON "EvaluationCycle"("deadline");

CREATE UNIQUE INDEX "Reviewer_inviteToken_key" ON "Reviewer"("inviteToken");
CREATE INDEX "Reviewer_cycleId_idx" ON "Reviewer"("cycleId");
CREATE INDEX "Reviewer_userId_idx" ON "Reviewer"("userId");
CREATE INDEX "Reviewer_contactId_idx" ON "Reviewer"("contactId");
CREATE INDEX "Reviewer_type_idx" ON "Reviewer"("type");
CREATE INDEX "Reviewer_status_idx" ON "Reviewer"("status");
CREATE INDEX "Reviewer_tokenExpiresAt_idx" ON "Reviewer"("tokenExpiresAt");
CREATE UNIQUE INDEX "Reviewer_cycleId_userId_type_key" ON "Reviewer"("cycleId", "userId", "type");
CREATE UNIQUE INDEX "Reviewer_cycleId_contactId_type_key" ON "Reviewer"("cycleId", "contactId", "type");

CREATE UNIQUE INDEX "EvaluationResponse_reviewerId_key" ON "EvaluationResponse"("reviewerId");
CREATE INDEX "EvaluationResponse_reviewerId_idx" ON "EvaluationResponse"("reviewerId");

CREATE UNIQUE INDEX "EvaluationGroup_name_key" ON "EvaluationGroup"("name");
CREATE INDEX "EvaluationGroup_name_idx" ON "EvaluationGroup"("name");

CREATE INDEX "EvaluationSession_audienceType_idx" ON "EvaluationSession"("audienceType");
CREATE UNIQUE INDEX "EvaluationSession_audienceType_name_key" ON "EvaluationSession"("audienceType", "name");

CREATE INDEX "EvaluationQuestion_sessionId_idx" ON "EvaluationQuestion"("sessionId");
CREATE INDEX "EvaluationQuestion_order_idx" ON "EvaluationQuestion"("order");
CREATE UNIQUE INDEX "EvaluationQuestion_sessionId_order_key" ON "EvaluationQuestion"("sessionId", "order");

CREATE INDEX "EvaluationFormQuestion_staffRole_idx" ON "EvaluationFormQuestion"("staffRole");
CREATE INDEX "EvaluationFormQuestion_audienceType_idx" ON "EvaluationFormQuestion"("audienceType");
CREATE INDEX "EvaluationFormQuestion_order_idx" ON "EvaluationFormQuestion"("order");
CREATE UNIQUE INDEX "EvaluationFormQuestion_staffRole_audienceType_order_key" ON "EvaluationFormQuestion"("staffRole", "audienceType", "order");

COMMIT;
