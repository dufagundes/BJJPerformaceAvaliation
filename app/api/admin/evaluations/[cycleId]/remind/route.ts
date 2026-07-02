import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";
import { sendEvaluationInvitationEmail, sendEvaluationReminderEmail, sendSelfEvaluationEmail } from "../../../../../../lib/evaluationWorkflowEmails";
import { prisma } from "../../../../../../lib/prisma";

function daysUntil(deadline: Date): number {
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ cycleId: string }> },
) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const { cycleId } = await context.params;
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required." }, { status: 400 });
  }

  let template: "invitation" | "reminder" = "reminder";
  try {
    const payload = (await request.json()) as { template?: string };
    if (payload.template === "invitation") {
      template = "invitation";
    }
  } catch {
    template = "reminder";
  }

  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, schoolId: adminSession.schoolId },
    select: {
      id: true,
      description: true,
      deadline: true,
      subject: {
        select: { name: true, email: true },
      },
      selfEvaluation: {
        select: {
          id: true,
          status: true,
          inviteToken: true,
          tokenExpiresAt: true,
        },
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
    kind: "self-evaluation" | "reviewer";
    reviewerId: string;
    email: string;
    ok: boolean;
    deliveryId?: string;
    error?: string;
  }> = [];

  let selfEvaluation = cycle.selfEvaluation;
  if (!selfEvaluation) {
    selfEvaluation = await prisma.selfEvaluation.create({
      data: {
        cycleId: cycle.id,
        inviteToken: randomUUID(),
        tokenExpiresAt: cycle.deadline,
      },
      select: {
        id: true,
        status: true,
        inviteToken: true,
        tokenExpiresAt: true,
      },
    });
  }

  if (selfEvaluation.status !== "COMPLETED") {
    if (selfEvaluation.tokenExpiresAt.getTime() < Date.now()) {
      results.push({
        kind: "self-evaluation",
        reviewerId: selfEvaluation.id,
        email: cycle.subject.email,
        ok: false,
        error: "Self evaluation link is expired.",
      });
    } else if (!cycle.subject.email) {
      results.push({
        kind: "self-evaluation",
        reviewerId: selfEvaluation.id,
        email: "",
        ok: false,
        error: "Staff member has no email address.",
      });
    } else {
      const delivery = await sendSelfEvaluationEmail(cycle.subject.email, {
        staffName: cycle.subject.name,
        cycleName: cycle.description,
        deadline: cycle.deadline,
        inviteToken: selfEvaluation.inviteToken,
      });

      results.push({
        kind: "self-evaluation",
        reviewerId: selfEvaluation.id,
        email: cycle.subject.email,
        ok: delivery.ok,
        deliveryId: delivery.id,
        error: delivery.error,
      });
    }
  }

  for (const reviewer of cycle.reviewers) {
    if (reviewer.tokenExpiresAt.getTime() < Date.now()) {
      results.push({
        kind: "reviewer",
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
        kind: "reviewer",
        reviewerId: reviewer.id,
        email: "",
        ok: false,
        error: "Reviewer has no email address.",
      });
      continue;
    }

    const emailInput = {
      reviewerName: target.name,
      subjectName: cycle.subject.name,
      deadline: cycle.deadline,
      inviteToken: reviewer.inviteToken,
    };

    const delivery = template === "invitation"
      ? await sendEvaluationInvitationEmail(target.email, emailInput)
      : await sendEvaluationReminderEmail(target.email, {
          ...emailInput,
          daysRemaining: daysUntil(cycle.deadline),
        });

    results.push({
      kind: "reviewer",
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
      template,
      sent,
      failed,
      results,
    },
    { status: 200 },
  );
}