import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";
import { sendEvaluationReminderEmail } from "../../../../../../lib/evaluationWorkflowEmails";
import { prisma } from "../../../../../../lib/prisma";

function daysUntil(deadline: Date): number {
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ cycleId: string }> },
) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  const { cycleId } = await context.params;
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required." }, { status: 400 });
  }

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      deadline: true,
      subject: {
        select: { name: true },
      },
      reviewers: {
        where: {
          status: "PENDING",
        },
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
        },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const results: Array<{
    reviewerId: string;
    email: string;
    ok: boolean;
    deliveryId?: string;
    error?: string;
  }> = [];

  for (const reviewer of cycle.reviewers) {
    if (reviewer.tokenExpiresAt.getTime() < Date.now()) {
      results.push({
        reviewerId: reviewer.id,
        email: reviewer.user?.email || reviewer.contact?.email || "",
        ok: false,
        error: "Invite token is expired.",
      });
      continue;
    }

    const target = reviewer.user || reviewer.contact;
    if (!target?.email) {
      results.push({
        reviewerId: reviewer.id,
        email: "",
        ok: false,
        error: "Reviewer has no email address.",
      });
      continue;
    }

    const delivery = await sendEvaluationReminderEmail(target.email, {
      reviewerName: target.name,
      subjectName: cycle.subject.name,
      deadline: cycle.deadline,
      inviteToken: reviewer.inviteToken,
      daysRemaining: daysUntil(cycle.deadline),
    });

    results.push({
      reviewerId: reviewer.id,
      email: target.email,
      ok: delivery.ok,
      deliveryId: delivery.id,
      error: delivery.error,
    });
  }

  const sent = results.filter((item) => item.ok).length;
  const failed = results.length - sent;

  return NextResponse.json(
    {
      ok: true,
      cycleId: cycle.id,
      sent,
      failed,
      results,
    },
    { status: 200 },
  );
}