import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

async function main() {
  try {
    console.log("🔄 Creating fresh evaluation cycle for testing...\n");

    const school = await prisma.school.upsert({
      where: { name: "Default School" },
      update: { isActive: true },
      create: { name: "Default School", isActive: true },
      select: { id: true },
    });

    // Find or create a test staff member
    let staffUser = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "STAFF" },
    });

    if (!staffUser) {
      console.log("Creating test staff user...");
      staffUser = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: "Test Staff Member",
          email: `staff-${Date.now()}@test.local`,
          passwordHash: "test",
          role: "STAFF",
          staffProfile: {
            create: {
              title: "Head Instructor",
            },
          },
        },
      });
    }

    console.log(`✅ Staff: ${staffUser.name}`);

    // Find admin user
    let adminUser = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "ADMIN" },
    });

    if (!adminUser) {
      throw new Error("No admin user found - please run seed-test-admin.cjs");
    }

    // Create a new evaluation cycle with future deadline (30 days from now)
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 30);

    const cycle = await prisma.evaluationCycle.create({
      data: {
        schoolId: school.id,
        subjectId: staffUser.id,
        createdBy: adminUser.id,
        description: "Test Evaluation Cycle",
        status: "IN_PROGRESS",
        deadline: futureDeadline,
      },
    });

    console.log(`✅ Cycle: ${cycle.description}`);
    console.log(
      `   Deadline: ${futureDeadline.toISOString().split("T")[0]} (30 days)`
    );

    // Create test reviewers (Peer type)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 14); // 14 days validity

    const reviewers = [];
    for (let i = 1; i <= 3; i++) {
      const contact = await prisma.contact.create({
        data: {
          schoolId: school.id,
          name: `Test Reviewer ${i}`,
          email: `reviewer${i}-${Date.now()}@test.local`,
          type: "STUDENT",
          studentName: `Student ${i}`,
        },
      });

      const reviewer = await prisma.reviewer.create({
        data: {
          cycleId: cycle.id,
          contactId: contact.id,
          type: "PEER",
          status: "PENDING",
          inviteToken: generateToken(),
          tokenExpiresAt: tokenExpiry,
        },
      });

      reviewers.push(reviewer);
      console.log(
        `✅ Reviewer: ${contact.name} (Token: ${reviewer.inviteToken.substring(0, 8)}...)`
      );
    }

    console.log("\n✨ Fresh evaluation cycle created successfully!\n");
    console.log("📋 TEST TOKENS:\n");

    reviewers.forEach((r, i) => {
      console.log(`Token ${i + 1}: ${r.inviteToken}`);
    });

    console.log(
      "\n\n💡 Use one of these tokens to test the evaluation form:"
    );
    console.log(`   http://localhost:3000/evaluate/${reviewers[0].inviteToken}`);
    console.log(`   https://bjjstaffvaluation.com/evaluate/${reviewers[0].inviteToken}\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
