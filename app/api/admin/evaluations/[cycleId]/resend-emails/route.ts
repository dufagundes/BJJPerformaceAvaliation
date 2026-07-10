import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";
import { sendEvaluationReminderEmail } from "../../../../../../lib/evaluationWorkflowEmails";
import { prisma } from "../../../../../../lib/prisma";

const EMAIL_SEND_DELAY_MS = 150;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function pauseBeforeEmailSend(attemptCount: number): Promise<void> {
  if (attemptCount > 0) {
    await wait(EMAIL_SEND_DELAY_MS);
  }
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ cycleId: string }> }
) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const { cycleId } = await context.params;
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required." }, { status: 400 });
  }

  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, schoolId: adminSession.schoolId },
    select: {
      id: true,
      description: true,
      deadline: true,
      subject: {
        select: { name: true },
      },
      reviewers: {
        select: {
          id: true,
          inviteToken: true,
          tokenExpiresAt: true,
          type: true,
          user: {
            select: { name: true, email: true },
          },
          contact: {
            select: { name: true, email: true },
          },
          response: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  // Filter to only non-respondents (those without a response yet)
  const nonRespondents = cycle.reviewers.filter((r) => !r.response);

  const results: Array<{
    name: string;
    email: string;
    ok: boolean;
    error?: string;
  }> = [];

  let emailSendAttempts = 0;

  for (const reviewer of nonRespondents) {
    const email = reviewer.user?.email ?? reviewer.contact?.email;
    const name = reviewer.user?.name ?? reviewer.contact?.name ?? "Reviewer";

    if (!email) {
      results.push({
        name,
        email: "",
        ok: false,
        error: "No email address on file.",
      });
      continue;
    }

    if (reviewer.tokenExpiresAt.getTime() < Date.now()) {
      results.push({
        name,
        email,
        ok: false,
        error: "Invitation link is expired.",
      });
      continue;
    }

    await pauseBeforeEmailSend(emailSendAttempts);
    emailSendAttempts += 1;

    const daysRemaining = Math.max(0, Math.ceil((reviewer.tokenExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

    const delivery = await sendEvaluationReminderEmail(email, {
      reviewerName: name,
      subjectName: cycle.subject.name,
      deadline: cycle.deadline,
      inviteToken: reviewer.inviteToken,
      daysRemaining,
    });

    results.push({
      name,
      email,
      ok: delivery.ok,
      error: delivery.ok ? undefined : delivery.error,
    });
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    sent,
    failed,
    total: nonRespondents.length,
    results,
  });
}
