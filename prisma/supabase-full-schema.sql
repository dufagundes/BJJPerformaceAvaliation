-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'PEER', 'PARENT_STUDENT');

-- CreateEnum
CREATE TYPE "EvaluationCycleStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewerType" AS ENUM ('PARENT_STUDENT', 'PEER');

-- CreateEnum
CREATE TYPE "ReviewerStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EvaluationQuestionType" AS ENUM ('RATING', 'MULTIPLE_CHOICE', 'TEXT');

-- CreateEnum
CREATE TYPE "EvaluationAudienceType" AS ENUM ('PEER', 'PARENT_STUDENT', 'ALL');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('STUDENT', 'PARENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "type" "ContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "studentName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultCycleDurationDays" INTEGER NOT NULL DEFAULT 15,
    "defaultContactsToInvite" INTEGER NOT NULL DEFAULT 5,
    "reminderScheduleDaysBefore" INTEGER[] DEFAULT ARRAY[3, 1]::INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCycle" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EvaluationCycleStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "EvaluationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviewer" (
    "id" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "userId" UUID,
    "contactId" UUID,
    "type" "ReviewerType" NOT NULL,
    "status" "ReviewerStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResponse" (
    "id" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,
    "strengths_text" TEXT,
    "improvements_text" TEXT,

    CONSTRAINT "EvaluationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationGroup" (
    "id" UUID NOT NULL,
    "name" "ReviewerType" NOT NULL,
    "weight" DECIMAL(8,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationSession" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "audienceType" "EvaluationAudienceType" NOT NULL,
    "weight" DECIMAL(8,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationQuestion" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "type" "EvaluationQuestionType" NOT NULL,
    "weight" DECIMAL(8,6) NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "EvaluationQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationFormQuestion" (
    "id" UUID NOT NULL,
    "staffRole" TEXT NOT NULL DEFAULT '',
    "audienceType" "EvaluationAudienceType" NOT NULL DEFAULT 'ALL',
    "text" TEXT NOT NULL,
    "type" "EvaluationQuestionType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationFormQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_userId_key" ON "StaffMember"("userId");

-- CreateIndex
CREATE INDEX "StaffMember_isActive_idx" ON "StaffMember"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_isActive_idx" ON "Contact"("isActive");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "EvaluationCycle_subjectId_idx" ON "EvaluationCycle"("subjectId");

-- CreateIndex
CREATE INDEX "EvaluationCycle_createdBy_idx" ON "EvaluationCycle"("createdBy");

-- CreateIndex
CREATE INDEX "EvaluationCycle_status_idx" ON "EvaluationCycle"("status");

-- CreateIndex
CREATE INDEX "EvaluationCycle_deadline_idx" ON "EvaluationCycle"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "Reviewer_inviteToken_key" ON "Reviewer"("inviteToken");

-- CreateIndex
CREATE INDEX "Reviewer_cycleId_idx" ON "Reviewer"("cycleId");

-- CreateIndex
CREATE INDEX "Reviewer_userId_idx" ON "Reviewer"("userId");

-- CreateIndex
CREATE INDEX "Reviewer_contactId_idx" ON "Reviewer"("contactId");

-- CreateIndex
CREATE INDEX "Reviewer_type_idx" ON "Reviewer"("type");

-- CreateIndex
CREATE INDEX "Reviewer_status_idx" ON "Reviewer"("status");

-- CreateIndex
CREATE INDEX "Reviewer_tokenExpiresAt_idx" ON "Reviewer"("tokenExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reviewer_cycleId_userId_type_key" ON "Reviewer"("cycleId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Reviewer_cycleId_contactId_type_key" ON "Reviewer"("cycleId", "contactId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationResponse_reviewerId_key" ON "EvaluationResponse"("reviewerId");

-- CreateIndex
CREATE INDEX "EvaluationResponse_reviewerId_idx" ON "EvaluationResponse"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationGroup_name_key" ON "EvaluationGroup"("name");

-- CreateIndex
CREATE INDEX "EvaluationGroup_name_idx" ON "EvaluationGroup"("name");

-- CreateIndex
CREATE INDEX "EvaluationSession_audienceType_idx" ON "EvaluationSession"("audienceType");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationSession_audienceType_name_key" ON "EvaluationSession"("audienceType", "name");

-- CreateIndex
CREATE INDEX "EvaluationQuestion_sessionId_idx" ON "EvaluationQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "EvaluationQuestion_order_idx" ON "EvaluationQuestion"("order");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationQuestion_sessionId_order_key" ON "EvaluationQuestion"("sessionId", "order");

-- CreateIndex
CREATE INDEX "EvaluationFormQuestion_staffRole_idx" ON "EvaluationFormQuestion"("staffRole");

-- CreateIndex
CREATE INDEX "EvaluationFormQuestion_audienceType_idx" ON "EvaluationFormQuestion"("audienceType");

-- CreateIndex
CREATE INDEX "EvaluationFormQuestion_order_idx" ON "EvaluationFormQuestion"("order");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationFormQuestion_staffRole_audienceType_order_key" ON "EvaluationFormQuestion"("staffRole", "audienceType", "order");

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCycle" ADD CONSTRAINT "EvaluationCycle_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCycle" ADD CONSTRAINT "EvaluationCycle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviewer" ADD CONSTRAINT "Reviewer_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviewer" ADD CONSTRAINT "Reviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviewer" ADD CONSTRAINT "Reviewer_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResponse" ADD CONSTRAINT "EvaluationResponse_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationQuestion" ADD CONSTRAINT "EvaluationQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EvaluationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

