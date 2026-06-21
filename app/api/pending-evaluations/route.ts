import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pendingReviewers = await prisma.reviewer.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        type: true,
        inviteToken: true,
        cycle: {
          select: {
            id: true,
            description: true,
            deadline: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        cycle: {
          deadline: "asc",
        },
      },
    });

    return Response.json({ pendingReviewers });
  } catch (error) {
    console.error("Error fetching pending evaluations:", error);
    return Response.json(
      { error: "Failed to fetch pending evaluations" },
      { status: 500 }
    );
  }
}
