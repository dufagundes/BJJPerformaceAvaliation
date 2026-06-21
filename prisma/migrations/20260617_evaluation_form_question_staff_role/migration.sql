ALTER TABLE "EvaluationFormQuestion"
ADD COLUMN "staffRole" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "EvaluationFormQuestion_audienceType_order_key";
CREATE INDEX "EvaluationFormQuestion_staffRole_idx" ON "EvaluationFormQuestion"("staffRole");
CREATE UNIQUE INDEX "EvaluationFormQuestion_staffRole_audienceType_order_key"
ON "EvaluationFormQuestion"("staffRole", "audienceType", "order");
