import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../../../../lib/adminAuth";
import { sendEvaluationInvitationEmail } from "../../../../../../../../lib/evaluationWorkflowEmails";
import { prisma } from "../../../../../../../../lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ cycleId: string; reviewerId: string }> },
) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  const { cycleId, reviewerId } = await context.params;
  if (!cycleId || !reviewerId) {
    return NextResponse.json({ error: "cycleId and reviewerId are required." }, { status: 400 });
  }

  const reviewer = await prisma.reviewer.findFirst({
    where: {
      id: reviewerId,
      cycleId,
    },
    select: {
      id: true,
      inviteToken: true,
      tokenExpiresAt: true,
      cycle: {
        select: {
          deadline: true,
          subject: {
            select: { name: true },
          },
        },
      },
      user: {
        select: { name: true, email: true },
      },
      contact: {
        select: { name: true, email: true },
      },
    },
  });

  if (!reviewer) {
    return NextResponse.json({ error: "Reviewer not found." }, { status: 404 });
  }

  if (reviewer.tokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite token is expired." }, { status: 400 });
  }

  const target = reviewer.user || reviewer.contact;
  if (!target?.email) {
    return NextResponse.json({ error: "Reviewer has no email address." }, { status: 400 });
  }

  const delivery = await sendEvaluationInvitationEmail(target.email, {
    reviewerName: target.name,
    subjectName: reviewer.cycle.subject.name,
    deadline: reviewer.cycle.deadline,
    inviteToken: reviewer.inviteToken,
  });

  if (!delivery.ok) {
    return NextResponse.json(
      {
        ok: false,
        email: target.email,
        error: delivery.error || "Resend failed to deliver the invitation.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      email: target.email,
      deliveryId: delivery.id,
    },
    { status: 200 },
  );
}