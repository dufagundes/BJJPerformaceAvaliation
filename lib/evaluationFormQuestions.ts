import { EvaluationAudienceType, EvaluationQuestionType } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";

export type EvaluationFormOption = {
  label: string;
  score: number;
};

export type EvaluationFormQuestion = {
  id: string;
  staffRole: string;
  audienceType: EvaluationAudienceType;
  text: string;
  type: EvaluationQuestionType;
  isRequired: boolean;
  options: EvaluationFormOption[];
  order: number;
};

export type EvaluationFormQuestionPayload = {
  id?: string;
  staffRole?: string;
  audienceType: EvaluationAudienceType;
  text: string;
  type: EvaluationQuestionType;
  isRequired: boolean;
  options: EvaluationFormOption[];
  order: number;
};

const HEAD_INSTRUCTOR_ROLE = "Head Instructor";

const DEFAULT_SCORED_OPTIONS: EvaluationFormOption[] = [
  { label: "Strongly Disagree", score: 0 },
  { label: "Disagree", score: 25 },
  { label: "Partially Agree", score: 50 },
  { label: "Agree", score: 75 },
  { label: "Strongly Agree", score: 100 },
];

function isLegacyNumericDefaultOptions(options: EvaluationFormOption[]): boolean {
  if (options.length !== 5) {
    return false;
  }

  return options.every((option, index) => {
    const expectedLabels = ["1", "2", "3", "4", "5"];
    const expectedScores = [0, 25, 50, 75, 100];

    return option.label === expectedLabels[index] && option.score === expectedScores[index];
  });
}

const DEFAULT_QUESTIONS: Array<Omit<EvaluationFormQuestionPayload, "id">> = [
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PEER,
    order: 1,
    text: "Before every class, the Head Instructor clearly communicates what the class will cover and what my role is as a coach - I always know exactly what to do and how to help.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PEER,
    order: 2,
    text: "The Head Instructor keeps the team aligned through regular meetings - we are always on the same page and there are no surprises on the mat.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PEER,
    order: 3,
    text: "The Head Instructor has built a coaching team where I feel valued, connected, and proud to be part of - not just a group of people teaching separate classes.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PEER,
    order: 4,
    text: "The Head Instructor mentors me personally, gives constructive feedback on my coaching, and consistently models the GB standards of Brotherhood, Integrity, and Development in everything they do.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PEER,
    order: 5,
    text: "The Head Instructor actively encourages and supports me in pursuing my ICP certification and growing as a Gracie Barra coach.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 1,
    text: "Every time I bring my child to class, the instructor is already on the mat and ready to go - classes start and end on time.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 2,
    text: "My child looks forward to coming to class because of the energy and enthusiasm this instructor brings to every session.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 3,
    text: "When I watch class, I can see my child attempting techniques outside their comfort zone because this instructor creates a judgment-free environment.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 4,
    text: "The way this instructor explains techniques makes sense to my child - they come home able to describe and demonstrate what they learned in class.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 5,
    text: "The instructor actively moves around the mat, corrects techniques, and interacts with students throughout the entire class - not just during demonstrations.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 6,
    text: "The instructor makes sure both beginner and more experienced students receive instruction and attention appropriate to their level.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 7,
    text: "The instructor leads with integrity, treats all students as part of the GB family, and actively supports each student’s personal development.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 8,
    text: "I have felt genuinely cared for by this instructor - when my child missed a week of classes, they took the time to reach out and make sure everything was okay.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 9,
    text: "When my child first joined GB Lindale, the instructor personally reached out to check how their training was going.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 10,
    text: "The instructor contributes to a positive school culture by avoiding gossip, rumors, or negative talk about other students, families, or staff members.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 11,
    text: "I have never witnessed or experienced any behavior from this instructor that made me or my child feel physically or emotionally unsafe.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
  {
    staffRole: HEAD_INSTRUCTOR_ROLE,
    audienceType: EvaluationAudienceType.PARENT_STUDENT,
    order: 12,
    text: "I would highly recommend this instructor to other families.",
    type: EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: true,
    options: DEFAULT_SCORED_OPTIONS,
  },
];

function normalizeOptions(options: unknown): EvaluationFormOption[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const candidate = option as Record<string, unknown>;
      const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
      const score = Number.parseFloat(String(candidate.score));

      if (!label || !Number.isFinite(score)) {
        return null;
      }

      return { label, score };
    })
    .filter((option): option is EvaluationFormOption => option !== null);
}

function isMissingSchoolIdColumn(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string; meta?: { column?: string } };
  return (
    (candidate.code === "42703" || candidate.code === "P2022") &&
    ((candidate.message ?? "").includes("schoolId") || (candidate.meta?.column ?? "").includes("schoolId"))
  );
}

