import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../lib/adminAuth";

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  return NextResponse.json(
    {
      error: "Scorecard generation is not available in the current schema.",
    },
    { status: 410 },
  );
}