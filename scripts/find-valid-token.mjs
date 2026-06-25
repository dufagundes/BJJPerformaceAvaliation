import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reviewers = await prisma.reviewer.findMany({
    where: {
      tokenExpiresAt: { gt: new Date() },
      status: "PENDING",
    },
    select: {
      inviteToken: true,
      type: true,
      status: true,
      tokenExpiresAt: true,
      cycle: {
        select: {
          description: true,
          deadline: true,
          subject: { select: { name: true } },
        },
      },
    },
    take: 5,
  });

  if (reviewers.length === 0) {
    console.log(
      "❌ No valid, non-expired, pending reviewers found in database"
    );
    console.log(
      "   Please ensure an evaluation cycle with reviewers exists and has a future deadline."
    );
  } else {
    console.log(`\n✅ Found ${reviewers.length} valid token(s):\n`);
    reviewers.forEach((r, i) => {
      console.log(
        `Token ${i + 1}: ${r.inviteToken.substring(0, 8)}...${r.inviteToken.substring(r.inviteToken.length - 8)}`
      );
      console.log(`  Staff: ${r.cycle.subject.name}`);
      console.log(`  Type: ${r.type}`);
      console.log(
        `  Token Expires: ${r.tokenExpiresAt.toISOString().split("T")[0]}`
      );
      console.log(
        `  Cycle Deadline: ${r.cycle.deadline.toISOString().split("T")[0]}`
      );
      console.log(`\n  Full Token:\n  ${r.inviteToken}\n`);
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
