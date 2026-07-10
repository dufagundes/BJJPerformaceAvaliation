#!/usr/bin/env node
/**
 * Test Message History API
 * Run with: node scripts/test-api.mjs
 */

const API_URL = "http://localhost:3000/api/admin/messages";

async function testApi() {
  try {
    console.log("🚀 Testing Message History API");
    console.log("─".repeat(50));
    console.log(`GET ${API_URL}`);
    console.log("─".repeat(50));

    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("\n✅ API Response:");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n📊 Summary:");
    console.log(`  - SMS Messages: ${data.total?.sms || 0}`);
    console.log(`  - Email Messages: ${data.total?.email || 0}`);
    console.log(`  - SMS Replies: ${data.total?.replies || 0}`);

    if (data.total?.sms === 0 && data.total?.email === 0) {
      console.log("\n💡 No messages logged yet. Send some SMS/emails to populate the history.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testApi();
