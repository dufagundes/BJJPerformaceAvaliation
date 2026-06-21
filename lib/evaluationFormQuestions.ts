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

async function ensureDefaultsSeeded() {
  await prisma.$transaction(async (tx) => {
    for (const question of DEFAULT_QUESTIONS) {
      await tx.evaluationFormQuestion.upsert({
        where: {
          staffRole_audienceType_order: {
            staffRole: question.staffRole ?? "",
            audienceType: question.audienceType,
            order: question.order,
          },
        },
        create: {
          id: randomUUID(),
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
  audienceType?: EvaluationAudienceType,
  staffRole = HEAD_INSTRUCTOR_ROLE,
): Promise<EvaluationFormQuestion[]> {
  await ensureDefaultsSeeded();

  const audienceFilter = audienceType
    ? { OR: [{ audienceType: EvaluationAudienceType.ALL }, { audienceType }] }
    : {};

  let rows = await prisma.evaluationFormQuestion.findMany({
    where: { staffRole, ...audienceFilter },
    orderBy: [{ staffRole: "asc" }, { audienceType: "asc" }, { order: "asc" }],
  });

  // Fall back to HEAD_INSTRUCTOR questions when no questions are configured for the given role
  if (rows.length === 0 && staffRole !== HEAD_INSTRUCTOR_ROLE) {
    rows = await prisma.evaluationFormQuestion.findMany({
      where: { staffRole: HEAD_INSTRUCTOR_ROLE, ...audienceFilter },
      orderBy: [{ staffRole: "asc" }, { audienceType: "asc" }, { order: "asc" }],
    });
  }

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

export async function saveEvaluationFormQuestions(payload: EvaluationFormQuestionPayload[]): Promise<EvaluationFormQuestion[]> {
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
        keepIds.add(question.id);
        await tx.evaluationFormQuestion.upsert({
          where: { id: question.id },
          create: { id: question.id, ...data },
          update: data,
        });
      } else {
        const created = await tx.evaluationFormQuestion.create({
          data: { id: randomUUID(), ...data },
          select: { id: true },
        });
        keepIds.add(created.id);
      }
    }

    const existing = await tx.evaluationFormQuestion.findMany({
      select: { id: true },
    });

    for (const row of existing) {
      if (!keepIds.has(row.id)) {
        await tx.evaluationFormQuestion.delete({ where: { id: row.id } });
      }
    }
  });

  const defaultStaffRole = payload[0]?.staffRole?.trim() ?? "";
  return getEvaluationFormQuestions(undefined, defaultStaffRole);
}