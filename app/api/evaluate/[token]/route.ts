import { NextResponse } from "next/server";
import { EvaluationQuestionType } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getEvaluationFormQuestions } from "../../../../lib/evaluationFormQuestions";

const USED_TOKEN_MESSAGE =
  "This evaluation has already been submitted. Thank you for your participation.";
const EXPIRED_TOKEN_MESSAGE = "This evaluation link has expired.";

type EvaluationAnswers = Record<string, string | number>;

function getFirstName(fullName: string): string {
  const name = fullName.trim();
  if (!name) {
    return "this staff member";
  }
  return name.split(/\s+/)[0] ?? "this staff member";
}

function validateAnswers(answers: unknown, questions: Array<{ order: number; type: EvaluationQuestionType; isRequired: boolean }>): answers is EvaluationAnswers {
  if (!answers || typeof answers !== "object") {
    return false;
  }

  const candidate = answers as Record<string, unknown>;

  for (const question of questions) {
    const value = candidate[`q${question.order}`];

    if (question.type === EvaluationQuestionType.TEXT) {
      if (typeof value !== "string") {
        return false;
      }

      if (question.isRequired && value.trim().length === 0) {
        return false;
      }

      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return false;
    }
  }

  return true;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const reviewer = await prisma.reviewer.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      type: true,
      status: true,
      tokenExpiresAt: true,
      cycle: {
        select: {
          deadline: true,
          subject: {
            select: {
              name: true,
              staffProfile: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!reviewer) {
    return NextResponse.json({ error: "This evaluation link is invalid." }, { status: 404 });
  }

  if (reviewer.status === "COMPLETED") {
    return NextResponse.json({ error: USED_TOKEN_MESSAGE }, { status: 409 });
  }

  const now = new Date();
  const cycleEnded = now > reviewer.cycle.deadline;
  const tokenExpired = now > reviewer.tokenExpiresAt;
  if (cycleEnded || tokenExpired) {
    return NextResponse.json({ error: EXPIRED_TOKEN_MESSAGE }, { status: 410 });
  }

  const questions = await getEvaluationFormQuestions(
    reviewer.type,
    reviewer.cycle.subject.staffProfile?.title ?? "",
  );

  return NextResponse.json(
    {
      evaluatorId: reviewer.id,
      evaluatorType: reviewer.type,
      staffFirstName: getFirstName(reviewer.cycle.subject.name),
      questions,
    },
    { status: 200 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const answers = (payload as { answers?: unknown })?.answers;
  const rawAnswers = answers as Record<string, unknown>;

  // Extract open-ended text fields
  const strengthsText = rawAnswers?.strengths_text;
  const improvementsText = rawAnswers?.improvements_text;

  // Create clean answers object with only Likert responses (remove text fields)
  const likertAnswers = { ...rawAnswers };
  delete likertAnswers.strengths_text;
  delete likertAnswers.improvements_text;

  const reviewer = await prisma.reviewer.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      type: true,
      status: true,
      cycleId: true,
      tokenExpiresAt: true,
      cycle: {
        select: {
          deadline: true,
          subject: {
            select: {
              staffProfile: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!reviewer) {
    return NextResponse.json({ error: "This evaluation link is invalid." }, { status: 404 });
  }

  if (reviewer.status === "COMPLETED") {
    return NextResponse.json({ error: USED_TOKEN_MESSAGE }, { status: 409 });
  }

  const now = new Date();
  const cycleEnded = now > reviewer.cycle.deadline;
  const tokenExpired = now > reviewer.tokenExpiresAt;
  if (cycleEnded || tokenExpired) {
    return NextResponse.json({ error: EXPIRED_TOKEN_MESSAGE }, { status: 410 });
  }

  const questions = await getEvaluationFormQuestions(
    reviewer.type,
    reviewer.cycle.subject.staffProfile?.title ?? "",
  );

  if (!validateAnswers(likertAnswers, questions)) {
    return NextResponse.json({ error: "Invalid answers payload." }, { status: 400 });
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.evaluationResponse.create({
      data: {
        reviewerId: reviewer.id,
        answers: likertAnswers,
        strengths_text: typeof strengthsText === "string" ? strengthsText : null,
        improvements_text: typeof improvementsText === "string" ? improvementsText : null,
      },
    });

    await tx.reviewer.update({
      where: { id: reviewer.id },
      data: { status: "COMPLETED" },
    });

    const pendingReviewerCount = await tx.reviewer.count({
      where: {
        cycleId: reviewer.cycleId,
        status: "PENDING",
      },
    });

    if (pendingReviewerCount === 0) {
      await tx.evaluationCycle.updateMany({
        where: {
          id: reviewer.cycleId,
          status: {
            in: ["IN_PROGRESS", "OVERDUE"],
          },
        },
        data: {
          status: "COMPLETED",
        },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
