#!/usr/bin/env node
/**
 * Send SMS Reminders for Evaluations
 * 
 * Usage:
 *   node --env-file=.env scripts/send-sms-reminders.mjs
 *   node --env-file=.env scripts/send-sms-reminders.mjs --days 3,1
 *   node --env-file=.env scripts/send-sms-reminders.mjs --summary
 */

import { sendEvaluationReminders, getReminderSummary } from "../lib/smsReminders.js";

const args = process.argv.slice(2);
const showSummary = args.includes("--summary");
const daysArg = args.find((arg) => arg.startsWith("--days"));
let daysToRemind = undefined;

if (daysArg) {
  const daysStr = daysArg.split("=")[1];
  daysToRemind = daysStr?.split(",").map((d) => parseInt(d.trim()));
}

async function main() {
  try {
    if (showSummary) {
      console.log("📋 Reminder Summary\n");
      const summary = await getReminderSummary();
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log("🚀 Sending SMS Reminders");
    console.log("─".repeat(50));

    const result = await sendEvaluationReminders(daysToRemind);

    console.log("─".repeat(50));
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