function mapQuestionRows(rows: Array<{
  id: string;
  staffRole: string;
  audienceType: EvaluationAudienceType;
  text: string;
  type: EvaluationQuestionType;
  isRequired: boolean;
  options: unknown;
  order: number;
}>): EvaluationFormQuestion[] {
  return rows.map((row) => ({
    options:
      row.type === EvaluationQuestionType.TEXT
        ? []
        : (() => {
            const normalized = normalizeOptions(row.options);
            if (normalized.length === 0) {
              return DEFAULT_SCORED_OPTIONS;
            }

            if (isLegacyNumericDefaultOptions(normalized)) {
              return DEFAULT_SCORED_OPTIONS;
            }

            return normalized;
          })(),
    id: row.id,
    staffRole: row.staffRole,
    audienceType: row.audienceType,
    text: row.text,
    type: row.type === EvaluationQuestionType.TEXT ? EvaluationQuestionType.TEXT : EvaluationQuestionType.MULTIPLE_CHOICE,
    isRequired: row.isRequired,
    order: row.order,
  }));
}

function getDefaultEvaluationFormQuestions(
  audienceType?: EvaluationAudienceType,
  staffRole = HEAD_INSTRUCTOR_ROLE,
): EvaluationFormQuestion[] {
  const audienceMatches = (question: Omit<EvaluationFormQuestionPayload, "id">) => !audienceType ||
    question.audienceType === EvaluationAudienceType.ALL ||
    question.audienceType === audienceType;
  const roleQuestions = DEFAULT_QUESTIONS.filter((question) => (question.staffRole ?? "") === staffRole && audienceMatches(question));
  const questions = roleQuestions.length > 0
    ? roleQuestions
    : DEFAULT_QUESTIONS.filter((question) => (question.staffRole ?? "") === HEAD_INSTRUCTOR_ROLE && audienceMatches(question));

  return mapQuestionRows(questions.map((question) => ({
    id: `default-${question.staffRole}-${question.audienceType}-${question.order}`,
    staffRole: question.staffRole ?? "",
    audienceType: question.audienceType,
    text: question.text,
    type: question.type,
    isRequired: question.isRequired,
    options: question.options,
    order: question.order,
  })));
}

async function getLegacyEvaluationFormQuestions(
  audienceType?: EvaluationAudienceType,
  staffRole = HEAD_INSTRUCTOR_ROLE,
): Promise<EvaluationFormQuestion[]> {
  const audienceClause = audienceType
    ? `AND ("audienceType" = 'ALL'::"EvaluationAudienceType" OR "audienceType" = $2::"EvaluationAudienceType")`
    : "";
  const params = audienceType ? [staffRole, audienceType] : [staffRole];
  let rows = (await prisma.$queryRawUnsafe(
    `
    SELECT "id", "staffRole", "audienceType", "text", "type", "isRequired", "options", "order"
    FROM "EvaluationFormQuestion"
    WHERE "staffRole" = $1::TEXT
    ${audienceClause}
    ORDER BY "staffRole" ASC, "audienceType" ASC, "order" ASC
    `,
    ...params,
  )) as Array<{
    id: string;
    staffRole: string;
    audienceType: EvaluationAudienceType;
    text: string;
    type: EvaluationQuestionType;
    isRequired: boolean;
    options: unknown;
    order: number;
  }>;

  if (rows.length === 0 && staffRole !== HEAD_INSTRUCTOR_ROLE) {
    const fallbackParams = audienceType ? [HEAD_INSTRUCTOR_ROLE, audienceType] : [HEAD_INSTRUCTOR_ROLE];
    rows = (await prisma.$queryRawUnsafe(
      `
      SELECT "id", "staffRole", "audienceType", "text", "type", "isRequired", "options", "order"
      FROM "EvaluationFormQuestion"
      WHERE "staffRole" = $1::TEXT
      ${audienceClause}
      ORDER BY "staffRole" ASC, "audienceType" ASC, "order" ASC
      `,
      ...fallbackParams,
    )) as typeof rows;
  }

  if (rows.length === 0) {
    return getDefaultEvaluationFormQuestions(audienceType, staffRole);
  }

  return mapQuestionRows(rows);
}

async function ensureDefaultsSeeded(schoolId: string) {
  await prisma.$transaction(async (tx) => {
    for (const question of DEFAULT_QUESTIONS) {
      await tx.evaluationFormQuestion.upsert({
        where: {
          schoolId_staffRole_audienceType_order: {
            schoolId,
            staffRole: question.staffRole ?? "",
            audienceType: question.audienceType,
            order: question.order,
          },
        },
        create: {
          id: randomUUID(),
          schoolId,
          staffRole: question.staffRole ?? "",
          audienceType: question.audienceType,
          text: question.text,
          type: question.type,
          isRequired: question.isRequired,
          options: question.options,
          order: question.order,
        },
        update: {
          text: question.text,
          type: question.type,
          isRequired: question.isRequired,
          options: question.options,
        },
      });
    }

    const defaultsByAudience = new Map<EvaluationAudienceType, Set<number>>();
    for (const question of DEFAULT_QUESTIONS) {
      if ((question.staffRole ?? "") !== HEAD_INSTRUCTOR_ROLE) {
        continue;
      }

      const allowedOrders = defaultsByAudience.get(question.audienceType) ?? new Set<number>();
      allowedOrders.add(question.order);
      defaultsByAudience.set(question.audienceType, allowedOrders);
    }

    for (const [audienceType, allowedOrders] of defaultsByAudience.entries()) {
      await tx.evaluationFormQuestion.deleteMany({
        where: {
          schoolId,
          staffRole: HEAD_INSTRUCTOR_ROLE,
          audienceType,
          order: {
            notIn: Array.from(allowedOrders),
          },
        },
      });
    }
  });
}

