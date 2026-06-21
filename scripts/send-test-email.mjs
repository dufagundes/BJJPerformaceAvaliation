import { sendTestEmail } from "../lib/testEmail.ts";

async function main() {
  const result = await sendTestEmail();

  if (!result.ok) {
    throw new Error(result.error || "Resend failed to send the test email.");
  }

  console.log("Test email sent.");
  console.log(`Message ID: ${result.id ?? "unknown"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to send test email.");
  process.exitCode = 1;
});