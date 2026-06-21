-- 01_create_enums_and_tables.sql
-- Run first in Supabase SQL Editor.

BEGIN;

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'PEER', 'PARENT_STUDENT');
CREATE TYPE "EvaluationCycleStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "ReviewerType" AS ENUM ('PARENT_STUDENT', 'PEER');
CREATE TYPE "ReviewerStatus" AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE "EvaluationQuestionType" AS ENUM ('RATING', 'MULTIPLE_CHOICE', 'TEXT');
CREATE TYPE "EvaluationAudienceType" AS ENUM ('PEER', 'PARENT_STUDENT', 'ALL');
CREATE TYPE "ContactType" AS ENUM ('STUDENT', 'PARENT');

-- Create tables
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

CREATE TABLE "StaffMember" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "AdminConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultCycleDurationDays" INTEGER NOT NULL DEFAULT 15,
    "defaultContactsToInvite" INTEGER NOT NULL DEFAULT 5,
    "reminderScheduleDaysBefore" INTEGER[] DEFAULT ARRAY[3, 1]::INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminConfig_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "EvaluationResponse" (
    "id" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,
    CONSTRAINT "EvaluationResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationGroup" (
    "id" UUID NOT NULL,
    "name" "ReviewerType" NOT NULL,
    "weight" DECIMAL(8,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EvaluationGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationSession" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "audienceType" "EvaluationAudienceType" NOT NULL,
    "weight" DECIMAL(8,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EvaluationSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationQuestion" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "type" "EvaluationQuestionType" NOT NULL,
    "weight" DECIMAL(8,6) NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "EvaluationQuestion_pkey" PRIMARY KEY ("id")
);

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

COMMIT;
