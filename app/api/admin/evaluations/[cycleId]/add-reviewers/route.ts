import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEvaluationInviteSms } from "@/lib/smsService";
import { sendEvaluationInvitationEmail } from "@/lib/evaluationWorkflowEmails";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const { cycleId } = await params;
    const body = await req.json();
    const { reviewerIds, type } = body; // type: "PEER" | "PARENT_STUDENT"

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: "reviewerIds array is required" },
        { status: 400 }
      );
    }

    if (!type || !["PEER", "PARENT_STUDENT"].includes(type)) {
      return NextResponse.json(
        { error: "type must be PEER or PARENT_STUDENT" },
        { status: 400 }
      );
    }

    // Get the cycle with its deadline and subject
    const cycle = await prisma.evaluationCycle.findFirst({
      where: { id: cycleId },
      select: {
        id: true,
        deadline: true,
        status: true,
        subject: { select: { name: true } },
        school: { select: { id: true, name: true } },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Evaluation cycle not found" },
        { status: 404 }
      );
    }

    // Check if cycle is still active
    if (cycle.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Can only add reviewers to cycles that are in progress" },
        { status: 400 }
      );
    }

    const addedReviewers = [];
    const errors = [];

    for (const reviewerId of reviewerIds) {
      try {
        // Check if reviewer already exists in this cycle
        const existing = await prisma.reviewer.findFirst({
          where: {
            cycleId,
            OR: [
              { userId: type === "PEER" ? reviewerId : undefined },
              { contactId: type === "PARENT_STUDENT" ? reviewerId : undefined },
            ],
          },
        });

        if (existing) {
          errors.push(`Reviewer ${reviewerId} already in this cycle`);
          continue;
        }

        // Create invite token
        const inviteToken = uuidv4();
        const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        // Create new reviewer
        const newReviewer = await prisma.reviewer.create({
          data: {
            cycleId,
            userId: type === "PEER" ? reviewerId : null,
            contactId: type === "PARENT_STUDENT" ? reviewerId : null,
            type,
            status: "PENDING",
            inviteToken,
            tokenExpiresAt,
          },
          select: {
            id: true,
            user: { select: { name: true, email: true, phone: true } },
            contact: { select: { name: true, email: true, phone: true } },
          },
        });

        // Send invitations
        const reviewLink = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/evaluate/${inviteToken}`;
        const reviewerName =
          type === "PEER"
            ? newReviewer.user?.name || "Reviewer"
            : newReviewer.contact?.name || "Reviewer";
        const reviewerEmail =
          type === "PEER" ? newReviewer.user?.email : newReviewer.contact?.email;
        const reviewerPhone =
          type === "PEER" ? newReviewer.user?.phone : newReviewer.contact?.phone;

        // Send SMS if phone available
        if (reviewerPhone?.trim()) {
          await sendEvaluationInviteSms(
            reviewerPhone,
            reviewerName,
            reviewLink,
            cycle.school?.name || "Your School",
            cycle.subject?.name || "staff member"
          ).catch((error) => {
            console.warn(`[sms] Failed to send SMS to ${reviewerName}:`, error);
          });
        }

        // Send email if available
        if (reviewerEmail?.trim()) {
          await sendEvaluationInvitationEmail(
            reviewerEmail,
            {
              reviewerName,
              subjectName: cycle.subject.name,
              deadline: cycle.deadline,
              inviteToken,
            },
            cycle.school.id,
            {
              cycleId,
              reviewerId: newReviewer.id,
            }
          ).catch((error) => {
            console.warn(
              `[email] Failed to send email to ${reviewerEmail}:`,
              error
            );
          });
        }

        addedReviewers.push({
          id: newReviewer.id,
          name: reviewerName,
          email: reviewerEmail,
        });
      } catch (error) {
        errors.push(
          `Failed to add reviewer ${reviewerId}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      added: addedReviewers.length,
      addedReviewers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error adding reviewers:", error);
    return NextResponse.json(
      {
        error: "Failed to add reviewers",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
