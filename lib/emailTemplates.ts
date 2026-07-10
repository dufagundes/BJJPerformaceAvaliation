import { prisma } from "./prisma";

export type EmailTemplateType = "invitation" | "reminder" | "self_evaluation";

export type EmailTemplate = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

// Default templates
const DEFAULT_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  invitation: {
    subject: "GB Staff Evaluation: feedback request for {subjectName}",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; background: #ffffff;">
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 28px 32px; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe;">Performance Evaluation</p>
            <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Your perspective can help {subjectName} grow</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px;">Hi {reviewerName},</p>
            <p style="margin: 0 0 16px;">You have been invited to share feedback for <strong>{subjectName}</strong>. Families, students, and colleagues each see different parts of a school community, and your observations help create a fairer, more useful picture.</p>
            <p style="margin: 0 0 20px;">The evaluation is short, confidential, and focused on practical feedback that can support professional growth.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
              <strong>School:</strong> {schoolName}<br />
              <strong>Deadline:</strong> {deadline}<br />
              No account is required. This invitation is personal to you.
            </div>
            <p style="margin: 0;">
              <a href="{magicLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;">
                Fill Out Evaluation
              </a>
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `Hi {reviewerName},\n\nYou have been invited to share feedback for {subjectName}. Families, students, and colleagues each see different parts of a school community, and your observations help create a fairer, more useful picture.\n\nThe evaluation is short, confidential, and focused on practical feedback that can support professional growth.\n\nSchool: {schoolName}\nDeadline: {deadline}\n\nFill Out Evaluation: {magicLink}\n\nThis invitation is personal to you. No account is required.`,
  },
  reminder: {
    subject: "GB Staff Evaluation: reminder for {subjectName}",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; background: #ffffff;">
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 28px 32px; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe;">Evaluation Reminder</p>
            <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Feedback for {subjectName} closes in {daysRemaining}</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px;">Hi {reviewerName},</p>
            <p style="margin: 0 0 16px;">This is a reminder to complete your confidential evaluation for <strong>{subjectName}</strong>. Your experience helps the school recognize strengths and identify where support would make the biggest difference.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
              <strong>School:</strong> {schoolName}<br />
              <strong>Deadline:</strong> {deadline}<br />
              No account is required. This invitation is personal to you.
            </div>
            <p style="margin: 0;">
              <a href="{magicLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;">
                Fill Out Evaluation
              </a>
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `Hi {reviewerName},\n\nReminder: complete your evaluation for {subjectName}. This closes in {daysRemaining}. Your experience helps the school recognize strengths and identify where support would make the biggest difference.\n\nSchool: {schoolName}\nDeadline: {deadline}\n\nFill Out Evaluation: {magicLink}\n\nThis invitation is personal to you. No account is required.`,
  },
  self_evaluation: {
    subject: "GB Staff Evaluation: self evaluation for {cycleName}",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; background: #ffffff;">
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 28px 32px; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe;">Self Evaluation</p>
            <h1 style="margin: 0; font-size: 24px; line-height: 1.25;">Reflect on your progress before your review meeting</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px;">Hi {staffName},</p>
            <p style="margin: 0 0 16px;">You have been invited to complete a self evaluation for <strong>{cycleName}</strong>. This is your opportunity to describe your accomplishments, strengths, challenges, improvement areas, and goals in your own words.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
              <strong>School:</strong> {schoolName}<br />
              <strong>Deadline:</strong> {deadline}<br />
              No account is required. This private link is personal to you.
            </div>
            <p style="margin: 0;">
              <a href="{magicLink}" style="display:inline-block;background:#C8102E;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;">
                Complete Self Evaluation
              </a>
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `Hi {staffName},\n\nYou have been invited to complete a self evaluation for {cycleName}. This is your opportunity to describe your accomplishments, strengths, challenges, improvement areas, and goals in your own words.\n\nSchool: {schoolName}\nDeadline: {deadline}\n\nComplete Self Evaluation: {magicLink}\n\nThis private link is personal to you. No account is required.`,
  },
};

/**
 * Get email template for a school, falling back to default if not customized
 */
export async function getEmailTemplate(
  schoolId: string,
  templateType: EmailTemplateType
): Promise<EmailTemplate> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: {
        schoolId_templateType: {
          schoolId,
          templateType,
        },
      },
    });

    if (template) {
      return {
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      };
    }
  } catch (error) {
    console.warn(`Failed to fetch email template: ${error}`);
  }

  // Return default template
  return DEFAULT_TEMPLATES[templateType];
}

/**
 * Get all email templates for a school
 */
export async function getEmailTemplates(schoolId: string) {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { schoolId },
    });

    return templates;
  } catch (error) {
    console.warn(`Failed to fetch email templates: ${error}`);
    return [];
  }
}

/**
 * Save email template for a school
 */
export async function saveEmailTemplate(
  schoolId: string,
  templateType: EmailTemplateType,
  template: EmailTemplate
) {
  return prisma.emailTemplate.upsert({
    where: {
      schoolId_templateType: {
        schoolId,
        templateType,
      },
    },
    update: {
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
    },
    create: {
      schoolId,
      templateType,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
    },
  });
}
