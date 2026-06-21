import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../lib/adminAuth";

export async function GET(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  return NextResponse.json(
    {
      error: "Legacy /api/admin/evaluators endpoint is deprecated. Use /api/admin/evaluations/start for reviewer creation.",
    },
    { status: 410 },
  );
}

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  return NextResponse.json(
    {
      error: "Legacy /api/admin/evaluators endpoint is deprecated. Use /api/admin/evaluations/start for reviewer creation.",
    },
    { status: 410 },
  );
}
