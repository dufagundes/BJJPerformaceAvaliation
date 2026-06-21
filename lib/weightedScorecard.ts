import { prisma } from "./prisma";
import { getScorecardWeights, ScorecardSessionWeight } from "./scorecardWeights";

type GroupName = "PEER" | "PARENT_STUDENT";

type ScorecardFactorOutput = {
  questionText: string;
  weight: number;
  rawAverage: number;
  normalizedScore: number;
  factorScore: number;
  responseCount: number;
};

type ScorecardSessionOutput = {
  name: string;
  weight: number;
  sessionScore: number;
  factors: ScorecardFactorOutput[];
};

type ScorecardGroupOutput = {
  name: "Peers" | "Parents/Students";
  weight: number;
  groupScore: number;
  responseRate: string;
  sessions: ScorecardSessionOutput[];
};

export type CycleScorecardResult = {
  cycleId: string;
  subjectName: string;
  finalScore: number;
  scoreLabel: "Excellent" | "Good" | "Needs Improvement" | "Critical";
  groups: ScorecardGroupOutput[];
  qualitativeFeedback: Array<{ text: string; audience: "anonymous" }>;
  notes?: string[];
};

type ReviewerWithResponse = {
  id: string;
  type: GroupName;
  status: string;
  response: {
    answers: unknown;
  } | null;
};

const LEGACY_ORDER_TO_KEY: Record<number, string> = {
  1: "communication",
  2: "punctualityAndPreparation",
  3: "teachingEffectiveness",
  4: "conflictHandling",
  5: "professionalism",
};

function toOneDecimal(value: number): number {
  return Number.parseFloat(value.toFixed(1));
}

