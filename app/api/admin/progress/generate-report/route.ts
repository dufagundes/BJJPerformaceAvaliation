import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { calculateCycleScorecard } from "../../../../../lib/weightedScorecard";
import { prisma } from "../../../../../lib/prisma";

type GenerateReportPayload = {
  cycleId?: string;
  staffMemberId?: string;
};

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  let payload: GenerateReportPayload;
  try {
    payload = (await request.json()) as GenerateReportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const cycleId = payload.cycleId?.trim() ?? "";
  const staffMemberId = payload.staffMemberId?.trim() ?? "";

  if (!cycleId || !staffMemberId) {
    return NextResponse.json({ error: "cycleId and staffMemberId are required." }, { status: 400 });
  }

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      subjectId: true,
      reviewers: {
        select: {
          type: true,
          status: true,
        },
      },
    },
  });

  if (!cycle || cycle.subjectId !== staffMemberId) {
    return NextResponse.json({ error: "Evaluation cycle not found for this staff member." }, { status: 404 });
  }

  const parentSubmitted = cycle.reviewers.some(
    (reviewer) => reviewer.type === "PARENT_STUDENT" && reviewer.status === "COMPLETED",
  );
  const peerSubmitted = cycle.reviewers.some(
    (reviewer) => reviewer.type === "PEER" && reviewer.status === "COMPLETED",
  );

  if (!parentSubmitted || !peerSubmitted) {
    return NextResponse.json(
      {
        error:
          "Generate Report is locked until at least one submitted response exists from both Parents / Students and Peers / Co-Instructors.",
      },
      { status: 409 },
    );
  }

  const scorecard = await calculateCycleScorecard(cycleId);

  return NextResponse.json(
    {
      ok: true,
      message: "Report generated.",
      scorecard,
    },
    { status: 200 },
  );
}
