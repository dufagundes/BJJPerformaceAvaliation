import { prisma } from "./prisma";
import { randomUUID } from "crypto";

type GroupName = "PEER" | "PARENT_STUDENT";

type FactorSeed = {
  order: number;
  text: string;
  weight: number;
};

type SessionSeed = {
  name: string;
  audienceType: GroupName;
  weight: number;
  factors: FactorSeed[];
};

type GroupSeed = {
  name: GroupName;
  weight: number;
};

const WEIGHT_DECIMAL_SCALE = 6;
const WEIGHT_SUM_EPSILON = 0.00001;

function buildEqualWeightFactors(factors: Array<{ order: number; text: string }>): FactorSeed[] {
  const weightPerFactor = normalizeWeight(1 / factors.length);
  return factors.map((factor) => ({ ...factor, weight: weightPerFactor }));
}

const DEFAULT_GROUPS: GroupSeed[] = [
  { name: "PEER", weight: 0.3 },
  { name: "PARENT_STUDENT", weight: 0.7 },
];

const DEFAULT_SESSIONS: SessionSeed[] = [
  {
    name: "Peer Evaluation",
    audienceType: "PEER",
    weight: 1,
    factors: buildEqualWeightFactors([
      { order: 1, text: "Q1 Pre-class briefing" },
      { order: 2, text: "Q2 Team alignment and meetings" },
      { order: 3, text: "Q3 Team culture and bonding" },
      { order: 4, text: "Q4 Mentoring and feedback" },
      { order: 5, text: "Q5 ICP certification support" },
    ]),
  },
  {
    name: "Parents/Students Evaluation",
    audienceType: "PARENT_STUDENT",
    weight: 1,
    factors: buildEqualWeightFactors([
      { order: 1, text: "Q1 Punctuality" },
      { order: 2, text: "Q2 Motivation" },
      { order: 3, text: "Q3 Encouragement" },
      { order: 4, text: "Q4 Communication" },
      { order: 5, text: "Q5 Active engagement" },
      { order: 6, text: "Q6 Inclusion" },
      { order: 7, text: "Q7 GB core values" },
      { order: 8, text: "Q8 Student follow-up" },
      { order: 9, text: "Q9 New student follow-up" },
      { order: 10, text: "Q10 School culture" },
      { order: 11, text: "Q11 Safety and boundaries" },
      { order: 12, text: "Q12 Overall recommendation" },
    ]),
  },
];

export type ScorecardFactorWeight = {
  id: string;
  questionText: string;
  order: number;
  weight: number;
};

export type ScorecardSessionWeight = {
  id: string;
  name: string;
  audienceType: GroupName;
  weight: number;
  factors: ScorecardFactorWeight[];
};

export type ScorecardGroupWeight = {
  id: string;
  name: GroupName;
  weight: number;
};

export type ScorecardWeights = {
  groups: ScorecardGroupWeight[];
  sessions: ScorecardSessionWeight[];
};

export type ScorecardWeightsPayload = {
  groups: Array<{ id: string; name: GroupName; weight: number }>;
  sessions: Array<{
    id: string;
    name: string;
    audienceType: GroupName;
    weight: number;
    factors: Array<{ id: string; weight: number }>;
  }>;
};

function normalizeWeight(value: number): number {
  return Number.parseFloat(Number(value).toFixed(WEIGHT_DECIMAL_SCALE));
}

function parseNumber(value: unknown): number {
  return Number.parseFloat(String(value));
}

function isMissingSchoolIdColumn(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "42703" && (candidate.message ?? "").includes("schoolId");
}

function buildDefaultScorecardWeights(): ScorecardWeights {
  return {
    groups: DEFAULT_GROUPS.map((group) => ({
      id: `default-group-${group.name}`,
      name: group.name,
      weight: normalizeWeight(group.weight),
    })),
    sessions: DEFAULT_SESSIONS.map((session, sessionIndex) => {
      const sessionId = `default-session-${session.audienceType}-${sessionIndex + 1}`;
      return {
        id: sessionId,
        name: session.name,
        audienceType: session.audienceType,
        weight: normalizeWeight(session.weight),
        factors: session.factors.map((factor) => ({
          id: `${sessionId}-factor-${factor.order}`,
          questionText: factor.text,
          order: factor.order,
          weight: normalizeWeight(factor.weight),
        })),
      };
    }),
  };
}

function isCloseToOne(value: number): boolean {
  return Math.abs(normalizeWeight(value) - 1) <= WEIGHT_SUM_EPSILON;
}

