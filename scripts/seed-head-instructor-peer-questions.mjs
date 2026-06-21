import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient({ log: ["error"] });

const STAFF_ROLE = "Head Instructor";
const AUDIENCE_TYPE = "PEER";
const OPTIONS = [
  { label: "Strongly Disagree", score: 0 },
  { label: "Disagree", score: 25 },
  { label: "Partially Agree", score: 50 },
  { label: "Agree", score: 75 },
  { label: "Strongly Agree", score: 100 },
];

const QUESTIONS = [
  "Before every class, the Head Instructor clearly communicates what the class will cover and what my role is as a coach - I always know exactly what to do and how to help.",
  "The Head Instructor keeps the team aligned through regular meetings - we are always on the same page and there are no surprises on the mat.",
  "The Head Instructor has built a coaching team where I feel valued, connected, and proud to be part of - not just a group of people teaching separate classes.",
  "The Head Instructor mentors me personally, gives constructive feedback on my coaching, and consistently models the GB standards of Brotherhood, Integrity, and Development in everything they do.",
  "The Head Instructor actively encourages and supports me in pursuing my ICP certification and growing as a Gracie Barra coach.",
];

async function main() {
  for (const [index, text] of QUESTIONS.entries()) {
    const order = index + 1;

    await prisma.evaluationFormQuestion.upsert({
      where: {
        staffRole_audienceType_order: {
          staffRole: STAFF_ROLE,
          audienceType: AUDIENCE_TYPE,
          order,
        },
      },
      create: {
        id: randomUUID(),
        staffRole: STAFF_ROLE,
        audienceType: AUDIENCE_TYPE,
        text,
        type: "MULTIPLE_CHOICE",
        isRequired: true,
        options: OPTIONS,
        order,
      },
      update: {
        text,
        type: "MULTIPLE_CHOICE",
        isRequired: true,
        options: OPTIONS,
      },
    });
  }

  await prisma.evaluationFormQuestion.deleteMany({
    where: {
      staffRole: STAFF_ROLE,
      audienceType: AUDIENCE_TYPE,
      order: {
        gt: QUESTIONS.length,
      },
    },
  });

  console.log("Head Instructor Peers questions seeded.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