export async function getEvaluationFormQuestions(
  schoolId: string,
  audienceType?: EvaluationAudienceType,
  staffRole = HEAD_INSTRUCTOR_ROLE,
): Promise<EvaluationFormQuestion[]> {
  try {
    await ensureDefaultsSeeded(schoolId);
  } catch (error) {
    if (isMissingSchoolIdColumn(error)) {
      return getLegacyEvaluationFormQuestions(audienceType, staffRole);
    }

    throw error;
  }

  const audienceFilter = audienceType
    ? { OR: [{ audienceType: EvaluationAudienceType.ALL }, { audienceType }] }
    : {};

  try {
    let rows = await prisma.evaluationFormQuestion.findMany({
      where: { schoolId, staffRole, ...audienceFilter },
      orderBy: [{ staffRole: "asc" }, { audienceType: "asc" }, { order: "asc" }],
    });

    // Fall back to HEAD_INSTRUCTOR questions when no questions are configured for the given role
    if (rows.length === 0 && staffRole !== HEAD_INSTRUCTOR_ROLE) {
      rows = await prisma.evaluationFormQuestion.findMany({
        where: { schoolId, staffRole: HEAD_INSTRUCTOR_ROLE, ...audienceFilter },
        orderBy: [{ staffRole: "asc" }, { audienceType: "asc" }, { order: "asc" }],
      });
    }

    if (rows.length === 0) {
      return getDefaultEvaluationFormQuestions(audienceType, staffRole);
    }

    return mapQuestionRows(rows);
  } catch (error) {
    if (isMissingSchoolIdColumn(error)) {
      return getLegacyEvaluationFormQuestions(audienceType, staffRole);
    }

    throw error;
  }
}

function validateQuestionPayload(payload: EvaluationFormQuestionPayload[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const question of payload) {
    const key = `${question.staffRole ?? ""}:${question.audienceType}:${question.order}`;
    if (seen.has(key)) {
      errors.push(`Duplicate order ${question.order} for ${question.audienceType}.`);
    }
    seen.add(key);

    if (!question.text.trim()) {
      errors.push("Question text cannot be empty.");
    }

    if (!Number.isInteger(question.order) || question.order <= 0) {
      errors.push(`Question order must be a positive integer for "${question.text}".`);
    }

    if (question.type !== EvaluationQuestionType.TEXT) {
      if (question.options.length < 2) {
        errors.push(`Scored question "${question.text}" must have at least 2 answer options.`);
      }

      for (const option of question.options) {
        if (!option.label.trim() || !Number.isFinite(option.score)) {
          errors.push(`Answer options for "${question.text}" must have labels and numeric scores.`);
          break;
        }
      }
    }
  }

  return errors;
}

export function validateEvaluationFormQuestions(payload: EvaluationFormQuestionPayload[]): string[] {
  return validateQuestionPayload(payload);
}

export async function saveEvaluationFormQuestions(schoolId: string, payload: EvaluationFormQuestionPayload[]): Promise<EvaluationFormQuestion[]> {
  const errors = validateQuestionPayload(payload);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  await prisma.$transaction(async (tx) => {
    const keepIds = new Set<string>();

    for (const question of payload) {
      const data = {
        staffRole: question.staffRole?.trim() ?? "",
        audienceType: question.audienceType,
        text: question.text.trim(),
        type: question.type,
        isRequired: question.isRequired,
        options: question.type === EvaluationQuestionType.TEXT ? [] : question.options,
        order: question.order,
      };

      if (question.id) {
        const updated = await tx.evaluationFormQuestion.updateMany({
          where: { id: question.id, schoolId },
          data,
        });
        if (updated.count > 0) {
          keepIds.add(question.id);
          continue;
        }
      }

      const created = await tx.evaluationFormQuestion.create({
        data: { id: randomUUID(), schoolId, ...data },
        select: { id: true },
      });
      keepIds.add(created.id);
    }

    const existing = await tx.evaluationFormQuestion.findMany({
      where: { schoolId },
      select: { id: true },
    });

    for (const row of existing) {
      if (!keepIds.has(row.id)) {
        await tx.evaluationFormQuestion.delete({ where: { id: row.id } });
      }
    }
  });

  const defaultStaffRole = payload[0]?.staffRole?.trim() ?? "";
  return getEvaluationFormQuestions(schoolId, undefined, defaultStaffRole);
}