export function validateScorecardWeights(payload: ScorecardWeightsPayload): string[] {
  const errors: string[] = [];

  const groupSum = payload.groups.reduce((sum, group) => sum + normalizeWeight(group.weight), 0);
  if (!isCloseToOne(groupSum)) {
    errors.push("Group weights must sum to exactly 1.00.");
  }

  const sessionsByAudience = new Map<GroupName, Array<{ name: string; weight: number }>>();
  for (const session of payload.sessions) {
    const list = sessionsByAudience.get(session.audienceType) ?? [];
    list.push({ name: session.name, weight: normalizeWeight(session.weight) });
    sessionsByAudience.set(session.audienceType, list);
  }

  for (const [audienceType, sessions] of sessionsByAudience.entries()) {
    const sum = sessions.reduce((acc, session) => acc + session.weight, 0);
    if (!isCloseToOne(sum)) {
      errors.push(`Session weights for ${audienceType} must sum to exactly 1.00.`);
    }
  }

  for (const session of payload.sessions) {
    const factorSum = session.factors.reduce((sum, factor) => sum + normalizeWeight(factor.weight), 0);
    if (!isCloseToOne(factorSum)) {
      errors.push(`Factor weights for session \"${session.name}\" must sum to exactly 1.00.`);
    }
  }

  return errors;
}

async function ensureDefaultsSeeded(schoolId: string) {
  await prisma.$transaction(async (tx) => {
    for (const group of DEFAULT_GROUPS) {
      await tx.$executeRawUnsafe(
        `
        INSERT INTO "EvaluationGroup" ("id", "schoolId", "name", "weight", "createdAt", "updatedAt")
        VALUES ($1::UUID, $2::UUID, $3::"ReviewerType", $4::DECIMAL(8,6), NOW(), NOW())
        ON CONFLICT ("schoolId", "name") DO NOTHING
        `,
        randomUUID(),
        schoolId,
        group.name,
        normalizeWeight(group.weight),
      );
    }

    for (const session of DEFAULT_SESSIONS) {
      await tx.$executeRawUnsafe(
        `
        INSERT INTO "EvaluationSession" ("id", "schoolId", "name", "audienceType", "weight", "createdAt", "updatedAt")
        VALUES ($1::UUID, $2::UUID, $3::TEXT, $4::"EvaluationAudienceType", $5::DECIMAL(8,6), NOW(), NOW())
        ON CONFLICT ("schoolId", "audienceType", "name") DO NOTHING
        `,
        randomUUID(),
        schoolId,
        session.name,
        session.audienceType,
        normalizeWeight(session.weight),
      );

      await tx.$executeRawUnsafe(
        `
        UPDATE "EvaluationSession"
        SET "weight" = $4::DECIMAL(8,6), "updatedAt" = NOW()
        WHERE "schoolId" = $1::UUID AND "name" = $2::TEXT AND "audienceType" = $3::"EvaluationAudienceType"
        `,
        schoolId,
        session.name,
        session.audienceType,
        normalizeWeight(session.weight),
      );

      for (const factor of session.factors) {
        await tx.$executeRawUnsafe(
          `
          INSERT INTO "EvaluationQuestion" ("id", "sessionId", "text", "type", "weight", "order")
          SELECT $1::UUID, s."id", $5::TEXT, 'RATING'::"EvaluationQuestionType", $6::DECIMAL(8,6), $7::INT
          FROM "EvaluationSession" s
          WHERE s."schoolId" = $2::UUID AND s."name" = $3::TEXT AND s."audienceType" = $4::"EvaluationAudienceType"
          ON CONFLICT ("sessionId", "order") DO UPDATE
          SET "text" = EXCLUDED."text", "type" = EXCLUDED."type", "weight" = EXCLUDED."weight"
          `,
          randomUUID(),
          schoolId,
          session.name,
          session.audienceType,
          factor.text,
          normalizeWeight(factor.weight),
          factor.order,
        );
      }

      const allowedOrders = session.factors.map((factor) => factor.order);
      await tx.$executeRawUnsafe(
        `
        DELETE FROM "EvaluationQuestion"
        WHERE "sessionId" = (
          SELECT s."id"
          FROM "EvaluationSession" s
          WHERE s."schoolId" = $1::UUID AND s."name" = $2::TEXT AND s."audienceType" = $3::"EvaluationAudienceType"
        )
        AND NOT ("order" = ANY($4::INT[]))
        `,
        schoolId,
        session.name,
        session.audienceType,
        allowedOrders,
      );
    }
  });
}

