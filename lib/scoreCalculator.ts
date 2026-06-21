import { Prisma, ReviewerType } from "@prisma/client";
import { prisma } from "./prisma";

const GROUP_WEIGHTS: Record<ReviewerType, number> = {
  PEER: 0.5,
  PARENT_STUDENT: 0.5,
};

type ScoreResult = {
  weightedScore: number;
  strengths: string[];
  weaknesses: string[];
};

type AnswersRecord = Record<string, Prisma.JsonValue>;

function asAnswersRecord(value: Prisma.JsonValue): AnswersRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as AnswersRecord;
}

function getNumberValue(record: AnswersRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getTextValue(record: AnswersRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const total = numbers.reduce((sum, value) => sum + value, 0);
  return total / numbers.length;
}

function roundScore(score: number): number {
  return Math.round(score * 100) / 100;
}

export async function calculateScore(
  staffMemberId: string,
  cycleId: string,
): Promise<ScoreResult> {
  const reviewerResponses = await prisma.reviewer.findMany({
    where: {
      cycleId,
      status: "COMPLETED",
      cycle: {
        subjectId: staffMemberId,
      },
      response: {
        isNot: null,
      },
    },
    select: {
      type: true,
      response: {
        select: {
          answers: true,
        },
      },
    },
  });

  const scoresByType: Record<ReviewerType, number[]> = {
    PEER: [],
    PARENT_STUDENT: [],
  };
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const reviewer of reviewerResponses) {
    const answers = asAnswersRecord(reviewer.response?.answers as Prisma.JsonValue);
    if (!answers) {
      continue;
    }

    const primaryRatings = [
      getNumberValue(answers, ["q1", "question1"]),
      getNumberValue(answers, ["q2", "question2"]),
      getNumberValue(answers, ["q3", "question3"]),
      getNumberValue(answers, ["q4", "question4"]),
      getNumberValue(answers, ["q5", "question5"]),
      getNumberValue(answers, ["q6", "question6"]),
      getNumberValue(answers, ["q7", "question7"]),
      getNumberValue(answers, ["q8", "question8"]),
    ];

    const legacyRatings = [
      getNumberValue(answers, ["communication"]),
      getNumberValue(answers, ["punctualityAndPreparation"]),
      getNumberValue(answers, ["teachingEffectiveness"]),
      getNumberValue(answers, ["conflictHandling"]),
      getNumberValue(answers, ["professionalism"]),
    ];

    const usablePrimaryRatings =
      primaryRatings.some((rating) => rating !== null) && !primaryRatings.some((rating) => rating === null)
        ? (primaryRatings as number[])
        : null;
    const usableLegacyRatings =
      !legacyRatings.some((rating) => rating === null) ? (legacyRatings as number[]) : null;
    const ratings = usablePrimaryRatings ?? usableLegacyRatings;

    if (!ratings) {
      continue;
    }

    scoresByType[reviewer.type].push(average(ratings));

    const strength = getTextValue(answers, ["q9", "question9", "observedStrength", "strength"]);
    if (strength) {
      strengths.push(strength);
    }

    const weakness = getTextValue(answers, ["q10", "question10", "improvementArea", "weakness"]);
    if (weakness) {
      weaknesses.push(weakness);
    }
  }

  const presentGroups = (Object.entries(scoresByType) as Array<[ReviewerType, number[]]>).filter(
    ([, scores]) => scores.length > 0,
  );

  if (presentGroups.length === 0) {
    return {
      weightedScore: 0,
      strengths,
      weaknesses,
    };
  }

  const missingWeight = (Object.entries(scoresByType) as Array<[ReviewerType, number[]]>).reduce(
    (sum, [type, scores]) => sum + (scores.length === 0 ? GROUP_WEIGHTS[type] : 0),
    0,
  );
  const presentWeightTotal = presentGroups.reduce((sum, [type]) => sum + GROUP_WEIGHTS[type], 0);

  const weightedScore = presentGroups.reduce((sum, [type, scores]) => {
    const redistributedShare =
      presentWeightTotal > 0 ? missingWeight * (GROUP_WEIGHTS[type] / presentWeightTotal) : 0;
    const adjustedWeight = GROUP_WEIGHTS[type] + redistributedShare;
    return sum + average(scores) * adjustedWeight;
  }, 0);

  return {
    weightedScore: roundScore(weightedScore),
    strengths,
    weaknesses,
  };
}