import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

type EmailTemplateInput = {
  templateType: "invitation" | "reminder" | "self_evaluation";
  subject: string;
  htmlContent: string;
  textContent: string;
};

// Default templates with magic links
const DEFAULT_TEMPLATES: Record<string, EmailTemplateInput> = {
  invitation: {
    templateType: "invitation",
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
            <p style="margin: 0 0 16px;">You have been invited to share feedback for <strong>{subjectName}</strong>. Your observations help create a fairer, more useful picture of their contributions.</p>
            <p style="margin: 0 0 20px;">The evaluation is short, confidential, and focused on practical feedback that supports professional growth.</p>
            <div style="margin: 0 0 24px; padding: 14px 16px; border-left: 4px solid #C8102E; background: #f9fafb; color: #374151;">
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
    textContent: `Hi {reviewerName},\n\nYou have been invited to share feedback for {subjectName}. Your observations help create a fairer, more useful picture of their contributions.\n\nDeadline: {deadline}\n\nFill Out Evaluation: {magicLink}\n\nThis invitation is personal to you. No account is required.`,
  },
  reminder: {
    templateType: "reminder",
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
    textContent: `Hi {reviewerName},\n\nReminder: complete your evaluation for {subjectName}. This closes in {daysRemaining}. Your experience helps the school recognize strengths and identify where support would make the biggest difference.\n\nDeadline: {deadline}\n\nFill Out Evaluation: {magicLink}\n\nThis invitation is personal to you. No account is required.`,
  },
  self_evaluation: {
    templateType: "self_evaluation",
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
    textContent: `Hi {staffName},\n\nYou have been invited to complete a self evaluation for {cycleName}. This is your opportunity to describe your accomplishments, strengths, challenges, improvement areas, and goals in your own words.\n\nDeadline: {deadline}\n\nComplete Self Evaluation: {magicLink}\n\nThis private link is personal to you. No account is required.`,
  },
};

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { schoolId: adminSession.schoolId },
    });

    return NextResponse.json({
      templates,
      defaults: DEFAULT_TEMPLATES,
      placeholders: {
        invitation: ["{reviewerName}", "{subjectName}", "{deadline}", "{magicLink}"],
        reminder: ["{reviewerName}", "{subjectName}", "{deadline}", "{daysRemaining}", "{magicLink}"],
        self_evaluation: ["{staffName}", "{cycleName}", "{deadline}", "{magicLink}"],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await request.json() as { templates: EmailTemplateInput[] };

    if (!Array.isArray(body.templates)) {
      return NextResponse.json({ error: "templates must be an array" }, { status: 400 });
    }

    const updatedTemplates = [];

    for (const template of body.templates) {
      if (!["invitation", "reminder", "self_evaluation"].includes(template.templateType)) {
        return NextResponse.json(
          { error: `Invalid template type: ${template.templateType}` },
          { status: 400 }
        );
      }

      if (!template.subject || !template.htmlContent || !template.textContent) {
        return NextResponse.json(
          { error: "subject, htmlContent, and textContent are required" },
          { status: 400 }
        );
      }

      const updated = await prisma.emailTemplate.upsert({
        where: {
          schoolId_templateType: {
            schoolId: adminSession.schoolId,
            templateType: template.templateType,
          },
        },
        update: {
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
        },
        create: {
          schoolId: adminSession.schoolId,
          templateType: template.templateType,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
        },
      });

      updatedTemplates.push(updated);
    }

    return NextResponse.json({ templates: updatedTemplates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
