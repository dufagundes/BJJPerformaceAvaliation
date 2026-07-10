import { Resend } from "resend";
import { sendEvaluationInviteSms } from "./smsService";

type SendInviteInput = {
  evaluatorEmail: string;
  evaluatorName: string;
  evaluatorPhone?: string;
  staffFullName: string;
  token: string;
};

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export type InviteDeliveryResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

function getFirstName(fullName: string): string {
  const name = fullName.trim();
  if (!name) {
    return "there";
  }
  return name.split(/\s+/)[0] ?? "there";
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    if (name === "RESEND_API_KEY") {
      throw new Error("Email is not configured. Add RESEND_API_KEY in your environment variables, then redeploy or restart the server.");
    }

    if (name === "EMAIL_FROM") {
      throw new Error("Email sender is not configured. Add EMAIL_FROM in your environment variables, then redeploy or restart the server.");
    }

    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAppUrl(): string {
  const appUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!appUrl) {
    throw new Error("Missing APP_URL (or NEXT_PUBLIC_APP_URL).");
  }

  if (appUrl.startsWith("http://") || appUrl.startsWith("https://")) {
    return appUrl.replace(/\/$/, "");
  }

  return `https://${appUrl.replace(/\/$/, "")}`;
}

export function buildEvaluationLink(token: string): string {
  return `${getAppUrl()}/evaluate/${token}`;
}

export function buildEvaluationInviteTemplate(input: {
  evaluatorName: string;
  staffFullName: string;
  token: string;
}): EmailTemplate {
  const schoolName = process.env.SCHOOL_NAME?.trim() || "Your School";
  const staffFirstName = getFirstName(input.staffFullName);
  const evaluatorFirstName = getFirstName(input.evaluatorName);
  const evaluationLink = buildEvaluationLink(input.token);

  const subject = `[${schoolName}] - Your input matters: Quarterly evaluation for ${staffFirstName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <p>Hi ${evaluatorFirstName},</p>
      <p>We hope you are doing well on and off the mats.</p>
      <p>
        At ${schoolName}, we are committed to building a team that keeps growing - not just
        in technique, but in how we show up for each other and for our students every day.
      </p>
      <p>
        As part of our quarterly evaluation process, we are gathering feedback about ${input.staffFullName}.
        You have been selected because your perspective matters to us.
      </p>
      <p><strong>YOUR RESPONSES ARE COMPLETELY ANONYMOUS.</strong></p>
      <p>
        Your name will never be attached to any individual answer. All feedback is combined
        with responses from others and processed together, so no single person's response
        can be identified.
      </p>
      <p>
        We believe that honest, sincere feedback - given with respect - is one of the most
        valuable gifts we can give a colleague. It helps us celebrate what is working and
        grow in the areas that need attention. This process is not about judgment. It is about
        helping each other become better.
      </p>
      <p>The evaluation takes approximately 5 minutes to complete.</p>
      <p>
        <a href="${evaluationLink}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
          Complete the evaluation ->
        </a>
      </p>
      <p>
        <a href="${evaluationLink}">${evaluationLink}</a>
      </p>
      <p>This link is personal to you. Please do not share it with others.<br />You can start the evaluation and continue later, but your final response can only be submitted once.</p>
      <p>If you have any questions about this process, please reach out to us directly.</p>
      <p>
        Thank you for being part of our team and for helping us grow together.
      </p>
      <p>
        Warm regards,<br />
        ${schoolName} Leadership Team
      </p>
    </div>
  `;

  const text = `Hi ${evaluatorFirstName},

You have been selected to participate in the quarterly evaluation of ${input.staffFullName}
at ${schoolName}.

Your responses are completely anonymous. No individual answer will be linked to your name.

Please click the link below to complete the evaluation (approximately 5 minutes):
${evaluationLink}

This link is personal to you. Please do not share it with others. You can start the evaluation and continue later, but your final response can only be submitted once.
`;

  return { subject, html, text };
}

export async function sendEvaluationInvite(input: SendInviteInput): Promise<InviteDeliveryResult> {
  try {
    const apiKey = getRequiredEnv("RESEND_API_KEY");
    const from = getRequiredEnv("EMAIL_FROM");
    const resend = new Resend(apiKey);
    const template = buildEvaluationInviteTemplate({
      evaluatorName: input.evaluatorName,
      staffFullName: input.staffFullName,
      token: input.token,
    });

    // Send email
    const emailResponse = await resend.emails.send({
      from,
      to: input.evaluatorEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (emailResponse.error) {
      console.error("[email] resend send failed", emailResponse.error);
      return {
        ok: false,
        error: emailResponse.error.message || "Resend failed to deliver the email.",
      };
    }

    // Send SMS if phone number is provided
    if (input.evaluatorPhone?.trim()) {
      const evaluationLink = buildEvaluationLink(input.token);
      const smsResult = await sendEvaluationInviteSms(
        input.evaluatorPhone,
        input.evaluatorName,
        evaluationLink
      );

      if (!smsResult.ok) {
        console.warn("[sms] Failed to send SMS to evaluator:", smsResult.error);
        // Don't fail the whole invite if SMS fails - email was successful
      } else {
        console.log("[sms] Evaluation invite SMS sent successfully");
      }
    }

    return { ok: true, id: emailResponse.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";
    console.error("[email] invite send failed", message);
    return { ok: false, error: message };
  }
}
