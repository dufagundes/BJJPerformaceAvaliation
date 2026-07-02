ALTER TABLE "EvaluationGroup" ADD COLUMN IF NOT EXISTS "schoolId" UUID;
ALTER TABLE "EvaluationSession" ADD COLUMN IF NOT EXISTS "schoolId" UUID;
ALTER TABLE "EvaluationFormQuestion" ADD COLUMN IF NOT EXISTS "schoolId" UUID;

ALTER TABLE "EvaluationGroup"
ADD CONSTRAINT "EvaluationGroup_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvaluationSession"
ADD CONSTRAINT "EvaluationSession_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvaluationFormQuestion"
ADD CONSTRAINT "EvaluationFormQuestion_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "EvaluationGroup"
SET "schoolId" = (SELECT "id" FROM first_school)
WHERE "schoolId" IS NULL AND EXISTS (SELECT 1 FROM first_school);

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "EvaluationSession"
SET "schoolId" = (SELECT "id" FROM first_school)
WHERE "schoolId" IS NULL AND EXISTS (SELECT 1 FROM first_school);

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "EvaluationFormQuestion"
SET "schoolId" = (SELECT "id" FROM first_school)
WHERE "schoolId" IS NULL AND EXISTS (SELECT 1 FROM first_school);

DROP INDEX IF EXISTS "EvaluationGroup_name_key";
DROP INDEX IF EXISTS "EvaluationSession_audienceType_name_key";
DROP INDEX IF EXISTS "EvaluationFormQuestion_staffRole_audienceType_order_key";

CREATE INDEX IF NOT EXISTS "EvaluationGroup_schoolId_idx" ON "EvaluationGroup"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationGroup_schoolId_name_key" ON "EvaluationGroup"("schoolId", "name");

CREATE INDEX IF NOT EXISTS "EvaluationSession_schoolId_idx" ON "EvaluationSession"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationSession_schoolId_audienceType_name_key" ON "EvaluationSession"("schoolId", "audienceType", "name");

CREATE INDEX IF NOT EXISTS "EvaluationFormQuestion_schoolId_idx" ON "EvaluationFormQuestion"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationFormQuestion_schoolId_staffRole_audienceType_order_key"
ON "EvaluationFormQuestion"("schoolId", "staffRole", "audienceType", "order");

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
), source_groups AS (
  SELECT g.* FROM "EvaluationGroup" g JOIN first_school fs ON g."schoolId" = fs."id"
)
INSERT INTO "EvaluationGroup" ("id", "schoolId", "name", "weight", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."id", g."name", g."weight", NOW(), NOW()
FROM "School" s
CROSS JOIN source_groups g
WHERE s."id" <> g."schoolId"
ON CONFLICT ("schoolId", "name") DO NOTHING;

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
), source_sessions AS (
  SELECT es.* FROM "EvaluationSession" es JOIN first_school fs ON es."schoolId" = fs."id"
)
INSERT INTO "EvaluationSession" ("id", "schoolId", "name", "audienceType", "weight", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."id", es."name", es."audienceType", es."weight", NOW(), NOW()
FROM "School" s
CROSS JOIN source_sessions es
WHERE s."id" <> es."schoolId"
ON CONFLICT ("schoolId", "audienceType", "name") DO NOTHING;

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
), source_questions AS (
  SELECT
    es."name",
    es."audienceType",
    q."text",
    q."type",
    q."weight",
    q."order"
  FROM "EvaluationQuestion" q
  JOIN "EvaluationSession" es ON es."id" = q."sessionId"
  JOIN first_school fs ON es."schoolId" = fs."id"
)
INSERT INTO "EvaluationQuestion" ("id", "sessionId", "text", "type", "weight", "order")
SELECT gen_random_uuid(), target_session."id", q."text", q."type", q."weight", q."order"
FROM source_questions q
JOIN "EvaluationSession" target_session
  ON target_session."name" = q."name"
  AND target_session."audienceType" = q."audienceType"
LEFT JOIN "EvaluationQuestion" existing
  ON existing."sessionId" = target_session."id"
  AND existing."order" = q."order"
WHERE existing."id" IS NULL;

WITH first_school AS (
  SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1
), source_form_questions AS (
  SELECT fq.* FROM "EvaluationFormQuestion" fq JOIN first_school fs ON fq."schoolId" = fs."id"
)
INSERT INTO "EvaluationFormQuestion" (
  "id",
  "schoolId",
  "staffRole",
  "audienceType",
  "text",
  "type",
  "isRequired",
  "options",
  "order",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  s."id",
  fq."staffRole",
  fq."audienceType",
  fq."text",
  fq."type",
  fq."isRequired",
  fq."options",
  fq."order",
  NOW(),
  NOW()
FROM "School" s
CROSS JOIN source_form_questions fq
WHERE s."id" <> fq."schoolId"
ON CONFLICT ("schoolId", "staffRole", "audienceType", "order") DO NOTHING;
