import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient({ log: ["error"] });

const STAFF_ROLE = "Head Instructor";
const AUDIENCE_TYPE = "PARENT_STUDENT";
const OPTIONS = [
  { label: "Strongly Disagree", score: 0 },
  { label: "Disagree", score: 25 },
  { label: "Partially Agree", score: 50 },
  { label: "Agree", score: 75 },
  { label: "Strongly Agree", score: 100 },
];

const QUESTIONS = [
  "Every time I bring my child to class, the instructor is already on the mat and ready to go - classes start and end on time.",
  "My child looks forward to coming to class because of the energy and enthusiasm this instructor brings to every session.",
  "When I watch class, I can see my child attempting techniques outside their comfort zone because this instructor creates a judgment-free environment.",
  "The way this instructor explains techniques makes sense to my child - they come home able to describe and demonstrate what they learned in class.",
  "The instructor actively moves around the mat, corrects techniques, and interacts with students throughout the entire class - not just during demonstrations.",
  "The instructor makes sure both beginner and more experienced students receive instruction and attention appropriate to their level.",
  "The instructor leads with integrity, treats all students as part of the GB family, and actively supports each student’s personal development.",
  "I have felt genuinely cared for by this instructor - when my child missed a week of classes, they took the time to reach out and make sure everything was okay.",
  "When my child first joined GB Lindale, the instructor personally reached out to check how their training was going.",
  "The instructor contributes to a positive school culture by avoiding gossip, rumors, or negative talk about other students, families, or staff members.",
  "I have never witnessed or experienced any behavior from this instructor that made me or my child feel physically or emotionally unsafe.",
  "I would highly recommend this instructor to other families.",
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

  console.log("Head Instructor Parents/Students questions seeded.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
