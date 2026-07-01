import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../../../lib/adminAuth";
import { sendSelfEvaluationEmail } from "../../../../../../../lib/evaluationWorkflowEmails";
import { prisma } from "../../../../../../../lib/prisma";

export async function POST(
  _request: Request,
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
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  if (!cycle.subject.email) {
    return NextResponse.json({ error: "Staff member has no email address." }, { status: 400 });
  }

  const selfEvaluation = cycle.selfEvaluation ?? await prisma.selfEvaluation.create({
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

  if (selfEvaluation.status === "COMPLETED") {
    return NextResponse.json({ error: "Self evaluation has already been completed." }, { status: 409 });
  }

  if (selfEvaluation.tokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Self evaluation link is expired." }, { status: 400 });
  }

  const delivery = await sendSelfEvaluationEmail(cycle.subject.email, {
    staffName: cycle.subject.name,
    cycleName: cycle.description,
    deadline: cycle.deadline,
    inviteToken: selfEvaluation.inviteToken,
  });

  if (!delivery.ok) {
    return NextResponse.json(
      {
        ok: false,
        email: cycle.subject.email,
        error: delivery.error || "Resend failed to deliver the self evaluation email.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      email: cycle.subject.email,
      deliveryId: delivery.id,
      selfEvaluationId: selfEvaluation.id,
    },
    { status: 200 },
  );
}