async function getSchoolScorecardWeights(schoolId: string): Promise<ScorecardWeights> {
  const groupRows = (await prisma.$queryRawUnsafe(
    `
    SELECT "id", "name", "weight"
    FROM "EvaluationGroup"
    WHERE "schoolId" = $1::UUID
    ORDER BY "name" ASC
    `,
    schoolId,
  )) as Array<{ id: string; name: GroupName; weight: unknown }>;

  const sessionRows = (await prisma.$queryRawUnsafe(
    `
    SELECT s."id", s."name", s."audienceType", s."weight"
    FROM "EvaluationSession" s
    WHERE s."schoolId" = $1::UUID
    ORDER BY s."audienceType" ASC, s."name" ASC
    `,
    schoolId,
  )) as Array<{ id: string; name: string; audienceType: GroupName; weight: unknown }>;

  const factorRows = (await prisma.$queryRawUnsafe(
    `
    SELECT q."id", q."sessionId", q."text", q."order", q."weight"
    FROM "EvaluationQuestion" q
    INNER JOIN "EvaluationSession" s ON s."id" = q."sessionId"
    WHERE s."schoolId" = $1::UUID
    ORDER BY q."sessionId" ASC, q."order" ASC
    `,
    schoolId,
  )) as Array<{ id: string; sessionId: string; text: string; order: number; weight: unknown }>;

  const factorsBySession = new Map<string, ScorecardFactorWeight[]>();
  for (const factor of factorRows) {
    const list = factorsBySession.get(factor.sessionId) ?? [];
    list.push({
      id: factor.id,
      questionText: factor.text,
      order: Number(factor.order),
      weight: normalizeWeight(parseNumber(factor.weight)),
    });
    factorsBySession.set(factor.sessionId, list);
  }

  return {
    groups: groupRows.map((group) => ({
      id: group.id,
      name: group.name,
      weight: normalizeWeight(parseNumber(group.weight)),
    })),
    sessions: sessionRows.map((session) => ({
      id: session.id,
      name: session.name,
      audienceType: session.audienceType,
      weight: normalizeWeight(parseNumber(session.weight)),
      factors: factorsBySession.get(session.id) ?? [],
    })),
  };
}

async function getLegacyScorecardWeights(): Promise<ScorecardWeights> {
  const groupRows = (await prisma.$queryRawUnsafe(
    `
    SELECT "id", "name", "weight"
    FROM "EvaluationGroup"
    ORDER BY "name" ASC
    `,
  )) as Array<{ id: string; name: GroupName; weight: unknown }>;

  const sessionRows = (await prisma.$queryRawUnsafe(
    `
    SELECT s."id", s."name", s."audienceType", s."weight"
    FROM "EvaluationSession" s
    ORDER BY s."audienceType" ASC, s."name" ASC
    `,
  )) as Array<{ id: string; name: string; audienceType: GroupName; weight: unknown }>;

  const factorRows = (await prisma.$queryRawUnsafe(
    `
    SELECT q."id", q."sessionId", q."text", q."order", q."weight"
    FROM "EvaluationQuestion" q
    INNER JOIN "EvaluationSession" s ON s."id" = q."sessionId"
    ORDER BY q."sessionId" ASC, q."order" ASC
    `,
  )) as Array<{ id: string; sessionId: string; text: string; order: number; weight: unknown }>;

  if (groupRows.length === 0 || sessionRows.length === 0) {
    return buildDefaultScorecardWeights();
  }

  const factorsBySession = new Map<string, ScorecardFactorWeight[]>();
  for (const factor of factorRows) {
    const list = factorsBySession.get(factor.sessionId) ?? [];
    list.push({
      id: factor.id,
      questionText: factor.text,
      order: Number(factor.order),
      weight: normalizeWeight(parseNumber(factor.weight)),
    });
    factorsBySession.set(factor.sessionId, list);
  }

  return {
    groups: groupRows.map((group) => ({
      id: group.id,
      name: group.name,
      weight: normalizeWeight(parseNumber(group.weight)),
    })),
    sessions: sessionRows.map((session) => ({
      id: session.id,
      name: session.name,
      audienceType: session.audienceType,
      weight: normalizeWeight(parseNumber(session.weight)),
      factors: factorsBySession.get(session.id) ?? [],
    })),
  };
}

export async function getScorecardWeights(schoolId: string): Promise<ScorecardWeights> {
  try {
    await ensureDefaultsSeeded(schoolId);
    return await getSchoolScorecardWeights(schoolId);
  } catch (error) {
    if (isMissingSchoolIdColumn(error)) {
      return getLegacyScorecardWeights();
    }

    throw error;
  }
}

export async function saveScorecardWeights(schoolId: string, payload: ScorecardWeightsPayload): Promise<void> {
  const errors = validateScorecardWeights(payload);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  await prisma.$transaction(async (tx) => {
    for (const group of payload.groups) {
      await tx.$executeRawUnsafe(
        `
        UPDATE "EvaluationGroup"
        SET "weight" = $2::DECIMAL(8,6), "updatedAt" = NOW()
        WHERE "id" = $1::UUID AND "schoolId" = $3::UUID
        `,
        group.id,
        normalizeWeight(group.weight),
        schoolId,
      );
    }

    for (const session of payload.sessions) {
      await tx.$executeRawUnsafe(
        `
        UPDATE "EvaluationSession"
        SET "weight" = $2::DECIMAL(8,6), "updatedAt" = NOW()
        WHERE "id" = $1::UUID AND "schoolId" = $3::UUID
        `,
        session.id,
        normalizeWeight(session.weight),
        schoolId,
      );

      for (const factor of session.factors) {
        await tx.$executeRawUnsafe(
          `
          UPDATE "EvaluationQuestion"
          SET "weight" = $2::DECIMAL(8,6)
          WHERE "id" = $1::UUID
          AND "sessionId" IN (SELECT "id" FROM "EvaluationSession" WHERE "schoolId" = $3::UUID)
          `,
          factor.id,
          normalizeWeight(factor.weight),
          schoolId,
        );
      }
    }
  });
}
