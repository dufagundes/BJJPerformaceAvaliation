import { Resend } from "resend";
import { logEmailMessage } from "./messageLogging";
import { getEmailTemplate } from "./emailTemplates";

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

function substitutePlaceholders(content: string, replacements: Record<string, string>): string {
  let result = content;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, "g"), value);
  });
  return result;
}

export async function buildInvitationEmailTemplate(
  input: InviteTemplateInput,
  schoolId: string
): Promise<MailTemplate> {
  const reviewLink = getReviewLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);

  // Fetch from database or get defaults
  const dbTemplate = await getEmailTemplate(schoolId, "invitation");

  const substitutions = {
    reviewerName: input.reviewerName,
    subjectName: input.subjectName,
    deadline: deadlineDate,
    magicLink: reviewLink,
  };

  return {
    subject: substitutePlaceholders(dbTemplate.subject, substitutions),
    html: substitutePlaceholders(dbTemplate.htmlContent, substitutions) + buildFooterHtml(),
    text: substitutePlaceholders(dbTemplate.textContent, substitutions) + `\n\n${buildFooterText()}`,
  };
}

export async function buildReminderEmailTemplate(
  input: ReminderTemplateInput,
  schoolId: string
): Promise<MailTemplate> {
  const reviewLink = getReviewLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);
  const label = input.daysRemaining <= 1 ? "1 day" : `${input.daysRemaining} days`;

  // Fetch from database or get defaults
  const dbTemplate = await getEmailTemplate(schoolId, "reminder");

  const substitutions = {
    reviewerName: input.reviewerName,
    subjectName: input.subjectName,
    deadline: deadlineDate,
    daysRemaining: label,
    magicLink: reviewLink,
  };

  return {
    subject: substitutePlaceholders(dbTemplate.subject, substitutions),
    html: substitutePlaceholders(dbTemplate.htmlContent, substitutions) + buildFooterHtml(),
    text: substitutePlaceholders(dbTemplate.textContent, substitutions) + `\n\n${buildFooterText()}`,
  };
}

export async function buildSelfEvaluationEmailTemplate(
  input: SelfEvaluationTemplateInput,
  schoolId: string
): Promise<MailTemplate> {
  const selfEvaluationLink = getSelfEvaluationLink(input.inviteToken);
  const deadlineDate = formatDate(input.deadline);

  // Fetch from database or get defaults
  const dbTemplate = await getEmailTemplate(schoolId, "self_evaluation");

  const substitutions = {
    staffName: input.staffName,
    cycleName: input.cycleName,
    deadline: deadlineDate,
    magicLink: selfEvaluationLink,
  };

  return {
    subject: substitutePlaceholders(dbTemplate.subject, substitutions),
    html: substitutePlaceholders(dbTemplate.htmlContent, substitutions) + buildFooterHtml(),
    text: substitutePlaceholders(dbTemplate.textContent, substitutions) + `\n\n${buildFooterText()}`,
  };
}

async function sendMail(
  to: string,
  template: MailTemplate,
  metadata?: {
    schoolId?: string;
    cycleId?: string;
    reviewerId?: string;
    messageType?: string;
  }
): Promise<MailDelivery> {
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

    // Log the email if metadata provided
    if (metadata?.schoolId && response.data?.id) {
      await logEmailMessage({
        schoolId: metadata.schoolId,
        cycleId: metadata.cycleId,
        reviewerId: metadata.reviewerId,
        resendId: response.data.id,
        toEmail: to,
        fromEmail: formatFromAddress(from),
        subject: template.subject,
        htmlContent: template.html,
        messageType: metadata.messageType || "other",
      }).catch((error) => {
        console.warn("Failed to log email message:", error);
      });
    }

    return { ok: true, id: response.data?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}

export async function sendEvaluationInvitationEmail(
  to: string,
  input: InviteTemplateInput,
  schoolId: string,
  metadata?: { cycleId?: string; reviewerId?: string }
): Promise<MailDelivery> {
  const template = await buildInvitationEmailTemplate(input, schoolId);
  return sendMail(to, template, {
    schoolId,
    ...metadata,
    messageType: "invite",
  });
}

export async function sendEvaluationReminderEmail(
  to: string,
  input: ReminderTemplateInput,
  schoolId: string,
  metadata?: { cycleId?: string; reviewerId?: string }
): Promise<MailDelivery> {
  const template = await buildReminderEmailTemplate(input, schoolId);
  return sendMail(to, template, {
    schoolId,
    ...metadata,
    messageType: "reminder",
  });
}

export async function sendSelfEvaluationEmail(
  to: string,
  input: SelfEvaluationTemplateInput,
  schoolId: string,
  metadata?: { cycleId?: string; reviewerId?: string }
): Promise<MailDelivery> {
  const template = await buildSelfEvaluationEmailTemplate(input, schoolId);
  return sendMail(to, template, {
    schoolId,
    ...metadata,
    messageType: "self-evaluation",
  });
}