import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";
import { sendSms } from "../../../../../../lib/smsService";
import { normalizePhoneNumber } from "../../../../../../lib/phoneUtils";
import { prisma } from "../../../../../../lib/prisma";

const SMS_SEND_DELAY_MS = 100;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function pauseBeforeSmsSend(attemptCount: number): Promise<void> {
  if (attemptCount > 0) {
    await wait(SMS_SEND_DELAY_MS);
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
            select: { name: true, email: true, phone: true },
          },
          contact: {
            select: { name: true, phone: true },
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
    phone: string;
    ok: boolean;
    error?: string;
  }> = [];

  let smsSendAttempts = 0;

  for (const reviewer of nonRespondents) {
    const phone = reviewer.user?.phone ?? reviewer.contact?.phone;
    const name = reviewer.user?.name ?? reviewer.contact?.name ?? "Reviewer";

    if (!phone) {
      results.push({
        name,
        phone: "",
        ok: false,
        error: "No phone number on file.",
      });
      continue;
    }

    const normalizedPhone = normalizePhoneNumber(phone, "1");
    if (!normalizedPhone) {
      results.push({
        name,
        phone,
        ok: false,
        error: "Invalid phone number format.",
      });
      continue;
    }

    if (reviewer.tokenExpiresAt.getTime() < Date.now()) {
      results.push({
        name,
        phone: normalizedPhone,
        ok: false,
        error: "Invitation link is expired.",
      });
      continue;
    }

    await pauseBeforeSmsSend(smsSendAttempts);
    smsSendAttempts += 1;

    const daysRemaining = Math.max(0, Math.ceil((reviewer.tokenExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    const reminderMessage = `Reminder: You have ${daysRemaining} days left to complete the evaluation for ${cycle.subject.name}. Click to respond: ${process.env.APP_URL || "https://bjjstaffvaluation.com"}/evaluate/${reviewer.inviteToken}`;

    const result = await sendSms(normalizedPhone, reminderMessage, {
      schoolId: adminSession.schoolId,
      cycleId: cycle.id,
      reviewerId: reviewer.id,
      messageType: "reminder",
    });

    results.push({
      name,
      phone: normalizedPhone,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
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
