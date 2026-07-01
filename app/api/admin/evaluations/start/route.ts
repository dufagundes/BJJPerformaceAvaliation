import { randomUUID } from "crypto";
import { ReviewerStatus, ReviewerType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { sendEvaluationInvitationEmail, sendSelfEvaluationEmail } from "../../../../../lib/evaluationWorkflowEmails";
import { prisma } from "../../../../../lib/prisma";

type StartEvaluationPayload = {
  description?: string;
  subjectId?: string;
  cycleDurationDays?: number;
  peerUserIds?: string[];
  contactIds?: string[];
};

export async function POST(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: StartEvaluationPayload;
  try {
    payload = (await request.json()) as StartEvaluationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const description = payload.description?.trim() ?? "";
  const subjectId = payload.subjectId?.trim() || "";
  const cycleDurationDays = Number(payload.cycleDurationDays ?? 0);
  const peerUserIds = Array.from(new Set(payload.peerUserIds ?? [])).map((id) => id.trim()).filter(Boolean);
  const contactIds = Array.from(new Set(payload.contactIds ?? [])).map((id) => id.trim()).filter(Boolean);

  if (!description || !subjectId || !Number.isFinite(cycleDurationDays)) {
    return NextResponse.json({ error: "description, subjectId, and cycleDurationDays are required." }, { status: 400 });
  }

  if (!Number.isInteger(cycleDurationDays) || cycleDurationDays <= 0) {
    return NextResponse.json({ error: "cycleDurationDays must be a positive integer." }, { status: 400 });
  }

  if (peerUserIds.length < 1) {
    return NextResponse.json({ error: "At least 1 peer evaluator is required." }, { status: 400 });
  }

  if (peerUserIds.includes(subjectId)) {
    return NextResponse.json({ error: "Subject cannot be selected as a peer evaluator." }, { status: 400 });
  }

  const [subject, peersPool, selectedContacts] = await Promise.all([
    prisma.user.findFirst({
      where: { id: subjectId, schoolId: adminSession.schoolId },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.user.findMany({
      where: {
        schoolId: adminSession.schoolId,
        id: { in: peerUserIds },
        role: "STAFF",
        isActive: true,
        staffProfile: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.contact.findMany({
      where: {
        schoolId: adminSession.schoolId,
        id: { in: contactIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
      },
    }),
  ]);

  if (!subject) {
    return NextResponse.json({ error: "Subject user not found." }, { status: 404 });
  }

  if (subject.role !== "STAFF") {
    return NextResponse.json({ error: "Subject must be an active staff member." }, { status: 400 });
  }

  if (peersPool.length !== peerUserIds.length) {
    return NextResponse.json({ error: "One or more selected peers are invalid or inactive." }, { status: 400 });
  }

  if (selectedContacts.length !== contactIds.length) {
    return NextResponse.json({ error: "One or more selected contacts are invalid or inactive." }, { status: 400 });
  }

  const deadline = new Date(Date.now() + cycleDurationDays * 24 * 60 * 60 * 1000);

  const cycle = await prisma.evaluationCycle.create({
    data: {
      schoolId: adminSession.schoolId,
      subjectId,
      description,
      status: "IN_PROGRESS",
      deadline,
      createdBy: adminSession.userId,
    },
    select: {
      id: true,
      subjectId: true,
      description: true,
      status: true,
      deadline: true,
      createdAt: true,
      createdBy: true,
    },
  });

  const reviewerResults: Array<{
    reviewerId: string;
    reviewerType: ReviewerType;
    reviewerName: string;
    reviewerEmail: string;
    status: ReviewerStatus;
    inviteToken: string;
    delivery: { ok: boolean; id?: string; error?: string };
  }> = [];

  const selfEvaluationToken = randomUUID();
  const selfEvaluation = await prisma.selfEvaluation.create({
    data: {
      cycleId: cycle.id,
      inviteToken: selfEvaluationToken,
      tokenExpiresAt: deadline,
    },
    select: {
      id: true,
      status: true,
      inviteToken: true,
    },
  });

  const selfEvaluationDelivery = await sendSelfEvaluationEmail(subject.email, {
    staffName: subject.name,
    cycleName: description,
    deadline,
    inviteToken: selfEvaluation.inviteToken,
  });

  for (const peer of peersPool) {
    const inviteToken = randomUUID();
    const reviewer = await prisma.reviewer.create({
      data: {
        cycleId: cycle.id,
        userId: peer.id,
        type: ReviewerType.PEER,
        status: ReviewerStatus.PENDING,
        inviteToken,
        tokenExpiresAt: deadline,
      },
      select: {
        id: true,
        status: true,
        inviteToken: true,
      },
    });

    const delivery = await sendEvaluationInvitationEmail(peer.email, {
      reviewerName: peer.name,
      subjectName: subject.name,
      deadline,
      inviteToken,
    });

    reviewerResults.push({
      reviewerId: reviewer.id,
      reviewerType: ReviewerType.PEER,
      reviewerName: peer.name,
      reviewerEmail: peer.email,
      status: reviewer.status,
      inviteToken: reviewer.inviteToken,
      delivery,
    });
  }

  for (const contact of selectedContacts) {
    const inviteToken = randomUUID();
    const reviewer = await prisma.reviewer.create({
      data: {
        cycleId: cycle.id,
        contactId: contact.id,
        type: ReviewerType.PARENT_STUDENT,
        status: ReviewerStatus.PENDING,
        inviteToken,
        tokenExpiresAt: deadline,
      },
      select: {
        id: true,
        status: true,
        inviteToken: true,
      },
    });

    const delivery = await sendEvaluationInvitationEmail(contact.email, {
      reviewerName: contact.name,
      subjectName: subject.name,
      deadline,
      inviteToken,
    });

    reviewerResults.push({
      reviewerId: reviewer.id,
      reviewerType: ReviewerType.PARENT_STUDENT,
      reviewerName: contact.name,
      reviewerEmail: contact.email,
      status: reviewer.status,
      inviteToken: reviewer.inviteToken,
      delivery,
    });
  }

  const sent = reviewerResults.filter((reviewer) => reviewer.delivery.ok).length;
  const failed = reviewerResults.length - sent;

  return NextResponse.json(
    {
      ok: true,
      cycle,
      subject: {
        id: subject.id,
        name: subject.name,
      },
      deliverySummary: {
        sent,
        failed,
        total: reviewerResults.length,
      },
      reviewers: reviewerResults,
      selfEvaluation: {
        id: selfEvaluation.id,
        status: selfEvaluation.status,
        inviteToken: selfEvaluation.inviteToken,
        delivery: selfEvaluationDelivery,
      },
    },
    { status: 201 },
  );
}