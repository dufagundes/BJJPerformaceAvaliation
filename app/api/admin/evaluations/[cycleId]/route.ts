import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";

function getDaysRemaining(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export async function GET(
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
      status: true,
      deadline: true,
      createdAt: true,
      subject: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewers: {
        orderBy: [{ type: "asc" }, { id: "asc" }],
        select: {
          id: true,
          type: true,
          status: true,
          tokenExpiresAt: true,
          inviteToken: true,
          response: {
            select: {
              id: true,
              submittedAt: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const daysRemaining = getDaysRemaining(cycle.deadline);
  const reviewers = cycle.reviewers.map((reviewer) => {
    const person = reviewer.user || reviewer.contact;
    return {
      id: reviewer.id,
      type: reviewer.type,
      status: reviewer.status,
      reviewer: {
        id: person?.id,
        name: person?.name,
        email: person?.email,
      },
      completionStatus: reviewer.response ? "COMPLETED" : "PENDING",
      submittedAt: reviewer.response?.submittedAt ?? null,
      tokenExpiresAt: reviewer.tokenExpiresAt,
    };
  });

  return NextResponse.json(
    {
      cycle: {
        id: cycle.id,
        status: cycle.status,
        deadline: cycle.deadline,
        createdAt: cycle.createdAt,
        subject: cycle.subject,
      },
      daysRemaining,
      reviewers,
    },
    { status: 200 },
  );
}