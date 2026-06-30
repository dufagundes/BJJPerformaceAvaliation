import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { calculateCycleScorecard } from "../../../../lib/weightedScorecard";

export async function GET(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId")?.trim() ?? "";
  const staffMemberId = searchParams.get("staffMemberId")?.trim() ?? "";

  if (!cycleId || !staffMemberId) {
    return NextResponse.json({ error: "cycleId and staffMemberId are required." }, { status: 400 });
  }

  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, schoolId: adminSession.schoolId },
    select: {
      id: true,
      subjectId: true,
      reviewers: {
        select: {
          id: true,
          type: true,
          status: true,
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
      },
    },
  });

  if (!cycle || cycle.subjectId !== staffMemberId) {
    return NextResponse.json({ error: "Evaluation cycle not found for this staff member." }, { status: 404 });
  }

  const peerReviewers = cycle.reviewers.filter((reviewer) => reviewer.type === "PEER");
  const parentReviewers = cycle.reviewers.filter((reviewer) => reviewer.type === "PARENT_STUDENT");

  const peerSubmitted = peerReviewers.filter((reviewer) => reviewer.status === "COMPLETED").length;
  const parentSubmitted = parentReviewers.filter((reviewer) => reviewer.status === "COMPLETED").length;

  const groups = [
    {
      key: "PEER",
      name: "Peers / Co-Instructors",
      invited: peerReviewers.length,
      submitted: peerSubmitted,
      progressPercent: peerReviewers.length > 0 ? Math.round((peerSubmitted / peerReviewers.length) * 100) : 0,
      evaluators: peerReviewers.map((reviewer) => ({
        id: reviewer.id,
        name: reviewer.user?.name ?? reviewer.contact?.name ?? "Unknown",
        email: reviewer.user?.email ?? reviewer.contact?.email ?? "Unknown",
        status: reviewer.status === "COMPLETED" ? "submitted" : "pending",
      })),
    },
    {
      key: "PARENT_STUDENT",
      name: "Parents / Students",
      invited: parentReviewers.length,
      submitted: parentSubmitted,
      progressPercent: parentReviewers.length > 0 ? Math.round((parentSubmitted / parentReviewers.length) * 100) : 0,
      evaluators: parentReviewers.map((reviewer) => ({
        id: reviewer.id,
        name: reviewer.user?.name ?? reviewer.contact?.name ?? "Unknown",
        email: reviewer.user?.email ?? reviewer.contact?.email ?? "Unknown",
        status: reviewer.status === "COMPLETED" ? "submitted" : "pending",
      })),
    },
  ] as const;

  const checklist = [
    {
      key: "PARENT_STUDENT",
      label: "At least one Parents / Students response submitted",
      met: parentSubmitted > 0,
      submitted: parentSubmitted,
      invited: parentReviewers.length,
    },
    {
      key: "PEER",
      label: "At least one Peers / Co-Instructors response submitted",
      met: peerSubmitted > 0,
      submitted: peerSubmitted,
      invited: peerReviewers.length,
    },
  ] as const;

  const canGenerate = parentSubmitted > 0 && peerSubmitted > 0;
  const hasAnySubmission = parentSubmitted + peerSubmitted > 0;

  let preview: {
    finalScore: number;
    scoreLabel: "Excellent" | "Good" | "Needs Improvement" | "Critical";
    peerGroupScore: number;
    parentGroupScore: number;
    peerWeight: number;
    parentWeight: number;
    notes?: string[];
  } | null = null;

  if (hasAnySubmission) {
    const scorecard = await calculateCycleScorecard(cycleId);
    const peerGroup = scorecard.groups.find((group) => group.name === "Peers");
    const parentGroup = scorecard.groups.find((group) => group.name === "Parents/Students");

    preview = {
      finalScore: scorecard.finalScore,
      scoreLabel: scorecard.scoreLabel,
      peerGroupScore: peerGroup?.groupScore ?? 0,
      parentGroupScore: parentGroup?.groupScore ?? 0,
      peerWeight: peerGroup?.weight ?? 0,
      parentWeight: parentGroup?.weight ?? 0,
      notes: scorecard.notes,
    };
  }

  return NextResponse.json(
    {
      stage: canGenerate ? 5 : 4,
      stageLabel: canGenerate ? "Ready To Generate Report" : "Waiting For Required Group Responses",
      groups,
      checklist,
      generate: {
        enabled: canGenerate,
        reason: canGenerate
          ? "Both evaluator groups have submitted responses."
          : "Generate Report remains disabled until at least one submitted response exists from both Parents / Students and Peers / Co-Instructors.",
        buttonLabel: canGenerate ? "Generate Report" : "Waiting For Required Responses",
      },
      totals: {
        submitted: parentSubmitted + peerSubmitted,
        invited: parentReviewers.length + peerReviewers.length,
      },
      preview,
    },
    { status: 200 },
  );

}
