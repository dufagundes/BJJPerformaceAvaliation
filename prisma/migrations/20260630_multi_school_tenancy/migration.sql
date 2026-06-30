CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "School" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "School_name_key" ON "School"("name");
CREATE INDEX "School_isActive_idx" ON "School"("isActive");

INSERT INTO "School" ("id", "name", "isActive", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default School', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "User" ADD COLUMN "schoolId" UUID;
UPDATE "User" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "schoolId" SET NOT NULL;
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contact" ADD COLUMN "schoolId" UUID;
UPDATE "Contact" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "Contact" ALTER COLUMN "schoolId" SET NOT NULL;
DROP INDEX IF EXISTS "Contact_email_key";
CREATE INDEX "Contact_schoolId_idx" ON "Contact"("schoolId");
CREATE UNIQUE INDEX "Contact_schoolId_email_key" ON "Contact"("schoolId", "email");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvaluationCycle" ADD COLUMN "schoolId" UUID;
UPDATE "EvaluationCycle"
SET "schoolId" = "User"."schoolId"
FROM "User"
WHERE "EvaluationCycle"."subjectId" = "User"."id";
UPDATE "EvaluationCycle" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "EvaluationCycle" ALTER COLUMN "schoolId" SET NOT NULL;
CREATE INDEX "EvaluationCycle_schoolId_idx" ON "EvaluationCycle"("schoolId");
ALTER TABLE "EvaluationCycle" ADD CONSTRAINT "EvaluationCycle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminConfig" ADD COLUMN "schoolId" UUID;
UPDATE "AdminConfig" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "AdminConfig" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "AdminConfig" DROP CONSTRAINT IF EXISTS "AdminConfig_pkey";
ALTER TABLE "AdminConfig" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "AdminConfig" ALTER COLUMN "id" TYPE UUID USING (
  CASE
    WHEN "id" = 'default' THEN gen_random_uuid()
    ELSE "id"::uuid
  END
);
ALTER TABLE "AdminConfig" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "AdminConfig" ADD CONSTRAINT "AdminConfig_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "AdminConfig_schoolId_key" ON "AdminConfig"("schoolId");
ALTER TABLE "AdminConfig" ADD CONSTRAINT "AdminConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;