-- CreateTable
CREATE TABLE "EvaluationGroup" (
  "id" UUID NOT NULL,
  "name" "ReviewerType" NOT NULL,
  "weight" DECIMAL(5,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EvaluationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationSession" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "audienceType" "EvaluationAudienceType" NOT NULL,
  "weight" DECIMAL(5,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EvaluationSession_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EvaluationQuestion" ADD COLUMN "sessionId" UUID;
ALTER TABLE "EvaluationQuestion" ADD COLUMN "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.00;

-- Migrate existing category/audience questions into sessions before dropping columns
INSERT INTO "EvaluationSession" ("id", "name", "audienceType", "weight", "createdAt", "updatedAt")
SELECT (
  substr(md5(q."audienceType"::text || ':' || q."category"), 1, 8) || '-' ||
  substr(md5(q."audienceType"::text || ':' || q."category"), 9, 4) || '-' ||
  substr(md5(q."audienceType"::text || ':' || q."category"), 13, 4) || '-' ||
  substr(md5(q."audienceType"::text || ':' || q."category"), 17, 4) || '-' ||
  substr(md5(q."audienceType"::text || ':' || q."category"), 21, 12)
)::uuid,
q."category", q."audienceType", 1.00, NOW(), NOW()
FROM (
  SELECT DISTINCT "category", "audienceType" FROM "EvaluationQuestion"
) q;

UPDATE "EvaluationQuestion" q
SET "sessionId" = s."id"
FROM "EvaluationSession" s
WHERE s."name" = q."category"
  AND s."audienceType" = q."audienceType";

ALTER TABLE "EvaluationQuestion" ALTER COLUMN "sessionId" SET NOT NULL;

-- Drop old unique/indexes and columns
DROP INDEX IF EXISTS "EvaluationQuestion_audienceType_order_key";
DROP INDEX IF EXISTS "EvaluationQuestion_category_idx";
DROP INDEX IF EXISTS "EvaluationQuestion_audienceType_idx";
ALTER TABLE "EvaluationQuestion" DROP COLUMN IF EXISTS "category";
ALTER TABLE "EvaluationQuestion" DROP COLUMN IF EXISTS "audienceType";

-- Indexes
CREATE UNIQUE INDEX "EvaluationGroup_name_key" ON "EvaluationGroup"("name");
CREATE INDEX "EvaluationGroup_name_idx" ON "EvaluationGroup"("name");

CREATE UNIQUE INDEX "EvaluationSession_audienceType_name_key" ON "EvaluationSession"("audienceType", "name");
CREATE INDEX "EvaluationSession_audienceType_idx" ON "EvaluationSession"("audienceType");

CREATE INDEX "EvaluationQuestion_sessionId_idx" ON "EvaluationQuestion"("sessionId");
CREATE UNIQUE INDEX "EvaluationQuestion_sessionId_order_key" ON "EvaluationQuestion"("sessionId", "order");

-- AddForeignKey
ALTER TABLE "EvaluationQuestion"
ADD CONSTRAINT "EvaluationQuestion_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "EvaluationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
