import { Resend } from "resend";

type TestEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAppUrl(): string {
  const appUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  return appUrl;
}

export async function sendTestEmail(to: string | string[]): Promise<TestEmailResult> {
  try {
    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0 || recipients.some((recipient) => recipient.trim().length === 0)) {
      throw new Error("At least one recipient email is required.");
    }

    const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
    const from = getRequiredEnv("EMAIL_FROM");
    const schoolName = process.env.SCHOOL_NAME?.trim() || "Your School";
    const appUrl = getAppUrl();

    const response = await resend.emails.send({
      from,
      to: recipients,
      subject: `[${schoolName}] Test email`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <p>This is a test email from the Gb Staff Performance app.</p>
          <p>If you received this message, the Resend integration is working.</p>
          <p>App URL: <a href="${appUrl}">${appUrl}</a></p>
        </div>
      `,
      text: `This is a test email from the Gb Staff Performance app. If you received this message, the Resend integration is working. App URL: ${appUrl}`,
    });

    if (response.error) {
      return {
        ok: false,
        error: response.error.message || "Resend failed to send the test email.",
      };
    }

    return { ok: true, id: response.data?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send test email.",
    };
  }
}