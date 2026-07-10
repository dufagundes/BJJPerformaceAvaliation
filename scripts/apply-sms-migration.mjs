#!/usr/bin/env node
/**
 * Apply SMS phone fields migration manually
 * This adds phone columns to Contact and User tables without losing data
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("🚀 Applying SMS phone fields migration...\n");

    // Check if columns already exist
    const contactPhoneExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Contact' AND column_name = 'phone'
      )`
    );

    if (contactPhoneExists[0]?.exists) {
      console.log("✓ Contact.phone column already exists, skipping...");
    } else {
      console.log("Adding phone column to Contact table...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Contact" ADD COLUMN "phone" TEXT`
      );
      console.log("✓ Phone column added to Contact table");

      console.log("Creating index on Contact.phone...");
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "Contact_phone_idx" ON "Contact"("phone")`
      );
      console.log("✓ Index created");
    }

    const userPhoneExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'phone'
      )`
    );

    if (userPhoneExists[0]?.exists) {
      console.log("✓ User.phone column already exists, skipping...");
    } else {
      console.log("\nAdding phone column to User table...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "User" ADD COLUMN "phone" TEXT`
      );
      console.log("✓ Phone column added to User table");

      console.log("Creating index on User.phone...");
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "User_phone_idx" ON "User"("phone")`
      );
      console.log("✓ Index created");
    }

    const cycleRemindersExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'EvaluationCycle' AND column_name = 'remindersSentAt'
      )`
    );

    if (cycleRemindersExists[0]?.exists) {
      console.log("✓ EvaluationCycle.remindersSentAt column already exists, skipping...");
    } else {
      console.log("\nAdding remindersSentAt column to EvaluationCycle table...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "EvaluationCycle" ADD COLUMN "remindersSentAt" JSONB`
      );
      console.log("✓ remindersSentAt column added");
    }

    const smsTemplatesExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AdminConfig' AND column_name = 'smsTemplates'
      )`
    );

    if (smsTemplatesExists[0]?.exists) {
      console.log("✓ AdminConfig.smsTemplates column already exists, skipping...");
    } else {
      console.log("\nAdding smsTemplates column to AdminConfig table...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "AdminConfig" ADD COLUMN "smsTemplates" JSONB`
      );
      console.log("✓ smsTemplates column added");
    }

    // Check for new message tracking tables
    const smsMessageTableExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SmsMessage'
      )`
    );

    if (smsMessageTableExists[0]?.exists) {
      console.log("✓ SmsMessage table already exists, skipping...");
    } else {
      console.log("\nCreating SmsMessage table...");
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "SmsMessage" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "schoolId" UUID NOT NULL,
          "cycleId" UUID,
          "reviewerId" UUID,
          "twilioSid" TEXT NOT NULL UNIQUE,
          "toPhone" TEXT NOT NULL,
          "fromPhone" TEXT NOT NULL,
          "messageBody" TEXT NOT NULL,
          "messageType" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'sent',
          "deliveredAt" TIMESTAMP(3),
          "failureReason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SmsMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT,
          CONSTRAINT "SmsMessage_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE SET NULL,
          CONSTRAINT "SmsMessage_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer" ("id") ON DELETE SET NULL,
          PRIMARY KEY ("id")
        )`
      );
      console.log("✓ SmsMessage table created");

      console.log("Creating SmsMessage indexes...");
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsMessage_schoolId_idx" ON "SmsMessage"("schoolId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsMessage_cycleId_idx" ON "SmsMessage"("cycleId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsMessage_reviewerId_idx" ON "SmsMessage"("reviewerId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsMessage_status_idx" ON "SmsMessage"("status")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsMessage_createdAt_idx" ON "SmsMessage"("createdAt")`
      );
    }

    const smsReplyTableExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SmsReply'
      )`
    );

    if (smsReplyTableExists[0]?.exists) {
      console.log("✓ SmsReply table already exists, skipping...");
    } else {
      console.log("\nCreating SmsReply table...");
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "SmsReply" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "schoolId" UUID NOT NULL,
          "twilioSid" TEXT NOT NULL UNIQUE,
          "originalSid" TEXT NOT NULL,
          "replyFromPhone" TEXT NOT NULL,
          "replyToPhone" TEXT NOT NULL,
          "messageBody" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SmsReply_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT,
          PRIMARY KEY ("id")
        )`
      );
      console.log("✓ SmsReply table created");

      console.log("Creating SmsReply indexes...");
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsReply_schoolId_idx" ON "SmsReply"("schoolId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsReply_originalSid_idx" ON "SmsReply"("originalSid")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SmsReply_createdAt_idx" ON "SmsReply"("createdAt")`
      );
    }

    const emailMessageTableExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'EmailMessage'
      )`
    );

    if (emailMessageTableExists[0]?.exists) {
      console.log("✓ EmailMessage table already exists, skipping...");
    } else {
      console.log("\nCreating EmailMessage table...");
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "EmailMessage" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "schoolId" UUID NOT NULL,
          "cycleId" UUID,
          "reviewerId" UUID,
          "resendId" TEXT NOT NULL UNIQUE,
          "toEmail" TEXT NOT NULL,
          "fromEmail" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "htmlContent" TEXT NOT NULL,
          "messageType" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'sent',
          "deliveredAt" TIMESTAMP(3),
          "failureReason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EmailMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT,
          CONSTRAINT "EmailMessage_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE SET NULL,
          CONSTRAINT "EmailMessage_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer" ("id") ON DELETE SET NULL,
          PRIMARY KEY ("id")
        )`
      );
      console.log("✓ EmailMessage table created");

      console.log("Creating EmailMessage indexes...");
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "EmailMessage_schoolId_idx" ON "EmailMessage"("schoolId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "EmailMessage_cycleId_idx" ON "EmailMessage"("cycleId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "EmailMessage_reviewerId_idx" ON "EmailMessage"("reviewerId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "EmailMessage_status_idx" ON "EmailMessage"("status")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "EmailMessage_createdAt_idx" ON "EmailMessage"("createdAt")`
      );
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("Phone number support is now ready to use.");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      console.log("✓ Columns already exist, no changes needed");
    } else {
      console.error("❌ Migration failed:");
      console.error(error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
