import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";
import { calculateCycleScorecard } from "../../../../../../lib/weightedScorecard";

export async function GET(
  request: Request,
  context: { params: Promise<{ cycleId: string }> },
) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  const { cycleId } = await context.params;
  if (!cycleId) {
    return NextResponse.json({ error: "Missing cycleId." }, { status: 400 });
  }

  try {
    const scorecard = await calculateCycleScorecard(cycleId);
    return NextResponse.json(scorecard, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to build scorecard.",
      },
      { status: 500 },
    );
  }
}
