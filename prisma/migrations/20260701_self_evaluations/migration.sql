CREATE TYPE "SelfEvaluationStatus" AS ENUM ('PENDING', 'COMPLETED');

CREATE TABLE "SelfEvaluation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cycleId" UUID NOT NULL,
  "inviteToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "status" "SelfEvaluationStatus" NOT NULL DEFAULT 'PENDING',
  "answers" JSONB,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SelfEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SelfEvaluation_cycleId_key" ON "SelfEvaluation"("cycleId");
CREATE UNIQUE INDEX "SelfEvaluation_inviteToken_key" ON "SelfEvaluation"("inviteToken");
CREATE INDEX "SelfEvaluation_status_idx" ON "SelfEvaluation"("status");
CREATE INDEX "SelfEvaluation_tokenExpiresAt_idx" ON "SelfEvaluation"("tokenExpiresAt");

ALTER TABLE "SelfEvaluation" ADD CONSTRAINT "SelfEvaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;