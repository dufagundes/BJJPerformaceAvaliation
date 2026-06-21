import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

const TEST_USER_EMAILS = [
  "admin@example.com",
  "test-staff@example.com",
  "peer1@example.com",
  "peer2@example.com",
];

const TEST_CONTACT_EMAILS = ["parent1@example.com", "student1@example.com"];
const TEST_CYCLE_DESCRIPTION = "Test Evaluation Cycle - Ready for Testing";

async function main() {
  await prisma.$transaction(async (tx) => {
    const testUsers = await tx.user.findMany({
      where: {
        email: { in: TEST_USER_EMAILS },
      },
      select: { id: true },
    });

    const testContacts = await tx.contact.findMany({
      where: {
        email: { in: TEST_CONTACT_EMAILS },
      },
      select: { id: true },
    });

    const userIds = testUsers.map((user) => user.id);
    const contactIds = testContacts.map((contact) => contact.id);

    await tx.evaluationCycle.deleteMany({
      where: {
        OR: [
          { description: TEST_CYCLE_DESCRIPTION },
          ...(userIds.length > 0 ? [{ subjectId: { in: userIds } }, { createdBy: { in: userIds } }] : []),
        ],
      },
    });

    if (contactIds.length > 0) {
      await tx.contact.deleteMany({
        where: {
          id: { in: contactIds },
        },
      });
    }

    if (userIds.length > 0) {
      await tx.user.deleteMany({
        where: {
          id: { in: userIds },
        },
      });
    }
  });

  console.log("Test data cleanup complete.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
