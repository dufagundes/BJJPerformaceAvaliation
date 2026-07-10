import twilio from "twilio";
import { logSmsMessage } from "./messageLogging";

export type SendSmsResult = {
  ok: boolean;
  sid?: string;
  error?: string;
  message?: string;
};

export type SmsTemplateConfig = {
  invite?: string;
  reminder?: string;
  completion?: string;
};

const DEFAULT_TEMPLATES: Required<SmsTemplateConfig> = {
  invite: "Hi {name}, you're invited to evaluate. {link}",
  reminder: "{name}, reminder: {days} days left. {link}",
  completion: "Thank you {name}!",
};

export { DEFAULT_TEMPLATES };

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    if (name === "TWILIO_ACCOUNT_SID") {
      throw new Error(
        "Twilio is not configured. Add TWILIO_ACCOUNT_SID in your environment variables."
      );
    }
    if (name === "TWILIO_AUTH_TOKEN") {
      throw new Error(
        "Twilio is not configured. Add TWILIO_AUTH_TOKEN in your environment variables."
      );
    }
    if (name === "TWILIO_PHONE_NUMBER") {
      throw new Error(
        "Twilio is not configured. Add TWILIO_PHONE_NUMBER in your environment variables."
      );
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    throw new Error(
      `Phone number must be in E.164 format (e.g., +1234567890). Got: ${phone}`
    );
  }
  return cleaned;
}

export async function sendSms(
  to: string | string[],
  message: string,
  metadata?: {
    schoolId?: string;
    cycleId?: string;
    reviewerId?: string;
    messageType?: string;
  }
): Promise<SendSmsResult> {
  try {
    const accountSid = getRequiredEnv("TWILIO_ACCOUNT_SID");
    const authToken = getRequiredEnv("TWILIO_AUTH_TOKEN");
    const fromNumber = getRequiredEnv("TWILIO_PHONE_NUMBER");

    const client = twilio(accountSid, authToken);

    const recipients = Array.isArray(to) ? to : [to];

    if (recipients.length === 0) {
      throw new Error("At least one recipient phone number is required.");
    }

    // Format and validate all phone numbers
    const formattedNumbers = recipients.map((num) => {
      const cleaned = num.trim();
      if (!cleaned) {
        throw new Error("Phone number cannot be empty.");
      }
      return formatPhoneNumber(cleaned);
    });

    // Send to all recipients (Twilio sends one message per recipient)
    if (formattedNumbers.length === 1) {
      const result = await client.messages.create({
        from: fromNumber,
        to: formattedNumbers[0],
        body: message,
      });

      // Log the message if metadata provided
      if (metadata?.schoolId) {
        await logSmsMessage({
          schoolId: metadata.schoolId,
          cycleId: metadata.cycleId,
          reviewerId: metadata.reviewerId,
          twilioSid: result.sid,
          toPhone: formattedNumbers[0],
          fromPhone: fromNumber,
          messageBody: message,
          messageType: metadata.messageType || "other",
        }).catch((error) => {
          console.warn("Failed to log SMS message:", error);
        });
      }

      return {
        ok: true,
        sid: result.sid,
        message: `SMS sent successfully to ${formattedNumbers[0]}`,
      };
    } else {
      // Send to multiple recipients
      const results = await Promise.all(
        formattedNumbers.map((num) =>
          client.messages.create({
            from: fromNumber,
            to: num,
            body: message,
          })
        )
      );

      // Log all messages if metadata provided
      if (metadata?.schoolId) {
        await Promise.all(
          results.map((result, index) =>
            logSmsMessage({
              schoolId: metadata.schoolId,
              cycleId: metadata.cycleId,
              reviewerId: metadata.reviewerId,
              twilioSid: result.sid,
              toPhone: formattedNumbers[index],
              fromPhone: fromNumber,
              messageBody: message,
              messageType: metadata.messageType || "other",
            }).catch((error) => {
              console.warn("Failed to log SMS message:", error);
            })
          )
        );
      }

      return {
        ok: true,
        sid: results[0].sid,
        message: `SMS sent successfully to ${results.length} recipient(s)`,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("SMS sending error:", errorMessage);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

export async function sendEvaluationInviteSms(
  phoneNumber: string,
  name: string,
  evaluationLink: string,
  template?: string
): Promise<SendSmsResult> {
  const messageTemplate = template || DEFAULT_TEMPLATES.invite;
  const message = messageTemplate
    .replace("{name}", name)
    .replace("{link}", evaluationLink)
    .replace("{subject}", "staff evaluation"); // Generic fallback
  return sendSms(phoneNumber, message);
}

export async function sendReminderSms(
  phoneNumber: string,
  name: string,
  daysDue: number,
  template?: string
): Promise<SendSmsResult> {
  const messageTemplate = template || DEFAULT_TEMPLATES.reminder;
  const message = messageTemplate
    .replace("{name}", name)
    .replace("{days}", daysDue.toString())
    .replace("{link}", ""); // Link not typically included in reminders
  return sendSms(phoneNumber, message.trim());
}

export async function sendCompletionConfirmationSms(
  phoneNumber: string,
  name: string,
  template?: string
): Promise<SendSmsResult> {
  const messageTemplate = template || DEFAULT_TEMPLATES.completion;
  const message = messageTemplate.replace("{name}", name);
  return sendSms(phoneNumber, message);
}
