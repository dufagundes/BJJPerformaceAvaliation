import { Resend } from "resend";

const EVALUATION_BASE_URL = "https://bjjstaff.com/evaluate";
const EMAIL_FROM = "evaluations@bjjstaff.com";

type InviteTemplateInput = {
  reviewerName: string;
  subjectName: string;
  deadline: Date;
  inviteToken: string;
};

type ReminderTemplateInput = InviteTemplateInput & {
  daysRemaining: number;
};

type MailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export type MailDelivery = {
  ok: boolean;
  id?: string;
  error?: string;
};

function getReviewLink(inviteToken: string): string {
  return `${EVALUATION_BASE_URL}/${inviteToken}`;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function buildInvitationEmailTemplate(input: InviteTemplateInput): MailTemplate {
  const reviewLink = getReviewLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);

  return {
    subject: `You're invited to evaluate ${input.subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto;">
        <p>Hi ${input.reviewerName},</p>
        <p>You've been selected to provide feedback for <strong>${input.subjectName}</strong>.</p>
        <p>Deadline: <strong>${deadlineDate}</strong></p>
        <p>
          <a href="${reviewLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">
            Fill Out Evaluation
          </a>
        </p>
        <p style="font-size: 14px; color: #4b5563;">
          This link is personal and expires on ${deadlineDate}. No account needed.
        </p>
        <p style="font-size: 13px; color: #6b7280;">${reviewLink}</p>
      </div>
    `,
    text: `Hi ${input.reviewerName},\n\nYou've been selected to provide feedback for ${input.subjectName}.\nDeadline: ${deadlineDate}\n\nFill Out Evaluation: ${reviewLink}\n\nThis link is personal and expires on ${deadlineDate}. No account needed.`,
  };
}

export function buildReminderEmailTemplate(input: ReminderTemplateInput): MailTemplate {
  const reviewLink = getReviewLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);
  const label = input.daysRemaining <= 1 ? "1 day" : `${input.daysRemaining} days`;

  return {
    subject: `Reminder: Your evaluation closes in ${label}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto;">
        <p>Hi ${input.reviewerName},</p>
        <p>This is a reminder that your evaluation for <strong>${input.subjectName}</strong> closes in <strong>${label}</strong>.</p>
        <p>Deadline: <strong>${deadlineDate}</strong></p>
        <p>
          <a href="${reviewLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">
            Fill Out Evaluation
          </a>
        </p>
        <p style="font-size: 14px; color: #4b5563;">
          This link is personal and expires on ${deadlineDate}. No account needed.
        </p>
        <p style="font-size: 13px; color: #6b7280;">${reviewLink}</p>
      </div>
    `,
    text: `Hi ${input.reviewerName},\n\nReminder: your evaluation for ${input.subjectName} closes in ${label}.\nDeadline: ${deadlineDate}\n\nFill Out Evaluation: ${reviewLink}\n\nThis link is personal and expires on ${deadlineDate}. No account needed.`,
  };
}

async function sendMail(to: string, template: MailTemplate): Promise<MailDelivery> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { ok: false, error: "RESEND_API_KEY is missing." };
    }

    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (response.error) {
      return {
        ok: false,
        error: response.error.message || "Resend failed to deliver email.",
      };
    }

    return { ok: true, id: response.data?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}

export async function sendEvaluationInvitationEmail(to: string, input: InviteTemplateInput): Promise<MailDelivery> {
  return sendMail(to, buildInvitationEmailTemplate(input));
}

export async function sendEvaluationReminderEmail(to: string, input: ReminderTemplateInput): Promise<MailDelivery> {
  return sendMail(to, buildReminderEmailTemplate(input));
}