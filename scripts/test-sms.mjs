#!/usr/bin/env node
/**
 * Test Twilio SMS Integration
 * Run with: node --env-file=.env scripts/test-sms.mjs
 *
 * Before running:
 * 1. Add your Twilio credentials to .env:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER (sender number, e.g., +1234567890)
 *
 * 2. Update TEST_PHONE_NUMBER below with the number to test
 */

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// CHANGE THIS TO YOUR TEST PHONE NUMBER
const TEST_PHONE_NUMBER = "+19258527902";

if (!accountSid || !authToken || !fromNumber) {
  console.error("❌ Error: Twilio credentials not configured");
  console.error("Please add the following to your .env file:");
  console.error("  TWILIO_ACCOUNT_SID=your_account_sid");
  console.error("  TWILIO_AUTH_TOKEN=your_auth_token");
  console.error("  TWILIO_PHONE_NUMBER=+1234567890");
  process.exit(1);
}

if (TEST_PHONE_NUMBER === "+1234567890") {
  console.error(
    "❌ Error: TEST_PHONE_NUMBER is not configured in the script"
  );
  console.error("Edit scripts/test-sms.mjs and update TEST_PHONE_NUMBER");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testSms() {
  console.log("🚀 Testing Twilio SMS Integration");
  console.log("─".repeat(50));
  console.log(`From: ${fromNumber}`);
  console.log(`To: ${TEST_PHONE_NUMBER}`);
  console.log("─".repeat(50));

  try {
    console.log("\n📤 Sending test SMS...");

    const message = await client.messages.create({
      from: fromNumber,
      to: TEST_PHONE_NUMBER,
      body: "🎓 Test SMS from GB Staff Performance - Integration working!",
    });

    console.log("✅ SMS sent successfully!");
    console.log(`Message SID: ${message.sid}`);
    console.log(`Status: ${message.status}`);
    console.log("\nCheck your phone for the text message (may take a few seconds)");
  } catch (error) {
    console.error("❌ Error sending SMS:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.message.includes("is not a valid")) {
        console.error(
          "\n💡 Tip: Make sure your phone number is in E.164 format: +1234567890"
        );
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testSms();
