import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log("🗑️  Starting database cleanup...\n");

    // 1. Delete old questions with empty staffRole
    const oldQuestionsDeleted = await prisma.evaluationFormQuestion.deleteMany({
      where: {
        staffRole: "",
      },
    });
    console.log(`✅ Deleted ${oldQuestionsDeleted.count} old questions (staffRole="")`);

    // 2. Delete old evaluation cycles
    const oldCyclesDeleted = await prisma.evaluationCycle.deleteMany({
      where: {
        // Keep only cycles created recently (last 7 days)
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log(`✅ Deleted ${oldCyclesDeleted.count} old evaluation cycles (older than 7 days)`);

    // 3. Verify remaining questions are all Head Instructor role
    const remainingQuestions = await prisma.evaluationFormQuestion.findMany({
      select: { staffRole: true, audienceType: true, order: true, text: true },
      orderBy: [{ staffRole: "asc" }, { audienceType: "asc" }, { order: "asc" }],
    });
    console.log(`\n📊 Remaining questions (${remainingQuestions.length} total):`);
    remainingQuestions.forEach((q) => {
      console.log(
        `  • [${q.staffRole || "EMPTY"}] ${q.audienceType} #${q.order}: ${q.text.substring(0, 50)}...`,
      );
    });

    // 4. Verify remaining cycles
    const remainingCycles = await prisma.evaluationCycle.findMany({
      select: { id: true, status: true, deadline: true, createdAt: true },
    });
    console.log(`\n✅ Remaining cycles: ${remainingCycles.length}`);
    remainingCycles.forEach((c) => {
      console.log(`  • Status: ${c.status}, Deadline: ${c.deadline.toISOString()}`);
    });

    console.log("\n✨ Cleanup complete!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
