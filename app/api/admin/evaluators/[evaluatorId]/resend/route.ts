import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../../lib/adminAuth";

export async function POST(
  request: Request,
  context: { params: Promise<{ evaluatorId: string }> },
) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  const { evaluatorId } = await context.params;
  if (!evaluatorId) {
    return NextResponse.json({ error: "evaluatorId is required." }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: "Legacy /api/admin/evaluators/[evaluatorId]/resend endpoint is deprecated. Use /api/admin/evaluations/[cycleId]/remind.",
    },
    { status: 410 },
  );
}
