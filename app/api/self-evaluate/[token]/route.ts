import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { SELF_EVALUATION_QUESTIONS } from "../../../../lib/selfEvaluationQuestions";

const USED_TOKEN_MESSAGE = "This self evaluation has already been submitted. Thank you for your reflection.";
const EXPIRED_TOKEN_MESSAGE = "This self evaluation link has expired.";

type SelfEvaluationAnswers = Record<string, string>;

function validateAnswers(answers: unknown): answers is SelfEvaluationAnswers {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return false;
  }

  const candidate = answers as Record<string, unknown>;
  return SELF_EVALUATION_QUESTIONS.every((question) => {
    const value = candidate[`q${question.order}`];
    return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 2000;
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const selfEvaluation = await prisma.selfEvaluation.findUnique({
    where: { inviteToken: token },
    select: {
      status: true,
      tokenExpiresAt: true,
      cycle: {
        select: {
          description: true,
          deadline: true,
          subject: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!selfEvaluation) {
    return NextResponse.json({ error: "This self evaluation link is invalid." }, { status: 404 });
  }

  if (selfEvaluation.status === "COMPLETED") {
    return NextResponse.json({ error: USED_TOKEN_MESSAGE }, { status: 409 });
  }

  const now = new Date();
  if (now > selfEvaluation.tokenExpiresAt || now > selfEvaluation.cycle.deadline) {
    return NextResponse.json({ error: EXPIRED_TOKEN_MESSAGE }, { status: 410 });
  }

  return NextResponse.json(
    {
      staffName: selfEvaluation.cycle.subject.name,
      cycleName: selfEvaluation.cycle.description,
      deadline: selfEvaluation.cycle.deadline,
      questions: SELF_EVALUATION_QUESTIONS,
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
  if (!validateAnswers(answers)) {
    return NextResponse.json({ error: "Please answer every self evaluation question before submitting." }, { status: 400 });
  }

  const selfEvaluation = await prisma.selfEvaluation.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      status: true,
      tokenExpiresAt: true,
      cycle: {
        select: { deadline: true },
      },
    },
  });

  if (!selfEvaluation) {
    return NextResponse.json({ error: "This self evaluation link is invalid." }, { status: 404 });
  }

  if (selfEvaluation.status === "COMPLETED") {
    return NextResponse.json({ error: USED_TOKEN_MESSAGE }, { status: 409 });
  }

  const now = new Date();
  if (now > selfEvaluation.tokenExpiresAt || now > selfEvaluation.cycle.deadline) {
    return NextResponse.json({ error: EXPIRED_TOKEN_MESSAGE }, { status: 410 });
  }

  await prisma.selfEvaluation.update({
    where: { id: selfEvaluation.id },
    data: {
      status: "COMPLETED",
      answers,
      submittedAt: now,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}