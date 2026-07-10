import { randomUUID } from "crypto";
import { ReviewerStatus, ReviewerType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { sendEvaluationInvitationEmail, sendSelfEvaluationEmail } from "../../../../../lib/evaluationWorkflowEmails";
import { sendEvaluationInviteSms, sendSms } from "../../../../../lib/smsService";
import { prisma } from "../../../../../lib/prisma";

type StartEvaluationPayload = {
  description?: string;
  subjectId?: string;
  cycleDurationDays?: number;
  peerUserIds?: string[];
  contactIds?: string[];
};

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
      select: { id: true, name: true, email: true, phone: true, role: true },
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
        phone: true,
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
        phone: true,
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

  let selfEvaluation: { id: string; status: ReviewerStatus | string; inviteToken: string };
  let selfEvaluationDelivery: { ok: boolean; id?: string; error?: string };
  let emailSendAttempts = 0;

  try {
    const selfEvaluationToken = randomUUID();
    selfEvaluation = await prisma.selfEvaluation.create({
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

    await pauseBeforeEmailSend(emailSendAttempts);
    emailSendAttempts += 1;

    selfEvaluationDelivery = await sendSelfEvaluationEmail(subject.email, {
      staffName: subject.name,
      cycleName: description,
      deadline,
      inviteToken: selfEvaluation.inviteToken,
    });

    // Send SMS to subject for self-evaluation if phone is available
    if (subject.phone?.trim()) {
      const selfEvalLink = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/self-evaluate/${selfEvaluation.inviteToken}`;
      const message = `Hi ${subject.name}, your quarterly self-evaluation is ready. Click here to complete it: ${selfEvalLink}`;
      await sendSms(subject.phone, message, {
        schoolId: adminSession.schoolId,
        cycleId: cycle.id,
        messageType: "invite",
      }).catch((error) => {
        console.warn("[sms] Failed to send self-evaluation SMS to subject:", error);
      });
    }
  } catch (error) {
    await prisma.evaluationCycle.delete({ where: { id: cycle.id } }).catch(() => null);
    return NextResponse.json(
      {
        error: error instanceof Error && error.message.includes("SelfEvaluation")
          ? "Could not create the self evaluation magic link. Apply the 20260701_self_evaluations database migration, then try again."
          : "Could not create the self evaluation magic link. Please try again.",
      },
      { status: 500 },
    );
  }

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

    await pauseBeforeEmailSend(emailSendAttempts);
    emailSendAttempts += 1;

    const delivery = await sendEvaluationInvitationEmail(peer.email, {
      reviewerName: peer.name,
      subjectName: subject.name,
      deadline,
      inviteToken,
    });

    // Send SMS if phone number is available
    if (peer.phone?.trim()) {
      const reviewLink = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/evaluate/${inviteToken}`;
      await sendEvaluationInviteSms(peer.phone, peer.name, reviewLink).catch((error) => {
        console.warn(`[sms] Failed to send invite SMS to peer ${peer.id}:`, error);
      });
    }

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

    await pauseBeforeEmailSend(emailSendAttempts);
    emailSendAttempts += 1;

    const delivery = await sendEvaluationInvitationEmail(contact.email, {
      reviewerName: contact.name,
      subjectName: subject.name,
      deadline,
      inviteToken,
    });

    // Send SMS if phone number is available
    if (contact.phone?.trim()) {
      const reviewLink = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/evaluate/${inviteToken}`;
      await sendEvaluationInviteSms(contact.phone, contact.name, reviewLink).catch((error) => {
        console.warn(`[sms] Failed to send invite SMS to contact ${contact.id}:`, error);
      });
    }

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

  const deliveryResults = [selfEvaluationDelivery, ...reviewerResults.map((reviewer) => reviewer.delivery)];
  const sent = deliveryResults.filter((delivery) => delivery.ok).length;
  const failed = deliveryResults.length - sent;
  const errors = deliveryResults
    .filter((delivery) => !delivery.ok && delivery.error)
    .map((delivery) => delivery.error as string);

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
        total: deliveryResults.length,
        errors,
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