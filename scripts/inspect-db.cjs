const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const token = "2c6c4525-c428-4e90-b3f1-ad626cbc6576";
  const reviewer = await prisma.evaluationReviewer.findUnique({
    where: { token },
    include: {
      cycle: {
        include: {
          subject: { include: { staffProfile: true } },
        },
      },
    },
  });
  if (!reviewer) {
    console.log("❌ Reviewer not found for token:", token);
  } else {
    console.log("✅ Reviewer found:");
    console.log("  Status:", reviewer.status);
    console.log("  Type:", reviewer.type);
    console.log("  tokenExpiresAt:", reviewer.tokenExpiresAt);
    console.log("  Cycle deadline:", reviewer.cycle?.deadline);
    console.log("  Subject:", reviewer.cycle?.subject?.name);
    console.log("  Staff Role:", reviewer.cycle?.subject?.staffProfile?.title || "(none)");
    const now = new Date();
    console.log("  Now:", now);
    console.log("  Cycle ended?", now > reviewer.cycle?.deadline);
    console.log("  Token expired?", now > reviewer.tokenExpiresAt);
  }

  const questions = await prisma.evaluationFormQuestion.findMany({ orderBy: [{ staffRole: "asc" }, { order: "asc" }] });
  console.log("\nQuestions in DB:", questions.length);
  questions.forEach(q => console.log(`  [${q.staffRole || "EMPTY"}] ${q.audienceType} #${q.order}`));

  await prisma.$disconnect();
}
main();
