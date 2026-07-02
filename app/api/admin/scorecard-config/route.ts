import { NextResponse } from "next/server";
import { EvaluationAudienceType, EvaluationQuestionType } from "@prisma/client";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import {
  getEvaluationFormQuestions,
  saveEvaluationFormQuestions,
  validateEvaluationFormQuestions,
} from "../../../../lib/evaluationFormQuestions";

const HEAD_INSTRUCTOR_ROLE = "Head Instructor";

type SavePayload = {
  questions?: Array<{
    id?: string;
    staffRole?: string;
    audienceType: EvaluationAudienceType;
    text: string;
    type: EvaluationQuestionType;
    isRequired: boolean;
    order: number;
    options?: Array<{ label: string; score: number }>;
  }>;
};

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const questions = await getEvaluationFormQuestions(adminSession.schoolId, undefined, HEAD_INSTRUCTOR_ROLE);
  return NextResponse.json({ questions }, { status: 200 });
}

export async function PUT(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: SavePayload;
  try {
    payload = (await request.json()) as SavePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const questions = payload.questions ?? [];
  const validationErrors = validateEvaluationFormQuestions(
    questions.map((question) => ({
      id: question.id,
      staffRole: question.staffRole,
      audienceType: question.audienceType,
      text: question.text,
      type: question.type,
      isRequired: question.isRequired,
      order: question.order,
      options: question.options ?? [],
    })),
  );

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
  }

  try {
    const savedQuestions = await saveEvaluationFormQuestions(
      adminSession.schoolId,
      questions.map((question) => ({
        id: question.id,
        staffRole: question.staffRole,
        audienceType: question.audienceType,
        text: question.text,
        type: question.type,
        isRequired: question.isRequired,
        order: question.order,
        options: question.options ?? [],
      })),
    );

    return NextResponse.json({ questions: savedQuestions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save scorecard questions." },
      { status: 400 },
    );
  }
}