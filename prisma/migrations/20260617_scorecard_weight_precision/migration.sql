ALTER TABLE "EvaluationGroup"
ALTER COLUMN "weight" TYPE DECIMAL(8,6);

ALTER TABLE "EvaluationSession"
ALTER COLUMN "weight" TYPE DECIMAL(8,6);

ALTER TABLE "EvaluationQuestion"
ALTER COLUMN "weight" TYPE DECIMAL(8,6);