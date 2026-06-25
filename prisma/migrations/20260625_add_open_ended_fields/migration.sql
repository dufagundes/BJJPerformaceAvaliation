-- Add open-ended response fields to EvaluationResponse table
ALTER TABLE "EvaluationResponse" ADD COLUMN IF NOT EXISTS "strengths_text" TEXT;
ALTER TABLE "EvaluationResponse" ADD COLUMN IF NOT EXISTS "improvements_text" TEXT;
