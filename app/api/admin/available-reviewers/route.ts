import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "PEER"; // PEER or PARENT_STUDENT
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId parameter is required" },
        { status: 400 }
      );
    }

    // Get cycle to ensure it exists and get schoolId
    const cycle = await prisma.evaluationCycle.findFirst({
      where: { id: cycleId },
      select: { schoolId: true },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 }
      );
    }

    // Get already assigned reviewers for this cycle
    const assignedReviewers = await prisma.reviewer.findMany({
      where: {
        cycleId,
        type,
      },
      select: {
        userId: type === "PEER" ? true : false,
        contactId: type === "PARENT_STUDENT" ? true : false,
      },
    });

    const assignedIds = assignedReviewers.map((r) =>
      type === "PEER" ? r.userId : r.contactId
    );

    let reviewers: Array<{ id: string; name: string; email: string }> = [];

    if (type === "PEER") {
      // Get staff members from this school that aren't already reviewers
      const staffUsers = await prisma.user.findMany({
        where: {
          schoolId: cycle.schoolId,
          role: "STAFF",
          isActive: true,
          id: {
            notIn: assignedIds.filter((id): id is string => id !== null),
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: "asc" },
      });
      reviewers = staffUsers;
    } else {
      // Get contacts from this school that aren't already reviewers
      const contacts = await prisma.contact.findMany({
        where: {
          schoolId: cycle.schoolId,
          isActive: true,
          id: {
            notIn: assignedIds.filter((id): id is string => id !== null),
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: "asc" },
      });
      reviewers = contacts;
    }

    return NextResponse.json({
      reviewers: reviewers.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        type,
      })),
    });
  } catch (error) {
    console.error("Error fetching available reviewers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch available reviewers",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
