-- Add open-ended response fields to EvaluationResponse table
ALTER TABLE "EvaluationResponse" ADD COLUMN "strengths_text" TEXT;
ALTER TABLE "EvaluationResponse" ADD COLUMN "improvements_text" TEXT;