function toSixDecimals(value: number): number {
  return Number.parseFloat(value.toFixed(6));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getScoreLabel(score: number): CycleScorecardResult["scoreLabel"] {
  if (score >= 85) {
    return "Excellent";
  }
  if (score >= 70) {
    return "Good";
  }
  if (score >= 50) {
    return "Needs Improvement";
  }
  return "Critical";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readNumericResponse(answers: Record<string, unknown>, order: number): number | null {
  const direct = answers[`q${order}`];
  if (typeof direct === "number" && Number.isFinite(direct)) {
    return clamp(direct, 0, 100);
  }

  const longForm = answers[`question${order}`];
  if (typeof longForm === "number" && Number.isFinite(longForm)) {
    return clamp(longForm, 0, 100);
  }

  const legacyKey = LEGACY_ORDER_TO_KEY[order];
  if (legacyKey && typeof answers[legacyKey] === "number" && Number.isFinite(answers[legacyKey] as number)) {
    return clamp(answers[legacyKey] as number, 1, 5);
  }

  return null;
}

function normalizeToHundred(rawAverage: number, values: number[]): number {
  // Current forms store rating answers on a 0-100 scale. Legacy forms may store 1-5.
  // If any value is 0 or >5, treat the factor as 0-100 data.
  const looksLikeHundredScale = values.some((value) => value === 0 || value > 5);
  if (looksLikeHundredScale) {
    return clamp(rawAverage, 0, 100);
  }

  return clamp(((rawAverage - 1) / 4) * 100, 0, 100);
}

function normalizeSingleResponse(value: number): number {
  if (value <= 5) {
    return clamp(((value - 1) / 4) * 100, 0, 100);
  }

  return clamp(value, 0, 100);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildResponseRate(reviewers: ReviewerWithResponse[]): string {
  const total = reviewers.length;
  const completed = reviewers.filter((reviewer) => reviewer.status === "COMPLETED" && reviewer.response !== null).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return `${completed}/${total} (${percent}%)`;
}

function buildFactorOutput(
  session: ScorecardSessionWeight,
  reviewers: ReviewerWithResponse[],
): { factors: ScorecardFactorOutput[]; sessionScore: number; hasResponses: boolean } {
  const enriched = session.factors.map((factor) => {
    const values: number[] = [];

    for (const reviewer of reviewers) {
      const answers = asRecord(reviewer.response?.answers);
      if (!answers) {
        continue;
      }

      const value = readNumericResponse(answers, factor.order);
      if (value !== null) {
        values.push(value);
      }
    }

    const responseCount = values.length;
    const rawAverage = responseCount > 0 ? average(values) : 0;
    const normalizedScore = responseCount > 0 ? normalizeToHundred(rawAverage, values) : 0;

    return {
      questionText: factor.questionText,
      configuredWeight: factor.weight,
      rawAverage,
      normalizedScore,
      responseCount,
    };
  });

  const answeredFactors = enriched.filter((factor) => factor.responseCount > 0);
  const answeredWeightTotal = answeredFactors.reduce((sum, factor) => sum + factor.configuredWeight, 0);

  const factors: ScorecardFactorOutput[] = enriched.map((factor) => {
    const effectiveWeight =
      factor.responseCount > 0 && answeredWeightTotal > 0 ? factor.configuredWeight / answeredWeightTotal : 0;
    const factorScore = factor.normalizedScore * effectiveWeight;

    return {
      questionText: factor.questionText,
      weight: toSixDecimals(factor.configuredWeight),
      rawAverage: toOneDecimal(factor.rawAverage),
      normalizedScore: toOneDecimal(factor.normalizedScore),
      factorScore: toOneDecimal(factorScore),
      responseCount: factor.responseCount,
    };
  });

  const sessionScore = toOneDecimal(factors.reduce((sum, factor) => sum + factor.factorScore, 0));

  return {
    factors,
    sessionScore,
    hasResponses: answeredFactors.length > 0,
  };
}

function buildGroupAverage(
  sessions: ScorecardSessionWeight[],
  reviewers: ReviewerWithResponse[],
): { groupScore: number; hasResponses: boolean } {
  const statementOrders = new Set<number>();
  for (const session of sessions) {
    for (const factor of session.factors) {
      statementOrders.add(factor.order);
    }
  }

  const normalizedValues: number[] = [];
  for (const reviewer of reviewers) {
    const answers = asRecord(reviewer.response?.answers);
    if (!answers) {
      continue;
    }

    for (const order of statementOrders) {
      const value = readNumericResponse(answers, order);
      if (value !== null) {
        normalizedValues.push(normalizeSingleResponse(value));
      }
    }
  }

  if (normalizedValues.length === 0) {
    return { groupScore: 0, hasResponses: false };
  }

  return {
    groupScore: toOneDecimal(average(normalizedValues)),
    hasResponses: true,
  };
}

export async function calculateCycleScorecard(cycleId: string): Promise<CycleScorecardResult> {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      subject: {
        select: {
          name: true,
        },
      },
      reviewers: {
        select: {
          id: true,
          type: true,
          status: true,
          response: {
            select: {
              answers: true,
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    throw new Error("Cycle not found.");
  }

  const weights = await getScorecardWeights();

  const groupsByName = new Map(weights.groups.map((group) => [group.name, group]));
  const sessionsByAudience = new Map<GroupName, ScorecardSessionWeight[]>();
  for (const session of weights.sessions) {
    const list = sessionsByAudience.get(session.audienceType) ?? [];
    list.push(session);
    sessionsByAudience.set(session.audienceType, list);
  }

  // Filter only completed reviewers with responses for scoring
  const completedReviewers = cycle.reviewers.filter(
    (reviewer) => reviewer.status === "COMPLETED" && reviewer.response !== null,
  ) as ReviewerWithResponse[];

  const reviewersByGroup = new Map<GroupName, ReviewerWithResponse[]>();
  reviewersByGroup.set(
    "PEER",
    completedReviewers.filter((reviewer) => reviewer.type === "PEER"),
  );
  reviewersByGroup.set(
    "PARENT_STUDENT",
    completedReviewers.filter((reviewer) => reviewer.type === "PARENT_STUDENT"),
  );

  // Keep all reviewers for response rate calculation
  const allReviewersByGroup = new Map<GroupName, ReviewerWithResponse[]>();
  allReviewersByGroup.set(
    "PEER",
    cycle.reviewers.filter((reviewer) => reviewer.type === "PEER") as ReviewerWithResponse[],
  );
  allReviewersByGroup.set(
    "PARENT_STUDENT",
    cycle.reviewers.filter((reviewer) => reviewer.type === "PARENT_STUDENT") as ReviewerWithResponse[],
  );

  const notes: string[] = [];

  const groupOutputs: Array<{
    key: GroupName;
    configuredWeight: number;
    hasResponses: boolean;
    groupScore: number;
    output: ScorecardGroupOutput;
  }> = [];

  for (const groupName of ["PEER", "PARENT_STUDENT"] as const) {
    const groupWeight = groupsByName.get(groupName)?.weight ?? 0;
    const sessions = sessionsByAudience.get(groupName) ?? [];
    const reviewers = reviewersByGroup.get(groupName) ?? [];
    const allReviewers = allReviewersByGroup.get(groupName) ?? [];

    const sessionScores = sessions.map((session) => {
      const details = buildFactorOutput(session, reviewers);
      return {
        id: session.id,
        name: session.name,
        weight: session.weight,
        sessionScore: details.sessionScore,
        factors: details.factors,
        hasResponses: details.hasResponses,
      };
    });

    const groupAverage = buildGroupAverage(sessions, reviewers);
    const groupScore = groupAverage.groupScore;
    const hasResponses = groupAverage.hasResponses;

    groupOutputs.push({
      key: groupName,
      configuredWeight: groupWeight,
      hasResponses,
      groupScore,
      output: {
        name: groupName === "PEER" ? "Peers" : "Parents/Students",
        weight: toSixDecimals(groupWeight),
        groupScore,
        responseRate: buildResponseRate(allReviewers),
        sessions: sessionScores.map((session) => ({
          name: session.name,
          weight: toSixDecimals(session.weight),
          sessionScore: toOneDecimal(session.sessionScore),
          factors: session.factors,
        })),
      },
    });
  }

  const parentGroup = groupOutputs.find((group) => group.key === "PARENT_STUDENT");
  const peerGroup = groupOutputs.find((group) => group.key === "PEER");

  const parentWeighted = parentGroup?.hasResponses ? parentGroup.groupScore * (parentGroup.configuredWeight ?? 0) : 0;
  const peerWeighted = peerGroup?.hasResponses ? peerGroup.groupScore * (peerGroup.configuredWeight ?? 0) : 0;
  const finalScore = parentWeighted + peerWeighted;

  if (parentGroup && !parentGroup.hasResponses) {
    notes.push("No responses received from Parents/Students.");
  }
  if (peerGroup && !peerGroup.hasResponses) {
    notes.push("No responses received from Peers.");
  }

  const qualitativeFeedback: Array<{ text: string; audience: "anonymous" }> = [];
  for (const reviewer of completedReviewers) {
    const answers = asRecord(reviewer.response?.answers);
    if (!answers) {
      continue;
    }

    for (const value of Object.values(answers)) {
      if (typeof value !== "string") {
        continue;
      }

      const trimmed = value.trim();
      if (trimmed.length > 0) {
        qualitativeFeedback.push({ text: trimmed, audience: "anonymous" });
      }
    }
  }

  const roundedFinalScore = toOneDecimal(clamp(finalScore, 0, 100));

  return {
    cycleId: cycle.id,
    subjectName: cycle.subject.name,
    finalScore: Number.parseFloat(roundedFinalScore.toFixed(1)),
    scoreLabel: getScoreLabel(roundedFinalScore),
    groups: groupOutputs.map((group) => group.output),
    qualitativeFeedback,
    notes: notes.length > 0 ? notes : undefined,
  };
}
