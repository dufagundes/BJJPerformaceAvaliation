DROP INDEX IF EXISTS "User_email_key";

CREATE UNIQUE INDEX "User_schoolId_email_key" ON "User"("schoolId", "email");
