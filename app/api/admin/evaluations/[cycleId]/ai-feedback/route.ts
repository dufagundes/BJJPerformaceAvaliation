import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";
import { generateFeedback, ReviewCategoryInput } from "../../../../../../lib/generateFeedback";
import { calculateCycleScorecard } from "../../../../../../lib/weightedScorecard";

export async function POST(
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

    const categories: ReviewCategoryInput[] = scorecard.groups.flatMap((group) =>
      group.sessions.flatMap((session) =>
        session.factors.map((factor) => ({
          group: group.name,
          session: session.name,
          factor: factor.questionText,
          normalizedScore: factor.normalizedScore,
          responseCount: factor.responseCount,
        })),
      ),
    );

    const allComments = scorecard.qualitativeFeedback
      .map((entry) => entry.text)
      .filter((entry) => entry.trim().length > 0);

    const strengthsComments = allComments.slice(0, 8);
    const improvementComments = allComments.slice(8, 16);

    const aiReview = await generateFeedback(
      scorecard.subjectName,
      scorecard.finalScore,
      scorecard.scoreLabel,
      categories,
      strengthsComments,
      improvementComments,
    );

    return NextResponse.json(
      {
        reviewMarkdown: aiReview.reviewMarkdown,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate AI review.",
      },
      { status: 500 },
    );
  }
}
