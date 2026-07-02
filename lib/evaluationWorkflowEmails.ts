import { Resend } from "resend";

type InviteTemplateInput = {
  reviewerName: string;
  subjectName: string;
  deadline: Date;
  inviteToken: string;
};

type SelfEvaluationTemplateInput = {
  staffName: string;
  cycleName: string;
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

const BRAND_NAME = "GB Staff Evaluation";

export type MailDelivery = {
  ok: boolean;
  id?: string;
  error?: string;
};

function getAppUrl(): string {
  const appUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";

  if (appUrl.startsWith("http://") || appUrl.startsWith("https://")) {
    return appUrl.replace(/\/$/, "");
  }

  return `https://${appUrl.replace(/\/$/, "")}`;
}

function getReviewLink(inviteToken: string): string {
  return `${getAppUrl()}/evaluate/${inviteToken}`;
}

function getSelfEvaluationLink(inviteToken: string): string {
  return `${getAppUrl()}/self-evaluate/${inviteToken}`;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatFromAddress(from: string): string {
  if (from.includes("<") && from.includes(">")) {
    return from;
  }

  return `${BRAND_NAME} <${from}>`;
}

function buildFooterHtml(): string {
  return `
    <div style="padding: 18px 32px 26px; color: #6b7280; font-size: 12px; line-height: 1.5;">
      <p style="margin: 0 0 6px;">You are receiving this because your school invited you to provide feedback through ${BRAND_NAME}.</p>
      <p style="margin: 0;">Sent by ${BRAND_NAME} for bjjstaffvaluation.com.</p>
    </div>
  `;
}

function buildFooterText(): string {
  return `You are receiving this because your school invited you to provide feedback through ${BRAND_NAME}.\nSent by ${BRAND_NAME} for bjjstaffvaluation.com.`;
}

export function buildInvitationEmailTemplate(input: InviteTemplateInput): MailTemplate {
  const reviewLink = getReviewLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);

  return {
    subject: `${BRAND_NAME}: feedback request for ${input.subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; background: #ffffff;">
        <div style="display:none;max-height:0;overflow:hidden;color:#ffffff;opacity:0;">Your school invited you to provide feedback for ${input.subjectName}.</div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 28px 32px; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe;">Performance Evaluation</p>
            <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Your perspective can help ${input.subjectName} grow</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px;">Hi ${input.reviewerName},</p>
            <p style="margin: 0 0 16px;">You have been invited to share feedback for <strong>${input.subjectName}</strong>. Families, students, and colleagues each see different parts of a school community, and your observations help create a fairer, more useful picture.</p>
            <p style="margin: 0 0 20px;">The evaluation is short, confidential, and focused on practical feedback that can support professional growth.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
              <strong>Deadline:</strong> ${deadlineDate}<br />
              No account is required. This invitation is personal to you.
            </div>
            <p style="margin: 0;">
              <a href="${reviewLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;">
                Fill Out Evaluation
              </a>
            </p>
          </div>
          ${buildFooterHtml()}
        </div>
      </div>
    `,
    text: `Hi ${input.reviewerName},\n\nYour school invited you to share feedback for ${input.subjectName}. Families, students, and colleagues each see different parts of a school community, and your observations help create a fairer, more useful picture.\n\nDeadline: ${deadlineDate}\n\nFill Out Evaluation: ${reviewLink}\n\nThis invitation is personal to you. No account is required.\n\n${buildFooterText()}`,
  };
}

export function buildReminderEmailTemplate(input: ReminderTemplateInput): MailTemplate {
  const reviewLink = getReviewLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);
  const label = input.daysRemaining <= 1 ? "1 day" : `${input.daysRemaining} days`;

  return {
    subject: `${BRAND_NAME}: evaluation reminder for ${input.subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; background: #ffffff;">
        <div style="display:none;max-height:0;overflow:hidden;color:#ffffff;opacity:0;">Your school invited you to complete feedback for ${input.subjectName}.</div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 28px 32px; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe;">Evaluation Reminder</p>
            <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Feedback for ${input.subjectName} closes in ${label}</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px;">Hi ${input.reviewerName},</p>
            <p style="margin: 0 0 16px;">This is a reminder to complete your confidential evaluation for <strong>${input.subjectName}</strong>. Your experience can help the school recognize strengths and identify where support would make the biggest difference.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
              <strong>Deadline:</strong> ${deadlineDate}<br />
              No account is required. This invitation is personal to you.
            </div>
            <p style="margin: 0;">
              <a href="${reviewLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;">
                Fill Out Evaluation
              </a>
            </p>
          </div>
          ${buildFooterHtml()}
        </div>
      </div>
    `,
    text: `Hi ${input.reviewerName},\n\nReminder: your school invited you to complete feedback for ${input.subjectName}. This evaluation closes in ${label}. Your experience can help the school recognize strengths and identify where support would make the biggest difference.\n\nDeadline: ${deadlineDate}\n\nFill Out Evaluation: ${reviewLink}\n\nThis invitation is personal to you. No account is required.\n\n${buildFooterText()}`,
  };
}

export function buildSelfEvaluationEmailTemplate(input: SelfEvaluationTemplateInput): MailTemplate {
  const selfEvaluationLink = getSelfEvaluationLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);

  return {
    subject: `${BRAND_NAME}: self evaluation for ${input.cycleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; background: #ffffff;">
        <div style="display:none;max-height:0;overflow:hidden;color:#ffffff;opacity:0;">Your school invited you to complete your self evaluation.</div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 28px 32px; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe;">Self Evaluation</p>
            <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Reflect on your progress before your review meeting</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px;">Hi ${input.staffName},</p>
            <p style="margin: 0 0 16px;">You have been invited to complete a self evaluation for <strong>${input.cycleName}</strong>. This is not part of your scorecard. It is your opportunity to describe your accomplishments, strengths, challenges, improvement areas, and goals in your own words.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
              <strong>Deadline:</strong> ${deadlineDate}<br />
              No account is required. This private link is personal to you.
            </div>
            <p style="margin: 0;">
              <a href="${selfEvaluationLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;">
                Complete Self Evaluation
              </a>
            </p>
          </div>
          ${buildFooterHtml()}
        </div>
      </div>
    `,
    text: `Hi ${input.staffName},\n\nYour school invited you to complete a self evaluation for ${input.cycleName}. This is not part of your scorecard. It is your opportunity to describe your accomplishments, strengths, challenges, improvement areas, and goals in your own words.\n\nDeadline: ${deadlineDate}\n\nComplete Self Evaluation: ${selfEvaluationLink}\n\nThis private link is personal to you. No account is required.\n\n${buildFooterText()}`,
  };
}

async function sendMail(to: string, template: MailTemplate): Promise<MailDelivery> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { ok: false, error: "RESEND_API_KEY is missing." };
    }

    const from = process.env.EMAIL_FROM?.trim();
    if (!from) {
      return { ok: false, error: "EMAIL_FROM is missing." };
    }

    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: formatFromAddress(from),
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

export async function sendSelfEvaluationEmail(to: string, input: SelfEvaluationTemplateInput): Promise<MailDelivery> {
  return sendMail(to, buildSelfEvaluationEmailTemplate(input));
}