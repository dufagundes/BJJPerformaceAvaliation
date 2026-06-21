import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ["admin@example.com", "test-staff@example.com", "peer1@example.com", "peer2@example.com"],
      },
    },
    select: { email: true },
  });

  const contacts = await prisma.contact.findMany({
    where: {
      email: {
        in: ["parent1@example.com", "student1@example.com"],
      },
    },
    select: { email: true },
  });

  const cycles = await prisma.evaluationCycle.count({
    where: {
      description: "Test Evaluation Cycle - Ready for Testing",
    },
  });

  const parentQuestions = await prisma.evaluationFormQuestion.findMany({
    where: {
      staffRole: "Head Instructor",
      audienceType: "PARENT_STUDENT",
    },
    orderBy: { order: "asc" },
    select: {
      order: true,
      text: true,
    },
  });

  const peerQuestions = await prisma.evaluationFormQuestion.findMany({
    where: {
      staffRole: "Head Instructor",
      audienceType: "PEER",
    },
    orderBy: { order: "asc" },
    select: {
      order: true,
      text: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        remainingUsers: users,
        remainingContacts: contacts,
        remainingCycles: cycles,
        parentQuestionCount: parentQuestions.length,
        parentFirstQuestion: parentQuestions[0]?.text ?? null,
        parentLastQuestion: parentQuestions[parentQuestions.length - 1]?.text ?? null,
        peerQuestionCount: peerQuestions.length,
        peerFirstQuestion: peerQuestions[0]?.text ?? null,
        peerLastQuestion: peerQuestions[peerQuestions.length - 1]?.text ?? null,
      },
      null,
      2,
    ),
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
