#!/usr/bin/env node
/**
 * Test SMS Sending with Message Logging
 * Run with: node --env-file=.env scripts/test-sms-with-logging.mjs
 */

import { sendSms } from "../lib/smsService.js";
import { prisma } from "../lib/prisma.js";

const TEST_PHONE_NUMBER = "+19258527902";

async function testSmsWithLogging() {
  try {
    console.log("🚀 Testing SMS with Message Logging");
    console.log("─".repeat(50));

    // Get the first school
    const school = await prisma.school.findFirst({
      where: { isActive: true },
    });

    if (!school) {
      console.error("❌ No active school found in database");
      process.exit(1);
    }

    console.log(`✓ Using school: ${school.name} (${school.id})`);

    // Send SMS with logging metadata
    console.log("\n📤 Sending test SMS...");
    const result = await sendSms(TEST_PHONE_NUMBER, "Test SMS from GB Staff Performance - logging enabled!", {
      schoolId: school.id,
      messageType: "test",
    });

    if (!result.ok) {
      console.error("❌ Error:", result.message);
      process.exit(1);
    }

    console.log("✅ SMS sent successfully!");
    console.log(`Message SID: ${result.sid}`);

    // Query the database to show the logged message
    console.log("\n📊 Checking database for logged message...");
    const loggedMessage = await prisma.smsMessage.findUnique({
      where: { twilioSid: result.sid },
    });

    if (loggedMessage) {
      console.log("✅ Message logged to database!");
      console.log(`  - ID: ${loggedMessage.id}`);
      console.log(`  - To: ${loggedMessage.toPhone}`);
      console.log(`  - Type: ${loggedMessage.messageType}`);
      console.log(`  - Status: ${loggedMessage.status}`);
      console.log(`  - Created: ${loggedMessage.createdAt}`);
    } else {
      console.warn("⚠️  Message not found in database yet (may take a moment)");
    }

    console.log("\n✅ Test complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSmsWithLogging();
