import { prisma } from "../../../../lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Dev/test endpoint - only available in development
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "Test endpoint not available in production" }, { status: 403 });
    }

    const school = await prisma.school.upsert({
      where: { name: "Default School" },
      update: { isActive: true },
      create: { name: "Default School", isActive: true },
      select: { id: true },
    });

    // 1. Create or get test admin
    let testAdmin = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: "admin@example.com" } },
    });

    if (!testAdmin) {
      testAdmin = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: "Test Admin",
          email: "admin@example.com",
          role: "ADMIN",
          isActive: true,
          passwordHash: "", // Placeholder for test
        },
      });
    }

    // 2. Create or get test staff member
    let staffMember = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: "test-staff@example.com" } },
    });

    if (!staffMember) {
      staffMember = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: "Test Staff Member",
          email: "test-staff@example.com",
          role: "STAFF",
          isActive: true,
          passwordHash: "", // Placeholder for test
          staffProfile: {
            create: {
              title: "Head Instructor",
              isActive: true,
            },
          },
        },
      });
    } else {
      await prisma.staffMember.upsert({
        where: { userId: staffMember.id },
        create: {
          userId: staffMember.id,
          title: "Head Instructor",
          isActive: true,
        },
        update: {
          title: "Head Instructor",
          isActive: true,
        },
      });
    }

    // 2. Create test contacts (parent/student reviewers)
    let testContact1 = await prisma.contact.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: "parent1@example.com" } },
    });
    if (!testContact1) {
      testContact1 = await prisma.contact.create({
        data: {
          schoolId: school.id,
          type: "PARENT",
          name: "Test Parent 1",
          email: "parent1@example.com",
          studentName: "John Doe",
          isActive: true,
        },
      });
    }

    let testContact2 = await prisma.contact.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: "student1@example.com" } },
    });
    if (!testContact2) {
      testContact2 = await prisma.contact.create({
        data: {
          schoolId: school.id,
          type: "STUDENT",
          name: "Test Student",
          email: "student1@example.com",
          isActive: true,
        },
      });
    }

    // 3. Create test peer reviewers (users)
    let testPeer1 = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: "peer1@example.com" } },
    });
    if (!testPeer1) {
      testPeer1 = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: "Test Peer 1",
          email: "peer1@example.com",
          role: "STAFF",
          isActive: true,
          passwordHash: "",
        },
      });
    }

    let testPeer2 = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: "peer2@example.com" } },
    });
    if (!testPeer2) {
      testPeer2 = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: "Test Peer 2",
          email: "peer2@example.com",
          role: "STAFF",
          isActive: true,
          passwordHash: "",
        },
      });
    }

    // 4. Create test evaluation cycle
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const cycle = await prisma.evaluationCycle.create({
      data: {
        schoolId: school.id,
        description: "Test Evaluation Cycle - Ready for Testing",
        subjectId: staffMember.id,
        createdBy: testAdmin.id,
        deadline,
        status: "IN_PROGRESS",
      },
    });

    // 5. Create reviewers (peers + contacts)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30);

    const reviewerIds = await Promise.all([
      prisma.reviewer.create({
        data: {
          cycleId: cycle.id,
          type: "PEER",
          userId: testPeer1.id,
          status: "PENDING",
          inviteToken: randomUUID(),
          tokenExpiresAt: tokenExpiry,
        },
        select: { id: true },
      }),
      prisma.reviewer.create({
        data: {
          cycleId: cycle.id,
          type: "PEER",
          userId: testPeer2.id,
          status: "PENDING",
          inviteToken: randomUUID(),
          tokenExpiresAt: tokenExpiry,
        },
        select: { id: true },
      }),
      prisma.reviewer.create({
        data: {
          cycleId: cycle.id,
          type: "PARENT_STUDENT",
          contactId: testContact1.id,
          status: "PENDING",
          inviteToken: randomUUID(),
          tokenExpiresAt: tokenExpiry,
        },
        select: { id: true },
      }),
      prisma.reviewer.create({
        data: {
          cycleId: cycle.id,
          type: "PARENT_STUDENT",
          contactId: testContact2.id,
          status: "PENDING",
          inviteToken: randomUUID(),
          tokenExpiresAt: tokenExpiry,
        },
        select: { id: true },
      }),
    ]);

    // Fetch reviewers with related user/contact data
    const reviewers = await prisma.reviewer.findMany({
      where: {
        id: {
          in: reviewerIds.map((r) => r.id),
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
        inviteToken: true,
        user: {
          select: { name: true, email: true },
        },
        contact: {
          select: { name: true, email: true },
        },
      },
    });

    // Build evaluation URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const evaluationLinks = reviewers.map((reviewer) => ({
      id: reviewer.id,
      name: reviewer.user?.name || reviewer.contact?.name || "Unknown",
      type: reviewer.type,
      email: reviewer.user?.email || reviewer.contact?.email || "N/A",
      token: reviewer.inviteToken,
      url: `${baseUrl}/evaluate/${reviewer.inviteToken}`,
    }));

    return Response.json({
      ok: true,
      cycle: {
        id: cycle.id,
        subject: staffMember.name,
        deadline: cycle.deadline,
      },
      evaluationLinks,
      testLinksPage: `${baseUrl}/admin/evaluations/${cycle.id}/test-links`,
    });
  } catch (error) {
    console.error("Test seed error:", error);
    return Response.json(
      { error: "Failed to create test data", details: String(error) },
      { status: 500 }
    );
  }
}
